export interface OfflineQueueItem { id: string; type: 'invoice_create' | 'payment_record' | 'journal_entry' | 'customer_update'; payload: Record<string, unknown>; createdAt: string; retries: number; }
export interface PwaSyncStatus { queueDepth: number; lastSyncAt: string | null; conflictCount: number; pendingBytes: number; connectedClients: number; serviceWorkerVersion: string; isOnline: boolean; }
export interface PwaSyncResult { success: boolean; syncBatchId: string; itemsSynced: number; conflictsResolved: number; itemsFailed: number; completedAt: string; }

export function getPwaSyncStatus(): PwaSyncStatus {
  return {
    queueDepth: 7,
    lastSyncAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    conflictCount: 1,
    pendingBytes: 42_880,
    connectedClients: 3,
    serviceWorkerVersion: 'sw-v2.14.0',
    isOnline: true,
  };
}

export function forceSyncBatch(payload: Record<string, unknown>): PwaSyncResult {
  const items = Array.isArray(payload.items) ? payload.items.length : 7;
  return {
    success: true,
    syncBatchId: 'SYNC-' + Date.now().toString(36).toUpperCase(),
    itemsSynced: items,
    conflictsResolved: 1,
    itemsFailed: 0,
    completedAt: new Date().toISOString(),
  };
}
