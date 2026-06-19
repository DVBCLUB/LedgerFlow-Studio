import { Suspense, lazy, useEffect, useState } from 'react';

const BrowserSimulationPlanner = lazy(() => import('../BrowserSimulationPlanner'));
const ProjectMemoryDecisionLog = lazy(() => import('../ProjectMemoryDecisionLog'));
const ConfigHealthMonitor = lazy(() => import('../ConfigHealthMonitor'));
const SecurityControlCenter = lazy(() => import('../SecurityControlCenter'));
const ToolExecutionLayerPanel = lazy(() => import('../ToolExecutionLayerPanel'));
const RuntimeToolBridge = lazy(() => import('../RuntimeToolBridge'));
const RuntimeQueueAssistantBridge = lazy(() => import('../RuntimeQueueAssistantBridge'));
const RuntimeInboxBridge = lazy(() => import('../RuntimeInboxBridge'));
const SessionWorkboardBridge = lazy(() => import('../SessionWorkboardBridge'));
const SessionResultBridge = lazy(() => import('../SessionResultBridge'));
const SandboxApprovalBridge = lazy(() => import('../SandboxApprovalBridge'));
const ReleaseDraftSyncBridge = lazy(() => import('../ReleaseDraftSyncBridge'));
const LocalHandoffCenter = lazy(() => import('../LocalHandoffCenter'));
const PRControlCenter = lazy(() => import('../PRControlCenter'));
const PRDigestSyncBridge = lazy(() => import('../PRDigestSyncBridge'));
const MergeReadinessCenter = lazy(() => import('../MergeReadinessCenter'));
const SandboxPatchWorkspace = lazy(() => import('../SandboxPatchWorkspace'));
const PatchDiffReviewCenter = lazy(() => import('../PatchDiffReviewCenter'));
const FounderReviewChecklist = lazy(() => import('../FounderReviewChecklist'));
const RollbackCenter = lazy(() => import('../RollbackCenter'));
const ReleaseArtifactCenter = lazy(() => import('../ReleaseArtifactCenter'));
const ArtifactInspectorPanel = lazy(() => import('../ArtifactInspectorPanel'));
const AuditTrailPanel = lazy(() => import('../AuditTrailPanel'));
const CIRunInspectorPanel = lazy(() => import('../CIRunInspectorPanel'));
const CIRecoveryQueue = lazy(() => import('../CIRecoveryQueue'));
const BuildMonitorPanel = lazy(() => import('../BuildMonitorPanel'));
const ToolPolicyRegistry = lazy(() => import('../ToolPolicyRegistry'));

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

interface OpsToolsLauncherProps {
  hideTrigger?: boolean;
}

export default function OpsToolsLauncher({ hideTrigger = false }: OpsToolsLauncherProps) {
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
      {open && (
        <Suspense fallback={null}>
          <RuntimeInboxBridge />
          <RuntimeQueueAssistantBridge />
          <RuntimeToolBridge />
          <SessionWorkboardBridge />
          <SessionResultBridge />
          <SandboxApprovalBridge />
          <ReleaseDraftSyncBridge />
          <PRDigestSyncBridge />
        </Suspense>
      )}
      {!hideTrigger && (
        <button onClick={openPanel} className="fixed bottom-72 right-5 z-40 rounded-2xl border border-violet-400/40 bg-slate-950/95 px-4 py-3 text-left text-xs font-black text-violet-100 shadow-2xl shadow-violet-950/40 backdrop-blur transition hover:border-violet-300 hover:bg-violet-950/80" title="Open Ops Tools">
          <span className="block text-[10px] uppercase tracking-[0.18em] text-violet-300">Ops Tools</span>
          <span className="block">Panels</span>
        </button>
      )}
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
            <Suspense fallback={<div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-sm font-bold text-slate-400">Đang tải panel...</div>}>
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
            </Suspense>
          </div>
        </div>
      )}
    </>
  );
}
