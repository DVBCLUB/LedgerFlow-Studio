/**
 * agentEventBus.ts
 * ──────────────────────────────────────────────────────────────────
 * In-process pub/sub event bus for inter-agent communication.
 * Events are also persisted to a local JSON log (max 1000 entries).
 *
 * Usage:
 *   agentEventBus.publish('agent.completed', { runId, goal });
 *   const unsub = agentEventBus.subscribe('agent.completed', handler);
 *   unsub(); // remove listener
 * ──────────────────────────────────────────────────────────────────
 */

import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import { performance } from 'node:perf_hooks';
import type { AutomationEventType } from './automationRuleEngine.ts';
import { ensureRuntimeRootSync, resolveRuntimePathFromEnv, resolveRuntimeReadPathFromEnv } from './runtimePaths.ts';

export type AgentBusEventType =
  | AutomationEventType
  | 'memory.updated'
  | 'memory.approved'
  | 'pipeline.step.done'
  | 'agent.step.done'
  | 'cron.job.done'
  | 'ai.call.completed'
  | 'ai.call.failed'
  | 'agent.step.approval_required'
  | 'agent.step.rejected';

export interface AgentBusEvent {
  id: string;
  type: AgentBusEventType;
  source: string;
  payload: Record<string, unknown>;
  publishedAt: string;
}

type AgentBusHandler = (event: AgentBusEvent) => void | Promise<void>;

// ─── In-memory pub/sub ────────────────────────────────────────────────────────

const subscribers = new Map<string, Map<string, AgentBusHandler>>();

function getOrCreate(type: string): Map<string, AgentBusHandler> {
  if (!subscribers.has(type)) subscribers.set(type, new Map());
  return subscribers.get(type)!;
}

export function subscribe(type: AgentBusEventType | '*', handler: AgentBusHandler): () => void {
  const id = randomUUID();
  getOrCreate(type).set(id, handler);
  return () => {
    const map = subscribers.get(type);
    if (map) map.delete(id);
  };
}

// ─── Persistent event log (async, debounced checkpoint) ───────────────────────

const MAX_LOG_SIZE = 1_000;
const FLUSH_DEBOUNCE_MS = 250;
const FLUSH_BATCH_SIZE = 64;

// In-memory log is the source of truth for reads (no disk I/O in the hot path).
let eventLog: AgentBusEvent[] = [];
let logLoaded = false;
let dirty = false;
let pendingCount = 0;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let writeChain: Promise<void> = Promise.resolve();

function logFile() {
  return resolveRuntimePathFromEnv('AGENT_EVENT_LOG_FILE', 'agent_events.local.json');
}

// One-time cold read at startup (not in the hot path).
function loadLogFromDisk(): void {
  if (logLoaded) return;
  logLoaded = true;
  try {
    const readPath = resolveRuntimeReadPathFromEnv('AGENT_EVENT_LOG_FILE', 'agent_events.local.json');
    if (fs.existsSync(readPath)) {
      const parsed = JSON.parse(fs.readFileSync(readPath, 'utf-8'));
      eventLog = Array.isArray(parsed) ? (parsed as AgentBusEvent[]).slice(0, MAX_LOG_SIZE) : [];
    }
  } catch {
    eventLog = [];
  }
}
loadLogFromDisk();

function flushNow(): Promise<void> {
  if (!dirty) return writeChain;
  dirty = false;
  const snapshot = JSON.stringify(eventLog.slice(0, MAX_LOG_SIZE), null, 2);
  writeChain = writeChain.then(
    () =>
      new Promise<void>((resolve) => {
        try {
          ensureRuntimeRootSync();
          fs.writeFile(logFile(), snapshot, 'utf-8', () => resolve());
        } catch {
          resolve();
        }
      }),
    () => undefined,
  );
  return writeChain;
}

// Non-blocking enqueue: memory push + debounced/batched async checkpoint.
function enqueueForPersist(event: AgentBusEvent): void {
  eventLog = [event, ...eventLog].slice(0, MAX_LOG_SIZE);
  dirty = true;
  pendingCount += 1;
  if (pendingCount >= FLUSH_BATCH_SIZE) {
    pendingCount = 0;
    if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
    void flushNow();
    return;
  }
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    pendingCount = 0;
    void flushNow();
  }, FLUSH_DEBOUNCE_MS);
}

export async function flushEventLog(): Promise<void> {
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
  pendingCount = 0;
  await flushNow();
}

// Graceful shutdown: best-effort synchronous flush of any dirty state.
function flushOnExit(): void {
  try {
    if (!dirty) return;
    ensureRuntimeRootSync();
    fs.writeFileSync(logFile(), JSON.stringify(eventLog.slice(0, MAX_LOG_SIZE), null, 2), 'utf-8');
  } catch {
    /* ignore */
  }
}
process.once('SIGINT', flushOnExit);
process.once('SIGTERM', flushOnExit);
process.once('exit', flushOnExit);

// ─── Latency metrics (control-plane dispatch) ─────────────────────────────────

export interface MeshMetrics {
  published: number;
  delivered: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  dropRate: number;
}

export const LATENCY_BUCKETS_MS = [0.25, 0.5, 1, 2, 5, 10, 25, 50, 100, 250, 500, 1000] as const;

const latencyCounts = new Array<number>(LATENCY_BUCKETS_MS.length).fill(0);
let latencyOverflowCount = 0;
let publishedCount = 0;

// Pure helper (exported for tests).
export function computePercentileFromHistogram(
  counts: number[],
  buckets: readonly number[],
  overflowCount: number,
  p: number,
): number {
  const total = counts.reduce((sum, c) => sum + c, 0) + overflowCount;
  if (total === 0) return 0;
  const target = Math.ceil(total * p);
  let cum = 0;
  for (let i = 0; i < buckets.length; i += 1) {
    cum += counts[i] ?? 0;
    if (cum >= target) return buckets[i];
  }
  return buckets[buckets.length - 1];
}

function recordLatency(ms: number): void {
  publishedCount += 1;
  const idx = LATENCY_BUCKETS_MS.findIndex((b) => ms <= b);
  if (idx === -1) latencyOverflowCount += 1;
  else latencyCounts[idx] += 1;
}

export function meshLatencyHistogram(): MeshMetrics {
  return {
    published: publishedCount,
    delivered: publishedCount,
    p50Ms: computePercentileFromHistogram(latencyCounts, LATENCY_BUCKETS_MS, latencyOverflowCount, 0.5),
    p95Ms: computePercentileFromHistogram(latencyCounts, LATENCY_BUCKETS_MS, latencyOverflowCount, 0.95),
    p99Ms: computePercentileFromHistogram(latencyCounts, LATENCY_BUCKETS_MS, latencyOverflowCount, 0.99),
    dropRate: 0,
  };
}

// ─── Publish ──────────────────────────────────────────────────────────────────

export async function publish(
  type: AgentBusEventType,
  payload: Record<string, unknown>,
  source = 'system',
): Promise<AgentBusEvent> {
  const event: AgentBusEvent = { id: `evt_${randomUUID()}`, type, source, payload, publishedAt: new Date().toISOString() };
  const dispatchStart = performance.now();

  // Fire specific handlers
  const specific = subscribers.get(type);
  if (specific) {
    for (const handler of specific.values()) {
      try { await handler(event); } catch (err) { console.error(`[AgentEventBus] Handler error for ${type}:`, err); }
    }
  }

  // Fire wildcard handlers
  const wildcard = subscribers.get('*');
  if (wildcard) {
    for (const handler of wildcard.values()) {
      try { await handler(event); } catch (err) { console.error('[AgentEventBus] Wildcard handler error:', err); }
    }
  }

  const dispatchLatencyMs = performance.now() - dispatchStart;

  // Persist (non-blocking: memory push + debounced async checkpoint)
  enqueueForPersist(event);
  recordLatency(dispatchLatencyMs);

  // Fire automation rules
  try {
    const { fireAutomationEvent } = await import('./automationRuleEngine.ts');
    await fireAutomationEvent(type as any, payload);
  } catch {
    // Non-blocking: rule engine failures must not disrupt event flow
  }

  return event;
}

// ─── Query log ────────────────────────────────────────────────────────────────

export function getEventLog(limit = 100, filterType?: AgentBusEventType): AgentBusEvent[] {
  const filtered = filterType ? eventLog.filter((e) => e.type === filterType) : eventLog;
  return filtered.slice(0, limit);
}

export function clearEventLog(): void {
  eventLog = [];
  try {
    ensureRuntimeRootSync();
    fs.writeFileSync(logFile(), '[]', 'utf-8');
    dirty = false;
  } catch {
    /* ignore */
  }
}

export function getSubscriberCount(type?: AgentBusEventType): number {
  if (type) return subscribers.get(type)?.size ?? 0;
  return [...subscribers.values()].reduce((sum, map) => sum + map.size, 0);
}

/** Export singleton-style API */
export const agentEventBus = {
  publish,
  subscribe,
  getEventLog,
  clearEventLog,
  getSubscriberCount,
  flushEventLog,
  meshLatencyHistogram,
};
export default agentEventBus;
