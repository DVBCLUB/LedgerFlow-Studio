import { create } from 'zustand';
import { 
  getSupabaseConfig, 
  saveSupabaseConfig,
  SupabaseConfig
} from '../utils/supabaseSync';

interface SupabaseSyncState {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseTable: string;
  userEmail: string;
  isOfflineMode: boolean;
  supabaseSyncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  supabaseMessage: string | null;
  supabaseLastSynced: string | null;

  setSupabaseUrl: (url: string) => void;
  setSupabaseAnonKey: (key: string) => void;
  setSupabaseTable: (table: string) => void;
  setUserEmail: (email: string) => void;
  setIsOfflineMode: (isOffline: boolean) => void;
  setSupabaseSyncStatus: (status: 'idle' | 'syncing' | 'synced' | 'error') => void;
  setSupabaseMessage: (msg: string | null) => void;
  setSupabaseLastSynced: (time: string | null) => void;
  updateSupabaseConfig: (config: SupabaseConfig, email: string) => void;
  toggleOfflineMode: () => void;
}

export const useStore = create<SupabaseSyncState>((set) => {
  const initialConfig = getSupabaseConfig();
  const initialOffline = localStorage.getItem('lf_offline_mode') === 'true';
  const initialEmail = localStorage.getItem('lf_user_email') || '';

  return {
    supabaseUrl: initialConfig?.url || '',
    supabaseAnonKey: initialConfig?.anonKey || '',
    supabaseTable: initialConfig?.tableName || 'ledgerflow_vault',
    userEmail: initialEmail,
    isOfflineMode: initialOffline,
    supabaseSyncStatus: 'idle',
    supabaseMessage: null,
    supabaseLastSynced: null,

    setSupabaseUrl: (url) => set({ supabaseUrl: url }),
    setSupabaseAnonKey: (key) => set({ supabaseAnonKey: key }),
    setSupabaseTable: (table) => set({ supabaseTable: table }),
    setUserEmail: (email) => {
      localStorage.setItem('lf_user_email', email);
      set({ userEmail: email });
    },
    setIsOfflineMode: (isOffline) => {
      localStorage.setItem('lf_offline_mode', String(isOffline));
      set({ isOfflineMode: isOffline });
    },
    setSupabaseSyncStatus: (status) => set({ supabaseSyncStatus: status }),
    setSupabaseMessage: (msg) => set({ supabaseMessage: msg }),
    setSupabaseLastSynced: (time) => set({ supabaseLastSynced: time }),
    updateSupabaseConfig: (config, email) => {
      saveSupabaseConfig(config);
      localStorage.setItem('lf_user_email', email);
      set({
        supabaseUrl: config.url,
        supabaseAnonKey: config.anonKey,
        supabaseTable: config.tableName,
        userEmail: email,
      });
    },
    toggleOfflineMode: () => set((state) => {
      const nextVal = !state.isOfflineMode;
      localStorage.setItem('lf_offline_mode', String(nextVal));
      return { isOfflineMode: nextVal };
    }),
  };
});
