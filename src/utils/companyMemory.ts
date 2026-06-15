import { supabase } from './supabaseClient';

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
  memory_type: MemoryType;
  title: string;
  content: string;
  agent_author?: string;
  related_card_id?: string;
  related_product?: string;
  tags: string[];
  importance: Importance;
  is_active: boolean;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

export async function writeMemory(item: {
  memory_type: MemoryType;
  title: string;
  content: string;
  agent_author?: string;
  related_card_id?: string;
  related_product?: string;
  tags?: string[];
  importance?: Importance;
  expires_at?: string;
}): Promise<MemoryItem | null> {
  if (!supabase) return null;

  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData?.user) return null;

  const payload = {
    ...item,
    user_id: userData.user.id,
    tags: item.tags || [],
    importance: item.importance || 'normal',
  };

  const { data, error } = await supabase
    .from('company_memory')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('writeMemory error:', error);
    return null;
  }

  return data as MemoryItem;
}

export async function readRecentMemory(
  limit = 20,
  memoryTypes?: MemoryType[],
): Promise<MemoryItem[]> {
  if (!supabase) return [];

  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData?.user) return [];

  let query = supabase
    .from('company_memory')
    .select('*')
    .eq('user_id', userData.user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (memoryTypes?.length) {
    query = query.in('memory_type', memoryTypes);
  }

  const { data, error } = await query;
  if (error) {
    console.error('readRecentMemory error:', error);
    return [];
  }

  return (data || []) as MemoryItem[];
}

export async function readCriticalContext(): Promise<string> {
  const items = await readRecentMemory(10, ['context', 'decision']);
  const critical = items.filter((m) => m.importance === 'critical' || m.importance === 'high');
  if (!critical.length) return '';

  return critical
    .map((m) => `[${m.memory_type.toUpperCase()}] ${m.title}: ${m.content}`)
    .join('\n');
}

export async function deactivateMemory(id: string): Promise<void> {
  if (!supabase) return;
  await supabase.from('company_memory').update({ is_active: false }).eq('id', id);
}
