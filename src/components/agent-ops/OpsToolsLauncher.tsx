import { useEffect, useState } from 'react';
import BrowserSimulationPlanner from '../BrowserSimulationPlanner';
import ProjectMemoryDecisionLog from '../ProjectMemoryDecisionLog';
import ConfigHealthMonitor from '../ConfigHealthMonitor';
import SecurityControlCenter from '../SecurityControlCenter';
import ToolExecutionLayerPanel from '../ToolExecutionLayerPanel';
import RuntimeToolBridge from '../RuntimeToolBridge';
import RuntimeQueueAssistantBridge from '../RuntimeQueueAssistantBridge';
import RuntimeInboxBridge from '../RuntimeInboxBridge';
import SessionWorkboardBridge from '../SessionWorkboardBridge';
import SessionResultBridge from '../SessionResultBridge';
import SandboxApprovalBridge from '../SandboxApprovalBridge';
import ReleaseDraftSyncBridge from '../ReleaseDraftSyncBridge';
import LocalHandoffCenter from '../LocalHandoffCenter';
import PRControlCenter from '../PRControlCenter';
import PRDigestSyncBridge from '../PRDigestSyncBridge';
import MergeReadinessCenter from '../MergeReadinessCenter';
import SandboxPatchWorkspace from '../SandboxPatchWorkspace';
import PatchDiffReviewCenter from '../PatchDiffReviewCenter';
import FounderReviewChecklist from '../FounderReviewChecklist';
import RollbackCenter from '../RollbackCenter';
import ReleaseArtifactCenter from '../ReleaseArtifactCenter';
import ArtifactInspectorPanel from '../ArtifactInspectorPanel';
import AuditTrailPanel from '../AuditTrailPanel';
import CIRunInspectorPanel from '../CIRunInspectorPanel';
import CIRecoveryQueue from '../CIRecoveryQueue';
import BuildMonitorPanel from '../BuildMonitorPanel';
import ToolPolicyRegistry from '../ToolPolicyRegistry';

type OpsToolsView = 'tools' | 'local' | 'pr' | 'readiness' | 'memory' | 'config' | 'security' | 'browser' | 'sandbox' | 'diff' | 'founder' | 'rollback' | 'release' | 'artifacts' | 'audit' | 'ci' | 'recovery' | 'build' | 'policy';

const views: { id: OpsToolsView; label: string }[] = [
  { id: 'tools', label: 'Tools' },
  { id: 'local', label: 'Local' },
  { id: 'pr', label: 'PR Control' },
  { id: 'readiness', label: 'Readiness' },
  { id: 'memory', label: 'Memory' },
  { id: 'config', label: 'Config' },
  { id: 'security', label: 'Security' },
  { id: 'browser', label: 'Browser Plan' },
  { id: 'sandbox', label: 'Sandbox' },
  { id: 'diff', label: 'Diff Review' },
  { id: 'founder', label: 'Founder Review' },
  { id: 'rollback', label: 'Rollback' },
  { id: 'release', label: 'Release' },
  { id: 'artifacts', label: 'Artifacts' },
  { id: 'audit', label: 'Audit' },
  { id: 'ci', label: 'CI Runs' },
  { id: 'recovery', label: 'CI Recovery' },
  { id: 'build', label: 'Build Monitor' },
  { id: 'policy', label: 'Tool Policy' }
];

function isOpsToolsRoute() {
  return window.location.hash === '#/ops_tools' || window.location.hash === '#/misc_ops';
}

export default function OpsToolsLauncher() {
  const [open, setOpen] = useState(() => isOpsToolsRoute());
  const [view, setView] = useState<OpsToolsView>('tools');

  useEffect(() => {
    const sync = () => setOpen(isOpsToolsRoute());
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const openPanel = () => {
    window.location.hash = '#/ops_tools';
    setOpen(true);
  };

  const closePanel = () => {
    if (isOpsToolsRoute()) window.history.replaceState(null, '', window.location.pathname + window.location.search);
    setOpen(false);
  };

  return (
    <>
      {open && <RuntimeInboxBridge />}
      {open && <RuntimeQueueAssistantBridge />}
      {open && <RuntimeToolBridge />}
      {open && <SessionWorkboardBridge />}
      {open && <SessionResultBridge />}
      {open && <SandboxApprovalBridge />}
      {open && <ReleaseDraftSyncBridge />}
      {open && <PRDigestSyncBridge />}
      <button onClick={openPanel} className="fixed bottom-72 right-5 z-40 rounded-2xl border border-violet-400/40 bg-slate-950/95 px-4 py-3 text-left text-xs font-black text-violet-100 shadow-2xl shadow-violet-950/40 backdrop-blur transition hover:border-violet-300 hover:bg-violet-950/80" title="Open Ops Tools">
        <span className="block text-[10px] uppercase tracking-[0.18em] text-violet-300">Ops Tools</span>
        <span className="block">Panels</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 p-4 backdrop-blur">
          <div className="mx-auto max-w-6xl">
            <div className="mb-3 rounded-3xl border border-slate-800 bg-slate-950 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-300">Ops Tools</p>
                  <h2 className="mt-1 text-xl font-black text-white">Auxiliary Operations Panels</h2>
                  <p className="mt-1 text-xs font-semibold text-slate-400">Các panel ngoài phạm vi AgentOpsHub vẫn được giữ riêng để không mất tính năng người dùng đang thấy.</p>
                </div>
                <button onClick={closePanel} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-rose-300 hover:text-rose-200">Đóng</button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {views.map((item) => <button key={item.id} onClick={() => setView(item.id)} className={`rounded-2xl border px-4 py-2 text-xs font-black ${view === item.id ? 'border-violet-300 bg-violet-400/10 text-violet-100' : 'border-slate-700 text-slate-300 hover:border-violet-300'}`}>{item.label}</button>)}
              </div>
            </div>
            {view === 'tools' && <ToolExecutionLayerPanel />}
            {view === 'local' && <LocalHandoffCenter />}
            {view === 'pr' && <PRControlCenter />}
            {view === 'readiness' && <MergeReadinessCenter />}
            {view === 'memory' && <ProjectMemoryDecisionLog />}
            {view === 'config' && <ConfigHealthMonitor />}
            {view === 'security' && <SecurityControlCenter />}
            {view === 'browser' && <BrowserSimulationPlanner />}
            {view === 'sandbox' && <SandboxPatchWorkspace />}
            {view === 'diff' && <PatchDiffReviewCenter />}
            {view === 'founder' && <FounderReviewChecklist />}
            {view === 'rollback' && <RollbackCenter />}
            {view === 'release' && <ReleaseArtifactCenter />}
            {view === 'artifacts' && <ArtifactInspectorPanel />}
            {view === 'audit' && <AuditTrailPanel />}
            {view === 'ci' && <CIRunInspectorPanel />}
            {view === 'recovery' && <CIRecoveryQueue />}
            {view === 'build' && <BuildMonitorPanel />}
            {view === 'policy' && <ToolPolicyRegistry />}
          </div>
        </div>
      )}
    </>
  );
}
