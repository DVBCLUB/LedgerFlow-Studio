import { useEffect, useState } from 'react';
import ApprovedPrPanel from './ApprovedPrPanel';

export default function ApprovedPrLauncher() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const syncFromHash = () => {
      setOpen(['#/ai_pr', '#/ai-pr', '#/approved_pr'].includes(window.location.hash));
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-44 right-4 z-40 rounded-full border border-emerald-400/40 bg-slate-950/95 px-4 py-3 text-xs font-black text-emerald-200 shadow-2xl backdrop-blur hover:border-emerald-300 hover:text-white"
      >
        AI PR
      </button>
      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/88 p-4 backdrop-blur-xl">
          <div className="mx-auto max-w-6xl">
            <div className="mb-3 flex justify-end">
              <button onClick={() => setOpen(false)} className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-xs font-black text-slate-300 hover:border-emerald-300 hover:text-white">Đóng</button>
            </div>
            <ApprovedPrPanel />
          </div>
        </div>
      )}
    </>
  );
}
