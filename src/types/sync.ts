export type SyncTable = 'orders' | 'customers' | 'products' | 'expenses';
export type SyncOperation = 'create' | 'update' | 'delete';
export type SyncStatus = 'idle' | 'syncing' | 'pulling' | 'error' | 'offline';

export interface SyncQueueItem {
  id?: number;
  table: SyncTable;
  operation: SyncOperation;
  localId: number;
  payload?: Record<string, unknown>;
  status: 'pending' | 'in_progress' | 'failed';
  retryCount: number;
  errorMessage?: string;
  createdAt: Date;
}

export interface SyncIdMap {
  id?: number;
  table: SyncTable;
  localId: number;
  cloudId: string;
}
