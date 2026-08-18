/**
 * aiSmartTaskQueue.ts
 * ============================================================
 * INTELLIGENT AI TASK QUEUE WITH PRIORITY SCORING
 *
 * Implements a prioritized task queue for specialized AI employee roles.
 * Prioritizes tasks based on:
 *   Priority Score = (Urgency * 0.4) + (Business_Impact * 0.3) + (Deadline_Proximity * 0.3)
 */

import { recordAIAction } from './aiActionLedger.ts';

export type TaskStatus = 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface SmartTask {
  taskId: string;
  title: string;
  assignedRoleId: string;
  urgency: number; // 1 - 10
  businessImpact: number; // 1 - 10
  deadlineAt?: string; // ISO string
  priorityScore: number; // 0 - 100
  status: TaskStatus;
  payload?: Record<string, unknown>;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

const TASK_QUEUE: SmartTask[] = [];

/**
 * Calculate dynamic priority score
 */
export function computePriorityScore(
  urgency: number,
  businessImpact: number,
  deadlineAt?: string,
  nowMs: number = Date.now()
): number {
  const clampedUrgency = Math.max(1, Math.min(10, urgency));
  const clampedImpact = Math.max(1, Math.min(10, businessImpact));

  let deadlineScore = 30; // Default baseline if no deadline
  if (deadlineAt) {
    const diffHours = (new Date(deadlineAt).getTime() - nowMs) / (1000 * 60 * 60);
    if (diffHours <= 0) {
      deadlineScore = 100; // Overdue / immediate
    } else if (diffHours <= 12) {
      deadlineScore = 95;
    } else if (diffHours <= 24) {
      deadlineScore = 80;
    } else if (diffHours <= 48) {
      deadlineScore = 60;
    } else if (diffHours <= 168) {
      // 1 week
      deadlineScore = 40;
    } else {
      deadlineScore = 20;
    }
  }

  const score = clampedUrgency * 10 * 0.4 + clampedImpact * 10 * 0.3 + deadlineScore * 0.3;
  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Add a task to the smart queue and position it by priority
 */
export function enqueueTask(params: {
  title: string;
  assignedRoleId: string;
  urgency: number;
  businessImpact: number;
  deadlineAt?: string;
  payload?: Record<string, unknown>;
}): SmartTask {
  const now = new Date();
  const taskId = `tsk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const priorityScore = computePriorityScore(params.urgency, params.businessImpact, params.deadlineAt, now.getTime());

  const task: SmartTask = {
    taskId,
    title: params.title,
    assignedRoleId: params.assignedRoleId,
    urgency: params.urgency,
    businessImpact: params.businessImpact,
    deadlineAt: params.deadlineAt,
    priorityScore,
    status: 'QUEUED',
    payload: params.payload,
    createdAt: now.toISOString(),
  };

  TASK_QUEUE.push(task);
  reprioritizeQueue();

  recordAIAction({
    agentId: 'smart_task_queue_dispatcher',
    roleId: params.assignedRoleId,
    domain: 'software_core',
    actionType: 'SMART_TASK_ENQUEUED',
    targetResource: taskId,
    outputSummary: `Đã xếp hàng task "${params.title}" (Priority Score: ${priorityScore}/100) cho ${params.assignedRoleId}.`,
    permissionCheckPassed: true,
    constitutionalRulePassed: true,
  });

  return task;
}

/**
 * Re-sort the queue so highest priority score comes first
 */
export function reprioritizeQueue(): void {
  const nowMs = Date.now();
  for (const t of TASK_QUEUE) {
    if (t.status === 'QUEUED') {
      t.priorityScore = computePriorityScore(t.urgency, t.businessImpact, t.deadlineAt, nowMs);
    }
  }

  TASK_QUEUE.sort((a, b) => {
    // Queued items come before non-queued
    if (a.status === 'QUEUED' && b.status !== 'QUEUED') return -1;
    if (a.status !== 'QUEUED' && b.status === 'QUEUED') return 1;
    return b.priorityScore - a.priorityScore;
  });
}

/**
 * Dequeue the highest priority task for a specific AI role
 */
export function dequeueNextTaskForRole(roleId: string): SmartTask | null {
  reprioritizeQueue();
  const task = TASK_QUEUE.find((t) => t.assignedRoleId === roleId && t.status === 'QUEUED');
  if (!task) return null;

  task.status = 'IN_PROGRESS';
  task.startedAt = new Date().toISOString();

  recordAIAction({
    agentId: `worker_${roleId}`,
    roleId,
    domain: 'software_core',
    actionType: 'SMART_TASK_DEQUEUED',
    targetResource: task.taskId,
    outputSummary: `${roleId} đã nhận task ưu tiên cao nhất: "${task.title}" (${task.priorityScore}/100).`,
    permissionCheckPassed: true,
    constitutionalRulePassed: true,
  });

  return task;
}

/**
 * Mark task completed
 */
export function completeSmartTask(taskId: string, outputSummary: string): SmartTask {
  const task = TASK_QUEUE.find((t) => t.taskId === taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);

  task.status = 'COMPLETED';
  task.completedAt = new Date().toISOString();

  recordAIAction({
    agentId: `worker_${task.assignedRoleId}`,
    roleId: task.assignedRoleId,
    domain: 'software_core',
    actionType: 'SMART_TASK_COMPLETED',
    targetResource: taskId,
    outputSummary: `Đã hoàn thành task "${task.title}": ${outputSummary}`,
    permissionCheckPassed: true,
    constitutionalRulePassed: true,
  });

  return task;
}

/**
 * Get current snapshot of the task queue
 */
export function getQueueSnapshot(): {
  totalCount: number;
  queuedCount: number;
  inProgressCount: number;
  completedCount: number;
  tasks: SmartTask[];
} {
  reprioritizeQueue();
  return {
    totalCount: TASK_QUEUE.length,
    queuedCount: TASK_QUEUE.filter((t) => t.status === 'QUEUED').length,
    inProgressCount: TASK_QUEUE.filter((t) => t.status === 'IN_PROGRESS').length,
    completedCount: TASK_QUEUE.filter((t) => t.status === 'COMPLETED').length,
    tasks: [...TASK_QUEUE],
  };
}

/**
 * Reset queue for tests
 */
export function __resetTaskQueueForTesting(): void {
  TASK_QUEUE.length = 0;
}
