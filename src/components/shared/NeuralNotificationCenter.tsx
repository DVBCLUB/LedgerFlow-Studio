import React, { useState, useEffect, useCallback } from 'react';
import { Terminal, X, Code2, Database, Compass, Bell, Trash2, ShieldCheck, FileText } from 'lucide-react';
import { fetchAuditLogs, type AuditLogEntry } from '../../utils/assistantApi';

export default function NeuralNotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll audit logs
  const pollLogs = useCallback(async () => {
    try {
      const recentLogs = await fetchAuditLogs(15);
      setLogs((prevLogs) => {
        // Only update if there are new logs (check IDs)
        if (recentLogs.length > 0 && prevLogs.length > 0 && recentLogs[0].id !== prevLogs[0].id) {
          // Calculate how many new logs were added
          const newIndex = recentLogs.findIndex((l: AuditLogEntry) => l.id === prevLogs[0].id);
          if (newIndex > 0 && !isOpen) {
            setUnreadCount(c => c + newIndex);
          } else if (newIndex === -1 && !isOpen) {
            setUnreadCount(c => c + recentLogs.length);
          }
        } else if (prevLogs.length === 0 && recentLogs.length > 0 && !isOpen) {
          setUnreadCount(recentLogs.length);
        }
        return recentLogs;
      });
    } catch {
      // Ignore network errors on polling
    }
  }, [isOpen]);

  useEffect(() => {
    void pollLogs();
    const interval = setInterval(() => void pollLogs(), 15000);
    return () => clearInterval(interval);
  }, [pollLogs]);

  // Handle open/close with animation sequencing
  useEffect(() => {
    if (isOpen) {
      // Reset unread count
      setUnreadCount(0);
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative flex items-center justify-center w-8 h-8 rounded-full border border-white/10 text-slate-500 hover:text-white transition-colors"
        style={{ background: 'rgba(255,255,255,0.04)' }}
        title="Neural Comm Center — Agent Logs"
      >
        <Bell className="w-4 h-4" />
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] rounded-full flex items-center justify-center text-[8px] font-black text-white px-1"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 0 6px rgba(239,68,68,0.5)' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Backdrop + Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-[100]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 backdrop-blur-sm transition-opacity duration-300"
            style={{
              background: 'rgba(0,0,0,0.4)',
              opacity: isVisible ? 1 : 0,
            }}
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer panel */}
          <div
            className="absolute top-0 right-0 h-full w-[400px] flex flex-col shadow-2xl transition-transform"
            style={{
              background: 'linear-gradient(180deg, #0c0d11 0%, #09090b 100%)',
              borderLeft: '1px solid rgba(255,255,255,0.07)',
              transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
              transitionDuration: '320ms',
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Drawer Header */}
            <div
              className="flex items-center justify-between px-5 py-4 shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}
                >
                  <Terminal className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Neural Comm Center</h3>
                  <div className="text-[10px] text-slate-600 uppercase tracking-widest mt-0.5">
                    Live System Audit Logs
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLogs([])}
                  className="text-slate-600 hover:text-slate-300 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                  title="Xóa tạm thời"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-600 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Log list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 font-mono text-xs">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-slate-700">
                  <Terminal className="w-6 h-6 mb-2 opacity-40" />
                  <p>Chưa có log hệ thống nào</p>
                </div>
              ) : (
                logs.map((log, i) => {
                  let Icon = Terminal;
                  let s = { color: '#94a3b8', bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.07)' };

                  if (log.status === 'executed' || log.status === 'approved') {
                    s = { color: '#34d399', bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.15)' };
                    Icon = ShieldCheck;
                  } else if (log.status === 'failed' || log.status === 'rejected') {
                    s = { color: '#f87171', bg: 'rgba(248,113,113,0.06)', border: 'rgba(248,113,113,0.15)' };
                    Icon = X;
                  } else if (log.status === 'sandbox' || log.status === 'planned') {
                    s = { color: '#818cf8', bg: 'rgba(99,102,241,0.06)', border: 'rgba(99,102,241,0.15)' };
                    Icon = Compass;
                  } else if (log.status === 'pending_approval') {
                    s = { color: '#fbbf24', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.15)' };
                    Icon = FileText;
                  }

                  if (log.actor === 'system') Icon = Database;
                  if (log.actor === 'ai-agent') Icon = Code2;

                  return (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl flex gap-3"
                      style={{
                        background: s.bg,
                        border: `1px solid ${s.border}`,
                        animation: `lf-log-in 0.3s ease-out ${i * 0.04}s both`,
                      }}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: s.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold uppercase text-[10px]" style={{ color: s.color }}>[{log.actor}] {log.workspace}</span>
                          <span className="text-slate-700 text-[10px]">{new Date(log.createdAt).toLocaleTimeString('vi-VN')}</span>
                        </div>
                        <div className="text-slate-400 leading-relaxed truncate">{log.summary}</div>
                        <div className="text-[9px] text-slate-600 mt-1 uppercase tracking-wider">{log.action}</div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Streaming indicator */}
              <div className="flex items-center gap-2 text-slate-700 px-1 py-2 mt-4">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-slate-700"
                    style={{ animation: `lf-dot-pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
                  />
                ))}
                <span className="ml-1">Đang lắng nghe agent stream...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes lf-log-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lf-dot-pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </>
  );
}
