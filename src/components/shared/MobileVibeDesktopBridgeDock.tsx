import React, { useState, useEffect } from 'react';
import { Smartphone, DownloadCloud, Sparkles, CheckCircle2, FileCode, Lightbulb, RefreshCw, X } from 'lucide-react';

interface InboxItem {
  id: string;
  type: string;
  title: string;
  content: string;
  syncedToDesktop?: boolean;
}

export default function MobileVibeDesktopBridgeDock() {
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchInbox = async () => {
    try {
      const res = await fetch('/api/mobile-vibe/inbox');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.inbox)) {
        setInbox(data.inbox.filter((x: InboxItem) => !x.syncedToDesktop));
      }
    } catch {
      // offline
    }
  };

  useEffect(() => {
    void fetchInbox();
    const interval = setInterval(fetchInbox, 15000); // kiểm tra mỗi 15 giây
    return () => clearInterval(interval);
  }, []);

  const handlePullToDesktop = async () => {
    setPulling(true);
    setSuccessMessage(null);
    try {
      const res = await fetch('/api/mobile-vibe/pull', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Đã kéo thành công ${data.pulledCount || inbox.length} mục từ Mobile vào kho dữ liệu PC!`);
        await fetchInbox();
      }
    } catch {
      setSuccessMessage('Không thể kết nối máy chủ để kéo dữ liệu.');
    } finally {
      setPulling(false);
    }
  };

  if (inbox.length === 0 && !successMessage) {
    return null; // Không có gì cần pull, ẩn widget
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="rounded-2xl border border-cyan-500/40 bg-slate-950/95 p-4 shadow-2xl shadow-cyan-500/20 backdrop-blur-xl max-w-sm w-full space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Smartphone className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Hộp thư Mobile Vibe</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
              </h4>
              <p className="text-[10px] text-slate-400">
                {inbox.length > 0 ? `Có ${inbox.length} ý tưởng / code từ điện thoại` : 'Đã đồng bộ xong'}
              </p>
            </div>
          </div>

          <button onClick={() => setShowDrawer(!showDrawer)} className="text-slate-400 hover:text-white text-xs">
            {showDrawer ? 'Thu gọn' : 'Xem'}
          </button>
        </div>

        {/* Danh sách items nếu mở rộng */}
        {showDrawer && inbox.length > 0 && (
          <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-thin pr-1">
            {inbox.map((item) => (
              <div key={item.id} className="flex items-center gap-2 rounded-lg bg-slate-900/80 p-2 text-xs border border-slate-800">
                {item.type === 'code_snippet' ? (
                  <FileCode className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                ) : (
                  <Lightbulb className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                )}
                <span className="text-white font-medium truncate">{item.title}</span>
              </div>
            ))}
          </div>
        )}

        {successMessage && (
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {inbox.length > 0 && (
          <button
            onClick={handlePullToDesktop}
            disabled={pulling}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50"
          >
            <DownloadCloud className={`h-4 w-4 ${pulling ? 'animate-bounce' : ''}`} />
            <span>{pulling ? 'Đang kéo về PC...' : `📥 Kéo ${inbox.length} mục về Studio`}</span>
          </button>
        )}
      </div>
    </div>
  );
}
