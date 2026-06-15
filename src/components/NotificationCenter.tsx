import { useCallback, useEffect, useState } from 'react';
import { fetchNotifications, markAllAsRead, markAsRead, subscribeToNotifications, type AppNotification } from '../utils/notificationService';

const TYPE_ICON: Record<string, string> = {
  daily_brief: '📋',
  weekly_report: '📊',
  monthly_reminder: '📅',
  agent_done: '🤖',
  approval_needed: '⚠️',
  pipeline_done: '✅',
  alert: '🔔',
  info: 'ℹ️',
};

const TYPE_COLOR: Record<string, string> = {
  daily_brief: 'border-cyan-400/30 bg-cyan-950/30',
  weekly_report: 'border-blue-400/30 bg-blue-950/30',
  monthly_reminder: 'border-amber-400/30 bg-amber-950/30',
  agent_done: 'border-emerald-400/30 bg-emerald-950/30',
  approval_needed: 'border-rose-400/30 bg-rose-950/30',
  pipeline_done: 'border-emerald-400/30 bg-emerald-950/30',
  alert: 'border-rose-400/30 bg-rose-950/30',
  info: 'border-slate-700 bg-slate-900/50',
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await fetchNotifications();
    setNotifications(data);
    setUnreadCount(data.filter((item) => !item.is_read).length);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const unsubscribe = subscribeToNotifications((newNotification) => {
      setNotifications((current) => [newNotification, ...current]);
      setUnreadCount((current) => current + 1);
      try { new Audio('/notification.mp3').play().catch(() => undefined); } catch {}
    });
    return unsubscribe;
  }, [load]);

  return { notifications, unreadCount, loading, reload: load };
}

export function NotificationBell({ onClick }: { onClick: () => void }) {
  const { unreadCount } = useNotifications();
  return (
    <button onClick={onClick} className="relative rounded-2xl border border-slate-800 p-2 text-slate-400 transition hover:border-cyan-300 hover:text-cyan-200" title="Thông báo">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}
    </button>
  );
}

export default function NotificationCenter() {
  const { notifications, loading, reload } = useNotifications();
  const [expanded, setExpanded] = useState<string | null>(null);

  async function handleRead(id: string) {
    await markAsRead(id);
    reload();
  }

  async function handleReadAll() {
    await markAllAsRead();
    reload();
  }

  return (
    <section className="space-y-3 text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">Realtime</p>
          <h3 className="text-xl font-black text-white">Thông báo</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">Daily brief, approval, pipeline và cảnh báo từ agents.</p>
        </div>
        <button onClick={handleReadAll} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-cyan-300 hover:text-cyan-200">Đánh dấu tất cả đã đọc</button>
      </div>

      {loading && <p className="py-8 text-center text-sm text-slate-500">Đang tải...</p>}
      {!loading && notifications.length === 0 && (
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 py-12 text-center text-slate-500">
          <p className="mb-2 text-2xl">🔕</p>
          <p className="text-sm font-bold">Chưa có thông báo nào</p>
          <p className="mt-1 text-xs">Chief of Staff sẽ gửi Daily Brief lúc 8:00 sáng.</p>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((notification) => (
          <article key={notification.id} onClick={() => setExpanded(expanded === notification.id ? null : notification.id)} className={`cursor-pointer rounded-2xl border p-3 transition ${TYPE_COLOR[notification.type] || TYPE_COLOR.info}`}>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex-shrink-0 text-lg">{TYPE_ICON[notification.type] || '🔔'}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-black text-white">{notification.title}</p>
                  <span className="flex-shrink-0 text-[10px] text-slate-500">{new Date(notification.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {expanded === notification.id ? (
                  <div className="mt-2">
                    <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-300">{notification.content}</pre>
                    <button onClick={(event) => { event.stopPropagation(); handleRead(notification.id); }} className="mt-3 text-xs font-black text-cyan-300 hover:text-cyan-200">Đánh dấu đã đọc ✓</button>
                  </div>
                ) : (
                  <p className="mt-1 truncate text-xs text-slate-400">{notification.content.slice(0, 100)}...</p>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
