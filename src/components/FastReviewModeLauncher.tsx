import { useEffect, useState } from 'react';
import FastReviewModePanel from './FastReviewModePanel';

function isRoute() {
  return window.location.hash === '#/fast_mode' || window.location.hash === '#/fast-review';
}

export default function FastReviewModeLauncher() {
  const [open, setOpen] = useState(() => isRoute());

  useEffect(() => {
    const onHash = () => setOpen(isRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const openPanel = () => {
    window.location.hash = '#/fast_mode';
    setOpen(true);
  };

  const closePanel = () => {
    if (isRoute()) window.history.replaceState(null, '', window.location.pathname + window.location.search);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={openPanel}
        className="fixed bottom-72 right-5 z-40 rounded-2xl border border-emerald-400/40 bg-slate-950/95 px-4 py-3 text-left text-xs font-black text-emerald-100 shadow-2xl shadow-emerald-950/30 backdrop-blur transition hover:border-emerald-300 hover:bg-emerald-950/70"
        title="Fast Review Mode"
      >
        <span className="block text-[10px] uppercase tracking-[0.18em] text-emerald-300">Fast Mode</span>
        <span className="block">1 approve</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 p-4 backdrop-blur">
          <div className="mx-auto max-w-4xl">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-800 bg-slate-950 p-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">Convenient secure workflow</p>
                <h2 className="mt-1 text-xl font-black text-white">AI code/push qua một lớp duyệt</h2>
                <p className="mt-1 text-xs font-semibold text-slate-400">Giữ Review Desk là cổng duyệt chính; các màn còn lại hỗ trợ kiểm tra, log, rollback.</p>
              </div>
              <button onClick={closePanel} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-rose-300 hover:text-rose-200">Đóng</button>
            </div>
            <FastReviewModePanel />
          </div>
        </div>
      )}
    </>
  );
}
