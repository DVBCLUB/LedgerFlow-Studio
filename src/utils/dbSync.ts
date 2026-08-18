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

export interface HybridEngineStatus {
  mode: "local_only" | "hybrid_synced" | "hybrid_degraded";
  supabaseConfigured: boolean;
  supabaseConnected: boolean;
  localStoragePath: string;
  lastLocalSyncAt: string | null;
  lastCloudSyncAt: string | null;
  keysCount: number;
  lastError?: string;
}

/**
 * Lấy trạng thái lưu trữ Dual-Engine (Local PC File + Supabase Free Tier)
 */
export async function fetchHybridStorageStatus(): Promise<HybridEngineStatus | null> {
  try {
    const res = await fetch('/api/db/status');
    if (!res.ok) return null;
    const data = await res.json();
    if (data.success && data.status) {
      return data.status as HybridEngineStatus;
    }
  } catch (err) {
    console.warn("Could not fetch hybrid storage status:", err);
  }
  return null;
}

/**
 * Kích hoạt đồng bộ tức thì giữa Local và Supabase
 */
export async function triggerDualEngineSync(): Promise<boolean> {
  try {
    // 1. Lưu state hiện tại của client lên server trước
    await saveDatabaseToServer();
    // 2. Kích hoạt sync 2 chiều server ↔ Supabase
    const res = await fetch('/api/db/sync', { method: 'POST' });
    if (!res.ok) return false;
    const data = await res.json();
    // 3. Tải lại dữ liệu mới nhất
    await loadDatabaseFromServer();
    return !!data.success;
  } catch (err) {
    console.error("Failed to trigger dual-engine sync:", err);
    return false;
  }
}

