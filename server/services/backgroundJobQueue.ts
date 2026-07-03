/**
 * backgroundJobQueue.ts
 * ============================================================
 * Background Job Queue — async task processing engine
 * với priority, retry, concurrency control, dead-letter queue.
 * 
 * Dùng in-memory queue + file persistence cho durability.
 */
import { randomUUID } from 'node:crypto';
import { dispatchTextThroughFabric } from './aiFabric';
import { appendAuditEvent } from './auditLog';
import { executeScript } from './rpaEngine';
import { runRuntimeCoreMission } from './agentRuntimeCore.ts';
import fs from 'fs';
import path from 'path';

// ─── Types ──────────────────────────────────────────────────────────
export type JobType = 'ai_task' | 'rpa_script' | 'agent_loop' | 'report_generate' | 'audit' | 'refactor';

export type JobPriority = 'critical' | 'high' | 'normal' | 'low';

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'dead_letter';

export interface BackgroundJob {
  id: string;
  type: JobType;
  priority: JobPriority;
  status: JobStatus;
  payload: Record<string, unknown>;
  maxRetries: number;
  retryCount: number;
  retryDelayMs: number;
  timeoutMs: number;
  result?: string;
  error?: string;
  enqueuedAt: string;
  startedAt?: string;
  completedAt?: string;
  attempts: Array<{ at: string; status: string; durationMs: number; error?: string }>;
}

export interface QueueStats {
  queued: number;
  running: number;
  completed: number;
  failed: number;
  deadLetter: number;
  total: number;
  byPriority: Record<string, number>;
  byType: Record<string, number>;
}

// ─── Storage ────────────────────────────────────────────────────────
const QUEUE_FILE = path.join(process.cwd(), 'job_queue.json');
const JOBS_DIR = path.join(process.cwd(), 'job_results');

const MAX_CONCURRENT = 4;
const PRIORITY_WEIGHTS: Record<JobPriority, number> = { critical: 0, high: 1, normal: 2, low: 3 };

let queue: BackgroundJob[] = [];
let running = 0;
let processing = false;
let deadLetterJobs: BackgroundJob[] = [];

async function init(): Promise<void> {
  try {
    if (!fs.existsSync(JOBS_DIR)) await fs.promises.mkdir(JOBS_DIR, { recursive: true });
    if (fs.existsSync(QUEUE_FILE)) {
      const data = JSON.parse(await fs.promises.readFile(QUEUE_FILE, 'utf8'));
      queue = data.queue || [];
      deadLetterJobs = data.deadLetter || [];
      // Reset running jobs to failed if daemon restarted
      for (const job of queue) {
        if (job.status === 'running') { job.status = 'failed'; job.error = 'Daemon restarted while running.'; }
      }
    }
  } catch { }
}
init().catch(() => undefined);

async function persist(): Promise<void> {
  await fs.promises.writeFile(QUEUE_FILE, JSON.stringify({ queue: queue.slice(-500), deadLetter: deadLetterJobs.slice(-100) }, null, 2), 'utf8');
}

async function persistJobResult(job: BackgroundJob): Promise<void> {
  const file = path.join(JOBS_DIR, `${job.id}.json`);
  await fs.promises.writeFile(file, JSON.stringify(job, null, 2), 'utf8');
}

// ─── Core API ───────────────────────────────────────────────────────

export function enqueue(
  type: JobType,
  payload: Record<string, unknown>,
  options: {
    priority?: JobPriority;
    maxRetries?: number;
    retryDelayMs?: number;
    timeoutMs?: number;
  } = {}
): BackgroundJob {
  const job: BackgroundJob = {
    id: `job_${Date.now()}_${randomUUID().slice(0, 6)}`,
    type,
    priority: options.priority || 'normal',
    status: 'queued',
    payload,
    maxRetries: options.maxRetries ?? 3,
    retryCount: 0,
    retryDelayMs: options.retryDelayMs || 2000,
    timeoutMs: options.timeoutMs || 120000,
    enqueuedAt: new Date().toISOString(),
    attempts: [],
  };

  queue.push(job);
  persist().catch(() => undefined);

  // Trigger processing
  processQueue().catch(() => undefined);

  return job;
}

export function getJob(id: string): BackgroundJob | undefined {
  return queue.find(j => j.id === id) || deadLetterJobs.find(j => j.id === id);
}

export function listJobs(filter?: {
  status?: JobStatus; type?: JobType; priority?: JobPriority; limit?: number;
}): BackgroundJob[] {
  let result = [...queue];
  if (filter?.status) result = result.filter(j => j.status === filter.status);
  if (filter?.type) result = result.filter(j => j.type === filter.type);
  if (filter?.priority) result = result.filter(j => j.priority === filter.priority);
  result.sort((a, b) => new Date(b.enqueuedAt).getTime() - new Date(a.enqueuedAt).getTime());
  return result.slice(0, filter?.limit || 100);
}

export function getQueueStats(): QueueStats {
  const byPriority: Record<string, number> = {};
  const byType: Record<string, number> = {};

  for (const j of queue) {
    byPriority[j.priority] = (byPriority[j.priority] || 0) + 1;
    byType[j.type] = (byType[j.type] || 0) + 1;
  }

  return {
    queued: queue.filter(j => j.status === 'queued').length,
    running: queue.filter(j => j.status === 'running').length,
    completed: queue.filter(j => j.status === 'completed').length,
    failed: queue.filter(j => j.status === 'failed').length,
    deadLetter: deadLetterJobs.length,
    total: queue.length,
    byPriority,
    byType,
  };
}

export function retryJob(id: string): boolean {
  const job = queue.find(j => j.id === id);
  if (!job) return false;
  job.status = 'queued';
  job.retryCount = 0;
  persist().catch(() => undefined);
  processQueue().catch(() => undefined);
  return true;
}

export function purgeJob(id: string): boolean {
  const idx = queue.findIndex(j => j.id === id);
  if (idx < 0) {
    const dlIdx = deadLetterJobs.findIndex(j => j.id === id);
    if (dlIdx < 0) return false;
    deadLetterJobs.splice(dlIdx, 1);
    persist().catch(() => undefined);
    return true;
  }
  queue.splice(idx, 1);
  persist().catch(() => undefined);
  return true;
}

export function retryDeadLetter(): number {
  const count = deadLetterJobs.length;
  for (const j of deadLetterJobs) {
    j.status = 'queued';
    j.retryCount = 0;
    queue.push(j);
  }
  deadLetterJobs = [];
  persist().catch(() => undefined);
  processQueue().catch(() => undefined);
  return count;
}

// ─── Processing ─────────────────────────────────────────────────────

async function processQueue(): Promise<void> {
  if (processing) return;
  processing = true;

  try {
    while (true) {
      // Get next queued job (sort by priority first, then by enqueue time)
      const next = queue
        .filter(j => j.status === 'queued')
        .sort((a, b) => {
          const pDiff = PRIORITY_WEIGHTS[a.priority] - PRIORITY_WEIGHTS[b.priority];
          if (pDiff !== 0) return pDiff;
          return new Date(a.enqueuedAt).getTime() - new Date(b.enqueuedAt).getTime();
        })[0];

      if (!next || running >= MAX_CONCURRENT) break;

      running++;
      next.status = 'running';
      next.startedAt = new Date().toISOString();
      next.attempts.push({ at: new Date().toISOString(), status: 'running', durationMs: 0 });

      // Process asynchronously
      executeJob(next).finally(() => {
        running--;
        processQueue().catch(() => undefined);
      });
    }
  } finally {
    processing = false;
  }
}

async function executeJob(job: BackgroundJob): Promise<void> {
  const start = Date.now();
  let lastError: string | undefined;

  for (let attempt = 0; attempt <= job.maxRetries; attempt++) {
    if (attempt > 0) {
      await new Promise(r => setTimeout(r, job.retryDelayMs * attempt));
      job.retryCount = attempt;
      job.attempts.push({ at: new Date().toISOString(), status: 'retrying', durationMs: 0 });
    }

    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Job timeout')), job.timeoutMs)
      );

      const executePromise = executeJobByType(job);
      const result = await Promise.race([executePromise, timeoutPromise]);

      job.status = 'completed';
      job.result = result;
      job.completedAt = new Date().toISOString();
      job.attempts[job.attempts.length - 1] = {
        at: new Date().toISOString(), status: 'completed', durationMs: Date.now() - start,
      };

      await persistJobResult(job);
      await persist();
      return;

    } catch (err: any) {
      lastError = err.message;
      job.attempts[job.attempts.length - 1] = {
        at: new Date().toISOString(), status: 'failed', durationMs: Date.now() - start,
        error: err.message,
      };

      if (attempt < job.maxRetries) continue;

      // All retries exhausted → dead letter
      job.status = 'dead_letter';
      job.error = lastError;
      job.completedAt = new Date().toISOString();
      deadLetterJobs.push({ ...job });
      queue = queue.filter(j => j.id !== job.id);

      await appendAuditEvent({
        actor: 'system', workspace: 'Job Queue', action: 'job.dead_letter',
        target: `${job.type}: ${job.id}`, risk: 'MEDIUM', status: 'failed',
        summary: `Job ${job.id} moved to dead-letter after ${job.maxRetries + 1} attempts.`,
        connectorId: 'job-queue',
        evidence: { jobId: job.id, type: job.type, error: lastError },
      }).catch(() => undefined);

      await persist();
      return;
    }
  }
}

async function executeJobByType(job: BackgroundJob): Promise<string> {
  switch (job.type) {
    case 'ai_task': {
      const prompt = (job.payload.prompt || job.payload.query || '') as string;
      if (!prompt) throw new Error('Missing prompt/query');
      const result = await dispatchTextThroughFabric(prompt, undefined, {
        domain: (job.payload.domain || 'general') as any,
        localFallback: true,
      });
      return result.winner?.contentPreview || result.status;
    }

    case 'rpa_script': {
      const scriptId = job.payload.scriptId as string;
      if (!scriptId) throw new Error('Missing scriptId');
      const exec = await executeScript(scriptId, 'manual');
      return `RPA: ${exec.status} (${exec.results.length} actions)`;
    }

    case 'agent_loop': {
      const goal = (job.payload.goal || '') as string;
      if (!goal) throw new Error('Missing goal');
      const { run: loop } = await runRuntimeCoreMission({
        goal,
        domain: (job.payload.domain || 'coding') as any,
        maxLoops: (job.payload.maxLoops as number) || 3,
      });
      return `Loop: ${loop.status} (${loop.steps.length} steps)`;
    }

    case 'report_generate': {
      const { generateReport } = require('./scheduledReportGenerator');
      const scheduleId = job.payload.scheduleId as string;
      if (!scheduleId) throw new Error('Missing scheduleId');
      const report = await generateReport(scheduleId);
      return `Report: ${report.sections} sections, file: ${report.filePath}`;
    }

    case 'audit': {
      const { auditFile } = require('./aiSecurityAuditor');
      const filePath = (job.payload.filePath || '') as string;
      if (!filePath) throw new Error('Missing filePath');
      const audit = await auditFile(filePath);
      return `Audit: ${audit.score}/100, ${audit.totalFindings} findings`;
    }

    case 'refactor': {
      const { analyzeFileForRefactoring } = require('./codeRefactoringEngine');
      const filePath = (job.payload.filePath || '') as string;
      if (!filePath) throw new Error('Missing filePath');
      const report = await analyzeFileForRefactoring(filePath);
      return `Refactor: ${report.totalSmells} smells, score: ${report.complexityScore}/100`;
    }

    default:
      throw new Error(`Unknown job type: ${job.type}`);
  }
}
