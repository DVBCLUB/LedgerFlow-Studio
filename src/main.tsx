import {StrictMode, useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import SimulationGuard from './components/SimulationGuard.tsx';
import FounderLabsDock from './components/FounderLabsDock.tsx';
import AISettingsLauncher from './components/AISettingsLauncher.tsx';
import IntegrationHubLauncher from './components/IntegrationHubLauncher.tsx';
import DevHandoffLauncher from './components/DevHandoffLauncher.tsx';
import GitHubCIDoctorLauncher from './components/GitHubCIDoctorLauncher.tsx';
import LocalAuthGate from './components/LocalAuthGate.tsx';
import ApprovedPrPanel from './components/ApprovedPrPanel.tsx';
import AgentOpsHubLauncher from './components/agent-ops/AgentOpsHubLauncher.tsx';
import OpsToolsLauncher from './components/agent-ops/OpsToolsLauncher.tsx';
import FastConnectorModeBridge from './components/FastConnectorModeBridge.tsx';
import SecretExposureGuardBridge from './components/SecretExposureGuardBridge.tsx';
import './index.css';

function ReviewOverlay() {
  const [open, setOpen] = useState(() => window.location.hash === '#/review_desk');

  useEffect(() => {
    const sync = () => setOpen(window.location.hash === '#/review_desk');
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const close = () => {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-950/85 p-4 backdrop-blur">
      <div className="mx-auto max-w-5xl">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-800 bg-slate-950 p-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">Review Desk</p>
            <h2 className="mt-1 text-xl font-black text-white">Approved Change Review</h2>
            <p className="mt-1 text-xs font-semibold text-slate-400">Preview thay đổi, nhập câu duyệt, rồi backend tạo nhánh và Draft PR để CI kiểm tra.</p>
          </div>
          <button onClick={close} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-rose-300 hover:text-rose-200">Đóng</button>
        </div>
        <ApprovedPrPanel />
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocalAuthGate>
      <App />
      <ReviewOverlay />
      <SimulationGuard />
      <FounderLabsDock />
      <SecretExposureGuardBridge />
      <FastConnectorModeBridge />
      <AgentOpsHubLauncher />
      <OpsToolsLauncher />
      <GitHubCIDoctorLauncher />
      <DevHandoffLauncher />
      <AISettingsLauncher />
      <IntegrationHubLauncher />
    </LocalAuthGate>
  </StrictMode>,
);
