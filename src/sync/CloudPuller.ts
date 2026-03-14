import { db } from '../db/database';
import { supabase } from '../lib/supabase';
import { transforms } from './DataTransformers';
import type { SyncTable } from '../types/sync';

export class CloudPuller {
  /**
   * Pull all user data from Supabase cloud tables and merge into local IndexedDB.
   * Customers & products are pulled first (orders reference them).
   */
  async pullAll(): Promise<{ pulled: number }> {
    let pulled = 0;

    // Phase 1: Customers and products (no dependencies)
    const [customers, products] = await Promise.all([
      this.fetchTable('cloud_customers'),
      this.fetchTable('cloud_products'),
    ]);

    pulled += await this.mergeCustomers(customers);
    pulled += await this.mergeProducts(products);

    // Phase 2: Orders and expenses (orders depend on customers)
    const [orders, expenses] = await Promise.all([
      this.fetchTable('cloud_orders'),
      this.fetchTable('cloud_expenses'),
    ]);

    pulled += await this.mergeOrders(orders);
    pulled += await this.mergeExpenses(expenses);

    return { pulled };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async fetchTable(table: string): Promise<any[]> {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('is_deleted', false);

    if (error) {
      console.error(`[Sync] Failed to fetch ${table}:`, error.message);
      return [];
    }
    return data || [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async mergeCustomers(cloudRows: any[]): Promise<number> {
    let merged = 0;

    for (const row of cloudRows) {
      const existing = await db.syncIdMap
        .where('[table+cloudId]')
        .equals(['customers', row.id])
        .first();

      if (existing) {
        // Already mapped — check for updates (last-write-wins)
        const local = await db.customers.get(existing.localId);
        if (local && new Date(row.updated_at) > new Date(local.updatedAt)) {
          const data = transforms.customerFromCloud(row);
          await db.customers.update(existing.localId, data);
          merged++;
        }
      } else {
        // Check for phone match to avoid duplicates
        const phoneMatch = row.phone
          ? await db.customers.where('phone').equals(row.phone).first()
          : null;

        if (phoneMatch?.id) {
          // Link existing local record to cloud
          await db.syncIdMap.add({ table: 'customers' as SyncTable, localId: phoneMatch.id, cloudId: row.id });
          await db.customers.update(phoneMatch.id, { cloudId: row.id });
          // Update if cloud is newer
          if (new Date(row.updated_at) > new Date(phoneMatch.updatedAt)) {
            const data = transforms.customerFromCloud(row);
            await db.customers.update(phoneMatch.id, data);
          }
        } else {
          // New record — insert
          const data = transforms.customerFromCloud(row);
          const localId = (await db.customers.add(data)) as number;
          await db.syncIdMap.add({ table: 'customers' as SyncTable, localId, cloudId: row.id });
          merged++;
        }
      }
    }

    return merged;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async mergeProducts(cloudRows: any[]): Promise<number> {
    let merged = 0;

    for (const row of cloudRows) {
      const existing = await db.syncIdMap
        .where('[table+cloudId]')
        .equals(['products', row.id])
        .first();

      if (existing) {
        const local = await db.products.get(existing.localId);
        if (local && new Date(row.updated_at) > new Date(local.updatedAt)) {
          const data = transforms.productFromCloud(row);
          await db.products.update(existing.localId, data);
          merged++;
        }
      } else {
        const data = transforms.productFromCloud(row);
        const localId = (await db.products.add(data)) as number;
        await db.syncIdMap.add({ table: 'products' as SyncTable, localId, cloudId: row.id });
        merged++;
      }
    }

    return merged;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async mergeOrders(cloudRows: any[]): Promise<number> {
    let merged = 0;

    for (const row of cloudRows) {
      const existing = await db.syncIdMap
        .where('[table+cloudId]')
        .equals(['orders', row.id])
        .first();

      if (existing) {
        const local = await db.orders.get(existing.localId);
        if (local && new Date(row.updated_at) > new Date(local.updatedAt)) {
          const data = await transforms.orderFromCloud(row);
          await db.orders.update(existing.localId, data);
          merged++;
        }
      } else {
        // Check for order number match to avoid duplicates
        const numMatch = await db.orders
          .where('orderNumber')
          .equals(row.order_number)
          .first();

        if (numMatch?.id) {
          await db.syncIdMap.add({ table: 'orders' as SyncTable, localId: numMatch.id, cloudId: row.id });
          await db.orders.update(numMatch.id, { cloudId: row.id });
          if (new Date(row.updated_at) > new Date(numMatch.updatedAt)) {
            const data = await transforms.orderFromCloud(row);
            await db.orders.update(numMatch.id, data);
          }
        } else {
          const data = await transforms.orderFromCloud(row);
          const localId = (await db.orders.add(data)) as number;
          await db.syncIdMap.add({ table: 'orders' as SyncTable, localId, cloudId: row.id });
          merged++;
        }
      }
    }

    return merged;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async mergeExpenses(cloudRows: any[]): Promise<number> {
    let merged = 0;

    for (const row of cloudRows) {
      const existing = await db.syncIdMap
        .where('[table+cloudId]')
        .equals(['expenses', row.id])
        .first();

      if (existing) {
        // Expenses are append-only, no update needed
      } else {
        const data = transforms.expenseFromCloud(row);
        const localId = (await db.expenses.add(data)) as number;
        await db.syncIdMap.add({ table: 'expenses' as SyncTable, localId, cloudId: row.id });
        merged++;
      }
    }

    return merged;
  }
}
