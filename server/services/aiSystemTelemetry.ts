/**
 * aiSystemTelemetry.ts
 * ============================================================
 * AI System Telemetry — deep performance metrics,
 * bottleneck detection, và optimization suggestions.
 *
 * Theo dõi: memory usage, API latency p50/p95/p99,
 * error rates, throughput, saturation points.
 */
import fs from 'fs';
import path from 'path';
import { getSnapshot, getDailyCosts } from './costObservability';
import { getStats as getMemoryStats } from './compoundMemory';
import { getAgenticLoopMetrics } from './agenticLoopEngine';

// ─── Types ──────────────────────────────────────────────────────────
export interface LatencyPercentiles {
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  avg: number;
  min: number;
  max: number;
  totalSamples: number;
}

export interface ThroughputMetric {
  timestamp: string;
  requestsPerMinute: number;
  tokensPerMinute: number;
  successRate: number;
}

export interface Bottleneck {
  component: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  metric: string;
  currentValue: number;
  threshold: number;
  description: string;
  suggestion: string;
}

export interface TelemetrySnapshot {
  id: string;
  timestamp: string;
  latency: {
    api: LatencyPercentiles;
    memory: LatencyPercentiles;
    sandbox: LatencyPercentiles;
  };
  throughput: ThroughputMetric;
  resources: {
    memoryMB: number;
    uptimeMinutes: number;
    activeSessions: number;
    totalCalls: number;
  };
  errors: {
    totalErrors: number;
    byType: Record<string, number>;
    errorRate: number;
  };
  bottlenecks: Bottleneck[];
  recommendations: string[];
  healthScore: number;  // 0-100
}

// ─── In-memory metrics buffer ───────────────────────────────────────
interface RawMetric {
  ts: number;
  latency: number;
  component: string;
  success: boolean;
  errorType?: string;
  tokens: number;
}

const metricsBuffer: RawMetric[] = [];
const MAX_BUFFER = 1000;
const SNAPSHOTS_FILE = path.join(process.cwd(), 'telemetry_snapshots.json');
let snapshots: TelemetrySnapshot[] = [];

async function loadSnapshots(): Promise<void> {
  try { if (fs.existsSync(SNAPSHOTS_FILE)) snapshots = JSON.parse(await fs.promises.readFile(SNAPSHOTS_FILE, 'utf8')); } catch { }
}
loadSnapshots().catch(() => undefined);

async function saveSnapshots(): Promise<void> {
  await fs.promises.writeFile(SNAPSHOTS_FILE, JSON.stringify(snapshots.slice(-50), null, 2), 'utf8');
}

// ─── Core API ───────────────────────────────────────────────────────

export function recordMetric(latencyMs: number, component: string, success: boolean, tokens = 0, errorType?: string): void {
  metricsBuffer.push({ ts: Date.now(), latency: latencyMs, component, success, tokens, errorType });
  if (metricsBuffer.length > MAX_BUFFER) metricsBuffer.splice(0, metricsBuffer.length - MAX_BUFFER);
}

export async function captureTelemetry(): Promise<TelemetrySnapshot> {
  const now = new Date();
  const id = `tel_${Date.now()}`;
  const cutoff = now.getTime() - 60 * 60 * 1000; // Last hour

  const recentMetrics = metricsBuffer.filter(m => m.ts >= cutoff);

  // ── Latency percentiles ──
  function calcPercentiles(arr: number[]): LatencyPercentiles {
    if (arr.length === 0) return { p50: 0, p90: 0, p95: 0, p99: 0, avg: 0, min: 0, max: 0, totalSamples: 0 };
    const sorted = [...arr].sort((a, b) => a - b);
    return {
      p50: sorted[Math.floor(sorted.length * 0.50)],
      p90: sorted[Math.floor(sorted.length * 0.90)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      avg: +(sorted.reduce((s, v) => s + v, 0) / sorted.length).toFixed(1),
      min: sorted[0],
      max: sorted[sorted.length - 1],
      totalSamples: sorted.length,
    };
  }

  const apiLatencies = recentMetrics.filter(m => m.component === 'api' || m.component === 'fabric').map(m => m.latency);
  const memLatencies = recentMetrics.filter(m => m.component === 'memory').map(m => m.latency);
  const sandboxLatencies = recentMetrics.filter(m => m.component === 'sandbox').map(m => m.latency);

  // ── Throughput ──
  const minutesInWindow = Math.max(1, (now.getTime() - cutoff) / 60000);
  const throughput: ThroughputMetric = {
    timestamp: now.toISOString(),
    requestsPerMinute: +(recentMetrics.length / minutesInWindow).toFixed(1),
    tokensPerMinute: +(recentMetrics.reduce((s, m) => s + m.tokens, 0) / minutesInWindow).toFixed(1),
    successRate: recentMetrics.length > 0 ? +(recentMetrics.filter(m => m.success).length / recentMetrics.length * 100).toFixed(1) : 0,
  };

  // ── Resources ──
  const [memStats, loopMetrics] = await Promise.all([
    getMemoryStats().catch(() => ({ totalRecords: 0 })),
    Promise.resolve(getAgenticLoopMetrics()),
  ]);

  const resources = {
    memoryMB: +(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1),
    uptimeMinutes: Math.floor(process.uptime() / 60),
    activeSessions: loopMetrics.running || 0,
    totalCalls: recentMetrics.length,
  };

  // ── Errors ──
  const errors = recentMetrics.filter(m => !m.success);
  const byType: Record<string, number> = {};
  for (const e of errors) {
    byType[e.errorType || 'unknown'] = (byType[e.errorType || 'unknown'] || 0) + 1;
  }

  // ── Bottlenecks ──
  const bottlenecks: Bottleneck[] = [];

  // API latency bottleneck
  if (apiLatencies.length >= 5) {
    const apiP95 = calcPercentiles(apiLatencies).p95;
    if (apiP95 > 10000) {
      bottlenecks.push({
        component: 'api', severity: 'high', metric: 'p95_latency',
        currentValue: apiP95, threshold: 10000,
        description: `API p95 latency ${apiP95}ms exceeds 10s threshold.`,
        suggestion: 'Check API key rate limits, consider adding more provider keys, or enable local fallback.',
      });
    } else if (apiP95 > 5000) {
      bottlenecks.push({
        component: 'api', severity: 'medium', metric: 'p95_latency',
        currentValue: apiP95, threshold: 5000,
        description: `API latency approaching warning level (${apiP95}ms).`,
        suggestion: 'Monitor trend. Consider enabling caching or local fallback.',
      });
    }
  }

  // Error rate bottleneck
  const errorRate = errors.length / Math.max(1, recentMetrics.length);
  if (errorRate > 0.2) {
    bottlenecks.push({
      component: 'fabric', severity: 'high', metric: 'error_rate',
      currentValue: +(errorRate * 100).toFixed(1), threshold: 20,
      description: `Error rate ${(errorRate * 100).toFixed(1)}% exceeds 20% threshold.`,
      suggestion: 'Check API keys, network connectivity, and provider availability.',
    });
  }

  // Memory bottleneck
  if (resources.memoryMB > 500) {
    bottlenecks.push({
      component: 'daemon', severity: 'medium', metric: 'heap_memory',
      currentValue: resources.memoryMB, threshold: 500,
      description: `Heap memory ${resources.memoryMB}MB above 500MB.`,
      suggestion: 'Consider cleaning session memory or restarting daemon periodically.',
    });
  }

  // Memory records bottleneck
  if ((memStats as any).shortTerm?.count > 500) {
    bottlenecks.push({
      component: 'memory', severity: 'low', metric: 'short_term_count',
      currentValue: (memStats as any).shortTerm?.count || 0, threshold: 500,
      description: `Short-term memory has ${(memStats as any).shortTerm?.count || 0} records.`,
      suggestion: 'Run curator to promote valuable records and clean expired ones.',
    });
  }

  // Recommendations
  const recommendations: string[] = [];
  for (const b of bottlenecks) {
    recommendations.push(`[${b.severity}] ${b.component}: ${b.suggestion}`);
  }
  if (recentMetrics.length === 0) {
    recommendations.push('No metrics collected yet. Run some AI calls to gather telemetry data.');
  }
  if (errorRate < 0.05 && recentMetrics.length > 10) {
    recommendations.push('System is healthy with low error rate. Continue monitoring.');
  }

  // Health score
  let healthScore = 100;
  healthScore -= bottlenecks.filter(b => b.severity === 'critical').length * 20;
  healthScore -= bottlenecks.filter(b => b.severity === 'high').length * 10;
  healthScore -= bottlenecks.filter(b => b.severity === 'medium').length * 5;
  healthScore -= bottlenecks.filter(b => b.severity === 'low').length * 2;
  healthScore = Math.max(0, Math.min(100, healthScore));

  const snapshot: TelemetrySnapshot = {
    id,
    timestamp: now.toISOString(),
    latency: {
      api: calcPercentiles(apiLatencies),
      memory: calcPercentiles(memLatencies),
      sandbox: calcPercentiles(sandboxLatencies),
    },
    throughput,
    resources,
    errors: {
      totalErrors: errors.length,
      byType,
      errorRate: +(errorRate * 100).toFixed(1),
    },
    bottlenecks,
    recommendations: recommendations.slice(0, 8),
    healthScore,
  };

  snapshots.push(snapshot);
  if (snapshots.length % 5 === 0) saveSnapshots().catch(() => undefined);

  return snapshot;
}

export function getLatestTelemetry(): TelemetrySnapshot | undefined {
  return snapshots[snapshots.length - 1];
}

export function getTelemetryHistory(limit = 20): TelemetrySnapshot[] {
  return snapshots.slice(-limit).reverse();
}

export function getMetricsBuffer(): RawMetric[] {
  return [...metricsBuffer].reverse();
}

export function clearMetrics(): void {
  metricsBuffer.length = 0;
}
