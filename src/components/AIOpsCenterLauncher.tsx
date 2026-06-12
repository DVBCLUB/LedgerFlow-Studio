import { useEffect, useState } from 'react';
import AIOpsWorkboard from './AIOpsWorkboard';
import AgentSessionQueue from './AgentSessionQueue';
import SessionWorkboardBridge from './SessionWorkboardBridge';
import SessionResultBridge from './SessionResultBridge';
import ApprovalGatePanel from './ApprovalGatePanel';
import CIRecoveryQueue from './CIRecoveryQueue';
import BuildMonitorPanel from './BuildMonitorPanel';
import ToolPolicyRegistry from './ToolPolicyRegistry';

function isAIOpsRoute() {
  return window.location.hash === '#/ai_ops' || window.location.hash === '#/ai-ops' || window.location.hash === '#/ai_nhan_su';
}

export default function AIOpsCenterLauncher() {
  const [open, setOpen] = useState(() => isAIOpsRoute());
  const [view, setView] = useState<'sessions' | 'approval' | 'workboard' | 'recovery' | 'build' | 'policy'>('sessions');

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
      {open && <SessionWorkboardBridge />}
      {open && <SessionResultBridge />}
      <button
        onClick={openPanel}
        className="fixed bottom-56 right-5 z-40 rounded-2xl border border-violet-400/40 bg-slate-950/95 px-4 py-3 text-left text-xs font-black text-violet-100 shadow-2xl shadow-violet-950/40 backdrop-blur transition hover:border-violet-300 hover:bg-violet-950/80"
        title="Open AI Operations Center"
      >
        <span className="block text-[10px] uppercase tracking-[0.18em] text-violet-300">AI Ops</span>
        <span className="block">Sessions</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 p-4 backdrop-blur">
          <div className="mx-auto max-w-6xl">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-800 bg-slate-950 p-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-300">AI Operations Center</p>
                <h2 className="mt-1 text-xl font-black text-white">Agent Sessions, Approval, Policy, Recovery & Build Monitor</h2>
                <p className="mt-1 text-xs font-semibold text-slate-400">Điều phối AI agent theo kiểu OpenClaw nhưng sandbox-first, approval-first, audit-first.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setView('sessions')}
                  className={`rounded-2xl border px-4 py-2 text-xs font-black ${view === 'sessions' ? 'border-blue-300 bg-blue-400/10 text-blue-100' : 'border-slate-700 text-slate-300 hover:border-blue-300'}`}
                >
                  Sessions
                </button>
                <button
                  onClick={() => setView('approval')}
                  className={`rounded-2xl border px-4 py-2 text-xs font-black ${view === 'approval' ? 'border-emerald-300 bg-emerald-400/10 text-emerald-100' : 'border-slate-700 text-slate-300 hover:border-emerald-300'}`}
                >
                  Approval
                </button>
                <button
                  onClick={() => setView('workboard')}
                  className={`rounded-2xl border px-4 py-2 text-xs font-black ${view === 'workboard' ? 'border-violet-300 bg-violet-400/10 text-violet-100' : 'border-slate-700 text-slate-300 hover:border-violet-300'}`}
                >
                  Workboard
                </button>
                <button
                  onClick={() => setView('policy')}
                  className={`rounded-2xl border px-4 py-2 text-xs font-black ${view === 'policy' ? 'border-rose-300 bg-rose-400/10 text-rose-100' : 'border-slate-700 text-slate-300 hover:border-rose-300'}`}
                >
                  Policy
                </button>
                <button
                  onClick={() => setView('recovery')}
                  className={`rounded-2xl border px-4 py-2 text-xs font-black ${view === 'recovery' ? 'border-amber-300 bg-amber-400/10 text-amber-100' : 'border-slate-700 text-slate-300 hover:border-amber-300'}`}
                >
                  CI Recovery
                </button>
                <button
                  onClick={() => setView('build')}
                  className={`rounded-2xl border px-4 py-2 text-xs font-black ${view === 'build' ? 'border-cyan-300 bg-cyan-400/10 text-cyan-100' : 'border-slate-700 text-slate-300 hover:border-cyan-300'}`}
                >
                  Build Monitor
                </button>
                <button
                  onClick={() => { window.location.hash = '#/review_desk'; setOpen(false); }}
                  className="rounded-2xl border border-emerald-400/40 px-4 py-2 text-xs font-black text-emerald-200 hover:bg-emerald-400/10"
                >
                  Review Desk
                </button>
                <button
                  onClick={closePanel}
                  className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-rose-300 hover:text-rose-200"
                >
                  Đóng
                </button>
              </div>
            </div>
            {view === 'sessions' && <AgentSessionQueue />}
            {view === 'approval' && <ApprovalGatePanel />}
            {view === 'workboard' && <AIOpsWorkboard />}
            {view === 'policy' && <ToolPolicyRegistry />}
            {view === 'recovery' && <CIRecoveryQueue />}
            {view === 'build' && <BuildMonitorPanel />}
          </div>
        </div>
      )}
    </>
  );
}
