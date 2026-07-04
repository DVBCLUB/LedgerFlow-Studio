import React from 'react';
import { ClipboardCheck, Loader2, RefreshCw, ShieldAlert } from 'lucide-react';
import { listMissionExecutionQueues } from '../../services/aiWorkforceRuntimeClient';

const panelClass = 'rounded-3xl border border-emerald-500/20 bg-slate-950/70 p-5 text-left shadow-xl shadow-slate-950/20';
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-black uppercase text-emerald-100 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50';

type ChecklistStatus = 'done' | 'current' | 'pending' | 'blocked';

interface RunbookChecklistItem {
  title: string;
  status: ChecklistStatus;
  owner: string;
  action: string;
  evidence: string;
}

interface OperatorRunbook {
  queueId: string;
  status: string;
  owner: string;
  nextSafeAction: string;
  rollbackNote: string;
  handoffSummary: string;
  checklist: RunbookChecklistItem[];
  steps: Array<{
    title: string;
    status: string;
    owner: string;
    toolId: string;
    nextAction: string;
    rollbackNote: string;
    checklist: RunbookChecklistItem[];
  }>;
}

function firstActionableStep(queue: any) {
  return queue?.steps?.find((step: any) => step.status === 'running')
    || queue?.steps?.find((step: any) => step.status === 'ready')
    || queue?.steps?.find((step: any) => step.status === 'waiting_approval')
    || queue?.steps?.find((step: any) => step.status === 'blocked')
    || queue?.steps?.find((step: any) => step.status === 'queued')
    || null;
}

function stepNextAction(step: any) {
  if (!step) return 'Refresh queue state before taking action.';
  if (step.status === 'completed') return 'Review captured evidence and continue to the next dependent step.';
  if (step.status === 'running') return 'Complete the running step with replay artifact evidence or cancel the queue if safety changes.';
  if (step.status === 'ready') return 'Run Dry-run tool first, review safety replay, then Execute sim or complete manually with evidence.';
  if (step.status === 'waiting_approval') return `Capture human approval using phrase: ${step.approvalPhrase || 'APPROVE MISSION STEP'}.`;
  if (step.status === 'blocked') return `Stop and resolve blocker before continuing: ${step.blockedReason || 'blocked step'}.`;
  if (step.status === 'cancelled') return 'No action. Keep evidence and hand off cancellation reason to the owner.';
  return 'Wait for dependency completion before starting this step.';
}

function rollbackNote(queue: any) {
  if (queue?.summary?.completedSteps > 0) return 'Partial work exists. Preserve completed-step evidence, cancel remaining steps if needed, and create an explicit rollback follow-up for shipped artifacts.';
  if (queue?.status === 'cancelled') return 'Rollback already applied through cancellation; keep audit notes unchanged.';
  return 'Safe rollback is to cancel the queue before tool execution creates side effects.';
}

function checklistItem(title: string, status: ChecklistStatus, owner: string, action: string, evidence: string): RunbookChecklistItem {
  return { title, status, owner, action, evidence };
}

function buildRunbook(queue: any): OperatorRunbook | null {
  if (!queue?.id) return null;
  const active = firstActionableStep(queue);
  const steps = (queue.steps || []).map((step: any) => ({
    title: step.title,
    status: step.status,
    owner: step.agentRole,
    toolId: step.toolId,
    nextAction: stepNextAction(step),
    rollbackNote: step.status === 'completed'
      ? 'Preserve evidence; create a rollback follow-up only if output must be reversed.'
      : step.status === 'ready' || step.status === 'waiting_approval'
        ? 'Safe rollback is to cancel before execution.'
        : 'Keep the current audit/evidence trail unchanged.',
    checklist: [
      checklistItem('Confirm owner handoff', step.status === 'queued' ? 'pending' : 'done', step.agentRole, `Confirm ${step.agentRole} owns ${step.title}.`, 'Operator note with owner and scope.'),
      checklistItem('Approval gate', step.approvalRequired ? (step.approval ? 'done' : step.status === 'waiting_approval' ? 'current' : 'pending') : 'done', queue.owner, step.approvalRequired ? `Capture approval phrase: ${step.approvalPhrase || 'APPROVE MISSION STEP'}.` : 'No human approval required.', 'Approval fingerprint or no-approval-required note.'),
      checklistItem('Dry-run and safety replay', step.status === 'completed' ? 'done' : step.status === 'ready' || step.status === 'running' ? 'current' : step.status === 'blocked' ? 'blocked' : 'pending', 'Mission Tool Executor', 'Run dry-run preview and review safety replay before simulated execution.', 'Replay artifact fingerprint and safety mode.'),
      checklistItem('Verify evidence trail', step.evidence?.length ? 'done' : step.status === 'running' ? 'current' : step.status === 'blocked' ? 'blocked' : 'pending', step.agentRole, `Collect expected evidence: ${(step.expectedEvidence || []).join('; ') || 'operator note'}.`, 'Step evidence or replay artifact.'),
    ],
  }));

  return {
    queueId: queue.id,
    status: queue.status,
    owner: queue.owner,
    nextSafeAction: queue.status === 'completed'
      ? 'Mission complete. Review artifacts, archive audit trail, and prepare release handoff.'
      : queue.status === 'blocked'
        ? 'Stop execution. Resolve blocked step and get owner confirmation before resuming.'
        : stepNextAction(active),
    rollbackNote: rollbackNote(queue),
    handoffSummary: `${queue.owner} owns queue ${queue.id}. Status: ${queue.status}. Next safe action: ${stepNextAction(active)}`,
    checklist: [
      checklistItem('Review latest queue state', 'done', queue.owner, `Queue is ${queue.status} with ${queue.summary?.completedSteps ?? 0}/${queue.summary?.totalSteps ?? 0} completed steps.`, 'Runtime dashboard snapshot.'),
      checklistItem('Choose next safe action', active ? 'current' : 'blocked', queue.owner, stepNextAction(active), 'Operator handoff note.'),
      checklistItem('Confirm rollback path', queue.status === 'completed' ? 'done' : 'current', queue.owner, rollbackNote(queue), 'Rollback note in handoff.'),
      checklistItem('Verify evidence trail', queue.summary?.evidenceItems > 0 ? 'done' : 'current', 'Mission Operator', 'Confirm evidence, replay artifacts, and approval fingerprints are visible before handoff.', 'Step evidence or replay artifact.'),
    ],
    steps,
  };
}

function StatusPill({ status }: { status: ChecklistStatus | string }) {
  return <span className="rounded-full border border-border-secondary px-2 py-0.5 text-[10px] font-black uppercase text-text-secondary">{status}</span>;
}

export default function MissionOperatorRunbookPanel() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [queue, setQueue] = React.useState<any>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listMissionExecutionQueues();
      setQueue(result.queues?.[0] || result.stats?.latestQueue || null);
    } catch (err: any) {
      setError(err?.message || 'Cannot load Mission Operator Runbook.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const runbook = buildRunbook(queue);

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-200">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-text-primary">Mission Operator Runbook</h2>
            <p className="mt-2 max-w-3xl text-xs font-semibold leading-6 text-text-secondary">
              Live handoff dashboard cho queue mới nhất: Next safe action, Owner handoff, Rollback note, approval checklist và evidence trail trước khi chạy tiếp.
            </p>
          </div>
        </div>
        <button className={buttonClass} onClick={refresh} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh runbook
        </button>
      </div>

      {error && <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-bold text-amber-100"><ShieldAlert className="mr-2 inline h-4 w-4" />{error}</div>}
      {!runbook && !error && <p className="mt-4 rounded-2xl border border-border-primary bg-bg-surface/70 p-4 text-xs font-semibold text-text-tertiary">Chưa có mission queue. Bấm Queue mission trong Live Runtime Hub để tạo runbook.</p>}

      {runbook && (
        <>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">Next safe action</p>
              <p className="mt-2 text-xs font-bold leading-5 text-text-primary">{runbook.nextSafeAction}</p>
            </div>
            <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">Owner handoff</p>
              <p className="mt-2 text-xs font-bold leading-5 text-text-primary">{runbook.handoffSummary}</p>
            </div>
            <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">Rollback note</p>
              <p className="mt-2 text-xs font-bold leading-5 text-text-primary">{runbook.rollbackNote}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-border-primary bg-slate-950 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">Operator checklist</p>
              <div className="mt-3 space-y-2">
                {runbook.checklist.map((item) => (
                  <div key={item.title} className="rounded-xl border border-border-primary bg-bg-surface/70 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-black text-text-primary">{item.title}</p>
                      <StatusPill status={item.status} />
                    </div>
                    <p className="mt-1 text-[11px] font-semibold leading-5 text-text-secondary">{item.action}</p>
                    <p className="mt-1 text-[11px] font-semibold leading-5 text-emerald-200">evidence: {item.evidence}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border-primary bg-slate-950 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">Step handoffs</p>
              <div className="mt-3 space-y-2">
                {runbook.steps.slice(0, 6).map((step) => (
                  <div key={step.title} className="rounded-xl border border-border-primary bg-bg-surface/70 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-black text-text-primary">{step.title}</p>
                      <StatusPill status={step.status} />
                    </div>
                    <p className="mt-1 text-[11px] font-semibold text-text-tertiary">{step.owner} · {step.toolId}</p>
                    <p className="mt-1 text-[11px] font-semibold leading-5 text-text-secondary">{step.nextAction}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
