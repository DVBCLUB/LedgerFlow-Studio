import fs from 'node:fs';
import { randomBytes } from 'node:crypto';
import { ensureRuntimeRootSync, resolveRuntimePathFromEnv, resolveRuntimeReadPathFromEnv } from './runtimePaths.ts';

export type DurableJobStatus = 'queued' | 'running' | 'retry' | 'completed' | 'dead_letter' | 'cancelled';

export interface DurableJob<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  name: string;
  payload: TPayload;
  status: DurableJobStatus;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: string;
  leaseOwner?: string;
  leaseExpiresAt?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  dedupeKey?: string;
}

type QueueStore = { version: 1; jobs: DurableJob[] };
let mutationQueue = Promise.resolve();

function storageFile() {
  return resolveRuntimePathFromEnv('DURABLE_JOB_QUEUE_FILE', 'agent_jobs.local.json');
}

async function readStore(): Promise<QueueStore> {
  try {
    const parsed = JSON.parse(await fs.promises.readFile(resolveRuntimeReadPathFromEnv('DURABLE_JOB_QUEUE_FILE', 'agent_jobs.local.json'), 'utf8'));
    return { version: 1, jobs: Array.isArray(parsed?.jobs) ? parsed.jobs : [] };
  } catch (error: any) {
    if (error?.code === 'ENOENT') return { version: 1, jobs: [] };
    throw error;
  }
}

async function writeStore(store: QueueStore) {
  const target = storageFile();
  ensureRuntimeRootSync();
  await fs.promises.writeFile(target, JSON.stringify(store, null, 2), 'utf8');
}

function mutate<T>(operation: (store: QueueStore) => Promise<T> | T): Promise<T> {
  const run = async () => {
    const store = await readStore();
    const result = await operation(store);
    await writeStore(store);
    return result;
  };
  const queued = mutationQueue.then(run, run);
  mutationQueue = queued.then(() => undefined, () => undefined);
  return queued;
}

function compactStore(store: QueueStore, retentionDays = 30, maxTerminal = 300) {
  const cutoff = Date.now() - Math.max(1, retentionDays) * 24 * 60 * 60 * 1000;
  const active = store.jobs.filter((job) => ['queued', 'running', 'retry'].includes(job.status));
  const terminal = store.jobs
    .filter((job) => !['queued', 'running', 'retry'].includes(job.status) && Date.parse(job.updatedAt) >= cutoff)
    .slice(0, Math.max(0, maxTerminal));
  store.jobs = [...active, ...terminal].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export function enqueueDurableJob(input: { name: string; payload: Record<string, unknown>; maxAttempts?: number; dedupeKey?: string }): Promise<DurableJob> {
  return mutate((store) => {
    if (input.dedupeKey) {
      const existing = store.jobs.find((job) => job.dedupeKey === input.dedupeKey && ['queued', 'running', 'retry'].includes(job.status));
      if (existing) return existing;
    }
    const now = new Date().toISOString();
    const job: DurableJob = {
      id: `job_${Date.now()}_${randomBytes(5).toString('hex')}`,
      name: input.name,
      payload: input.payload,
      status: 'queued',
      attempts: 0,
      maxAttempts: Math.max(1, input.maxAttempts || 3),
      nextAttemptAt: now,
      createdAt: now,
      updatedAt: now,
      dedupeKey: input.dedupeKey,
    };
    store.jobs.unshift(job);
    compactStore(store);
    return job;
  });
}

export function claimDueJob(workerId: string, options: { leaseMs?: number; jobId?: string } = {}): Promise<DurableJob | null> {
  return mutate((store) => {
    const now = Date.now();
    const job = store.jobs.find((candidate) => {
      if (options.jobId && candidate.id !== options.jobId) return false;
      const due = Date.parse(candidate.nextAttemptAt) <= now;
      const leaseExpired = candidate.status === 'running' && Date.parse(candidate.leaseExpiresAt || '') <= now;
      return due && (candidate.status === 'queued' || candidate.status === 'retry' || leaseExpired);
    });
    if (!job) return null;
    job.status = 'running';
    job.attempts += 1;
    job.leaseOwner = workerId;
    job.leaseExpiresAt = new Date(now + (options.leaseMs || 60_000)).toISOString();
    job.updatedAt = new Date(now).toISOString();
    return { ...job, payload: { ...job.payload } };
  });
}

export function completeDurableJob(jobId: string, workerId: string): Promise<DurableJob> {
  return mutate((store) => {
    const job = store.jobs.find((candidate) => candidate.id === jobId);
    if (!job || job.status !== 'running' || job.leaseOwner !== workerId) throw new Error('Job lease is missing or owned by another worker.');
    const now = new Date().toISOString();
    job.status = 'completed';
    job.completedAt = now;
    job.updatedAt = now;
    delete job.leaseOwner;
    delete job.leaseExpiresAt;
    delete job.lastError;
    return { ...job, payload: { ...job.payload } };
  });
}

export function failDurableJob(jobId: string, workerId: string, error: unknown, baseDelayMs = 5_000): Promise<DurableJob> {
  return mutate((store) => {
    const job = store.jobs.find((candidate) => candidate.id === jobId);
    if (!job || job.status !== 'running' || job.leaseOwner !== workerId) throw new Error('Job lease is missing or owned by another worker.');
    const now = Date.now();
    job.lastError = error instanceof Error ? error.message : String(error);
    job.status = job.attempts >= job.maxAttempts ? 'dead_letter' : 'retry';
    job.nextAttemptAt = new Date(now + baseDelayMs * (2 ** Math.max(0, job.attempts - 1))).toISOString();
    job.updatedAt = new Date(now).toISOString();
    delete job.leaseOwner;
    delete job.leaseExpiresAt;
    return { ...job, payload: { ...job.payload } };
  });
}

export function retryDeadLetterJob(jobId: string): Promise<DurableJob> {
  return mutate((store) => {
    const job = store.jobs.find((candidate) => candidate.id === jobId);
    if (!job || job.status !== 'dead_letter') throw new Error('Only dead-letter jobs can be retried manually.');
    const now = new Date().toISOString();
    job.status = 'queued';
    job.attempts = 0;
    job.nextAttemptAt = now;
    job.updatedAt = now;
    delete job.lastError;
    delete job.leaseOwner;
    delete job.leaseExpiresAt;
    delete job.completedAt;
    return { ...job, payload: { ...job.payload } };
  });
}

export function cancelDurableJob(jobId: string): Promise<DurableJob> {
  return mutate((store) => {
    const job = store.jobs.find((candidate) => candidate.id === jobId);
    if (!job || !['queued', 'retry', 'dead_letter'].includes(job.status)) throw new Error('Only queued, retry, or dead-letter jobs can be cancelled.');
    const now = new Date().toISOString();
    job.status = 'cancelled';
    job.updatedAt = now;
    job.completedAt = now;
    delete job.leaseOwner;
    delete job.leaseExpiresAt;
    return { ...job, payload: { ...job.payload } };
  });
}

export function pruneDurableJobs(retentionDays = 30, maxTerminal = 300): Promise<{ removed: number }> {
  return mutate((store) => {
    const before = store.jobs.length;
    compactStore(store, retentionDays, maxTerminal);
    return { removed: before - store.jobs.length };
  });
}

export async function listDurableJobs(limit = 100): Promise<DurableJob[]> {
  await mutationQueue.catch(() => undefined);
  return (await readStore()).jobs.slice(0, Math.max(1, Math.min(limit, 500)));
}

export async function getDurableQueueSummary() {
  const jobs = await listDurableJobs(500);
  const counts: Record<DurableJobStatus, number> = { queued: 0, running: 0, retry: 0, completed: 0, dead_letter: 0, cancelled: 0 };
  for (const job of jobs) counts[job.status] += 1;
  return { counts, recent: jobs.slice(0, 20) };
}

export interface DeadLetterAlertSummary {
  hasAlert: boolean;
  deadLetterCount: number;
  unresolvedDeadLetters: DurableJob[];
  oldestDeadLetterAgeHours: number;
  recommendations: string[];
}

export async function checkDeadLetterAlert(): Promise<DeadLetterAlertSummary> {
  const jobs = await listDurableJobs(500);
  const deadLetters = jobs.filter((j) => j.status === 'dead_letter');
  const now = Date.now();
  let oldestAgeHours = 0;

  for (const dl of deadLetters) {
    const age = (now - Date.parse(dl.updatedAt)) / (1000 * 3600);
    if (age > oldestAgeHours) oldestAgeHours = age;
  }

  const hasAlert = deadLetters.length > 0;
  const recommendations: string[] = [];
  if (deadLetters.length > 0) {
    recommendations.push(`Có ${deadLetters.length} tác vụ rơi vào Dead Letter Queue (DLQ). Cần kiểm tra lỗi '${deadLetters[0]?.lastError?.slice(0, 80) || 'unknown'}' và thử lại.`);
  }

  return {
    hasAlert,
    deadLetterCount: deadLetters.length,
    unresolvedDeadLetters: deadLetters.slice(0, 10),
    oldestDeadLetterAgeHours: Math.round(oldestAgeHours * 10) / 10,
    recommendations,
  };
}

