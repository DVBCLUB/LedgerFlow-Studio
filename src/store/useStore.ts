import { create } from 'zustand';
import { 
  getSupabaseConfig, 
  saveSupabaseConfig,
  SupabaseConfig
} from '../utils/supabaseSync';
import { UnexpectedIdea } from '../types';

const DEFAULT_ACTIVE_IDEA: UnexpectedIdea = {
  id: 'idea_saas_vietqr',
  title: 'VietQR Auto-Ledger - Đồng bộ đối soát shop online nhỏ',
  type: 'saas',
  nicheAudience: 'Chủ shop bán hàng facebook live, kinh doanh hộ cá thể không rành ERP nặng nề',
  pricePoint: 35000,
  speedRating: 9,
  costRating: 10,
  marketPain: 9,
  viralPotential: 8,
  description: 'Ứng dụng siêu nhỏ sử dụng Webhook ngân hàng tự do bóc tách cú pháp chuyển khoản VietQR, đối chiếu với trạng thái tồn kho rồi tự động gán nhãn trạng thái hạch toán thông qua bảng SQLite thô của Chrome Extension.',
  guerrillaScore: 9.2,
  createdAt: '2026-06-01'
};

interface SupabaseSyncState {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseTable: string;
  userEmail: string;
  isOfflineMode: boolean;
  supabaseSyncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  supabaseMessage: string | null;
  supabaseLastSynced: string | null;
  
  // Active business idea chosen in Step 1.4 or default
  activeIdea: UnexpectedIdea;
  agentPromptHandoff?: { agentId: string; prompt: string };

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
  setActiveIdea: (idea: UnexpectedIdea) => void;
  setAgentPromptHandoff: (handoff: { agentId: string; prompt: string } | undefined) => void;
}

export const useStore = create<SupabaseSyncState>((set) => {
  const initialConfig = getSupabaseConfig();
  const initialOffline = localStorage.getItem('lf_offline_mode') === 'true';
  const initialEmail = localStorage.getItem('lf_user_email') || '';
  
  // Safely parse initial idea
  let initialIdea = DEFAULT_ACTIVE_IDEA;
  const storedIdeaRaw = localStorage.getItem('guerrilla_active_idea');
  if (storedIdeaRaw) {
    try {
      initialIdea = JSON.parse(storedIdeaRaw);
    } catch (_) {
      // fallback
    }
  } else {
    // try to load from unexpected ideas if exists
    const storedIdeas = localStorage.getItem('guerrilla_unexpected_ideas');
    if (storedIdeas) {
      try {
        const parsed = JSON.parse(storedIdeas);
        if (parsed && parsed.length > 0) {
          initialIdea = parsed[0];
          localStorage.setItem('guerrilla_active_idea', JSON.stringify(initialIdea));
        }
      } catch (_) {}
    }
  }

  return {
    supabaseUrl: initialConfig?.url || '',
    supabaseAnonKey: initialConfig?.anonKey || '',
    supabaseTable: initialConfig?.tableName || 'ledgerflow_vault',
    userEmail: initialEmail,
    isOfflineMode: initialOffline,
    supabaseSyncStatus: 'idle',
    supabaseMessage: null,
    supabaseLastSynced: null,
    activeIdea: initialIdea,
    agentPromptHandoff: undefined,

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
    setActiveIdea: (idea) => {
      localStorage.setItem('guerrilla_active_idea', JSON.stringify(idea));
      set({ activeIdea: idea });
    },
    setAgentPromptHandoff: (handoff) => set({ agentPromptHandoff: handoff }),
  };
});

