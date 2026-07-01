import { randomUUID } from 'node:crypto';
import { createJsonFileLocalStore } from './aiWorkforceLocalStore.ts';
import type { AIWorkforceMissionPlan } from './aiWorkforceMissionPlanner.ts';
import { isAgentToolId } from './agentToolIds.ts';
import {
  advanceAgentRun,
  approveAgentRunStep,
  createAgentRun,
  getAgentRun,
  listAgentRuns,
  stopAgentRun,
  type AgentRun,
} from './agentRuntime.ts';
import {
  approveMissionExecutionStep,
  cancelMissionExecutionQueue,
  completeMissionExecutionStep,
  createMissionExecutionQueue,
  startMissionExecutionStep,
  type MissionExecutionEvidence,
  type MissionExecutionQueue,
  type MissionExecutionQueueStep,
  type MissionExecutionQueueStatus,
} from './aiWorkforceMissionExecutionQueue.ts';

interface MissionExecutionQueueStoreState extends Record<string, unknown> {
  queueLinks: Record<string, { queueId: string; agentRunId: string; createdAt: string; plan: AIWorkforceMissionPlan }>;
  legacyQueues: Record<string, MissionExecutionQueue>;
}

function emptyState(): MissionExecutionQueueStoreState {
  return { queueLinks: {}, legacyQueues: {} };
}

function normalizeState(parsed: unknown): MissionExecutionQueueStoreState {
  const candidate = parsed && typeof parsed === 'object' && !Array.isArray(parsed)
    ? parsed as Partial<MissionExecutionQueueStoreState>
    : {};
  return {
    queueLinks: candidate.queueLinks && typeof candidate.queueLinks === 'object' ? candidate.queueLinks : {},
    legacyQueues: candidate.legacyQueues && typeof candidate.legacyQueues === 'object' ? candidate.legacyQueues : {},
  };
}

const queueStore = createJsonFileLocalStore<MissionExecutionQueueStoreState>({
  filePath: () => process.env.AI_WORKFORCE_MISSION_QUEUE_STORE_FILE || 'ai_workforce_mission_queues.local.json',
  emptyState,
  normalizeState,
});

export interface MissionQueueListOptions {
  limit?: number;
  status?: MissionExecutionQueueStatus;
}

export interface MissionQueueRuntimeDriftIssue {
  queueId: string;
  missionId: string;
  agentRunId: string;
  severity: 'warning' | 'critical';
  kind: 'missing_agent_run' | 'missing_legacy_queue' | 'source_mismatch' | 'queue_status_mismatch' | 'step_count_mismatch' | 'step_status_mismatch' | 'step_tool_mismatch';
  summary: string;
  details?: Record<string, unknown>;
}

export interface MissionQueueRuntimeDriftReport {
  generatedAt: string;
  checkedLinks: number;
  linkedQueues: number;
  issues: MissionQueueRuntimeDriftIssue[];
  repaired: string[];
}

export async function saveMissionExecutionQueue(queue: MissionExecutionQueue) {
  return queueStore.mutate((store) => {
    store.legacyQueues[queue.id] = queue;
    return queue;
  });
}

function mapStepStatus(status: AgentRun['steps'][number]['status']): MissionExecutionQueueStep['status'] {
  if (status === 'queued') return 'queued';
  if (status === 'running') return 'running';
  if (status === 'waiting_approval') return 'waiting_approval';
  if (status === 'completed') return 'completed';
  if (status === 'stopped') return 'cancelled';
  if (status === 'failed' || status === 'rejected') return 'blocked';
  return 'queued';
}

function mapQueueStatus(status: AgentRun['status']): MissionExecutionQueueStatus {
  if (status === 'planned') return 'queued';
  if (status === 'running') return 'running';
  if (status === 'waiting_approval') return 'needs_approval';
  if (status === 'completed') return 'completed';
  if (status === 'failed' || status === 'rejected') return 'blocked';
  if (status === 'stopped') return 'cancelled';
  return 'queued';
}

function queueFromAgentRun(link: { queueId: string; plan: AIWorkforceMissionPlan }, run: AgentRun): MissionExecutionQueue {
  const planSteps = link.plan.steps;
  const steps: MissionExecutionQueueStep[] = run.steps.map((runStep, index) => {
    const planned = planSteps[index];
    const evidenceItems = [runStep.evidence]
      .filter((item): item is Record<string, unknown> => Boolean(item))
      .map((item, evidenceIndex) => ({
        id: `${runStep.id}_evidence_${evidenceIndex + 1}`,
        title: runStep.title,
        kind: 'artifact' as const,
        value: JSON.stringify(item),
        createdAt: runStep.completedAt || run.updatedAt,
      }));
    return {
      id: runStep.id,
      missionStepId: planned?.id || `agent_step_${index + 1}`,
      title: runStep.title,
      lane: planned?.lane || 'mission-control',
      agentRole: planned?.agentRole || 'Agent Runtime',
      toolId: runStep.toolId,
      riskTier: (planned?.riskTier || runStep.risk || 'medium') as any,
      status: mapStepStatus(runStep.status),
      dependsOn: planned?.dependsOn || (index > 0 ? [planSteps[index - 1]?.id || `agent_step_${index}`] : []),
      approvalRequired: runStep.requiresApproval,
      approvalPhrase: runStep.requiresApproval ? 'APPROVE AGENT STEP' : undefined,
      approval: runStep.status === 'completed' && runStep.approvalFingerprint
        ? {
            approver: run.requestedBy,
            phrase: 'APPROVE AGENT STEP',
            fingerprint: `approval_${runStep.approvalFingerprint.slice(0, 24)}`,
            approvedAt: runStep.completedAt || run.updatedAt,
          }
        : undefined,
      highImpact: runStep.risk !== 'low',
      expectedEvidence: planned?.expectedEvidence || ['Inspectable runtime evidence'],
      evidence: evidenceItems,
      blockedReason: runStep.status === 'failed' || runStep.status === 'rejected' ? runStep.observation : undefined,
      startedAt: runStep.startedAt,
      completedAt: runStep.completedAt,
      updatedAt: run.updatedAt,
    };
  });

  const summary = {
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

  return {
    id: link.queueId,
    missionId: link.plan.id,
    goal: run.goal,
    owner: run.requestedBy,
    status: mapQueueStatus(run.status),
    riskTier: link.plan.riskTier,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    steps,
    timeline: [
      {
        id: `${link.queueId}_created`,
        action: 'queue_created',
        actor: run.requestedBy,
        summary: `Queue is mirrored from AgentRun ${run.id}.`,
        createdAt: run.createdAt,
      },
    ],
    summary,
  };
}

async function resolveQueueLink(queueId: string) {
  const state = await queueStore.read();
  return state.queueLinks[queueId] || null;
}

function pushIssue(
  list: MissionQueueRuntimeDriftIssue[],
  input: MissionQueueRuntimeDriftIssue,
) {
  list.push(input);
}

function compareQueueWithMirroredRun(
  legacy: MissionExecutionQueue,
  mirrored: MissionExecutionQueue,
  link: { queueId: string; agentRunId: string; plan: AIWorkforceMissionPlan },
  issues: MissionQueueRuntimeDriftIssue[],
) {
  if (legacy.status !== mirrored.status) {
    pushIssue(issues, {
      queueId: link.queueId,
      missionId: link.plan.id,
      agentRunId: link.agentRunId,
      severity: 'warning',
      kind: 'queue_status_mismatch',
      summary: `Queue status drift: legacy=${legacy.status}, run=${mirrored.status}.`,
      details: { legacyStatus: legacy.status, mirroredStatus: mirrored.status },
    });
  }

  if (legacy.steps.length !== mirrored.steps.length) {
    pushIssue(issues, {
      queueId: link.queueId,
      missionId: link.plan.id,
      agentRunId: link.agentRunId,
      severity: 'critical',
      kind: 'step_count_mismatch',
      summary: `Step count drift: legacy=${legacy.steps.length}, run=${mirrored.steps.length}.`,
      details: { legacySteps: legacy.steps.length, mirroredSteps: mirrored.steps.length },
    });
  }

  const steps = Math.min(legacy.steps.length, mirrored.steps.length);
  for (let index = 0; index < steps; index += 1) {
    const legacyStep = legacy.steps[index];
    const mirroredStep = mirrored.steps[index];
    if (legacyStep.status !== mirroredStep.status) {
      pushIssue(issues, {
        queueId: link.queueId,
        missionId: link.plan.id,
        agentRunId: link.agentRunId,
        severity: 'warning',
        kind: 'step_status_mismatch',
        summary: `Step[${index}] status drift: legacy=${legacyStep.status}, run=${mirroredStep.status}.`,
        details: { index, legacyStatus: legacyStep.status, mirroredStatus: mirroredStep.status, stepId: legacyStep.id },
      });
    }
    if (legacyStep.toolId !== mirroredStep.toolId) {
      pushIssue(issues, {
        queueId: link.queueId,
        missionId: link.plan.id,
        agentRunId: link.agentRunId,
        severity: 'critical',
        kind: 'step_tool_mismatch',
        summary: `Step[${index}] tool drift: legacy=${legacyStep.toolId}, run=${mirroredStep.toolId}.`,
        details: { index, legacyToolId: legacyStep.toolId, mirroredToolId: mirroredStep.toolId, stepId: legacyStep.id },
      });
    }
  }
}

export async function getMissionQueueRuntimeDriftReport(options: { autoRepair?: boolean; limit?: number } = {}): Promise<MissionQueueRuntimeDriftReport> {
  const state = await queueStore.read();
  const links = Object.values(state.queueLinks).slice(0, options.limit || Number.MAX_SAFE_INTEGER);
  const issues: MissionQueueRuntimeDriftIssue[] = [];
  const repairs: Record<string, MissionExecutionQueue> = {};

  for (const link of links) {
    const run = await getAgentRun(link.agentRunId);
    if (!run) {
      pushIssue(issues, {
        queueId: link.queueId,
        missionId: link.plan.id,
        agentRunId: link.agentRunId,
        severity: 'critical',
        kind: 'missing_agent_run',
        summary: 'Linked AgentRun was not found for mission queue.',
      });
      continue;
    }

    if (run.sourceId && run.sourceId !== link.plan.id) {
      pushIssue(issues, {
        queueId: link.queueId,
        missionId: link.plan.id,
        agentRunId: link.agentRunId,
        severity: 'critical',
        kind: 'source_mismatch',
        summary: `Run sourceId drift: run.sourceId=${run.sourceId}, plan.id=${link.plan.id}.`,
        details: { runSourceId: run.sourceId, planId: link.plan.id },
      });
    }

    const mirrored = queueFromAgentRun(link, run);
    const legacy = state.legacyQueues[link.queueId];
    if (!legacy) {
      pushIssue(issues, {
        queueId: link.queueId,
        missionId: link.plan.id,
        agentRunId: link.agentRunId,
        severity: 'warning',
        kind: 'missing_legacy_queue',
        summary: 'Legacy mission queue snapshot missing for linked AgentRun.',
      });
      if (options.autoRepair) repairs[link.queueId] = mirrored;
      continue;
    }

    compareQueueWithMirroredRun(legacy, mirrored, link, issues);
    if (options.autoRepair) repairs[link.queueId] = mirrored;
  }

  const repaired = Object.keys(repairs);
  if (options.autoRepair && repaired.length > 0) {
    await queueStore.mutate((store) => {
      for (const queueId of repaired) {
        store.legacyQueues[queueId] = repairs[queueId];
      }
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    checkedLinks: links.length,
    linkedQueues: Object.keys(state.queueLinks).length,
    issues,
    repaired,
  };
}

export async function createAndSaveMissionExecutionQueue(plan: AIWorkforceMissionPlan, actor = plan.owner || 'Founder') {
  return saveMissionExecutionQueue(createMissionExecutionQueue(plan, actor));
}

export async function createLinkedMissionExecutionQueue(plan: AIWorkforceMissionPlan, actor = plan.owner || 'Founder') {
  const queue = createMissionExecutionQueue(plan, actor);
  await saveMissionExecutionQueue(queue);

  const requestedTools = plan.steps.map((step) => (isAgentToolId(step.toolId) ? step.toolId : 'draft_patch'));
  try {
    const run = await createAgentRun({
      goal: plan.goal,
      requestedBy: actor,
      requestedTools,
      maxSteps: Math.max(1, Math.min(plan.steps.length, 12)),
      sourceType: 'workboard',
      sourceId: plan.id,
      plannerMode: 'auto',
    });
    await queueStore.mutate((store) => {
      store.queueLinks[queue.id] = { queueId: queue.id, agentRunId: run.id, createdAt: run.createdAt, plan };
    });
  } catch {
    // Keep mission queue functional even if AgentRun link cannot be attached.
  }

  return queue;
}

export async function getMissionExecutionQueue(queueId: string) {
  const state = await queueStore.read();
  const legacy = state.legacyQueues[queueId];
  if (legacy) return legacy;
  const link = await resolveQueueLink(queueId);
  if (!link) return null;
  const run = await getAgentRun(link.agentRunId);
  if (!run) return null;
  return queueFromAgentRun(link, run);
}

export async function requireMissionExecutionQueue(queueId: string) {
  const queue = await getMissionExecutionQueue(queueId);
  if (!queue) throw new Error(`Mission execution queue not found: ${queueId}`);
  return queue;
}

export async function listMissionExecutionQueues(options: MissionQueueListOptions = {}) {
  const state = await queueStore.read();
  const queues = await Promise.all(Object.values(state.queueLinks).map(async (link) => {
    const run = await getAgentRun(link.agentRunId);
    return run ? queueFromAgentRun(link, run) : null;
  }));
  const merged = [
    ...Object.values(state.legacyQueues),
    ...queues.filter((queue): queue is MissionExecutionQueue => Boolean(queue)),
  ];
  const deduped = Array.from(new Map(merged.map((queue) => [queue.id, queue])).values());
  return deduped
    .filter((queue): queue is MissionExecutionQueue => Boolean(queue))
    .filter((queue) => !options.status || queue.status === options.status)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, options.limit || 50);
}

export async function approveStoredMissionExecutionStep(options: { queueId: string; stepId: string; phrase: string; approver?: string }) {
  const link = await resolveQueueLink(options.queueId);
  if (!link) {
    const current = await requireMissionExecutionQueue(options.queueId);
    const next = approveMissionExecutionStep(current, options.stepId, options.phrase, options.approver || 'Founder');
    return saveMissionExecutionQueue(next);
  }
  const run = await getAgentRun(link.agentRunId);
  if (!run) {
    const current = await requireMissionExecutionQueue(options.queueId);
    const next = approveMissionExecutionStep(current, options.stepId, options.phrase, options.approver || 'Founder');
    return saveMissionExecutionQueue(next);
  }
  const step = run.steps.find((item) => item.id === options.stepId || item.status === 'waiting_approval');
  if (!step || step.status !== 'waiting_approval' || !step.approvalFingerprint) {
    const current = await requireMissionExecutionQueue(options.queueId);
    const next = approveMissionExecutionStep(current, options.stepId, options.phrase, options.approver || 'Founder');
    return saveMissionExecutionQueue(next);
  }
  if (options.phrase !== 'APPROVE AGENT STEP') {
    throw new Error('Approval phrase mismatch. Expected: APPROVE AGENT STEP');
  }
  await approveAgentRunStep(run.id, {
    stepId: step.id,
    fingerprint: step.approvalFingerprint,
    signature: step.approvalSignature,
    phrase: 'APPROVE AGENT STEP',
  });
  const nextRun = await getAgentRun(run.id);
  if (!nextRun) throw new Error('Agent run not found.');
  const synced = queueFromAgentRun(link, nextRun);
  await saveMissionExecutionQueue(synced);
  return synced;
}

export async function startStoredMissionExecutionStep(options: { queueId: string; stepId: string; actor?: string }) {
  const link = await resolveQueueLink(options.queueId);
  const current = await requireMissionExecutionQueue(options.queueId);
  const next = startMissionExecutionStep(current, options.stepId, options.actor || 'Mission Operator');
  if (link) await saveMissionExecutionQueue(next);
  return saveMissionExecutionQueue(next);
}

export async function completeStoredMissionExecutionStep(options: {
  queueId: string;
  stepId: string;
  evidence: Omit<MissionExecutionEvidence, 'id' | 'createdAt'>[];
  actor?: string;
}) {
  const link = await resolveQueueLink(options.queueId);
  const current = await requireMissionExecutionQueue(options.queueId);
  const next = completeMissionExecutionStep(current, options.stepId, options.evidence, options.actor || 'Mission Operator');
  if (link) await saveMissionExecutionQueue(next);
  return saveMissionExecutionQueue(next);
}

export async function cancelStoredMissionExecutionQueue(options: { queueId: string; reason: string; actor?: string }) {
  const link = await resolveQueueLink(options.queueId);
  const current = await requireMissionExecutionQueue(options.queueId);
  const next = cancelMissionExecutionQueue(current, options.reason, options.actor || 'Founder');
  if (link) {
    await stopAgentRun(link.agentRunId, options.reason).catch(() => undefined);
  }
  return saveMissionExecutionQueue(next);
}

export async function getMissionExecutionQueueStoreStats() {
  const queues = await listMissionExecutionQueues({ limit: Number.MAX_SAFE_INTEGER });
  const drift = await getMissionQueueRuntimeDriftReport({ limit: 200 });
  const byStatus = queues.reduce<Record<string, number>>((acc, queue) => {
    acc[queue.status] = (acc[queue.status] || 0) + 1;
    return acc;
  }, {});
  const storage = await queueStore.stats();
  return {
    total: queues.length,
    byStatus,
    linkedQueues: drift.linkedQueues,
    drift: {
      checkedLinks: drift.checkedLinks,
      issueCount: drift.issues.length,
      criticalIssues: drift.issues.filter((issue) => issue.severity === 'critical').length,
    },
    latestQueue: queues[0] || null,
    storage,
  };
}

export async function clearMissionExecutionQueueStoreForTest() {
  await queueStore.clear();
}
