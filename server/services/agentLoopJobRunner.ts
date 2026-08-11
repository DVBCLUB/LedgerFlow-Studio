/**
 * agentLoopJobRunner.ts
 * ============================================================
 * Bridge service that enqueues agentic loop tasks into the
 * durable BackgroundJobQueue so they survive HTTP timeouts.
 *
 * Usage:
 *   const jobId = enqueueAgentLoopJob({ goal: "...", domain: "coding" });
 *   // Later:
 *   const status = getAgentLoopJobStatus(jobId);
 */
import { randomUUID } from 'node:crypto';
import { enqueue, getJob, listJobs, type BackgroundJob } from './backgroundJobQueue.ts';
import type { AgenticLoopOptions } from './agenticLoopEngine.ts';
import { appendAuditEvent } from './auditLog.ts';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AgentLoopJobPayload extends Record<string, unknown> {
  goal: string;
  domain: string;
  maxLoops: number;
  maxRepairAttempts: number;
  autoRepair: boolean;
  stopOnFirstError: boolean;
  sandboxMode?: string;
  testCommand?: string;
  systemInstruction?: string;
  requestedBy: string;
  jobCorrelationId: string;
}

export interface AgentLoopJobStatus {
  jobId: string;
  goal: string;
  status: BackgroundJob['status'];
  requestedBy: string;
  enqueuedAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: string;
  error?: string;
  retryCount: number;
  attempts: BackgroundJob['attempts'];
}

// ─── Enqueue ──────────────────────────────────────────────────────────────────

/**
 * Enqueue an agentic loop as a durable background job.
 * Returns the jobId immediately without blocking.
 * The actual loop will run in the background worker.
 */
export function enqueueAgentLoopJob(
  options: AgenticLoopOptions & { requestedBy?: string },
  jobOptions: {
    priority?: 'critical' | 'high' | 'normal' | 'low';
    maxRetries?: number;
    timeoutMs?: number;
  } = {},
): string {
  const correlationId = `alj_${Date.now()}_${randomUUID().slice(0, 8)}`;

  const payload: AgentLoopJobPayload = {
    goal: options.goal,
    domain: options.domain || 'coding',
    maxLoops: Math.min(options.maxLoops ?? 5, 10),
    maxRepairAttempts: Math.min(options.maxRepairAttempts ?? 3, 5),
    autoRepair: options.autoRepair ?? false,
    stopOnFirstError: options.stopOnFirstError ?? true,
    sandboxMode: options.sandboxMode,
    testCommand: options.testCommand,
    systemInstruction: options.systemInstruction,
    requestedBy: options.requestedBy || 'system',
    jobCorrelationId: correlationId,
  };

  const job = enqueue('agent_loop', payload, {
    priority: jobOptions.priority || 'normal',
    maxRetries: jobOptions.maxRetries ?? 1,
    retryDelayMs: 5_000,
    timeoutMs: jobOptions.timeoutMs ?? 30 * 60 * 1000, // 30 minutes default
  });

  appendAuditEvent({
    actor: payload.requestedBy,
    workspace: 'Agent Loop Runner',
    action: 'agent_loop_job.enqueued',
    target: options.goal.slice(0, 80),
    risk: 'LOW',
    status: 'executed',
    summary: `Agent loop job enqueued: ${job.id} — "${options.goal.slice(0, 60)}"`,
    connectorId: 'agent-loop-runner',
    evidence: {
      jobId: job.id,
      correlationId,
      domain: payload.domain,
      maxLoops: payload.maxLoops,
      timeoutMs: jobOptions.timeoutMs ?? 30 * 60 * 1000,
    },
  }).catch(() => undefined);

  return job.id;
}

// ─── Status ───────────────────────────────────────────────────────────────────

export function getAgentLoopJobStatus(jobId: string): AgentLoopJobStatus | undefined {
  const job = getJob(jobId);
  if (!job || job.type !== 'agent_loop') return undefined;

  const payload = job.payload as AgentLoopJobPayload;
  return {
    jobId: job.id,
    goal: payload.goal || '',
    status: job.status,
    requestedBy: payload.requestedBy || 'unknown',
    enqueuedAt: job.enqueuedAt,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    result: job.result,
    error: job.error,
    retryCount: job.retryCount,
    attempts: job.attempts,
  };
}

/**
 * List recent agent loop jobs, newest first.
 */
export function listAgentLoopJobs(options: {
  limit?: number;
  status?: BackgroundJob['status'];
} = {}): AgentLoopJobStatus[] {
  return listJobs({ type: 'agent_loop', status: options.status, limit: options.limit || 50 })
    .map((job) => {
      const payload = job.payload as AgentLoopJobPayload;
      return {
        jobId: job.id,
        goal: payload.goal || '',
        status: job.status,
        requestedBy: payload.requestedBy || 'unknown',
        enqueuedAt: job.enqueuedAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        result: job.result,
        error: job.error,
        retryCount: job.retryCount,
        attempts: job.attempts,
      };
    });
}

// ─── Summary stats ────────────────────────────────────────────────────────────

export function getAgentLoopJobStats(): {
  queued: number;
  running: number;
  completed: number;
  failed: number;
  deadLetter: number;
} {
  const all = listJobs({ type: 'agent_loop', limit: 1000 });
  return {
    queued: all.filter((j) => j.status === 'queued').length,
    running: all.filter((j) => j.status === 'running').length,
    completed: all.filter((j) => j.status === 'completed').length,
    failed: all.filter((j) => j.status === 'failed').length,
    deadLetter: all.filter((j) => j.status === 'dead_letter').length,
  };
}
