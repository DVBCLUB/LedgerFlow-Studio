import { useEffect, useState } from 'react';
import AIOpsWorkboard from './AIOpsWorkboard';
import AgentSessionQueue from './AgentSessionQueue';
import AgentSkillRegistry from './AgentSkillRegistry';
import AgentRuntimeOrchestratorPanel from './AgentRuntimeOrchestratorPanel';
import BrowserSimulationPlanner from './BrowserSimulationPlanner';
import ProjectMemoryDecisionLog from './ProjectMemoryDecisionLog';
import SecurityControlCenter from './SecurityControlCenter';
import ToolExecutionLayerPanel from './ToolExecutionLayerPanel';
import LocalHandoffCenter from './LocalHandoffCenter';
import PRControlCenter from './PRControlCenter';
import PRDigestSyncBridge from './PRDigestSyncBridge';
import RuntimeInboxBridge from './RuntimeInboxBridge';
import SessionWorkboardBridge from './SessionWorkboardBridge';
import SessionResultBridge from './SessionResultBridge';
import ApprovalSessionBridge from './ApprovalSessionBridge';
import ApprovalReviewDeskBridge from './ApprovalReviewDeskBridge';
import FastReviewRoutingBridge from './FastReviewRoutingBridge';
import SandboxApprovalBridge from './SandboxApprovalBridge';
import ConnectorPolicyBridge from './ConnectorPolicyBridge';
import ReleaseDraftSyncBridge from './ReleaseDraftSyncBridge';
import ApprovalGatePanel from './ApprovalGatePanel';
import SandboxPatchWorkspace from './SandboxPatchWorkspace';
import PatchDiffReviewCenter from './PatchDiffReviewCenter';
import FounderReviewChecklist from './FounderReviewChecklist';
import RollbackCenter from './RollbackCenter';
import ReleaseArtifactCenter from './ReleaseArtifactCenter';
import ArtifactInspectorPanel from './ArtifactInspectorPanel';
import ConnectorSdkRegistry from './ConnectorSdkRegistry';
import AuditTrailPanel from './AuditTrailPanel';
import CIRunInspectorPanel from './CIRunInspectorPanel';
import CIRecoveryQueue from './CIRecoveryQueue';
import BuildMonitorPanel from './BuildMonitorPanel';
import ToolPolicyRegistry from './ToolPolicyRegistry';

function isAIOpsRoute() {
  return window.location.hash === '#/ai_ops' || window.location.hash === '#/ai-ops' || window.location.hash === '#/ai_nhan_su';
}

export default function AIOpsCenterLauncher() {
  const [open, setOpen] = useState(() => isAIOpsRoute());
  const [view, setView] = useState<'sessions' | 'skills' | 'runtime' | 'tools' | 'local' | 'pr' | 'memory' | 'security' | 'browser' | 'approval' | 'sandbox' | 'diff' | 'founder' | 'rollback' | 'release' | 'artifacts' | 'connectors' | 'audit' | 'ci' | 'workboard' | 'recovery' | 'build' | 'policy'>('sessions');

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
      {open && <RuntimeInboxBridge />}
      {open && <SessionWorkboardBridge />}
      {open && <SessionResultBridge />}
      {open && <ApprovalSessionBridge />}
      {open && <ApprovalReviewDeskBridge />}
      {open && <FastReviewRoutingBridge />}
      {open && <SandboxApprovalBridge />}
      {open && <ConnectorPolicyBridge />}
      {open && <ReleaseDraftSyncBridge />}
      {open && <PRDigestSyncBridge />}
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
                <h2 className="mt-1 text-xl font-black text-white">Agent Sessions, Runtime, Tools, Local Handoff, Skills, Memory, Security, Approval, Sandbox, Release, Rollback, Audit & Build Monitor</h2>
                <p className="mt-1 text-xs font-semibold text-slate-400">Điều phối AI agent theo kiểu OpenClaw nhưng sandbox-first, approval-first, audit-first.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setView('sessions')} className={`rounded-2xl border px-4 py-2 text-xs font-black ${view === 'sessions' ? 'border-blue-300 bg-blue-400/10 text-blue-100' : 'border-slate-700 text-slate-300 hover:border-blue-300'}`}>Sessions</button>
                <button onClick={() => setView('runtime')} className={`rounded-2xl border px-4 py-2 text-xs font-black ${view === 'runtime' ? 'border-fuchsia-300 bg-fuchsia-400/10 text-fuchsia-100' : 'border-slate-700 text-slate-300 hover:border-fuchsia-300'}`}>Runtime</button>
                <button onClick={() => setView('tools')} className={`rounded-2xl border px-4 py-2 text-xs font-black ${view === 'tools' ? 'border-teal-300 bg-teal-400/10 text-teal-100' : 'border-slate-700 text-slate-300 hover:border-teal-300'}`}>Tools</button>
                <button onClick={() => setView('local')} className={`rounded-2xl border px-4 py-2 text-xs font-black ${view === 'local' ? 'border-lime-300 bg-lime-400/10 text-lime-100' : 'border-slate-700 text-slate-300 hover:border-lime-300'}`}>Local</button>
                <button onClick={() => setView('pr')} className={`rounded-2xl border px-4 py-2 text-xs font-black ${view === 'pr' ? 'border-emerald-300 bg-emerald-400/10 text-emerald-100' : 'border-slate-700 text-slate-300 hover:border-emerald-300'}`}>PR Control</button>
                <button onClick={() => setView('skills')} className={`rounded-2xl border px-4 py-2 text-xs font-black ${view === 'skills' ? 'border-indigo-300 bg-indigo-400/10 text-indigo-100' : 'border-slate-700 text-slate-300 hover:border-indigo-300'}`}>Skills</button>
                <button onClick={() => setView('memory')} className={`rounded-2xl border px-4 py-2 text-xs font-black ${view === 'memory' ? 'border-emerald-300 bg-emerald-400/10 text-emerald-100' : 'border-slate-700 text-slate-300 hover:border-emerald-300'}`}>Memory</button>
                <button onClick={() => setView('security')} className={`rounded-2xl border px-4 py-2 text-xs font-black ${view === 'security' ? 'border-rose-300 bg-rose-400/10 text-rose-100' : 'border-slate-700 text-slate-300 hover:border-rose-300'}`}>Security</button>
                <button onClick={() => setView('browser')} className={`rounded-2xl border px-4 py-2 text-xs font-black ${view === 'browser' ? 'border-indigo-300 bg-indigo-400/10 text-indigo-100' : 'border-slate-700 text-slate-300 hover:border-indigo-300'}`}>Browser Plan</button>
                <button onClick={() => setView('approval')} className={`rounded-2xl border px-4 py-2 text-xs font-black ${view === 'approval' ? 'border-emerald-300 bg-emerald-400/10 text-emerald-100' : 'border-slate-700 text-slate-300 hover:border-emerald-300'}`}>Approval</button>
                <button onClick={() => setView('sandbox')} className={`rounded-2xl border px-4 py-2 text-xs font-black ${view === 'sandbox' ? 'border-teal-300 bg-teal-400/10 text-teal-100' : 'border-slate-700 text-slate-300 hover:border-teal-300'}`}>Sandbox</button>
                <button onClick={() => setView('diff')} className={`rounded-2xl border px-4 py-2 text-xs font-black ${view === 'diff' ? 'border-fuchsia-300 bg-fuchsia-400/10 text-fuchsia-100' : 'border-slate-700 text-slate-300 hover:border-fuchsia-300'}`}>Diff Review</button>
                <button onClick={() => setView('founder')} className={`rounded-2xl border px-4 py-2 text-xs font-black ${view === 'founder' ? 'border-lime-300 bg-lime-400/10 text-lime-100' : 'border-slate-700 text-slate-300 hover:border-lime-300'}`}>Founder Review</button>
                <button onClick={() => setView('rollback')} className={`rounded-2xl border px-4 py-2 text-xs font-black ${view === 'rollback' ? 'border-rose-300 bg-rose-400/10 text-rose-100' : 'border-slate-700 text-slate-300 hover:border-rose-300'}`}>Rollback</button>
                <button onClick={() => setView('release')} className={`rounded-2xl border px-4 py-2 text-xs font-black ${view === 'release' ? 'border-emerald-300 bg-emerald-400/10 text-emerald-100' : 'border-slate-700 text-slate-300 hover:border-emerald-300'}`}>Release</button>
                <button onClick={() => setView('artifacts')} className={`rounded-2xl border px-4 py-2 text-xs font-black ${view === 'artifacts' ? 'border-lime-300 bg-lime-400/10 text-lime-100' : 'border-slate-700 text-slate-300 hover:border-lime-300'}`}>Artifacts</button>
                <button onClick={() => setView('connectors')} className={`rounded-2xl border px-4 py-2 text-xs font-black ${view === 'connectors' ? 'border-indigo-300 bg-indigo-400/10 text-indigo-100' : 'border-slate-700 text-slate-300 hover:border-indigo-300'}`}>Connectors</button>
                <button onClick={() => setView('audit')} className={`rounded-2xl border px-4 py-2 text-xs font-black ${view === 'audit' ? 'border-slate-300 bg-slate-400/10 text-slate-100' : 'border-slate-700 text-slate-300 hover:border-slate-300'}`}>Audit</button>
                <button onClick={() => setView('ci')} className={`rounded-2xl border px-4 py-2 text-xs font-black ${view === 'ci' ? 'border-orange-300 bg-orange-400/10 text-orange-100' : 'border-slate-700 text-slate-300 hover:border-orange-300'}`}>CI Runs</button>
                <button onClick={() => setView('workboard')} className={`rounded-2xl border px-4 py-2 text-xs font-black ${view === 'workboard' ? 'border-violet-300 bg-violet-400/10 text-violet-100' : 'border-slate-700 text-slate-300 hover:border-violet-300'}`}>Workboard</button>
                <button onClick={() => setView('policy')} className={`rounded-2xl border px-4 py-2 text-xs font-black ${view === 'policy' ? 'border-rose-300 bg-rose-400/10 text-rose-100' : 'border-slate-700 text-slate-300 hover:border-rose-300'}`}>Policy</button>
                <button onClick={() => setView('recovery')} className={`rounded-2xl border px-4 py-2 text-xs font-black ${view === 'recovery' ? 'border-amber-300 bg-amber-400/10 text-amber-100' : 'border-slate-700 text-slate-300 hover:border-amber-300'}`}>CI Recovery</button>
                <button onClick={() => setView('build')} className={`rounded-2xl border px-4 py-2 text-xs font-black ${view === 'build' ? 'border-cyan-300 bg-cyan-400/10 text-cyan-100' : 'border-slate-700 text-slate-300 hover:border-cyan-300'}`}>Build Monitor</button>
                <button onClick={() => { window.location.hash = '#/review_desk'; setOpen(false); }} className="rounded-2xl border border-emerald-400/40 px-4 py-2 text-xs font-black text-emerald-200 hover:bg-emerald-400/10">Review Desk</button>
                <button onClick={closePanel} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-rose-300 hover:text-rose-200">Đóng</button>
              </div>
            </div>
            {view === 'sessions' && <AgentSessionQueue />}
            {view === 'runtime' && <AgentRuntimeOrchestratorPanel />}
            {view === 'tools' && <ToolExecutionLayerPanel />}
            {view === 'local' && <LocalHandoffCenter />}
            {view === 'pr' && <PRControlCenter />}
            {view === 'skills' && <AgentSkillRegistry />}
            {view === 'memory' && <ProjectMemoryDecisionLog />}
            {view === 'security' && <SecurityControlCenter />}
            {view === 'browser' && <BrowserSimulationPlanner />}
            {view === 'approval' && <ApprovalGatePanel />}
            {view === 'sandbox' && <SandboxPatchWorkspace />}
            {view === 'diff' && <PatchDiffReviewCenter />}
            {view === 'founder' && <FounderReviewChecklist />}
            {view === 'rollback' && <RollbackCenter />}
            {view === 'release' && <ReleaseArtifactCenter />}
            {view === 'artifacts' && <ArtifactInspectorPanel />}
            {view === 'connectors' && <ConnectorSdkRegistry />}
            {view === 'audit' && <AuditTrailPanel />}
            {view === 'ci' && <CIRunInspectorPanel />}
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
