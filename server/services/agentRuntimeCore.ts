import { runAgenticLoop, type AgenticLoopOptions, type AgenticLoopRun } from './agenticLoopEngine.ts';
import { subscribe as subscribeAgentMemory, type AgentMemoryRecord } from './agentMemoryStore.ts';
import { appendAIWorkforceRuntimeRecord } from './aiWorkforceRuntimeStore.ts';

export type RuntimeCoreMissionSource =
  | 'agentic_loop'
  | 'agent_runtime'
  | 'ai_workforce_runtime_hub'
  | 'multi_agent_orchestrator'
  | 'agent_swarm_coordinator';

export type RuntimeCoreMissionStatus =
  | 'planning'
  | 'running'
  | 'waiting_approval'
  | 'completed'
  | 'failed'
  | 'stopped'
  | 'cancelled';

export interface RuntimeCoreMissionRecord {
  surface: 'agent_runtime_core';
  source: RuntimeCoreMissionSource;
  missionId: string;
  goal: string;
  domain: string;
  status: RuntimeCoreMissionStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  summary?: string;
  stepCount: number;
  completedStepCount: number;
  failedStepCount: number;
  waitingApprovalCount?: number;
  totalDurationMs: number;
  sourceRef?: string;
  metadata?: Record<string, unknown>;
}

const memoryInboxByMission = new Map<string, AgentMemoryRecord[]>();

function pushMissionMemory(missionId: string, record: AgentMemoryRecord) {
  const current = memoryInboxByMission.get(missionId) || [];
  current.unshift(record);
  memoryInboxByMission.set(missionId, current.slice(0, 50));
}

subscribeAgentMemory('agent-memory.created', (record) => {
  for (const tag of record.tags) {
    if (tag.startsWith('mission:')) pushMissionMemory(tag.slice('mission:'.length), record);
  }
});

export function getRuntimeCoreMissionMemory(missionId: string): AgentMemoryRecord[] {
  return [...(memoryInboxByMission.get(missionId) || [])];
}

export function subscribeRuntimeCoreMissionMemory(
  missionId: string,
  handler: (record: AgentMemoryRecord) => void,
): () => void {
  return subscribeAgentMemory(`mission:${missionId}`, (record) => {
    handler(record);
  });
}

export async function recordRuntimeCoreMission(
  input: Omit<RuntimeCoreMissionRecord, 'surface'>,
) {
  const payload: RuntimeCoreMissionRecord = {
    surface: 'agent_runtime_core',
    ...input,
  };

  return appendAIWorkforceRuntimeRecord({
    id: `agent_runtime_core_${input.source}_${input.missionId}`,
    type: 'agent_runtime_core_mission',
    createdAt: input.updatedAt,
    payload,
  });
}

export function agenticLoopRunToRuntimeCoreMission(run: AgenticLoopRun): RuntimeCoreMissionRecord {
  return {
    surface: 'agent_runtime_core',
    source: 'agentic_loop',
    missionId: run.id,
    goal: run.goal,
    domain: run.domain,
    status: run.status === 'executing' || run.status === 'observing' || run.status === 'replanning' ? 'running' : run.status,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    completedAt: run.completedAt,
    summary: run.summary,
    stepCount: run.steps.length,
    completedStepCount: run.steps.filter((step) => step.phase === 'completed' || step.observation.success).length,
    failedStepCount: run.steps.filter((step) => step.phase === 'failed' || (!step.observation.success && step.completedAt)).length,
    waitingApprovalCount: undefined, // TODO: not tracked at step level yet
    totalDurationMs: run.totalDurationMs,
    metadata: {
      maxLoops: run.maxLoops,
      maxRepairAttempts: run.maxRepairAttempts,
      autoRepair: run.autoRepair,
      planLength: run.plan.length,
    },
  };
}

export async function runRuntimeCoreMission(options: AgenticLoopOptions) {
  const run = await runAgenticLoop(options);
  const coreMission = agenticLoopRunToRuntimeCoreMission(run);
  await recordRuntimeCoreMission(coreMission);
  return { run, coreMission };
}
