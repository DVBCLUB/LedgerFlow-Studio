import React, { Suspense, useEffect, useState } from 'react';
import { KeyRound, Loader2, X } from 'lucide-react';

const AISettingsManager = React.lazy(() => import('./AISettingsManager'));

function isAISettingsHash() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  return hash === 'ai_settings' || hash === 'ai-settings';
}

export default function AISettingsLauncher() {
  const [isOpen, setIsOpen] = useState(() => isAISettingsHash());

  useEffect(() => {
    const handleHashChange = () => setIsOpen(isAISettingsHash());
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const openSettings = () => {
    window.location.hash = '/ai_settings';
    setIsOpen(true);
  };

  const closeSettings = () => {
    setIsOpen(false);
    if (isAISettingsHash()) {
      window.location.hash = '/dashboard';
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openSettings}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-2xl border border-purple-700/70 bg-slate-950/90 px-4 py-3 text-xs font-black text-purple-100 shadow-2xl shadow-purple-950/40 backdrop-blur hover:bg-purple-950/90 hover:border-purple-500 transition-all"
        title="Cài đặt AI Gateway: nhập nhiều API key, fallback provider, backup/import key"
      >
        <KeyRound className="h-4 w-4 text-amber-300" />
        AI Gateway
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/95 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
            <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-slate-900 bg-slate-950/80 p-3 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-purple-700/60 bg-purple-950/40">
                  <KeyRound className="h-5 w-5 text-amber-300" />
                </div>
                <div>
                  <div className="text-sm font-black text-white">LedgerFlow AI Gateway</div>
                  <div className="text-[11px] font-semibold text-slate-400">
                    Cài đặt nhiều API key/provider, fallback tự động, backup chuyển máy.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={closeSettings}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-black text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
                Đóng
              </button>
            </div>

            <Suspense
              fallback={
                <div className="rounded-2xl border border-slate-900 bg-slate-950/70 p-8 text-sm font-bold text-slate-300">
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin text-purple-300" />
                  Đang tải màn hình cài đặt AI...
                </div>
              }
            >
              <AISettingsManager />
            </Suspense>
          </div>
        </div>
      )}
    </>
  );
}
