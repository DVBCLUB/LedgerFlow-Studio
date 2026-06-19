import React, { Suspense, useEffect, useState } from 'react';
import { Bot, Loader2, X, Minimize2, Maximize2 } from 'lucide-react';

const AIAssistantPanel = React.lazy(() => import('./AIAssistantPanel'));

interface AIAssistantLauncherProps {
  hideTrigger?: boolean;
}

export default function AIAssistantLauncher({ hideTrigger = false }: AIAssistantLauncherProps) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Listen for hash-based navigation
  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#/ai_assistant' || hash === '#/assistant_panel') {
        setOpen(true);
      }
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  function close() {
    setOpen(false);
    if (['#/ai_assistant', '#/assistant_panel'].includes(window.location.hash.toLowerCase())) {
      window.location.hash = '#/dashboard';
    }
  }

  return (
    <>
      {/* ── Floating trigger button ── */}
      {!hideTrigger && (
        <button
          id="ai-assistant-launcher-btn"
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-[200px] right-5 z-[79] inline-flex items-center gap-2 rounded-full border border-violet-400/40 bg-slate-950/95 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-violet-100 shadow-2xl shadow-violet-950/40 backdrop-blur transition hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-950/80 hover:shadow-violet-500/20"
          title="Mở AI Coding Assistant"
        >
          <Bot className="h-4 w-4" />
          <span className="hidden sm:inline">AI Coder</span>
        </button>
      )}

      {/* ── Overlay panel ── */}
      {open && (
        <div
          className={`fixed z-[96] transition-all duration-300 ${
            expanded
              ? 'inset-0'
              : 'bottom-4 right-4 w-[420px] h-[680px] max-h-[90vh]'
          }`}
        >
          <div className="flex flex-col h-full rounded-2xl overflow-hidden shadow-2xl shadow-violet-950/40 border border-slate-800/80 bg-slate-950">
            {/* Panel header bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-950/90 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-xs font-black text-white">AI Coding Assistant</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setExpanded(e => !e)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  title={expanded ? 'Thu nhỏ' : 'Phóng to'}
                >
                  {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                  title="Đóng"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-hidden">
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-400">
                    <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
                    Đang tải AI Assistant...
                  </div>
                }
              >
                <AIAssistantPanel />
              </Suspense>
            </div>
          </div>
        </div>
      )}

      {/* ── Backdrop when expanded ── */}
      {open && expanded && (
        <div
          className="fixed inset-0 z-[95] bg-slate-950/70 backdrop-blur-sm"
          onClick={close}
        />
      )}
    </>
  );
}
