import { getSupabaseClientInstance, getSupabaseConfig, categorizeSupabaseError } from './supabaseSync';

export type MemoryType =
  | 'decision'
  | 'context'
  | 'agent_output'
  | 'product_update'
  | 'market_intel'
  | 'customer'
  | 'blocker'
  | 'learning';

export type Importance = 'low' | 'normal' | 'high' | 'critical';

export interface MemoryItem {
  id: string;
  user_id?: string;
  memory_type: MemoryType;
  title: string;
  content: string;
  agent_author?: string | null;
  related_card_id?: string | null;
  related_product?: string | null;
  tags: string[];
  importance: Importance;
  is_active: boolean;
  expires_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface MemoryWriteInput {
  memory_type: MemoryType;
  title: string;
  content: string;
  agent_author?: string;
  related_card_id?: string;
  related_product?: string;
  tags?: string[];
  importance?: Importance;
  expires_at?: string;
}

export interface MemoryClientStatus {
  ready: boolean;
  message: string;
  userId?: string;
}

async function getMemoryClient(): Promise<{ client: any | null; userId?: string; status: MemoryClientStatus }> {
  const config = getSupabaseConfig();
  if (!config?.url || !config?.anonKey) {
    return {
      client: null,
      status: {
        ready: false,
        message: 'Chưa cấu hình Supabase. Vào phần Sync/Cloud để nhập URL và anon key trước khi dùng Memory Bus.'
      }
    };
  }

  const client = getSupabaseClientInstance(config.url, config.anonKey);
  if (!client) {
    return {
      client: null,
      status: { ready: false, message: 'Không khởi tạo được Supabase client.' }
    };
  }

  const { data, error } = await client.auth.getUser();
  if (error || !data?.user?.id) {
    return {
      client,
      status: {
        ready: false,
        message: 'Chưa đăng nhập Supabase Auth hoặc phiên đăng nhập đã hết hạn. Memory Bus cần user_id để RLS hoạt động.'
      }
    };
  }

  return {
    client,
    userId: data.user.id,
    status: { ready: true, message: 'Supabase Memory Bus sẵn sàng.', userId: data.user.id }
  };
}

export async function getCompanyMemoryStatus(): Promise<MemoryClientStatus> {
  const { status } = await getMemoryClient();
  return status;
}

export async function writeMemory(item: MemoryWriteInput): Promise<{ data: MemoryItem | null; error?: string }> {
  const { client, userId, status } = await getMemoryClient();
  if (!client || !userId) return { data: null, error: status.message };

  const payload = {
    user_id: userId,
    memory_type: item.memory_type,
    title: item.title.trim(),
    content: item.content.trim(),
    agent_author: item.agent_author || 'Founder',
    related_card_id: item.related_card_id || null,
    related_product: item.related_product || null,
    tags: item.tags || [],
    importance: item.importance || 'normal',
    expires_at: item.expires_at || null,
    is_active: true
  };

  const { data, error } = await client.from('company_memory').insert(payload).select('*').single();
  if (error) {
    const categorized = categorizeSupabaseError(error);
    return { data: null, error: categorized.message };
  }

  return { data };
}

export async function readRecentMemory(limit = 50, memoryTypes?: MemoryType[]): Promise<{ data: MemoryItem[]; error?: string }> {
  const { client, userId, status } = await getMemoryClient();
  if (!client || !userId) return { data: [], error: status.message };

  let query = client
    .from('company_memory')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (memoryTypes?.length) query = query.in('memory_type', memoryTypes);

  const { data, error } = await query;
  if (error) {
    const categorized = categorizeSupabaseError(error);
    return { data: [], error: categorized.message };
  }

  return { data: data || [] };
}

export async function readCriticalContext(): Promise<string> {
  const { data } = await readRecentMemory(20, ['context', 'decision']);
  const critical = data.filter((item) => item.importance === 'critical' || item.importance === 'high');
  if (!critical.length) return '';

  return critical
    .map((item) => `[${item.memory_type.toUpperCase()}] ${item.title}: ${item.content}`)
    .join('\n');
}

export async function deactivateMemory(id: string): Promise<{ success: boolean; error?: string }> {
  const { client, userId, status } = await getMemoryClient();
  if (!client || !userId) return { success: false, error: status.message };

  const { error } = await client
    .from('company_memory')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    const categorized = categorizeSupabaseError(error);
    return { success: false, error: categorized.message };
  }

  return { success: true };
}

export const MEMORY_TYPES: MemoryType[] = [
  'decision',
  'context',
  'agent_output',
  'product_update',
  'market_intel',
  'customer',
  'blocker',
  'learning'
];
