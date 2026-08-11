/**
 * agentPerformanceLedger.ts
 * ============================================================
 * Agent Performance Ledger — theo dõi track record của từng
 * AI agent role theo domain. Ghi lại success/failure metrics
 * và cung cấp getBestAgentForDomain() để auto-select agent tốt nhất.
 *
 * Được tích hợp bởi:
 *  - agentWorkflowEngine.ts  (sau khi step hoàn thành)
 *  - multiAgentOrchestrator.ts (sau mỗi task result)
 *  - agentSwarmCoordinator.ts  (sau swarm task completion)
 */
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { ensureRuntimeRootSync, resolveRuntimePathFromEnv } from './runtimePaths.ts';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AgentPerformanceRecord {
  /** Unique key: agentRole + '::' + domain */
  key: string;
  agentRole: string;
  domain: string;
  successCount: number;
  failureCount: number;
  totalRuns: number;
  successRate: number;
  avgLatencyMs: number;
  totalLatencyMs: number;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  lastUpdatedAt: string;
  createdAt: string;
}

export interface AgentOutcomeEvent {
  id: string;
  agentRole: string;
  domain: string;
  taskTitle: string;
  success: boolean;
  latencyMs: number;
  errorSummary?: string;
  recordedAt: string;
}

interface LedgerStore {
  records: Record<string, AgentPerformanceRecord>;
  recentEvents: AgentOutcomeEvent[];
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const MAX_EVENTS = 500;
let store: LedgerStore = { records: {}, recentEvents: [] };
let saveQueue = Promise.resolve();

function storagePath(): string {
  return resolveRuntimePathFromEnv('AGENT_PERF_LEDGER_FILE', 'agent_performance_ledger.json');
}

async function loadStore(): Promise<void> {
  try {
    const filePath = storagePath();
    if (fs.existsSync(filePath)) {
      const parsed = JSON.parse(await fs.promises.readFile(filePath, 'utf8'));
      store = {
        records: parsed.records || {},
        recentEvents: parsed.recentEvents || [],
      };
    }
  } catch {
    // Fresh start if file is corrupt
    store = { records: {}, recentEvents: [] };
  }
}

async function saveStore(): Promise<void> {
  ensureRuntimeRootSync();
  const target = storagePath();
  const data: LedgerStore = {
    records: store.records,
    recentEvents: store.recentEvents.slice(-MAX_EVENTS),
  };
  await fs.promises.writeFile(target, JSON.stringify(data, null, 2), 'utf8');
}

function queueSave(): void {
  const task = () => saveStore().catch(() => undefined);
  saveQueue = saveQueue.then(task, task);
}

// Initialize on module load
loadStore().catch(() => undefined);

// ─── Core API ─────────────────────────────────────────────────────────────────

/**
 * Record the outcome of an agent task.
 * Call this after any agent completes a step/task.
 */
export function recordAgentOutcome(
  agentRole: string,
  domain: string,
  success: boolean,
  latencyMs: number,
  options: {
    taskTitle?: string;
    errorSummary?: string;
  } = {},
): AgentPerformanceRecord {
  const key = `${agentRole}::${domain}`;
  const now = new Date().toISOString();

  if (!store.records[key]) {
    store.records[key] = {
      key,
      agentRole,
      domain,
      successCount: 0,
      failureCount: 0,
      totalRuns: 0,
      successRate: 0,
      avgLatencyMs: 0,
      totalLatencyMs: 0,
      lastUpdatedAt: now,
      createdAt: now,
    };
  }

  const record = store.records[key];
  record.totalRuns += 1;
  record.totalLatencyMs += latencyMs;
  record.avgLatencyMs = Math.round(record.totalLatencyMs / record.totalRuns);
  record.lastUpdatedAt = now;

  if (success) {
    record.successCount += 1;
    record.lastSuccessAt = now;
  } else {
    record.failureCount += 1;
    record.lastFailureAt = now;
  }

  record.successRate = record.totalRuns > 0
    ? parseFloat((record.successCount / record.totalRuns).toFixed(4))
    : 0;

  // Append event log
  const event: AgentOutcomeEvent = {
    id: `ape_${Date.now()}_${randomUUID().slice(0, 6)}`,
    agentRole,
    domain,
    taskTitle: (options.taskTitle || '').slice(0, 120),
    success,
    latencyMs,
    errorSummary: options.errorSummary?.slice(0, 200),
    recordedAt: now,
  };
  store.recentEvents.push(event);

  queueSave();
  return record;
}

/**
 * Get performance stats for a specific agent role.
 */
export function getAgentPerformanceStats(
  agentRole: string,
  domain?: string,
): AgentPerformanceRecord[] {
  return Object.values(store.records).filter(
    (r) => r.agentRole === agentRole && (domain === undefined || r.domain === domain),
  );
}

/**
 * Get the best-performing agent for a given domain from a list of candidates.
 * Falls back to first candidate if no data is available.
 *
 * Scoring: successRate * 0.7 + volumeBonus * 0.3
 * A minimum of 3 runs is required before an agent is considered "experienced".
 */
export function getBestAgentForDomain(
  domain: string,
  candidates: string[],
  options: { minRuns?: number } = {},
): { agent: string; confidence: number; reason: string } {
  const minRuns = options.minRuns ?? 3;

  let bestAgent = candidates[0];
  let bestScore = -1;
  let bestReason = 'Kh\u00f4ng c\u00f3 d\u1eef li\u1ec7u hi\u1ec7u su\u1ea5t, d\u00f9ng m\u1eb7c \u0111\u1ecbnh.';

  for (const agent of candidates) {
    const key = `${agent}::${domain}`;
    const record = store.records[key];
    if (!record || record.totalRuns < minRuns) continue;

    // Logarithmic volume bonus (caps at ~0.3 for 30+ runs)
    const volumeBonus = Math.min(0.3, Math.log10(record.totalRuns + 1) / 2);
    const score = record.successRate * 0.7 + volumeBonus;

    if (score > bestScore) {
      bestScore = score;
      bestAgent = agent;
      bestReason = `T\u1ef7 l\u1ec7 th\u00e0nh c\u00f4ng ${(record.successRate * 100).toFixed(0)}% tr\u00ean ${record.totalRuns} l\u1ea7n ch\u1ea1y trong domain "${domain}".`;
    }
  }

  return {
    agent: bestAgent,
    confidence: Math.max(0, Math.min(1, bestScore)),
    reason: bestReason,
  };
}

/**
 * Get all performance records, sorted by successRate descending.
 */
export function listAllPerformanceRecords(options: {
  domain?: string;
  minRuns?: number;
  limit?: number;
} = {}): AgentPerformanceRecord[] {
  let records = Object.values(store.records);
  if (options.domain) records = records.filter((r) => r.domain === options.domain);
  if (options.minRuns !== undefined) records = records.filter((r) => r.totalRuns >= options.minRuns!);
  records.sort((a, b) => b.successRate - a.successRate || b.totalRuns - a.totalRuns);
  return records.slice(0, options.limit || 200);
}

/**
 * Get recent outcome events.
 */
export function listRecentOutcomeEvents(limit = 50): AgentOutcomeEvent[] {
  return store.recentEvents.slice(-limit).reverse();
}

/**
 * Get a summary dashboard snapshot.
 */
export function getPerformanceDashboard(): {
  totalAgentRoles: number;
  totalDomains: number;
  totalRuns: number;
  overallSuccessRate: number;
  topPerformers: Array<{ agentRole: string; domain: string; successRate: number; totalRuns: number }>;
  underperformers: Array<{ agentRole: string; domain: string; successRate: number; totalRuns: number }>;
} {
  const records = Object.values(store.records);
  const experienced = records.filter((r) => r.totalRuns >= 3);

  const totalRuns = records.reduce((s, r) => s + r.totalRuns, 0);
  const totalSuccesses = records.reduce((s, r) => s + r.successCount, 0);

  const sorted = [...experienced].sort((a, b) => b.successRate - a.successRate);

  return {
    totalAgentRoles: new Set(records.map((r) => r.agentRole)).size,
    totalDomains: new Set(records.map((r) => r.domain)).size,
    totalRuns,
    overallSuccessRate: totalRuns > 0 ? parseFloat((totalSuccesses / totalRuns).toFixed(4)) : 0,
    topPerformers: sorted.slice(0, 5).map((r) => ({
      agentRole: r.agentRole,
      domain: r.domain,
      successRate: r.successRate,
      totalRuns: r.totalRuns,
    })),
    underperformers: sorted.slice(-3).reverse().map((r) => ({
      agentRole: r.agentRole,
      domain: r.domain,
      successRate: r.successRate,
      totalRuns: r.totalRuns,
    })),
  };
}
