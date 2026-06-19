import React, { Suspense, useEffect, useState } from 'react';
import { Loader2, Network, X } from 'lucide-react';

const IntegrationHub = React.lazy(() => import('./IntegrationHub'));

function isIntegrationHubHash() {
  const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0];
  return hash === 'integration_hub' || hash === 'integration-hub';
}

interface IntegrationHubLauncherProps {
  hideTrigger?: boolean;
}

export default function IntegrationHubLauncher({ hideTrigger = false }: IntegrationHubLauncherProps) {
  const [isOpen, setIsOpen] = useState(() => isIntegrationHubHash());

  useEffect(() => {
    const handleHashChange = () => setIsOpen(isIntegrationHubHash());
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const openHub = () => {
    window.location.hash = '/integration_hub';
    setIsOpen(true);
  };

  const closeHub = () => {
    setIsOpen(false);
    if (isIntegrationHubHash()) {
      window.location.hash = '/dashboard';
    }
  };

  return (
    <>
      {!hideTrigger && (
        <button
          type="button"
          onClick={openHub}
          className="fixed bottom-20 right-5 z-40 inline-flex items-center gap-2 rounded-2xl border border-cyan-700/70 bg-slate-950/90 px-4 py-3 text-xs font-black text-cyan-100 shadow-2xl shadow-cyan-950/40 backdrop-blur transition-all hover:border-cyan-400 hover:bg-cyan-950/90"
          title="Integration Hub: trung tâm đầu mối kết nối GitHub, VS Code, Google Workspace, ERP, chứng từ, automation"
        >
          <Network className="h-4 w-4 text-cyan-300" />
          Integration Hub
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/95 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
            <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-slate-900 bg-slate-950/80 p-3 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-700/60 bg-cyan-950/40">
                  <Network className="h-5 w-5 text-cyan-300" />
                </div>
                <div>
                  <div className="text-sm font-black text-white">LedgerFlow Integration Hub</div>
                  <div className="text-[11px] font-semibold text-slate-400">
                    Trung tâm đầu mối kết nối GitHub, VS Code/Cursor, Google Workspace, ERP, chứng từ và automation.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={closeHub}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-black text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
                Đóng
              </button>
            </div>

            <Suspense
              fallback={
                <div className="rounded-2xl border border-slate-900 bg-slate-950/70 p-8 text-sm font-bold text-slate-300">
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin text-cyan-300" />
                  Đang tải Integration Hub...
                </div>
              }
            >
              <IntegrationHub />
            </Suspense>
          </div>
        </div>
      )}
    </>
  );
}
