import { create } from 'zustand';
import type { SyncStatus } from '../types/sync';

interface SyncState {
  status: SyncStatus;
  pendingCount: number;
  lastSyncedAt: Date | null;
  setStatus: (status: SyncStatus) => void;
  setPendingCount: (count: number) => void;
  markSynced: () => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  status: 'idle',
  pendingCount: 0,
  lastSyncedAt: null,

  setStatus: (status) => set({ status }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
  markSynced: () => set({ lastSyncedAt: new Date() }),
}));
