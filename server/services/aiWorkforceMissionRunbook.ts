import { createHash } from 'node:crypto';
import type { MissionExecutionQueue, MissionExecutionQueueStep } from './aiWorkforceMissionExecutionQueue.ts';

export type MissionRunbookChecklistStatus = 'done' | 'current' | 'pending' | 'blocked';

export interface MissionRunbookChecklistItem {
  id: string;
  title: string;
  status: MissionRunbookChecklistStatus;
  owner: string;
  action: string;
  evidence: string;
}

export interface MissionStepRunbook {
  stepId: string;
  missionStepId: string;
  title: string;
  status: MissionExecutionQueueStep['status'];
  owner: string;
  toolId: string;
  riskTier: MissionExecutionQueueStep['riskTier'];
  nextAction: string;
  rollbackNote: string;
  handoff: string;
  checklist: MissionRunbookChecklistItem[];
}

export interface MissionOperatorRunbook {
  id: string;
  queueId: string;
  missionId: string;
  owner: string;
  status: MissionExecutionQueue['status'];
  riskTier: MissionExecutionQueue['riskTier'];
  nextSafeAction: string;
  rollbackNote: string;
  handoffSummary: string;
  checklist: MissionRunbookChecklistItem[];
  steps: MissionStepRunbook[];
  createdAt: string;
}

function stableId(prefix: string, value: unknown) {
  return `${prefix}_${createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16)}`;
}

function currentStep(queue: MissionExecutionQueue) {
  return queue.steps.find((step) => step.status === 'running')
    || queue.steps.find((step) => step.status === 'ready')
    || queue.steps.find((step) => step.status === 'waiting_approval')
    || queue.steps.find((step) => step.status === 'blocked')
    || queue.steps.find((step) => step.status === 'queued')
    || null;
}

function checklistItem(queueId: string, stepId: string, title: string, status: MissionRunbookChecklistStatus, owner: string, action: string, evidence: string): MissionRunbookChecklistItem {
  return {
    id: stableId('runbook_check', { queueId, stepId, title, action }),
    title,
    status,
    owner,
    action,
    evidence,
  };
}

function stepNextAction(step: MissionExecutionQueueStep) {
  if (step.status === 'completed') return 'Review captured evidence and continue to the next dependent step.';
  if (step.status === 'running') return 'Complete the running step with replay artifact evidence or cancel the queue if safety changes.';
  if (step.status === 'ready') return 'Run Dry-run tool first, review safety replay, then Execute sim or complete manually with evidence.';
  if (step.status === 'waiting_approval') return `Capture human approval using phrase: ${step.approvalPhrase || 'APPROVE MISSION STEP'}.`;
  if (step.status === 'blocked') return `Stop and resolve blocker before continuing: ${step.blockedReason || 'blocked step'}.`;
  if (step.status === 'cancelled') return 'No action. Keep evidence and hand off cancellation reason to the owner.';
  return 'Wait for dependency completion before starting this step.';
}

function stepRollbackNote(step: MissionExecutionQueueStep) {
  if (step.status === 'completed') return 'Preserve evidence, do not delete artifacts; create a follow-up rollback task if output must be reversed.';
  if (step.status === 'running') return 'Stop execution, capture operator note, and cancel the queue if safe completion is no longer possible.';
  if (step.status === 'ready' || step.status === 'waiting_approval') return 'Safe rollback is to cancel this queue before executing any tool-side effects.';
  if (step.status === 'blocked' || step.status === 'cancelled') return 'Keep blocker/cancellation note as audit evidence; do not resume until owner confirms.';
  return 'No rollback required yet; step has not started.';
}

function stepChecklist(queue: MissionExecutionQueue, step: MissionExecutionQueueStep) {
  return [
    checklistItem(
      queue.id,
      step.id,
      'Confirm owner handoff',
      step.status === 'queued' ? 'pending' : 'done',
      step.agentRole,
      `Confirm ${step.agentRole} owns ${step.title}.`,
      'Operator note with owner and scope.',
    ),
    checklistItem(
      queue.id,
      step.id,
      'Approval gate',
      step.approvalRequired ? (step.approval ? 'done' : step.status === 'waiting_approval' ? 'current' : 'pending') : 'done',
      queue.owner,
      step.approvalRequired ? `Capture approval phrase: ${step.approvalPhrase || 'APPROVE MISSION STEP'}.` : 'No human approval required for this step.',
      'Approval fingerprint or no-approval-required note.',
    ),
    checklistItem(
      queue.id,
      step.id,
      'Dry-run and safety replay',
      step.status === 'completed' ? 'done' : step.status === 'ready' || step.status === 'running' ? 'current' : step.status === 'blocked' ? 'blocked' : 'pending',
      'Mission Tool Executor',
      'Run dry-run preview and review safety replay before simulated execution.',
      'Replay artifact fingerprint and safety mode.',
    ),
    checklistItem(
      queue.id,
      step.id,
      'Evidence capture',
      step.evidence.length ? 'done' : step.status === 'running' ? 'current' : step.status === 'blocked' ? 'blocked' : 'pending',
      step.agentRole,
      `Collect expected evidence: ${step.expectedEvidence.join('; ') || 'operator note'}.`,
      'Artifact, metric, approval, or operator note attached to the step.',
    ),
  ];
}

function buildStepRunbook(queue: MissionExecutionQueue, step: MissionExecutionQueueStep): MissionStepRunbook {
  return {
    stepId: step.id,
    missionStepId: step.missionStepId,
    title: step.title,
    status: step.status,
    owner: step.agentRole,
    toolId: step.toolId,
    riskTier: step.riskTier,
    nextAction: stepNextAction(step),
    rollbackNote: stepRollbackNote(step),
    handoff: `${step.agentRole} owns ${step.title}. Current status: ${step.status}. Next action: ${stepNextAction(step)}`,
    checklist: stepChecklist(queue, step),
  };
}

function queueNextSafeAction(queue: MissionExecutionQueue, active: MissionExecutionQueueStep | null) {
  if (queue.status === 'completed') return 'Mission complete. Review artifacts, archive audit trail, and prepare release handoff.';
  if (queue.status === 'cancelled') return 'Queue cancelled. Preserve evidence and communicate cancellation reason before creating a new queue.';
  if (queue.status === 'blocked') return 'Stop execution. Resolve blocked step and get owner confirmation before resuming.';
  if (!active) return 'No active step found. Refresh queue state before taking action.';
  return stepNextAction(active);
}

function queueRollbackNote(queue: MissionExecutionQueue) {
  if (queue.summary.completedSteps > 0) return 'Partial work exists. Preserve completed-step evidence, cancel remaining steps if needed, and create explicit rollback follow-up for any shipped artifact.';
  if (queue.status === 'cancelled') return 'Rollback already applied through cancellation; keep audit notes unchanged.';
  return 'Safe rollback is to cancel the queue before tool execution creates side effects.';
}

function queueChecklist(queue: MissionExecutionQueue, active: MissionExecutionQueueStep | null) {
  return [
    checklistItem(queue.id, 'queue', 'Review latest queue state', 'done', queue.owner, `Queue is ${queue.status} with ${queue.summary.completedSteps}/${queue.summary.totalSteps} completed steps.`, 'Runtime dashboard snapshot.'),
    checklistItem(queue.id, 'queue', 'Choose next safe action', active ? 'current' : 'blocked', queue.owner, queueNextSafeAction(queue, active), 'Operator handoff note.'),
    checklistItem(queue.id, 'queue', 'Confirm rollback path', queue.status === 'completed' ? 'done' : 'current', queue.owner, queueRollbackNote(queue), 'Rollback note in handoff.'),
    checklistItem(queue.id, 'queue', 'Verify evidence trail', queue.summary.evidenceItems > 0 ? 'done' : 'current', 'Mission Operator', 'Confirm evidence, replay artifacts, and approval fingerprints are visible before handoff.', 'Step evidence or replay artifact.'),
  ];
}

export function buildMissionOperatorRunbook(queue: MissionExecutionQueue, createdAt = new Date().toISOString()): MissionOperatorRunbook {
  const active = currentStep(queue);
  const steps = queue.steps.map((step) => buildStepRunbook(queue, step));
  return {
    id: stableId('mission_runbook', { queueId: queue.id, updatedAt: queue.updatedAt, createdAt }),
    queueId: queue.id,
    missionId: queue.missionId,
    owner: queue.owner,
    status: queue.status,
    riskTier: queue.riskTier,
    nextSafeAction: queueNextSafeAction(queue, active),
    rollbackNote: queueRollbackNote(queue),
    handoffSummary: `${queue.owner} owns queue ${queue.id}. Status: ${queue.status}. Next safe action: ${queueNextSafeAction(queue, active)}`,
    checklist: queueChecklist(queue, active),
    steps,
    createdAt,
  };
}
