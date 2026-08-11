import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowRight, X, Sparkles, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { COMPANY_WORKSPACES } from '../../app/companyNavigation';
import { IconMap } from '../../app/iconRegistry';
import { createAgentRun, type AgentRun } from '../../utils/assistantApi';

type DispatchState = 'idle' | 'sending' | 'success' | 'error';

export default function GlobalCommandSpotlight() {
  const [isOpen, setIsOpen]   = useState(false);
  const [query, setQuery]     = useState('');
  const [dispatch, setDispatch] = useState<DispatchState>('idle');
  const [dispatchResult, setDispatchResult] = useState<AgentRun | null>(null);
  const [dispatchError, setDispatchError]   = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Ctrl+K / Cmd+K toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Auto-focus khi mở
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    // Reset state khi đóng
    if (!isOpen) {
      setDispatch('idle');
      setDispatchResult(null);
      setDispatchError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNavigate = (tab: string) => {
    window.location.hash = `/${tab}`;
    setIsOpen(false);
    setQuery('');
  };

  // ─── Giao nhiệm vụ thực cho Agent Runtime ────────────────────────────────
  const handleDispatchToAgent = async () => {
    if (!query.trim() || dispatch === 'sending') return;
    setDispatch('sending');
    setDispatchResult(null);
    setDispatchError(null);
    try {
      const run = await createAgentRun(query.trim(), {
        maxSteps: 5,
        plannerMode: 'auto',
      });
      setDispatchResult(run);
      setDispatch('success');
    } catch (err: any) {
      setDispatchError(err?.message || 'Không gửi được lệnh tới Agent Runtime. Hãy chắc daemon đang chạy.');
      setDispatch('error');
    }
  };

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      if (matchedWorkspaces.length === 1) {
        handleNavigate(matchedWorkspaces[0].tab);
      } else {
        void handleDispatchToAgent();
      }
    }
  };

  const normalizedQuery = query.toLowerCase();
  const matchedWorkspaces = COMPANY_WORKSPACES.filter(
    (w) =>
      w.label.toLowerCase().includes(normalizedQuery) ||
      w.description.toLowerCase().includes(normalizedQuery)
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      <div className="relative w-full max-w-2xl bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden shadow-indigo-500/10">
        {/* Search input */}
        <div className="flex items-center px-4 py-3 border-b border-white/5">
          <Search className="w-5 h-5 text-indigo-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              // Reset dispatch state khi user gõ lại
              if (dispatch !== 'idle') {
                setDispatch('idle');
                setDispatchResult(null);
                setDispatchError(null);
              }
            }}
            placeholder="Chuyển trang, hoặc Ra lệnh cho AI..."
            className="flex-1 bg-transparent text-white placeholder-slate-600 text-lg outline-none"
            onKeyDown={handleEnter}
          />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono bg-white/10 text-slate-400 px-1.5 py-0.5 rounded">ESC</span>
            <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white ml-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {/* ─── Kết quả dispatch (success hoặc error) ──────────────────── */}
          {dispatch === 'success' && dispatchResult && (
            <div className="m-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-black text-emerald-300">Đã giao nhiệm vụ cho Agent Runtime!</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Run ID: <span className="font-mono text-emerald-400">{dispatchResult.id.slice(-8)}</span>
                    {' · '}
                    Trạng thái: <span className="font-bold text-emerald-300">{dispatchResult.status}</span>
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Theo dõi tại{' '}
                    <button
                      onClick={() => { window.location.hash = '/ai_factory'; setIsOpen(false); }}
                      className="text-sky-400 hover:underline"
                    >
                      Đội ngũ AI
                    </button>
                    {' → Agent Runtime'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {dispatch === 'error' && dispatchError && (
            <div className="m-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-rose-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-black text-rose-300">Không gửi được lệnh</p>
                  <p className="mt-1 text-xs text-rose-400/80">{dispatchError}</p>
                  <p className="mt-1.5 font-mono text-[10px] text-slate-500">→ Chạy: npm run dev</p>
                </div>
              </div>
            </div>
          )}

          {/* ─── AI Action card (khi query đủ dài và chưa dispatch xong) ── */}
          {query.length > 2 && dispatch === 'idle' && (
            <div className="mb-4">
              <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Hành động AI
              </div>
              <button
                onClick={() => void handleDispatchToAgent()}
                className="w-full text-left px-3 py-3 rounded-lg hover:bg-indigo-500/10 flex items-center gap-3 group"
              >
                <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-md group-hover:bg-indigo-500/30 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    Giao nhiệm vụ AI: <span className="text-indigo-300">"{query}"</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Tạo Agent Run → gửi đến Agent Runtime (backend thực)
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all ml-auto shrink-0" />
              </button>
            </div>
          )}

          {/* Loading state */}
          {dispatch === 'sending' && (
            <div className="m-2 flex items-center gap-3 px-4 py-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
              <Loader2 className="h-4 w-4 text-indigo-400 animate-spin shrink-0" />
              <p className="text-sm font-semibold text-indigo-300">Đang gửi đến Agent Runtime...</p>
            </div>
          )}

          {/* ─── Workspace list ──────────────────────────────────────────── */}
          <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-widest">
            Không gian làm việc
          </div>
          {matchedWorkspaces.length > 0 ? (
            matchedWorkspaces.map((w) => {
              const Icon = IconMap[w.iconName] || IconMap['Building2'];
              return (
                <button
                  key={w.tab}
                  onClick={() => handleNavigate(w.tab)}
                  className="w-full text-left px-3 py-3 rounded-lg hover:bg-white/5 flex items-center justify-between group transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-white/5 text-slate-500 rounded-md group-hover:text-white group-hover:bg-white/10 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{w.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5 truncate max-w-sm">{w.description}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                </button>
              );
            })
          ) : (
            <div className="px-4 py-6 text-center text-slate-500 text-sm">
              {query.length > 2
                ? 'Không tìm thấy module. Nhấn Enter để giao nhiệm vụ cho AI.'
                : 'Gõ tên module hoặc lệnh AI...'}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-white/[0.02] border-t border-white/5 flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="font-mono bg-white/10 px-1 rounded text-[10px]">Enter</span>
            Chọn / Ra lệnh AI
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono bg-white/10 px-1 rounded text-[10px]">ESC</span>
            Đóng
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-[10px] text-slate-600">
            <Sparkles className="h-3 w-3 text-indigo-500/60" />
            Agent Runtime
          </div>
        </div>
      </div>
    </div>
  );
}
