import React, { Suspense, useEffect, useState } from 'react';
import { Code2, Loader2, X } from 'lucide-react';

const DevHandoffCenter = React.lazy(() => import('./DevHandoffCenter'));

export default function DevHandoffLauncher() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#/dev_handoff' || hash === '#/dev-handoff' || hash === '#/handoff') {
        setOpen(true);
      }
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  function close() {
    setOpen(false);
    if (['#/dev_handoff', '#/dev-handoff', '#/handoff'].includes(window.location.hash.toLowerCase())) {
      window.location.hash = '#/dashboard';
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-[152px] right-5 z-[79] inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-slate-950/95 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-emerald-100 shadow-2xl shadow-emerald-950/40 backdrop-blur transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-950"
        title="Mở Dev Handoff Center"
      >
        <Code2 className="h-4 w-4" /> Dev Handoff
      </button>

      {open && (
        <div className="fixed inset-0 z-[95] bg-slate-950/95 backdrop-blur-xl">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-950/40">
                  <Code2 className="h-5 w-5 text-emerald-200" />
                </div>
                <div>
                  <div className="text-sm font-black text-white">Dev Handoff Center</div>
                  <div className="text-[11px] font-bold text-slate-500">LedgerFlow → GitHub → VS Code/Cursor/Copilot</div>
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-black text-slate-200 hover:border-rose-400 hover:text-rose-100"
              >
                <X className="h-4 w-4" /> Đóng
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 md:p-6">
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center text-sm font-black text-slate-300">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-300" /> Đang tải Dev Handoff Center...
                  </div>
                }
              >
                <DevHandoffCenter />
              </Suspense>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
