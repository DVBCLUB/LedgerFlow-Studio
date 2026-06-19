// client-side cloud database synchronization helper
export const SYNC_KEYS = [
  'guerrilla_unexpected_ideas',
  'guerrilla_completed_steps',
  'lf_db_users',
  'lf_db_projects',
  'lf_db_transactions',
  'lf_db_assets',
  'fastrack_custom_registered_tables',
  'fastrack_checked_tasks',
  'ledgerflow_gamified_progress',
  'ledgerflow_advisory_actions',
  'fastrack_saved_snippets',
  'lf_imported_conversations'
];

export interface SyncStatus {
  status: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncedAt: string | null;
  message?: string;
}

/**
 * Loads entire database state from the Express server and updates LocalStorage.
 * This guarantees offline persistence is backed up securely on the Cloud Container disk!
 */
export async function loadDatabaseFromServer(): Promise<Record<string, any>> {
  try {
    const res = await fetch('/api/db/load');
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const data = await res.json();
    
    if (data.success && data.data && typeof data.data === 'object') {
      const payload = data.data;
      
      // Update local storage with keys retrieved from the server
      for (const key of SYNC_KEYS) {
        if (payload[key] !== undefined) {
          localStorage.setItem(key, typeof payload[key] === 'string' ? payload[key] : JSON.stringify(payload[key]));
        }
      }
      return payload;
    }
  } catch (err) {
    console.warn("Could not load backup stream from server. Staying offline-first:", err);
  }
  return {};
}

/**
 * Saves all LocalStorage states up to the Express server.
 */
export async function saveDatabaseToServer(): Promise<boolean> {
  try {
    const payload: Record<string, any> = {};
    for (const key of SYNC_KEYS) {
      const localVal = localStorage.getItem(key);
      if (localVal !== null) {
        try {
          payload[key] = JSON.parse(localVal);
        } catch (_) {
          payload[key] = localVal;
        }
      }
    }
    
    // Skip if nothing is stored locally yet
    if (Object.keys(payload).length === 0) return true;

    const res = await fetch('/api/db/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload })
    });
    
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.error("Failed to synchronize database state with cloud server:", err);
    return false;
  }
}
