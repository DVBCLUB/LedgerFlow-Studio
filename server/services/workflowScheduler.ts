/**
 * workflowScheduler.ts
 * ============================================================
 * AI Workflow Scheduler — lập lịch chạy agent pipeline
 * với cron expression + dependency chains giữa các task.
 *
 * Workflow = DAG các step, mỗi step là 1 agentic task.
 * Scheduler chạy các workflow theo cron hoặc manual trigger.
 */
import { randomUUID } from 'node:crypto';
import { dispatchTextThroughFabric } from './aiFabric';
import { appendAuditEvent } from './auditLog';
import { recordUsage } from './costObservability';
import fs from 'fs';
import path from 'path';

// ─── Types ──────────────────────────────────────────────────────────
export type WorkflowStepType = 'agent_task' | 'condition' | 'delay' | 'notify' | 'parallel';

export interface WorkflowStep {
  id: string;
  name: string;
  type: WorkflowStepType;
  goal?: string;
  domain?: string;
  condition?: string;
  delayMs?: number;
  notifyMessage?: string;
  dependsOn: string[];
  onSuccess?: string[];     // Next step IDs if success
  onFailure?: string[];     // Next step IDs if failed
  retries: number;
  timeoutMs: number;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  cronExpression?: string;  // Cron for auto-schedule
  enabled: boolean;
  maxRetries: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  lastRunStatus?: string;
}

export interface WorkflowStepResult {
  stepId: string;
  stepName: string;
  status: 'completed' | 'failed' | 'skipped' | 'timed_out';
  output: string;
  latencyMs: number;
  error?: string;
  retriesUsed: number;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  stepResults: WorkflowStepResult[];
  startedAt: string;
  completedAt?: string;
  totalLatencyMs: number;
  trigger: 'manual' | 'cron' | 'webhook';
  log: string[];
}

// ─── Storage ────────────────────────────────────────────────────────
const WF_FILE = path.join(process.cwd(), 'workflows.json');
const EXEC_FILE = path.join(process.cwd(), 'workflow_executions.json');

let workflows: WorkflowDefinition[] = [];
let executions: WorkflowExecution[] = [];
const cronTimers = new Map<string, ReturnType<typeof setInterval>>();

async function loadAll(): Promise<void> {
  try {
    if (fs.existsSync(WF_FILE)) workflows = JSON.parse(await fs.promises.readFile(WF_FILE, 'utf8'));
    if (fs.existsSync(EXEC_FILE)) executions = JSON.parse(await fs.promises.readFile(EXEC_FILE, 'utf8'));
  } catch { }
}
loadAll().catch(() => undefined);

async function saveWorkflows(): Promise<void> {
  await fs.promises.writeFile(WF_FILE, JSON.stringify(workflows, null, 2), 'utf8');
}
async function saveExecutions(): Promise<void> {
  await fs.promises.writeFile(EXEC_FILE, JSON.stringify(executions.slice(-100), null, 2), 'utf8');
}

// ─── Workflow CRUD ──────────────────────────────────────────────────

export function createWorkflow(input: {
  name: string; description?: string; steps?: WorkflowStep[];
  cronExpression?: string; tags?: string[];
}): WorkflowDefinition {
  const wf: WorkflowDefinition = {
    id: `wf_${Date.now()}_${randomUUID().slice(0, 6)}`,
    name: input.name.slice(0, 100),
    description: input.description || '',
    steps: input.steps || [],
    cronExpression: input.cronExpression,
    enabled: true,
    maxRetries: 3,
    tags: input.tags || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  workflows.push(wf);
  saveWorkflows().catch(() => undefined);

  // Auto-schedule if cron provided
  if (wf.cronExpression && wf.enabled) startCronScheduler(wf);

  return wf;
}

export function addStep(workflowId: string, step: Omit<WorkflowStep, 'id'>): WorkflowStep | undefined {
  const wf = workflows.find(w => w.id === workflowId);
  if (!wf) return undefined;
  const newStep: WorkflowStep = { ...step, id: `wstep_${Date.now()}_${randomUUID().slice(0, 4)}` };
  wf.steps.push(newStep);
  wf.updatedAt = new Date().toISOString();
  saveWorkflows().catch(() => undefined);
  return newStep;
}

export function updateStep(workflowId: string, stepId: string, patch: Partial<WorkflowStep>): boolean {
  const wf = workflows.find(w => w.id === workflowId);
  if (!wf) return false;
  const idx = wf.steps.findIndex(s => s.id === stepId);
  if (idx < 0) return false;
  wf.steps[idx] = { ...wf.steps[idx], ...patch };
  wf.updatedAt = new Date().toISOString();
  saveWorkflows().catch(() => undefined);
  return true;
}

export function deleteStep(workflowId: string, stepId: string): boolean {
  const wf = workflows.find(w => w.id === workflowId);
  if (!wf) return false;
  wf.steps = wf.steps.filter(s => s.id !== stepId);
  for (const s of wf.steps) {
    s.dependsOn = s.dependsOn.filter(d => d !== stepId);
    s.onSuccess = s.onSuccess?.filter(d => d !== stepId);
    s.onFailure = s.onFailure?.filter(d => d !== stepId);
  }
  wf.updatedAt = new Date().toISOString();
  saveWorkflows().catch(() => undefined);
  return true;
}

export function getWorkflow(id: string): WorkflowDefinition | undefined { return workflows.find(w => w.id === id); }
export function listWorkflows(): WorkflowDefinition[] { return [...workflows]; }
export function deleteWorkflow(id: string): boolean {
  stopCronScheduler(id);
  const idx = workflows.findIndex(w => w.id === id);
  if (idx < 0) return false;
  workflows.splice(idx, 1);
  saveWorkflows().catch(() => undefined);
  return true;
}

export function toggleWorkflow(id: string, enabled: boolean): boolean {
  const wf = workflows.find(w => w.id === id);
  if (!wf) return false;
  wf.enabled = enabled;
  if (enabled && wf.cronExpression) startCronScheduler(wf);
  else stopCronScheduler(id);
  saveWorkflows().catch(() => undefined);
  return true;
}

// ─── Workflow Execution ─────────────────────────────────────────────

export async function executeWorkflow(workflowId: string, trigger: WorkflowExecution['trigger'] = 'manual'): Promise<WorkflowExecution> {
  const wf = workflows.find(w => w.id === workflowId);
  if (!wf) throw new Error(`Workflow "${workflowId}" not found.`);

  const execId = `exec_${Date.now()}_${randomUUID().slice(0, 6)}`;
  const started = Date.now();
  const exec: WorkflowExecution = {
    id: execId, workflowId: wf.id, workflowName: wf.name,
    status: 'running', stepResults: [],
    startedAt: new Date().toISOString(), totalLatencyMs: 0,
    trigger, log: [],
  };

  exec.log.push(`Starting workflow "${wf.name}" (${wf.steps.length} steps, trigger: ${trigger})`);

  const completed = new Set<string>();
  const outputMap = new Map<string, string>();

  try {
    while (completed.size < wf.steps.length) {
      const ready = wf.steps.filter(s =>
        !completed.has(s.id) &&
        s.dependsOn.every(d => completed.has(d))
      );

      if (ready.length === 0) { exec.log.push('WARNING: deadlock detected.'); break; }

      // Execute parallel steps concurrently
      const parallel = ready.filter(s => s.type === 'parallel');
      const sequential = ready.filter(s => s.type !== 'parallel');

      // Run parallel steps
      if (parallel.length > 0) {
        exec.log.push(`Parallel: ${parallel.length} steps`);
        const results = await Promise.all(parallel.map(s => executeWorkflowStep(s, wf, outputMap)));
        for (const r of results) {
          exec.stepResults.push(r);
          outputMap.set(r.stepId, r.output);
          completed.add(r.stepId);
          exec.log.push(`  [${r.status}] ${r.stepName} (${r.latencyMs}ms)`);
        }
      }

      // Run sequential steps
      for (const step of sequential) {
        const result = await executeWorkflowStep(step, wf, outputMap);
        exec.stepResults.push(result);
        outputMap.set(result.stepId, result.output);
        completed.add(result.stepId);
        exec.log.push(`[${result.status}] ${result.stepName} (${result.latencyMs}ms)`);

        if (result.status === 'failed' && step.onFailure?.length) {
          exec.log.push(`  → Following onFailure path: ${step.onFailure.join(', ')}`);
        } else if (result.status === 'completed' && step.onSuccess?.length) {
          exec.log.push(`  → Following onSuccess path: ${step.onSuccess.join(', ')}`);
        }

        if (step.type === 'delay' && step.delayMs) {
          await new Promise(r => setTimeout(r, Math.min(step.delayMs, 60000)));
        }
      }
    }

    exec.status = exec.stepResults.every(r => r.status === 'completed' || r.status === 'skipped')
      ? 'completed' : 'failed';
    exec.log.push(`Workflow ${exec.status}: ${exec.stepResults.filter(r => r.status === 'completed').length}/${wf.steps.length} steps OK`);
  } catch (err: any) {
    exec.status = 'failed';
    exec.log.push(`CRASH: ${err.message}`);
  } finally {
    exec.totalLatencyMs = Date.now() - started;
    exec.completedAt = new Date().toISOString();
    executions.push(exec);

    // Update workflow last run
    wf.lastRunAt = exec.completedAt;
    wf.lastRunStatus = exec.status;
    saveWorkflows().catch(() => undefined);
    saveExecutions().catch(() => undefined);

    await appendAuditEvent({
      actor: 'system', workspace: 'Workflow Scheduler', action: 'workflow.execute',
      target: wf.name, risk: exec.status === 'failed' ? 'MEDIUM' : 'LOW',
      status: exec.status === 'completed' ? 'executed' : 'failed',
      summary: `Workflow "${wf.name}": ${exec.status} in ${exec.totalLatencyMs}ms`,
      connectorId: 'workflow-scheduler',
      evidence: { workflowId, trigger, steps: wf.steps.length, results: exec.stepResults.length },
    }).catch(() => undefined);
  }

  return exec;
}

async function executeWorkflowStep(
  step: WorkflowStep,
  workflow: WorkflowDefinition,
  outputMap: Map<string, string>,
): Promise<WorkflowStepResult> {
  const start = Date.now();
  let retriesUsed = 0;

  for (let attempt = 0; attempt <= step.retries; attempt++) {
    try {
      switch (step.type) {
        case 'agent_task': {
          // Build context from dependencies
          let context = '';
          for (const depId of step.dependsOn) {
            const depOutput = outputMap.get(depId);
            if (depOutput) context += `\n[Previous step output]\n${depOutput}\n`;
          }

          const result = await dispatchTextThroughFabric(
            `${step.goal || 'Complete this task'}\n\n${context}`.trim(),
            undefined,
            { domain: (step.domain || 'general') as any, localFallback: true }
          );

          return {
            stepId: step.id, stepName: step.name,
            status: result.status === 'completed' ? 'completed' : 'failed',
            output: result.winner?.contentPreview || '',
            latencyMs: Date.now() - start, retriesUsed,
          };
        }

        case 'condition': {
          const prevOutput = outputMap.get(step.dependsOn[0]) || '';
          const cond = step.condition || '';
          const passed = prevOutput.toLowerCase().includes(cond.toLowerCase());
          return {
            stepId: step.id, stepName: step.name,
            status: passed ? 'completed' : 'skipped',
            output: passed ? 'CONDITION_TRUE' : 'CONDITION_FALSE',
            latencyMs: 0, retriesUsed: 0,
          };
        }

        case 'delay':
          return {
            stepId: step.id, stepName: step.name,
            status: 'completed', output: `Delayed ${step.delayMs || 0}ms`,
            latencyMs: 0, retriesUsed: 0,
          };

        case 'notify':
          return {
            stepId: step.id, stepName: step.name,
            status: 'completed', output: `Notify: ${step.notifyMessage || ''}`,
            latencyMs: 0, retriesUsed: 0,
          };

        default:
          return {
            stepId: step.id, stepName: step.name,
            status: 'failed', output: `Unknown step type: ${step.type}`,
            latencyMs: 0, retriesUsed: 0,
            error: `Unknown type: ${step.type}`,
          };
      }
    } catch (err: any) {
      retriesUsed = attempt + 1;
      if (attempt >= step.retries) {
        return {
          stepId: step.id, stepName: step.name,
          status: 'failed', output: err.message,
          latencyMs: Date.now() - start, retriesUsed,
          error: err.message,
        };
      }
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }

  return {
    stepId: step.id, stepName: step.name,
    status: 'failed', output: 'Max retries exceeded',
    latencyMs: Date.now() - start, retriesUsed,
    error: 'Max retries exceeded',
  };
}

// ─── Cron Scheduler ─────────────────────────────────────────────────

function startCronScheduler(wf: WorkflowDefinition): void {
  if (!wf.cronExpression || !wf.enabled) return;
  if (cronTimers.has(wf.id)) return;

  // Simple cron: parse "minute hour * * *" format
  const parts = wf.cronExpression.split(/\s+/);
  if (parts.length < 2) return;

  const minute = parts[0] === '*' ? -1 : parseInt(parts[0]);
  const hour = parts[1] === '*' ? -1 : parseInt(parts[1]);

  const check = () => {
    const now = new Date();
    if ((minute === -1 || now.getMinutes() === minute) &&
        (hour === -1 || now.getHours() === hour)) {
      executeWorkflow(wf.id, 'cron').catch(() => undefined);
    }
  };

  const timer = setInterval(check, 60000); // Check every minute
  cronTimers.set(wf.id, timer);
  console.log(`[Workflow Scheduler] Cron started for "${wf.name}" (${wf.cronExpression})`);
}

function stopCronScheduler(workflowId: string): void {
  const timer = cronTimers.get(workflowId);
  if (timer) { clearInterval(timer); cronTimers.delete(workflowId); }
}

export function getExecution(id: string): WorkflowExecution | undefined {
  return executions.find(e => e.id === id);
}
export function listExecutions(limit = 50): WorkflowExecution[] {
  return executions.slice(-limit).reverse();
}
export function getWorkflowStats(): { total: number; active: number; cronScheduled: number } {
  return {
    total: workflows.length,
    active: workflows.filter(w => w.enabled).length,
    cronScheduled: cronTimers.size,
  };
}
