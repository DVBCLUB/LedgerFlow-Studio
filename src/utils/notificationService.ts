import { supabase } from './supabaseClient';

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

export async function fetchNotifications(limit = 20): Promise<AppNotification[]> {
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
  if (!supabase) return;
  await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
}

export async function markAllAsRead(): Promise<void> {
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
}

export function subscribeToNotifications(onNew: (notification: AppNotification) => void): () => void {
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
