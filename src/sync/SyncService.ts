import { db } from '../db/database';
import { SyncQueueProcessor } from './SyncQueueProcessor';
import { CloudPuller } from './CloudPuller';
import { connectivity } from './ConnectivityMonitor';
import type { SyncTable, SyncOperation } from '../types/sync';

class SyncService {
  private userId: string | null = null;
  private processor: SyncQueueProcessor | null = null;
  private puller = new CloudPuller();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private initialized = false;

  // Callback for UI state updates
  onStatusChange?: (status: 'idle' | 'syncing' | 'pulling' | 'error' | 'offline') => void;
  onPendingChange?: (count: number) => void;

  /**
   * Initialize the sync service for a logged-in user.
   * Starts connectivity monitoring and the sync queue processor.
   */
  async initialize(userId: string): Promise<void> {
    if (this.initialized && this.userId === userId) return;

    this.userId = userId;
    this.processor = new SyncQueueProcessor(userId);
    this.initialized = true;

    // Start connectivity monitoring
    connectivity.start();
    connectivity.onStatusChange((online) => {
      if (online) {
        this.onStatusChange?.('idle');
        this.processQueue();
      } else {
        this.onStatusChange?.('offline');
      }
    });

    // Start periodic queue processing (every 5 seconds)
    this.startProcessing();

    // Check if this is a fresh device (needs initial pull or upload)
    await this.checkInitialSync();
  }

  /**
   * Stop the sync service (on logout).
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.userId = null;
    this.processor = null;
    this.initialized = false;
    this.onStatusChange?.('idle');
  }

  /**
   * Enqueue a sync operation. Called from Zustand stores after local CRUD.
   * Non-blocking — silently skips if not logged in.
   */
  async enqueue(table: SyncTable, operation: SyncOperation, localId: number, _payload?: Record<string, unknown>): Promise<void> {
    if (!this.userId) return; // Not logged in — skip sync

    try {
      // Deduplicate: if there's already a pending create for this record, skip additional updates
      if (operation === 'update') {
        const existingCreate = await db.syncQueue
          .where('localId')
          .equals(localId)
          .filter((item) => item.table === table && item.operation === 'create' && item.status === 'pending')
          .first();

        if (existingCreate) return; // A create is pending — it will push the latest data
      }

      // If deleting, remove any pending create/update for this record
      if (operation === 'delete') {
        const pending = await db.syncQueue
          .where('localId')
          .equals(localId)
          .filter((item) => item.table === table && item.status === 'pending')
          .toArray();

        for (const p of pending) {
          await db.syncQueue.delete(p.id!);
        }
      }

      await db.syncQueue.add({
        table,
        operation,
        localId,
        status: 'pending',
        retryCount: 0,
        createdAt: new Date(),
      });

      this.onPendingChange?.(await this.processor!.getPendingCount());
    } catch (err) {
      console.error('[Sync] Failed to enqueue:', err);
    }
  }

  /**
   * Pull all data from Supabase cloud. Called on login or manual sync.
   */
  async pullFromCloud(): Promise<number> {
    if (!this.userId) return 0;

    this.onStatusChange?.('pulling');
    try {
      const result = await this.puller.pullAll();
      this.onStatusChange?.('idle');
      return result.pulled;
    } catch (err) {
      console.error('[Sync] Pull failed:', err);
      this.onStatusChange?.('error');
      return 0;
    }
  }

  /**
   * Push all pending queue items to cloud. Called periodically or on reconnect.
   */
  async processQueue(): Promise<number> {
    if (!this.processor || !connectivity.isOnline) return 0;

    this.onStatusChange?.('syncing');
    try {
      const processed = await this.processor.processAll();
      const pending = await this.processor.getPendingCount();
      this.onPendingChange?.(pending);
      this.onStatusChange?.(pending > 0 ? 'syncing' : 'idle');
      return processed;
    } catch (err) {
      console.error('[Sync] Queue processing failed:', err);
      this.onStatusChange?.('error');
      return 0;
    }
  }

  /**
   * Manual full sync: pull from cloud + push local changes.
   */
  async syncNow(): Promise<void> {
    await this.pullFromCloud();
    await this.processQueue();
  }

  /**
   * Perform initial upload: push all existing local data to cloud.
   * Used when an existing user with local data enables sync for the first time.
   */
  async performInitialUpload(): Promise<number> {
    if (!this.userId || !this.processor) return 0;

    this.onStatusChange?.('syncing');
    let total = 0;

    try {
      // Queue all customers
      const customers = await db.customers.toArray();
      for (const c of customers) {
        if (!c.cloudId && c.id) {
          await db.syncQueue.add({
            table: 'customers',
            operation: 'create',
            localId: c.id,
            status: 'pending',
            retryCount: 0,
            createdAt: new Date(),
          });
          total++;
        }
      }

      // Queue all products
      const products = await db.products.filter((p) => p.isActive !== false).toArray();
      for (const p of products) {
        if (!p.cloudId && p.id) {
          await db.syncQueue.add({
            table: 'products',
            operation: 'create',
            localId: p.id,
            status: 'pending',
            retryCount: 0,
            createdAt: new Date(),
          });
          total++;
        }
      }

      // Queue all orders
      const orders = await db.orders.toArray();
      for (const o of orders) {
        if (!o.cloudId && o.id) {
          await db.syncQueue.add({
            table: 'orders',
            operation: 'create',
            localId: o.id,
            status: 'pending',
            retryCount: 0,
            createdAt: new Date(),
          });
          total++;
        }
      }

      // Queue all expenses
      const expenses = await db.expenses.toArray();
      for (const e of expenses) {
        if (!e.cloudId && e.id) {
          await db.syncQueue.add({
            table: 'expenses',
            operation: 'create',
            localId: e.id,
            status: 'pending',
            retryCount: 0,
            createdAt: new Date(),
          });
          total++;
        }
      }

      // Process the queue
      await this.processQueue();

      this.onStatusChange?.('idle');
      return total;
    } catch (err) {
      console.error('[Sync] Initial upload failed:', err);
      this.onStatusChange?.('error');
      return total;
    }
  }

  /**
   * Check if we need initial sync on this device.
   */
  private async checkInitialSync(): Promise<void> {
    if (!this.userId) return;

    const mappingCount = await db.syncIdMap.count();
    const localCount = await db.orders.count() + await db.customers.count();

    if (mappingCount === 0 && localCount > 0) {
      // Existing local data, no sync yet → initial upload
      console.log('[Sync] Detected existing local data without sync mappings. Starting initial upload...');
      await this.performInitialUpload();
    } else if (mappingCount === 0 && localCount === 0) {
      // Fresh device → pull from cloud
      console.log('[Sync] Fresh device detected. Pulling data from cloud...');
      await this.pullFromCloud();
    }
  }

  private startProcessing(): void {
    if (this.intervalId) return;

    this.intervalId = setInterval(async () => {
      if (connectivity.isOnline && this.processor) {
        const pending = await this.processor.getPendingCount();
        if (pending > 0) {
          await this.processQueue();
        }
      }
    }, 5000);
  }

  getPendingCount(): Promise<number> {
    return this.processor?.getPendingCount() ?? Promise.resolve(0);
  }

  getFailedCount(): Promise<number> {
    return this.processor?.getFailedCount() ?? Promise.resolve(0);
  }

  retryFailed(): Promise<void> {
    return this.processor?.retryFailed() ?? Promise.resolve();
  }
}

// Singleton instance
export const syncService = new SyncService();
