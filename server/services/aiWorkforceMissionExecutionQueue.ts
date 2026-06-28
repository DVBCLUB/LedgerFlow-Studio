import { createHash } from 'node:crypto';
import type { AIWorkforceMissionPlan, AIWorkforceMissionStep, MissionRiskTier } from './aiWorkforceMissionPlanner.ts';

export type MissionExecutionStepStatus = 'queued' | 'waiting_approval' | 'ready' | 'running' | 'completed' | 'blocked' | 'cancelled';
export type MissionExecutionQueueStatus = 'queued' | 'needs_approval' | 'ready' | 'running' | 'completed' | 'blocked' | 'cancelled';

export interface MissionExecutionEvidence {
  id: string;
  title: string;
  kind: 'operator_note' | 'artifact' | 'metric' | 'approval' | 'audit';
  value: string;
  createdAt: string;
}

export interface MissionExecutionApproval {
  approver: string;
  phrase: string;
  fingerprint: string;
  approvedAt: string;
}

export interface MissionExecutionQueueStep {
  id: string;
  missionStepId: string;
  title: string;
  lane: string;
  agentRole: string;
  toolId: string;
  riskTier: MissionRiskTier;
  status: MissionExecutionStepStatus;
  dependsOn: string[];
  approvalRequired: boolean;
  approvalPhrase?: string;
  approval?: MissionExecutionApproval;
  highImpact: boolean;
  expectedEvidence: string[];
  evidence: MissionExecutionEvidence[];
  blockedReason?: string;
  startedAt?: string;
  completedAt?: string;
  updatedAt: string;
}

export interface MissionExecutionTimelineEvent {
  id: string;
  stepId?: string;
  action: 'queue_created' | 'step_ready' | 'step_approved' | 'step_started' | 'step_completed' | 'step_blocked' | 'queue_cancelled' | 'queue_advanced';
  actor: string;
  summary: string;
  createdAt: string;
}

export interface MissionExecutionQueue {
  id: string;
  missionId: string;
  goal: string;
  owner: string;
  status: MissionExecutionQueueStatus;
  riskTier: MissionRiskTier;
  createdAt: string;
  updatedAt: string;
  steps: MissionExecutionQueueStep[];
  timeline: MissionExecutionTimelineEvent[];
  summary: {
    totalSteps: number;
    readySteps: number;
    waitingApprovalSteps: number;
    runningSteps: number;
    completedSteps: number;
    blockedSteps: number;
    cancelledSteps: number;
    approvalsCaptured: number;
    evidenceItems: number;
  };
}

function stableId(prefix: string, value: unknown) {
  return `${prefix}_${createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16)}`;
}

function now() {
  return new Date().toISOString();
}

function approvalFingerprint(queueId: string, stepId: string, approver: string, phrase: string, approvedAt: string) {
  return stableId('approval', { queueId, stepId, approver, phrase, approvedAt });
}

function event(action: MissionExecutionTimelineEvent['action'], actor: string, summary: string, stepId?: string): MissionExecutionTimelineEvent {
  const createdAt = now();
  return {
    id: stableId('mission_event', { action, actor, summary, stepId, createdAt }),
    stepId,
    action,
    actor,
    summary,
    createdAt,
  };
}

function queueStatus(steps: MissionExecutionQueueStep[], existingStatus?: MissionExecutionQueueStatus): MissionExecutionQueueStatus {
  if (existingStatus === 'cancelled') return 'cancelled';
  if (steps.length && steps.every((step) => step.status === 'completed')) return 'completed';
  if (steps.some((step) => step.status === 'blocked')) return 'blocked';
  if (steps.some((step) => step.status === 'running')) return 'running';
  if (steps.some((step) => step.status === 'waiting_approval')) return 'needs_approval';
  if (steps.some((step) => step.status === 'ready')) return 'ready';
  return 'queued';
}

function summarize(steps: MissionExecutionQueueStep[]) {
  return {
    totalSteps: steps.length,
    readySteps: steps.filter((step) => step.status === 'ready').length,
    waitingApprovalSteps: steps.filter((step) => step.status === 'waiting_approval').length,
    runningSteps: steps.filter((step) => step.status === 'running').length,
    completedSteps: steps.filter((step) => step.status === 'completed').length,
    blockedSteps: steps.filter((step) => step.status === 'blocked').length,
    cancelledSteps: steps.filter((step) => step.status === 'cancelled').length,
    approvalsCaptured: steps.filter((step) => Boolean(step.approval)).length,
    evidenceItems: steps.reduce((sum, step) => sum + step.evidence.length, 0),
  };
}

function dependenciesCompleted(step: MissionExecutionQueueStep, steps: MissionExecutionQueueStep[]) {
  const byMissionStepId = new Map(steps.map((item) => [item.missionStepId, item]));
  return step.dependsOn.every((dependencyId) => byMissionStepId.get(dependencyId)?.status === 'completed');
}

function refreshQueue(queue: MissionExecutionQueue, timeline: MissionExecutionTimelineEvent[] = []): MissionExecutionQueue {
  const updatedAt = now();
  return {
    ...queue,
    status: queueStatus(queue.steps, queue.status),
    updatedAt,
    summary: summarize(queue.steps),
    timeline: [...queue.timeline, ...timeline],
  };
}

function initialStatus(step: AIWorkforceMissionStep): MissionExecutionStepStatus {
  if (step.status === 'blocked') return 'blocked';
  if (step.requiresApproval) return 'waiting_approval';
  if (step.dependsOn.length) return 'queued';
  return 'ready';
}

export function createMissionExecutionQueue(plan: AIWorkforceMissionPlan, actor = plan.owner || 'Founder'): MissionExecutionQueue {
  const createdAt = now();
  const queueId = stableId('mission_queue', { missionId: plan.id, createdAt });
  const steps = plan.steps.map((step): MissionExecutionQueueStep => ({
    id: stableId('mission_queue_step', { queueId, stepId: step.id }),
    missionStepId: step.id,
    title: step.title,
    lane: step.lane,
    agentRole: step.agentRole,
    toolId: step.toolId,
    riskTier: step.riskTier,
    status: initialStatus(step),
    dependsOn: step.dependsOn,
    approvalRequired: step.requiresApproval,
    approvalPhrase: step.approvalCheckpoint,
    highImpact: step.highImpact,
    expectedEvidence: step.expectedEvidence,
    evidence: [],
    blockedReason: step.status === 'blocked' ? 'Mission planner marked this step blocked.' : undefined,
    updatedAt: createdAt,
  }));

  const queue: MissionExecutionQueue = {
    id: queueId,
    missionId: plan.id,
    goal: plan.goal,
    owner: plan.owner,
    status: queueStatus(steps),
    riskTier: plan.riskTier,
    createdAt,
    updatedAt: createdAt,
    steps,
    timeline: [event('queue_created', actor, `Mission execution queue created for ${steps.length} steps.`)],
    summary: summarize(steps),
  };

  return advanceMissionExecutionQueue(queue, actor);
}

export function advanceMissionExecutionQueue(queue: MissionExecutionQueue, actor = 'Mission Queue') {
  if (queue.status === 'cancelled') return queue;
  const timeline: MissionExecutionTimelineEvent[] = [];
  const steps = queue.steps.map((step) => {
    if (step.status !== 'queued') return step;
    const approved = !step.approvalRequired || Boolean(step.approval);
    if (approved && dependenciesCompleted(step, queue.steps)) {
      timeline.push(event('step_ready', actor, `${step.title} is ready to run.`, step.id));
      return { ...step, status: 'ready' as MissionExecutionStepStatus, updatedAt: now() };
    }
    return step;
  });
  return refreshQueue({ ...queue, steps }, timeline.length ? [...timeline, event('queue_advanced', actor, 'Mission execution queue advanced.')] : []);
}

export function approveMissionExecutionStep(queue: MissionExecutionQueue, stepId: string, phrase: string, approver = 'Founder') {
  if (queue.status === 'cancelled') throw new Error('Cannot approve a cancelled mission execution queue.');
  let found = false;
  const approvedAt = now();
  const steps = queue.steps.map((step) => {
    if (step.id !== stepId && step.missionStepId !== stepId) return step;
    found = true;
    if (!step.approvalRequired) throw new Error(`Step ${step.title} does not require approval.`);
    if (!step.approvalPhrase || step.approvalPhrase !== phrase) {
      throw new Error(`Approval phrase mismatch for step ${step.title}. Expected: ${step.approvalPhrase || 'APPROVE MISSION STEP'}`);
    }
    const approval = {
      approver,
      phrase,
      approvedAt,
      fingerprint: approvalFingerprint(queue.id, step.id, approver, phrase, approvedAt),
    };
    const nextStatus: MissionExecutionStepStatus = dependenciesCompleted(step, queue.steps) ? 'ready' : 'queued';
    return { ...step, approval, status: nextStatus, updatedAt: approvedAt };
  });
  if (!found) throw new Error(`Mission execution step not found: ${stepId}`);
  const nextQueue = refreshQueue({ ...queue, steps }, [event('step_approved', approver, `Approval captured for ${stepId}.`, stepId)]);
  return advanceMissionExecutionQueue(nextQueue, approver);
}

export function startMissionExecutionStep(queue: MissionExecutionQueue, stepId: string, actor = 'Mission Operator') {
  if (queue.status === 'cancelled') throw new Error('Cannot start a cancelled mission execution queue.');
  let found = false;
  const startedAt = now();
  const steps = queue.steps.map((step) => {
    if (step.id !== stepId && step.missionStepId !== stepId) return step;
    found = true;
    if (step.status !== 'ready') throw new Error(`Step ${step.title} is not ready. Current status: ${step.status}`);
    return { ...step, status: 'running' as MissionExecutionStepStatus, startedAt, updatedAt: startedAt };
  });
  if (!found) throw new Error(`Mission execution step not found: ${stepId}`);
  return refreshQueue({ ...queue, steps }, [event('step_started', actor, `Started ${stepId}.`, stepId)]);
}

export function completeMissionExecutionStep(queue: MissionExecutionQueue, stepId: string, evidence: Omit<MissionExecutionEvidence, 'id' | 'createdAt'>[], actor = 'Mission Operator') {
  if (queue.status === 'cancelled') throw new Error('Cannot complete a cancelled mission execution queue.');
  let found = false;
  const completedAt = now();
  const steps = queue.steps.map((step) => {
    if (step.id !== stepId && step.missionStepId !== stepId) return step;
    found = true;
    if (step.status !== 'ready' && step.status !== 'running') throw new Error(`Step ${step.title} cannot be completed from status ${step.status}.`);
    const nextEvidence = evidence.map((item) => ({
      ...item,
      id: stableId('evidence', { stepId: step.id, title: item.title, value: item.value, completedAt }),
      createdAt: completedAt,
    }));
    return {
      ...step,
      status: 'completed' as MissionExecutionStepStatus,
      evidence: [...step.evidence, ...nextEvidence],
      completedAt,
      updatedAt: completedAt,
    };
  });
  if (!found) throw new Error(`Mission execution step not found: ${stepId}`);
  const nextQueue = refreshQueue({ ...queue, steps }, [event('step_completed', actor, `Completed ${stepId} with ${evidence.length} evidence item(s).`, stepId)]);
  return advanceMissionExecutionQueue(nextQueue, actor);
}

export function cancelMissionExecutionQueue(queue: MissionExecutionQueue, reason: string, actor = 'Founder') {
  const updatedAt = now();
  const steps = queue.steps.map((step) => step.status === 'completed'
    ? step
    : { ...step, status: 'cancelled' as MissionExecutionStepStatus, blockedReason: reason, updatedAt });
  return refreshQueue({ ...queue, status: 'cancelled', steps }, [event('queue_cancelled', actor, `Mission execution queue cancelled: ${reason}`)]);
}
