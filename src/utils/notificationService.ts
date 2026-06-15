import { getSupabaseClientInstance, getSupabaseConfig } from './supabaseSync';

export interface AppNotification {
  id: string;
  user_id?: string;
  title: string;
  content: string;
  type: string;
  is_read: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
}

type RealtimeInsertPayload = {
  new: Record<string, unknown>;
};

type SupabaseClientInstance = ReturnType<typeof getSupabaseClientInstance>;

function getClient(): SupabaseClientInstance | null {
  const config = getSupabaseConfig();
  if (!config?.url || !config?.anonKey) return null;
  return getSupabaseClientInstance(config.url, config.anonKey);
}

function normalizeNotification(raw: Record<string, unknown>): AppNotification {
  return {
    id: String(raw.id || ''),
    user_id: typeof raw.user_id === 'string' ? raw.user_id : undefined,
    title: String(raw.title || 'Thông báo'),
    content: String(raw.content || ''),
    type: String(raw.type || 'info'),
    is_read: Boolean(raw.is_read),
    metadata: raw.metadata && typeof raw.metadata === 'object' && !Array.isArray(raw.metadata) ? raw.metadata as Record<string, unknown> : {},
    created_at: String(raw.created_at || new Date().toISOString()),
  };
}

export async function fetchNotifications(limit = 20): Promise<AppNotification[]> {
  const supabase = getClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !Array.isArray(data)) return [];
  return data.map((item) => normalizeNotification(item as Record<string, unknown>));
}

export async function markAsRead(notificationId: string): Promise<void> {
  const supabase = getClient();
  if (!supabase) return;
  await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
}

export async function markAllAsRead(): Promise<void> {
  const supabase = getClient();
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
}

export function subscribeToNotifications(onNew: (notification: AppNotification) => void): () => void {
  const supabase = getClient();
  if (!supabase) return () => undefined;
  const channel = supabase
    .channel('notifications-realtime')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload: RealtimeInsertPayload) => {
      onNew(normalizeNotification(payload.new));
    })
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
