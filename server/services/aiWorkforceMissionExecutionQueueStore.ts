import { createJsonFileLocalStore } from './aiWorkforceLocalStore.ts';
import type { AIWorkforceMissionPlan } from './aiWorkforceMissionPlanner.ts';
import {
  approveMissionExecutionStep,
  cancelMissionExecutionQueue,
  completeMissionExecutionStep,
  createMissionExecutionQueue,
  startMissionExecutionStep,
  type MissionExecutionEvidence,
  type MissionExecutionQueue,
  type MissionExecutionQueueStatus,
} from './aiWorkforceMissionExecutionQueue.ts';

interface MissionExecutionQueueStoreState extends Record<string, unknown> {
  queues: Record<string, MissionExecutionQueue>;
}

function emptyState(): MissionExecutionQueueStoreState {
  return { queues: {} };
}

function normalizeState(parsed: unknown): MissionExecutionQueueStoreState {
  const candidate = parsed && typeof parsed === 'object' && !Array.isArray(parsed)
    ? parsed as Partial<MissionExecutionQueueStoreState>
    : {};
  return {
    queues: candidate.queues && typeof candidate.queues === 'object' ? candidate.queues : {},
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

export async function saveMissionExecutionQueue(queue: MissionExecutionQueue) {
  return queueStore.mutate((store) => {
    store.queues[queue.id] = queue;
    return queue;
  });
}

export async function createAndSaveMissionExecutionQueue(plan: AIWorkforceMissionPlan, actor = plan.owner || 'Founder') {
  return saveMissionExecutionQueue(createMissionExecutionQueue(plan, actor));
}

export async function getMissionExecutionQueue(queueId: string) {
  const state = await queueStore.read();
  return state.queues[queueId] || null;
}

export async function requireMissionExecutionQueue(queueId: string) {
  const queue = await getMissionExecutionQueue(queueId);
  if (!queue) throw new Error(`Mission execution queue not found: ${queueId}`);
  return queue;
}

export async function listMissionExecutionQueues(options: MissionQueueListOptions = {}) {
  const state = await queueStore.read();
  return Object.values(state.queues)
    .filter((queue) => !options.status || queue.status === options.status)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, options.limit || 50);
}

export async function approveStoredMissionExecutionStep(options: { queueId: string; stepId: string; phrase: string; approver?: string }) {
  const current = await requireMissionExecutionQueue(options.queueId);
  const next = approveMissionExecutionStep(current, options.stepId, options.phrase, options.approver || 'Founder');
  return saveMissionExecutionQueue(next);
}

export async function startStoredMissionExecutionStep(options: { queueId: string; stepId: string; actor?: string }) {
  const current = await requireMissionExecutionQueue(options.queueId);
  const next = startMissionExecutionStep(current, options.stepId, options.actor || 'Mission Operator');
  return saveMissionExecutionQueue(next);
}

export async function completeStoredMissionExecutionStep(options: {
  queueId: string;
  stepId: string;
  evidence: Omit<MissionExecutionEvidence, 'id' | 'createdAt'>[];
  actor?: string;
}) {
  const current = await requireMissionExecutionQueue(options.queueId);
  const next = completeMissionExecutionStep(current, options.stepId, options.evidence, options.actor || 'Mission Operator');
  return saveMissionExecutionQueue(next);
}

export async function cancelStoredMissionExecutionQueue(options: { queueId: string; reason: string; actor?: string }) {
  const current = await requireMissionExecutionQueue(options.queueId);
  const next = cancelMissionExecutionQueue(current, options.reason, options.actor || 'Founder');
  return saveMissionExecutionQueue(next);
}

export async function getMissionExecutionQueueStoreStats() {
  const queues = await listMissionExecutionQueues({ limit: Number.MAX_SAFE_INTEGER });
  const byStatus = queues.reduce<Record<string, number>>((acc, queue) => {
    acc[queue.status] = (acc[queue.status] || 0) + 1;
    return acc;
  }, {});
  const storage = await queueStore.stats();
  return {
    total: queues.length,
    byStatus,
    latestQueue: queues[0] || null,
    storage,
  };
}

export async function clearMissionExecutionQueueStoreForTest() {
  await queueStore.clear();
}
