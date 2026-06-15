// @ts-nocheck
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

function getClient() {
  const config = getSupabaseConfig();
  if (!config?.url || !config?.anonKey) return null;
  return getSupabaseClientInstance(config.url, config.anonKey);
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
  if (error) return [];
  return data || [];
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
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
      onNew(payload.new as AppNotification);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
