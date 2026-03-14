import { db } from '../db/database';
import { supabase } from '../lib/supabase';
import { transforms } from './DataTransformers';
import type { SyncQueueItem, SyncTable } from '../types/sync';

const TABLE_PRIORITY: Record<SyncTable, number> = {
  customers: 0,
  products: 1,
  orders: 2,
  expenses: 3,
};

const CLOUD_TABLE: Record<SyncTable, string> = {
  customers: 'cloud_customers',
  products: 'cloud_products',
  orders: 'cloud_orders',
  expenses: 'cloud_expenses',
};

export class SyncQueueProcessor {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async processAll(): Promise<number> {
    let processed = 0;
    let item = await this.getNext();

    while (item) {
      await this.processItem(item);
      processed++;
      item = await this.getNext();
    }

    return processed;
  }

  private async getNext(): Promise<SyncQueueItem | undefined> {
    const items = await db.syncQueue
      .where('status')
      .equals('pending')
      .toArray();

    if (items.length === 0) return undefined;

    // Sort by priority (customers first, then products, orders, expenses)
    items.sort((a, b) => {
      const pa = TABLE_PRIORITY[a.table] ?? 99;
      const pb = TABLE_PRIORITY[b.table] ?? 99;
      if (pa !== pb) return pa - pb;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return items[0];
  }

  private async processItem(item: SyncQueueItem): Promise<void> {
    await db.syncQueue.update(item.id!, { status: 'in_progress' });

    try {
      switch (item.operation) {
        case 'create':
          await this.handleCreate(item);
          break;
        case 'update':
          await this.handleUpdate(item);
          break;
        case 'delete':
          await this.handleDelete(item);
          break;
      }
      // Success — remove from queue
      await db.syncQueue.delete(item.id!);
    } catch (error) {
      const retryCount = (item.retryCount || 0) + 1;
      if (retryCount >= 5) {
        await db.syncQueue.update(item.id!, {
          status: 'failed',
          retryCount,
          errorMessage: String(error),
        });
      } else {
        await db.syncQueue.update(item.id!, {
          status: 'pending',
          retryCount,
        });
      }
    }
  }

  private async handleCreate(item: SyncQueueItem): Promise<void> {
    // Get the current local record
    const localRecord = await db.table(item.table).get(item.localId);
    if (!localRecord) return; // Record was deleted locally before sync

    const cloudPayload = await this.toCloud(item.table, localRecord);

    const { data, error } = await supabase
      .from(CLOUD_TABLE[item.table])
      .insert(cloudPayload)
      .select('id')
      .single();

    if (error) throw error;

    // Save ID mapping
    await db.syncIdMap.add({
      table: item.table,
      localId: item.localId,
      cloudId: data.id,
    });

    // Update local record with cloudId
    await db.table(item.table).update(item.localId, { cloudId: data.id });
  }

  private async handleUpdate(item: SyncQueueItem): Promise<void> {
    const mapping = await db.syncIdMap
      .where('[table+localId]')
      .equals([item.table, item.localId])
      .first();

    if (!mapping) {
      // No cloud record yet — treat as create
      return this.handleCreate(item);
    }

    const localRecord = await db.table(item.table).get(item.localId);
    if (!localRecord) return;

    const cloudPayload = await this.toCloud(item.table, localRecord) as Record<string, unknown>;
    const { id: _id, user_id: _uid, ...updatePayload } = cloudPayload;

    const { error } = await supabase
      .from(CLOUD_TABLE[item.table])
      .update(updatePayload)
      .eq('id', mapping.cloudId);

    if (error) throw error;
  }

  private async handleDelete(item: SyncQueueItem): Promise<void> {
    const mapping = await db.syncIdMap
      .where('[table+localId]')
      .equals([item.table, item.localId])
      .first();

    if (!mapping) return; // Never synced

    // Soft delete in cloud
    const { error } = await supabase
      .from(CLOUD_TABLE[item.table])
      .update({ is_deleted: true })
      .eq('id', mapping.cloudId);

    if (error) throw error;

    // Remove mapping
    await db.syncIdMap.delete(mapping.id!);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async toCloud(table: SyncTable, record: any) {
    switch (table) {
      case 'customers':
        return transforms.customerToCloud(record, this.userId);
      case 'products':
        return transforms.productToCloud(record, this.userId);
      case 'orders':
        return transforms.orderToCloud(record, this.userId);
      case 'expenses':
        return transforms.expenseToCloud(record, this.userId);
    }
  }

  async getPendingCount(): Promise<number> {
    return db.syncQueue.where('status').equals('pending').count();
  }

  async getFailedCount(): Promise<number> {
    return db.syncQueue.where('status').equals('failed').count();
  }

  async retryFailed(): Promise<void> {
    await db.syncQueue
      .where('status')
      .equals('failed')
      .modify({ status: 'pending', retryCount: 0, errorMessage: undefined });
  }
}
