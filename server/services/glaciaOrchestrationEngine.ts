/**
 * glaciaOrchestrationEngine.ts
 * ============================================================
 * UNIFIED AI ORCHESTRATION ENGINE — World-Class Robot Brain
 * ------------------------------------------------------------
 * Single entry point that routes ALL Glacia capabilities:
 *  - Skill Compiler ($0 Token Local Runtime)
 *  - Computer Vision (Doubao Vision)
 *  - Web Research & Self-Healing Code
 *  - Swarm Shift Scheduler (24/7 Autonomous)
 *  - Telegram Remote Control
 *  - Multi-Model AI Gateway
 *  - Auto-Programming Agent
 * ============================================================
 */

import fs from 'fs';
import path from 'path';
import { recordAIAction } from './aiActionLedger.ts';
import { validateActionPermission } from './glaciaAutonomyGate.ts';

// ─── State Machine Types ─────────────────────────────────────
export type TaskType =
  | 'skill_execute'
  | 'vision_analyze'
  | 'web_research'
  | 'self_heal'
  | 'swarm_shift'
  | 'telegram_command'
  | 'multi_model_reason'
  | 'auto_program'
  | 'blender_render'
  | 'video_generate'
  | 'banner_design';

export type TaskPriority = 'critical' | 'high' | 'normal' | 'low';
export type TaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface OrchestrationTask {
  id: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  payload: Record<string, unknown>;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
  /** Number of retries attempted so far */
  retryCount?: number;
  /** Maximum retries allowed before giving up */
  maxRetries?: number;
}

export interface OrchestrationMetrics {
  totalTasksExecuted: number;
  successRate: number;
  avgLatencyMs: number;
  tasksByType: Record<TaskType, number>;
  uptimeHours: number;
  activeTasks: number;
  queueDepth: number;
  lastRunAt: string;
}

// ─── Persistence ──────────────────────────────────────────────
const RUNTIME_DIR = path.resolve(process.cwd(), 'runtime');
const QUEUE_FILE = path.join(RUNTIME_DIR, 'glacia_queue.json');
const HISTORY_FILE = path.join(RUNTIME_DIR, 'glacia_history.json');
const STATE_FILE = path.join(RUNTIME_DIR, 'glacia_state.json');

function ensureRuntimeDir(): void {
  if (!fs.existsSync(RUNTIME_DIR)) {
    fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  }
}

function loadFromDisk<T>(filePath: string, fallback: T): T {
  try {
    ensureRuntimeDir();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw) as T;
    }
  } catch (err) {
    console.warn(`[Orchestration] Failed to load ${filePath}:`, err);
  }
  return fallback;
}

function saveToDisk(filePath: string, data: unknown): void {
  try {
    ensureRuntimeDir();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`[Orchestration] Failed to save ${filePath}:`, err);
  }
}

// ─── In-Memory Task Queue ────────────────────────────────────
let taskQueue: OrchestrationTask[] = loadFromDisk<OrchestrationTask[]>(QUEUE_FILE, []);
let completedTasks: OrchestrationTask[] = loadFromDisk<OrchestrationTask[]>(HISTORY_FILE, []);
const MAX_COMPLETED = 200;
let taskCounter = loadFromDisk<number>(STATE_FILE, 0);
let startTime = Date.now();

/**
 * Maps implementation task names to the autonomy policy vocabulary. Keeping
 * this here makes every execution path (single, parallel and DAG) pass the
 * same permission checkpoint before a tool is invoked.
 */
const AUTONOMY_ACTION_BY_TASK: Record<TaskType, string> = {
  skill_execute: 'skill_execute',
  vision_analyze: 'vision_analyze',
  web_research: 'web_research',
  self_heal: 'self_heal_code',
  swarm_shift: 'swarm_shift',
  telegram_command: 'telegram_command',
  multi_model_reason: 'chat',
  auto_program: 'auto_program',
  blender_render: 'blender_render',
  video_generate: 'video_generate',
  banner_design: 'banner_design',
};

function recordTaskAudit(task: OrchestrationTask, permissionCheckPassed: boolean, outputSummary: string, latencyMs = 0): void {
  const entry = recordAIAction({
    agentId: 'glacia-orchestrator',
    roleId: 'glacia-executive-robot',
    domain: 'glacia_orchestration',
    actionType: task.type,
    targetResource: task.id,
    inputPayload: task.payload,
    outputSummary,
    permissionCheckPassed,
    constitutionalRulePassed: permissionCheckPassed,
    latencyMs,
    metadata: { priority: task.priority, retryCount: task.retryCount || 0 },
  });
  task.metadata = { ...task.metadata, actionLedgerEntryId: entry.entryId };
}

// Auto-save debounce
let saveTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSave(): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveToDisk(QUEUE_FILE, taskQueue);
    saveToDisk(HISTORY_FILE, completedTasks);
    saveToDisk(STATE_FILE, taskCounter);
  }, 2000);
}

// ─── Priority Sorting ────────────────────────────────────────
const PRIORITY_ORDER: Record<TaskPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
};

function sortByPriority(tasks: OrchestrationTask[]): OrchestrationTask[] {
  return [...tasks].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}

// ─── Core Orchestration ──────────────────────────────────────

export function createTask(
  type: TaskType,
  payload: Record<string, unknown>,
  priority: TaskPriority = 'normal'
): OrchestrationTask {
  const task: OrchestrationTask = {
    id: `glacia-task-${++taskCounter}-${Date.now()}`,
    type,
    priority,
    status: 'queued',
    payload,
    createdAt: new Date().toISOString(),
  };
  taskQueue.push(task);
  scheduleSave();
  return task;
}

export function dequeueNextTask(): OrchestrationTask | null {
  if (taskQueue.length === 0) return null;
  const sorted = sortByPriority(taskQueue);
  const task = sorted[0];
  task.status = 'running';
  task.startedAt = new Date().toISOString();
  const idx = taskQueue.findIndex((t) => t.id === task.id);
  if (idx !== -1) taskQueue.splice(idx, 1);
  return task;
}

export function completeTask(taskId: string, result: unknown): void {
  const task = findTask(taskId);
  if (!task) return;
  // A cancellation is terminal. A late tool response must never resurrect it.
  if (task.status === 'cancelled') return;
  task.status = 'completed';
  task.completedAt = new Date().toISOString();
  task.result = result;
  completedTasks.unshift(task);
  if (completedTasks.length > MAX_COMPLETED) completedTasks.pop();
  scheduleSave();
}

export function failTask(taskId: string, error: string): void {
  const task = findTask(taskId);
  if (!task) return;
  if (task.status === 'cancelled') return;
  task.status = 'failed';
  task.completedAt = new Date().toISOString();
  task.error = error;
  completedTasks.unshift(task);
  if (completedTasks.length > MAX_COMPLETED) completedTasks.pop();
  scheduleSave();
}

export function findTask(taskId: string): OrchestrationTask | undefined {
  return taskQueue.find((t) => t.id === taskId) || completedTasks.find((t) => t.id === taskId);
}

export function getQueuedTasks(): OrchestrationTask[] {
  return sortByPriority(taskQueue);
}

export function getCompletedTasks(limit = 50): OrchestrationTask[] {
  return completedTasks.slice(0, limit);
}

export function getOrchestrationMetrics(): OrchestrationMetrics {
  const allDone = completedTasks.filter((t) => t.status === 'completed' || t.status === 'failed');
  const succeeded = completedTasks.filter((t) => t.status === 'completed').length;
  const totalLatency = completedTasks.reduce((acc, t) => {
    if (t.startedAt && t.completedAt) {
      return acc + (new Date(t.completedAt).getTime() - new Date(t.startedAt).getTime());
    }
    return acc;
  }, 0);

  const tasksByType = {} as Record<TaskType, number>;
  for (const t of completedTasks) {
    tasksByType[t.type] = (tasksByType[t.type] || 0) + 1;
  }

  return {
    totalTasksExecuted: completedTasks.length,
    successRate: allDone.length > 0 ? Math.round((succeeded / allDone.length) * 100) : 100,
    avgLatencyMs: succeeded > 0 ? Math.round(totalLatency / succeeded) : 0,
    tasksByType,
    activeTasks: taskQueue.length,
    queueDepth: taskQueue.length,
    lastRunAt: completedTasks[0]?.completedAt || new Date().toISOString(),
    uptimeHours: Math.round((Date.now() - startTime) / 3600000 * 100) / 100,
  };
}

export async function autoRouteTask(task: OrchestrationTask): Promise<unknown> {
  switch (task.type) {
    case 'skill_execute': {
      const { executeGlaciaSkill } = await import('./glaciaSkillCompiler.ts');
      return executeGlaciaSkill(
        task.payload.skillId as string,
        task.payload.params as Record<string, unknown> | undefined
      );
    }
    case 'vision_analyze': {
      const { analyzeImageWithGlaciaVision, appendVisionHistory } = await import('./glaciaVisionEngine.ts');
      const result = await analyzeImageWithGlaciaVision(task.payload as any);
      appendVisionHistory(result);
      return result;
    }
    case 'web_research': {
      const { performGlaciaWebResearch } = await import('./glaciaWebResearcher.ts');
      return performGlaciaWebResearch(task.payload as any);
    }
    case 'self_heal': {
      const { executeGlaciaSelfHealing } = await import('./glaciaWebResearcher.ts');
      return executeGlaciaSelfHealing(task.payload as any);
    }
    case 'swarm_shift': {
      const { executeNightShiftAutonomousCycle } = await import('./glaciaShiftScheduler.ts');
      return executeNightShiftAutonomousCycle();
    }
    case 'telegram_command': {
      const { sendTelegramNotification } = await import('./telegramBot.ts');
      await sendTelegramNotification(
        (task.payload.message as string) || 'Glacia orchestration task completed.'
      );
      return { notified: true };
    }
    case 'multi_model_reason': {
      const { callAI } = await import('./aiClient.ts');
      const messages = task.payload.messages as any[];
      const options = task.payload.options as any;
      return callAI(messages, options);
    }
    case 'auto_program': {
      const { callAI } = await import('./aiClient.ts');
      const spec = task.payload.spec as string;
      const language = (task.payload.language as string) || 'typescript';
      const result = await callAI(
        [
          {
            role: 'system',
            content: `You are Glacia Auto-Programmer. Generate production-ready ${language} code. Include types, error handling, and comments.`,
          },
          { role: 'user', content: spec },
        ],
        { model: 'ai-assistant', temperature: 0.2 }
      );
      return { code: result };
    }
    case 'blender_render': {
      const { executeGlaciaBlenderRender } = await import('./glaciaBlenderConnector.ts');
      return executeGlaciaBlenderRender(task.payload as any);
    }
    case 'video_generate': {
      const { generateGlaciaVideo } = await import('./glaciaVideoFactory.ts');
      return generateGlaciaVideo(task.payload as any);
    }
    case 'banner_design': {
      const { generateGlaciaBanner } = await import('./glaciaDesignEngine.ts');
      return generateGlaciaBanner(task.payload as any);
    }
    default:
      throw new Error(`Unknown task type: ${task.type}`);
  }
}

export async function executeTask(
  type: TaskType,
  payload: Record<string, unknown>,
  priority: TaskPriority = 'normal',
  maxRetries: number = 2
): Promise<OrchestrationTask> {
  const task = createTask(type, payload, priority);
  task.maxRetries = maxRetries;
  task.retryCount = 0;

  // A robot must be able to explain why it did not act. The denied task is
  // retained in history and cryptographically logged instead of disappearing.
  const permission = validateActionPermission(AUTONOMY_ACTION_BY_TASK[type]);
  task.metadata = {
    ...task.metadata,
    autonomy: {
      allowed: permission.allowed,
      currentLevel: permission.currentLevel,
      requiredLevel: permission.requiredLevel,
      reason: permission.reason,
    },
  };
  if (!permission.allowed) {
    failTask(task.id, `Autonomy gate denied: ${permission.reason}`);
    const deniedTask = findTask(task.id)!;
    recordTaskAudit(deniedTask, false, `Blocked before tool invocation: ${permission.reason}`);
    scheduleSave();
    return deniedTask;
  }

  while (task.retryCount <= maxRetries) {
    const attemptStartedAt = Date.now();
    try {
      task.status = 'running';
      task.startedAt = new Date().toISOString();
      scheduleSave();
      const result = await autoRouteTask(task);
      completeTask(task.id, result);
      const finalTask = findTask(task.id)!;
      const wasCancelled = finalTask.status === 'cancelled';
      recordTaskAudit(finalTask, !wasCancelled, wasCancelled ? `Cancelled while ${type} was running; late tool response ignored.` : `Completed ${type} safely.`, Date.now() - attemptStartedAt);
      return finalTask;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (task.retryCount < maxRetries) {
        task.retryCount!++;
        console.warn(
          `[Orchestration] Retry ${task.retryCount}/${maxRetries} for task ${task.id} (${type}): ${msg}`
        );
        // Exponential backoff: 1s, 2s, 4s
        const delay = 1000 * Math.pow(2, task.retryCount - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
        scheduleSave();
        continue;
      }
      failTask(task.id, msg);
      const failedTask = findTask(task.id)!;
      recordTaskAudit(failedTask, true, `Execution failed without completing action: ${msg.slice(0, 240)}`, Date.now() - attemptStartedAt);
    }
  }
  return findTask(task.id)!;
}

export async function executeParallel(
  tasks: Array<{ type: TaskType; payload: Record<string, unknown>; priority?: TaskPriority }>
): Promise<OrchestrationTask[]> {
  const results = await Promise.allSettled(
    tasks.map((t) => executeTask(t.type, t.payload, t.priority))
  );
  return results.map((r) =>
    r.status === 'fulfilled' ? r.value : null!
  ).filter(Boolean);
}

export async function executeChain(
  chain: Array<{ type: TaskType; payloadTransform: (prevResult: unknown) => Record<string, unknown>; priority?: TaskPriority }>
): Promise<OrchestrationTask[]> {
  const results: OrchestrationTask[] = [];
  let prevResult: unknown = null;
  for (const step of chain) {
    const payload = prevResult !== null ? step.payloadTransform(prevResult) : {};
    const task = await executeTask(step.type, payload, step.priority);
    results.push(task);
    prevResult = task.result;
  }
  return results;
}

export function resetOrchestration(): void {
  taskQueue.length = 0;
  completedTasks.length = 0;
  taskCounter = 0;
  startTime = Date.now();
  // Persist the reset state immediately
  saveToDisk(QUEUE_FILE, taskQueue);
  saveToDisk(HISTORY_FILE, completedTasks);
  saveToDisk(STATE_FILE, taskCounter);
}

export interface DAGNode {
  id: string;
  type: TaskType;
  payload: Record<string, unknown>;
  priority?: TaskPriority;
  dependsOn?: string[]; // IDs of preceding nodes that must complete successfully
}

export interface DAGWorkflowResult {
  workflowId: string;
  success: boolean;
  totalDurationMs: number;
  nodeResults: Record<string, OrchestrationTask>;
  error?: string;
}

export async function executeWorkflowDAG(
  workflowId: string,
  nodes: DAGNode[]
): Promise<DAGWorkflowResult> {
  const startTime = Date.now();
  const nodeResults: Record<string, OrchestrationTask> = {};
  const completedNodeIds = new Set<string>();
  const pendingNodes = new Map<string, DAGNode>(nodes.map((n) => [n.id, n]));

  while (pendingNodes.size > 0) {
    // Find all nodes whose dependencies are satisfied
    const readyNodes: DAGNode[] = [];
    for (const node of pendingNodes.values()) {
      const deps = node.dependsOn || [];
      const isReady = deps.every((d) => completedNodeIds.has(d));
      if (isReady) {
        readyNodes.push(node);
      }
    }

    if (readyNodes.length === 0 && pendingNodes.size > 0) {
      return {
        workflowId,
        success: false,
        totalDurationMs: Date.now() - startTime,
        nodeResults,
        error: 'Cyclic dependency or unresolvable node detected in DAG workflow.',
      };
    }

    // Execute ready nodes concurrently
    const batchPromises = readyNodes.map(async (node) => {
      pendingNodes.delete(node.id);
      // Inject previous dependency outputs into payload if needed
      const dynamicPayload = { ...node.payload };
      if (node.dependsOn && node.dependsOn.length > 0) {
        const depResults: Record<string, unknown> = {};
        for (const depId of node.dependsOn) {
          depResults[depId] = nodeResults[depId]?.result;
        }
        dynamicPayload.__dependencies = depResults;
      }

      const task = await executeTask(node.type, dynamicPayload, node.priority || 'normal');
      nodeResults[node.id] = task;
      if (task.status === 'completed') {
        completedNodeIds.add(node.id);
      }
      return task;
    });

    const batchResults = await Promise.all(batchPromises);
    const hasFailure = batchResults.some((t) => t.status === 'failed');
    if (hasFailure) {
      return {
        workflowId,
        success: false,
        totalDurationMs: Date.now() - startTime,
        nodeResults,
        error: 'One or more DAG task nodes failed to complete.',
      };
    }
  }

  return {
    workflowId,
    success: true,
    totalDurationMs: Date.now() - startTime,
    nodeResults,
  };
}

export function cancelTask(taskId: string): boolean {
  const idx = taskQueue.findIndex((t) => t.id === taskId);
  if (idx === -1) return false;
  taskQueue[idx].status = 'cancelled';
  completedTasks.unshift(taskQueue[idx]);
  taskQueue.splice(idx, 1);
  if (completedTasks.length > MAX_COMPLETED) completedTasks.pop();
  scheduleSave();
  return true;
}

