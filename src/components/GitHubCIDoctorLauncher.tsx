import React, { Suspense, useEffect, useState } from 'react';
import { Activity, Loader2, X } from 'lucide-react';

const GitHubCIDoctorPanel = React.lazy(() => import('./GitHubCIDoctorPanel'));

export default function GitHubCIDoctorLauncher() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash.toLowerCase();
      setOpen(hash === '#/ci_doctor' || hash === '#/ci-doctor' || hash === '#/github_ci');
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  function openPanel() {
    window.location.hash = '#/ci_doctor';
    setOpen(true);
  }

  function closePanel() {
    if (window.location.hash.toLowerCase().includes('ci')) {
      window.location.hash = '#/dashboard';
    }
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        className="fixed bottom-44 right-4 z-[60] inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-950/90 px-4 py-3 text-xs font-black text-amber-100 shadow-2xl shadow-black/40 backdrop-blur transition hover:bg-amber-900"
        title="Mở GitHub CI Doctor"
      >
        <Activity className="h-4 w-4" /> CI Doctor
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] overflow-y-auto bg-slate-950/95 p-4 text-slate-100 backdrop-blur md:p-8">
          <div className="mx-auto max-w-7xl space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <div>
                <div className="text-sm font-black uppercase tracking-[0.2em] text-amber-300">GitHub CI Doctor</div>
                <p className="mt-1 text-xs font-semibold text-slate-400">Đọc lỗi GitHub Actions, dùng AI Gateway phân tích, rồi tạo prompt sửa lỗi cho VS Code/Cursor.</p>
              </div>
              <button
                type="button"
                onClick={closePanel}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-black text-slate-200 hover:border-rose-500 hover:text-rose-100"
              >
                <X className="h-4 w-4" /> Đóng
              </button>
            </div>

            <Suspense fallback={<div className="rounded-3xl border border-slate-800 bg-slate-950 p-10 text-center text-sm font-bold text-slate-300"><Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-amber-300" />Đang tải CI Doctor...</div>}>
              <GitHubCIDoctorPanel repoUrl="https://github.com/DVBCLUB/LedgerFlow-Studio" />
            </Suspense>
          </div>
        </div>
      )}
    </>
  );
}
