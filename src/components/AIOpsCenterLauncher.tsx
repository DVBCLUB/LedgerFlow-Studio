import { useEffect, useState } from 'react';
import AIOpsWorkboard from './AIOpsWorkboard';

function isAIOpsRoute() {
  return window.location.hash === '#/ai_ops' || window.location.hash === '#/ai-ops' || window.location.hash === '#/ai_nhan_su';
}

export default function AIOpsCenterLauncher() {
  const [open, setOpen] = useState(() => isAIOpsRoute());

  useEffect(() => {
    const onHashChange = () => setOpen(isAIOpsRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const openPanel = () => {
    window.location.hash = '#/ai_ops';
    setOpen(true);
  };

  const closePanel = () => {
    if (isAIOpsRoute()) window.history.replaceState(null, '', window.location.pathname + window.location.search);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={openPanel}
        className="fixed bottom-56 right-5 z-40 rounded-2xl border border-violet-400/40 bg-slate-950/95 px-4 py-3 text-left text-xs font-black text-violet-100 shadow-2xl shadow-violet-950/40 backdrop-blur transition hover:border-violet-300 hover:bg-violet-950/80"
        title="Open AI Operations Center"
      >
        <span className="block text-[10px] uppercase tracking-[0.18em] text-violet-300">AI Ops</span>
        <span className="block">Workboard</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 p-4 backdrop-blur">
          <div className="mx-auto max-w-6xl">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-800 bg-slate-950 p-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-300">AI Operations Center</p>
                <h2 className="mt-1 text-xl font-black text-white">Agent Workboard & Approval Flow</h2>
                <p className="mt-1 text-xs font-semibold text-slate-400">Điều phối AI agent theo kiểu OpenClaw nhưng sandbox-first, approval-first, audit-first.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { window.location.hash = '#/review_desk'; setOpen(false); }}
                  className="rounded-2xl border border-emerald-400/40 px-4 py-2 text-xs font-black text-emerald-200 hover:bg-emerald-400/10"
                >
                  Mở Review Desk
                </button>
                <button
                  onClick={closePanel}
                  className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-rose-300 hover:text-rose-200"
                >
                  Đóng
                </button>
              </div>
            </div>
            <AIOpsWorkboard />
          </div>
        </div>
      )}
    </>
  );
}
