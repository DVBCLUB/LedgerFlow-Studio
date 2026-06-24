import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { appendAuditEvent } from './auditLog.ts';
import { createApprovalFingerprint, getAgentToolContract } from './agentToolRegistry.ts';
import { searchAgentMemory } from './agentMemoryStore.ts';
import { createAgentPlan, type AgentPlan, type AgentToolId } from './agentPlanner.ts';
import { executeSandboxTool } from './sandboxToolExecutor.ts';
import { readSecureJson, writeSecureJson } from './secureJsonStore.ts';
import { signRecord, verifyRecord } from './signedRecords.ts';
import { publish } from './agentEventBus.ts';

export type AgentRunStatus = 'planned' | 'running' | 'waiting_approval' | 'completed' | 'failed' | 'stopped';
export type AgentRunStepStatus = 'queued' | 'running' | 'waiting_approval' | 'completed' | 'failed' | 'stopped';

export interface AgentRunStep {
  id: string; index: number; toolId: AgentToolId; title: string; successCriteria: string; status: AgentRunStepStatus;
  risk: string; requiresApproval: boolean; toolInput?: Record<string, unknown>; approvalFingerprint?: string; approvalSignature?: string;
  observation?: string; evidence?: Record<string, unknown>; startedAt?: string; completedAt?: string;
}

export interface AgentRun {
  id: string; goal: string; status: AgentRunStatus; requestedBy: string; sourceType: 'direct' | 'workboard' | 'pipeline'; sourceId?: string;
  maxSteps: number; maxRuntimeMs: number; planner: AgentPlan['planner']; plannerSummary: string; plannerFallbackReason?: string; replanCount: number;
  startedAt?: string; completedAt?: string; stoppedReason?: string; createdAt: string; updatedAt: string; steps: AgentRunStep[]; observations: string[];
  artifacts: Array<{ id: string; type: string; summary: string; evidence: Record<string, unknown>; createdAt: string }>;
}

type RuntimeStore = { emergencyStop: boolean; stopReason?: string; runs: Record<string, AgentRun> };
let writeQueue = Promise.resolve();

function storageFile() { return path.resolve(process.cwd(), process.env.AGENT_RUNTIME_STORE_FILE || 'agent_runtime.local.enc'); }
async function readStoreUnsafe(): Promise<RuntimeStore> { const parsed = await readSecureJson<RuntimeStore>(storageFile(), { emergencyStop: false, runs: {} }); return { emergencyStop: Boolean(parsed.emergencyStop), stopReason: parsed.stopReason, runs: parsed.runs || {} }; }

async function mutate<T>(operation: (store: RuntimeStore) => T | Promise<T>): Promise<T> {
  let result!: T;
  const task = async () => { const store = await readStoreUnsafe(); result = await operation(store); await writeSecureJson(storageFile(), store); };
  const queued = writeQueue.then(task, task); writeQueue = queued.catch(() => undefined); await queued; return result;
}

function planSteps(plan: AgentPlan, maxSteps: number, toolInputs: Partial<Record<AgentToolId, Record<string, unknown>>> = {}): AgentRunStep[] {
  return plan.steps.slice(0, maxSteps).map((item, index) => {
    const contract = getAgentToolContract(item.toolId); if (!contract) throw new Error(`Tool ${item.toolId} is not registered.`);
    return { id: `step_${randomUUID()}`, index, toolId: item.toolId, title: item.title, successCriteria: item.successCriteria, status: 'queued', risk: contract.risk, requiresApproval: contract.requiresApproval, toolInput: toolInputs[item.toolId] };
  });
}

export async function createAgentRun(input: { goal: string; requestedBy?: string; requestedTools?: AgentToolId[]; toolInputs?: Partial<Record<AgentToolId, Record<string, unknown>>>; maxSteps?: number; maxRuntimeMs?: number; plannerMode?: 'auto' | 'ai' | 'deterministic'; sourceType?: AgentRun['sourceType']; sourceId?: string }) {
  const maxSteps = Math.max(1, Math.min(input.maxSteps || 6, 12));
  const plan = await createAgentPlan({ goal: input.goal, requestedTools: input.requestedTools, mode: input.plannerMode || 'auto' });
  const now = new Date().toISOString();
  const run: AgentRun = {
    id: `run_${randomUUID()}`, goal: input.goal.trim(), status: 'planned', requestedBy: input.requestedBy || 'founder', sourceType: input.sourceType || 'direct', sourceId: input.sourceId,
    maxSteps, maxRuntimeMs: Math.max(5_000, Math.min(input.maxRuntimeMs || 120_000, 600_000)), planner: plan.planner, plannerSummary: plan.summary, plannerFallbackReason: plan.fallbackReason, replanCount: 0,
    createdAt: now, updatedAt: now, steps: planSteps(plan, maxSteps, input.toolInputs), observations: [], artifacts: [],
  };
  await mutate((store) => { const duplicate = input.sourceId && Object.values(store.runs).find((item) => item.sourceType === run.sourceType && item.sourceId === input.sourceId); if (duplicate) throw new Error('Source is already linked to an AgentRun.'); store.runs[run.id] = run; });
  await appendAuditEvent({ actor: 'founder', workspace: 'agent-runtime', action: 'run.created', target: run.id, risk: 'LOW', status: 'planned', summary: run.goal, evidence: { planner: run.planner, steps: run.steps.map((step) => step.toolId), sourceType: run.sourceType, sourceId: run.sourceId } });
  return run;
}

export async function importLegacyAgentRuns(items: Array<{ id: string; title?: string; goal?: string; request?: string; prompt?: string; tools?: string[]; sourceType: 'workboard' | 'pipeline' }>) {
  const imported: AgentRun[] = []; const skipped: string[] = [];
  for (const item of items.slice(0, 100)) {
    try {
      const requestedTools = (item.tools || []).filter((tool): tool is AgentToolId => Boolean(getAgentToolContract(tool)));
      imported.push(await createAgentRun({ goal: item.request || item.prompt || item.goal || item.title || 'Imported legacy work', requestedTools, plannerMode: 'deterministic', sourceType: item.sourceType, sourceId: item.id }));
    } catch (error) { if (error instanceof Error && error.message.includes('already linked')) skipped.push(item.id); else throw error; }
  }
  return { imported, skipped };
}

async function executeStep(run: AgentRun, step: AgentRunStep) {
  step.status = 'running'; step.startedAt = new Date().toISOString(); run.status = 'running';
  let result: Record<string, unknown>;
  if (step.toolId === 'read_knowledge') { const memories = await searchAgentMemory(run.goal, { limit: 5 }); result = { action: step.toolId, mode: 'retrieval', citations: memories.map((item) => item.citation), memories }; }
  else if (step.toolId === 'external_connector') result = { action: step.toolId, mode: 'connector_preview', blocked: true, reason: 'A separately scoped connector approval is required.' };
  else result = await executeSandboxTool({ runId: run.id, stepId: step.id, toolId: step.toolId, goal: run.goal, toolInput: step.toolInput });
  const observation = `${step.toolId} completed with inspectable ${String(result.mode || 'sandbox')} evidence.`;
  step.status = 'completed'; step.completedAt = new Date().toISOString(); step.observation = observation; step.evidence = result; run.observations.push(observation);
  run.artifacts.push({ id: `artifact_${randomUUID()}`, type: step.toolId, summary: observation, evidence: result, createdAt: step.completedAt });
  await appendAuditEvent({ actor: 'ai-agent', workspace: 'agent-runtime', action: 'tool.executed', target: step.id, risk: step.risk.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH', status: result.blocked ? 'pending_approval' : 'sandbox', summary: observation, evidence: { runId: run.id, toolId: step.toolId, mode: result.mode } });
}

export async function advanceAgentRun(id: string) {
  return mutate(async (store) => {
    const run = store.runs[id]; if (!run) throw new Error('Agent run not found.');
    if (store.emergencyStop) throw new Error(`Agent runtime emergency stop is active${store.stopReason ? `: ${store.stopReason}` : '.'}`);
    if (['completed', 'failed', 'stopped'].includes(run.status)) return run;
    if (!run.startedAt) run.startedAt = new Date().toISOString();
    if (Date.now() - Date.parse(run.startedAt) > run.maxRuntimeMs) { run.status = 'stopped'; run.stoppedReason = 'Runtime budget exceeded.'; run.completedAt = new Date().toISOString(); return run; }
    for (const step of run.steps) {
      if (step.status === 'completed') continue;
      if (step.status === 'waiting_approval') { run.status = 'waiting_approval'; break; }
      if (step.requiresApproval) {
        step.status = 'waiting_approval'; step.approvalFingerprint = createApprovalFingerprint({ runId: run.id, stepId: step.id, toolId: step.toolId, goal: run.goal, toolInput: step.toolInput });
        step.approvalSignature = signRecord({ runId: run.id, stepId: step.id, fingerprint: step.approvalFingerprint }); run.status = 'waiting_approval';
        publish('agent.step.approval_required', { runId: run.id, stepId: step.id, toolId: step.toolId, fingerprint: step.approvalFingerprint }).catch(() => undefined);
        break;
      }
      try { await executeStep(run, step); }
      catch (error) {
        step.status = 'failed'; step.observation = error instanceof Error ? error.message : String(error); run.observations.push(`Failure: ${step.observation}`); run.status = 'failed';
        run.completedAt = new Date().toISOString();
        publish('agent.run.failed', { runId: run.id, error: step.observation }).catch(() => undefined);
        break;
      }
    }
    if (run.steps.every((step) => step.status === 'completed')) {
      run.status = 'completed'; run.completedAt = new Date().toISOString();
      publish('agent.run.completed', { runId: run.id }).catch(() => undefined);
    }
    run.updatedAt = new Date().toISOString(); return run;
  });
}

export async function replanAgentRun(id: string, mode: 'auto' | 'ai' | 'deterministic' = 'auto') {
  const snapshot = await getAgentRun(id); if (!snapshot) throw new Error('Agent run not found.');
  if (snapshot.replanCount >= 3) throw new Error('Re-plan limit reached.');
  const remaining = snapshot.steps.filter((step) => step.status !== 'completed').map((step) => step.toolId);
  const plan = await createAgentPlan({ goal: snapshot.goal, requestedTools: remaining, observations: snapshot.observations, mode });
  return mutate((store) => {
    const run = store.runs[id]; if (!run) throw new Error('Agent run not found.');
    const completed = run.steps.filter((step) => step.status === 'completed');
    run.steps = [...completed, ...planSteps(plan, Math.max(0, run.maxSteps - completed.length))].map((step, index) => ({ ...step, index }));
    run.planner = plan.planner; run.plannerSummary = plan.summary; run.plannerFallbackReason = plan.fallbackReason; run.replanCount += 1; run.status = 'planned'; run.updatedAt = new Date().toISOString(); return run;
  });
}

export async function approveAgentRunStep(runId: string, input: { stepId: string; fingerprint: string; signature?: string; phrase: string }) {
  const run = await mutate(async (store) => {
    if (store.emergencyStop) throw new Error('Agent runtime emergency stop is active.');
    const current = store.runs[runId]; if (!current) throw new Error('Agent run not found.');
    const step = current.steps.find((item) => item.id === input.stepId); if (!step || step.status !== 'waiting_approval') throw new Error('Step is not waiting for approval.');
    const signature = input.signature || step.approvalSignature || '';
    if (input.phrase !== 'APPROVE AGENT STEP' || step.approvalFingerprint !== input.fingerprint || !verifyRecord({ runId, stepId: step.id, fingerprint: step.approvalFingerprint }, signature)) throw new Error('Approval does not match the signed reviewed step.');
    await executeStep(current, step);
    current.status = current.steps.every((item) => item.status === 'completed') ? 'completed' : 'running';
    current.completedAt = current.status === 'completed' ? new Date().toISOString() : undefined;
    current.updatedAt = new Date().toISOString();
    if (current.status === 'completed') {
      publish('agent.run.completed', { runId: current.id }).catch(() => undefined);
    }
    return current;
  });
  await appendAuditEvent({ actor: 'founder', workspace: 'agent-runtime', action: 'step.approved', target: input.stepId, risk: 'MEDIUM', status: 'approved', summary: `Approved signed step for ${runId}.`, evidence: { runId, fingerprint: input.fingerprint } }); return run;
}

export async function stopAgentRun(id: string, reason: string) { return mutate((store) => { const run = store.runs[id]; if (!run) throw new Error('Agent run not found.'); run.status = 'stopped'; run.stoppedReason = reason; run.completedAt = new Date().toISOString(); run.updatedAt = run.completedAt; run.steps.filter((step) => ['queued', 'running', 'waiting_approval'].includes(step.status)).forEach((step) => { step.status = 'stopped'; }); return run; }); }
export async function setAgentRuntimeEmergencyStop(active: boolean, reason?: string) { return mutate((store) => { store.emergencyStop = active; store.stopReason = active ? reason || 'Founder emergency stop.' : undefined; if (active) Object.values(store.runs).filter((run) => ['planned', 'running', 'waiting_approval'].includes(run.status)).forEach((run) => { run.status = 'stopped'; run.stoppedReason = store.stopReason; run.completedAt = new Date().toISOString(); run.updatedAt = run.completedAt; run.steps.filter((step) => ['queued', 'running', 'waiting_approval'].includes(step.status)).forEach((step) => { step.status = 'stopped'; }); }); return { emergencyStop: store.emergencyStop, reason: store.stopReason }; }); }
export async function listAgentRuns(limit = 50) { await writeQueue.catch(() => undefined); const store = await readStoreUnsafe(); return { emergencyStop: store.emergencyStop, stopReason: store.stopReason, encrypted: true, runs: Object.values(store.runs).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, Math.max(1, Math.min(limit, 200))) }; }
export async function getAgentRun(id: string) { await writeQueue.catch(() => undefined); return (await readStoreUnsafe()).runs[id] || null; }
export async function getAgentRuntimeMetrics() { const { runs, emergencyStop } = await listAgentRuns(200); const steps = runs.flatMap((run) => run.steps); const completedDurations = steps.filter((step) => step.startedAt && step.completedAt).map((step) => Date.parse(step.completedAt!) - Date.parse(step.startedAt!)); return { emergencyStop, totalRuns: runs.length, activeRuns: runs.filter((run) => ['planned', 'running', 'waiting_approval'].includes(run.status)).length, waitingApproval: runs.filter((run) => run.status === 'waiting_approval').length, completedRuns: runs.filter((run) => run.status === 'completed').length, failedRuns: runs.filter((run) => run.status === 'failed').length, artifactCount: runs.reduce((sum, run) => sum + run.artifacts.length, 0), averageStepLatencyMs: completedDurations.length ? Math.round(completedDurations.reduce((a, b) => a + b, 0) / completedDurations.length) : 0, aiPlannedRuns: runs.filter((run) => run.planner === 'ai').length, fallbackPlannedRuns: runs.filter((run) => Boolean(run.plannerFallbackReason)).length };
}

