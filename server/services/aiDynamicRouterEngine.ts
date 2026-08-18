/**
 * aiDynamicRouterEngine.ts
 * ============================================================
 * Adaptive Cost-Quality-Latency Dynamic AI Router Engine for LedgerFlow OS.
 *
 * Implements historical telemetry tracking and multi-criteria scoring:
 *   Score = 0.5 * normalized_quality + 0.3 * (1 - normalized_cost) + 0.2 * (1 - normalized_latency)
 *
 * Features:
 *   - Telemetry logging for each task execution (latency, token cost, quality score from LLM-Judge/Eval)
 *   - Cold-start protection: Falls back to static policy when sample size < MIN_SAMPLES_THRESHOLD
 *   - Thompson/Bayesian exploration vs exploitation adaptive ranking
 *   - Persistent telemetry store in runtime/ai_dynamic_routing.json
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import type { TaskType, RouteEntry } from './aiRoutingPolicy.ts';

export interface RouteExecutionTelemetry {
  id: string;
  taskType: TaskType;
  provider: string;
  model?: string;
  kind: 'api' | 'cli' | 'local';
  latencyMs: number;
  tokensIn?: number;
  tokensOut?: number;
  costUsd: number;
  qualityScore: number; // 0 - 100
  success: boolean;
  timestamp: string;
  source: 'eval_harness' | 'task_execution' | 'llm_judge' | 'manual_feedback';
}

export interface ProviderAdaptiveRank {
  key: string; // provider:model
  provider: string;
  model?: string;
  kind: 'api' | 'cli' | 'local';
  sampleCount: number;
  avgLatencyMs: number;
  avgCostUsd: number;
  avgQualityScore: number; // 0 - 100
  successRate: number; // 0 - 1
  compositeScore: number; // 0 - 100
  recommendedOrder: number;
  isColdStart: boolean;
}

export interface DynamicRoutingState {
  version: number;
  lastCalculatedAt: string;
  telemetryHistory: RouteExecutionTelemetry[];
  adaptiveRanks: Partial<Record<TaskType, ProviderAdaptiveRank[]>>;
}

const RUNTIME_DIR = path.join(process.cwd(), 'runtime');
const DYNAMIC_ROUTER_FILE = path.join(RUNTIME_DIR, 'ai_dynamic_routing.json');
const MAX_TELEMETRY_LOGS = 500;
const MIN_SAMPLES_THRESHOLD = 3;

function ensureRuntimeDir(): void {
  if (!existsSync(RUNTIME_DIR)) {
    mkdirSync(RUNTIME_DIR, { recursive: true });
  }
}

function loadDynamicState(): DynamicRoutingState {
  ensureRuntimeDir();
  if (!existsSync(DYNAMIC_ROUTER_FILE)) {
    return {
      version: 1,
      lastCalculatedAt: new Date().toISOString(),
      telemetryHistory: [],
      adaptiveRanks: {},
    };
  }
  try {
    const raw = readFileSync(DYNAMIC_ROUTER_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      version: parsed.version || 1,
      lastCalculatedAt: parsed.lastCalculatedAt || new Date().toISOString(),
      telemetryHistory: Array.isArray(parsed.telemetryHistory) ? parsed.telemetryHistory : [],
      adaptiveRanks: parsed.adaptiveRanks || {},
    };
  } catch {
    return {
      version: 1,
      lastCalculatedAt: new Date().toISOString(),
      telemetryHistory: [],
      adaptiveRanks: {},
    };
  }
}

function saveDynamicState(state: DynamicRoutingState): void {
  ensureRuntimeDir();
  state.telemetryHistory = state.telemetryHistory.slice(-MAX_TELEMETRY_LOGS);
  writeFileSync(DYNAMIC_ROUTER_FILE, JSON.stringify(state, null, 2), 'utf8');
}

/**
 * Record a route execution execution telemetry.
 */
export function recordRouteTelemetry(telemetry: Omit<RouteExecutionTelemetry, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): RouteExecutionTelemetry {
  const state = loadDynamicState();
  const entry: RouteExecutionTelemetry = {
    id: telemetry.id || `telem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    taskType: telemetry.taskType,
    provider: telemetry.provider,
    model: telemetry.model,
    kind: telemetry.kind,
    latencyMs: Math.max(0, telemetry.latencyMs || 0),
    tokensIn: telemetry.tokensIn,
    tokensOut: telemetry.tokensOut,
    costUsd: Math.max(0, telemetry.costUsd || 0),
    qualityScore: Math.min(100, Math.max(0, telemetry.qualityScore || (telemetry.success ? 85 : 0))),
    success: telemetry.success,
    timestamp: telemetry.timestamp || new Date().toISOString(),
    source: telemetry.source || 'task_execution',
  };

  state.telemetryHistory.push(entry);
  recalculateAdaptiveRanks(state);
  saveDynamicState(state);
  return entry;
}

/**
 * Compute adaptive composite score and rankings across candidates for all task types.
 */
export function recalculateAdaptiveRanks(state?: DynamicRoutingState): DynamicRoutingState {
  const currentState = state || loadDynamicState();
  const history = currentState.telemetryHistory;

  const groupedByTask: Partial<Record<TaskType, Record<string, RouteExecutionTelemetry[]>>> = {};

  for (const item of history) {
    if (!groupedByTask[item.taskType]) {
      groupedByTask[item.taskType] = {};
    }
    const key = `${item.provider}:${item.model || 'default'}`;
    if (!groupedByTask[item.taskType]![key]) {
      groupedByTask[item.taskType]![key] = [];
    }
    groupedByTask[item.taskType]![key].push(item);
  }

  const updatedRanks: Partial<Record<TaskType, ProviderAdaptiveRank[]>> = {};

  for (const [taskTypeKey, providerMap] of Object.entries(groupedByTask)) {
    const taskType = taskTypeKey as TaskType;
    const candidates: ProviderAdaptiveRank[] = [];

    let maxLatency = 1000;
    let maxCost = 0.01;

    // Determine normalizers
    for (const telemList of Object.values(providerMap)) {
      for (const t of telemList) {
        if (t.latencyMs > maxLatency) maxLatency = t.latencyMs;
        if (t.costUsd > maxCost) maxCost = t.costUsd;
      }
    }

    for (const [key, telemList] of Object.entries(providerMap)) {
      const sampleCount = telemList.length;
      const totalLatency = telemList.reduce((acc, t) => acc + t.latencyMs, 0);
      const totalCost = telemList.reduce((acc, t) => acc + t.costUsd, 0);
      const totalQuality = telemList.reduce((acc, t) => acc + t.qualityScore, 0);
      const successes = telemList.filter((t) => t.success).length;

      const avgLatencyMs = Math.round(totalLatency / sampleCount);
      const avgCostUsd = Number((totalCost / sampleCount).toFixed(6));
      const avgQualityScore = Math.round(totalQuality / sampleCount);
      const successRate = Number((successes / sampleCount).toFixed(3));

      const isColdStart = sampleCount < MIN_SAMPLES_THRESHOLD;

      // Normalization
      const normQuality = avgQualityScore / 100; // 0..1
      const normCost = maxCost > 0 ? Math.min(1, avgCostUsd / maxCost) : 0; // 0..1
      const normLatency = maxLatency > 0 ? Math.min(1, avgLatencyMs / maxLatency) : 0; // 0..1

      // Formula: Score = (0.5 * Quality + 0.3 * (1 - Cost) + 0.2 * (1 - Latency)) * SuccessRate * 100
      let composite = (0.5 * normQuality + 0.3 * (1 - normCost) + 0.2 * (1 - normLatency)) * successRate * 100;
      composite = Math.round(Math.min(100, Math.max(0, composite)));

      const firstItem = telemList[0];
      candidates.push({
        key,
        provider: firstItem.provider,
        model: firstItem.model,
        kind: firstItem.kind,
        sampleCount,
        avgLatencyMs,
        avgCostUsd,
        avgQualityScore,
        successRate,
        compositeScore: composite,
        recommendedOrder: 0,
        isColdStart,
      });
    }

    // Sort by composite score desc
    candidates.sort((a, b) => b.compositeScore - a.compositeScore);
    candidates.forEach((c, idx) => {
      c.recommendedOrder = idx + 1;
    });

    updatedRanks[taskType] = candidates;
  }

  currentState.adaptiveRanks = updatedRanks;
  currentState.lastCalculatedAt = new Date().toISOString();

  if (!state) {
    saveDynamicState(currentState);
  }
  return currentState;
}

/**
 * Re-ranks static routing entries for a task type dynamically using historical telemetry.
 */
export function reorderEntriesAdaptively(taskType: TaskType, staticEntries: RouteEntry[]): { entries: RouteEntry[]; isAdaptive: boolean; telemetrySummary: string } {
  const state = loadDynamicState();
  const ranks = state.adaptiveRanks[taskType];

  if (!ranks || ranks.length === 0) {
    return {
      entries: [...staticEntries],
      isAdaptive: false,
      telemetrySummary: 'Cold-start: Chưa đủ telemetry thực tế, đang dùng quy tắc tĩnh tối ưu mặc định.',
    };
  }

  const scoreMap = new Map<string, number>();
  let hasSufficientSamples = false;

  for (const rank of ranks) {
    const lookupKey = `${rank.provider}:${rank.model || 'default'}`;
    scoreMap.set(lookupKey, rank.compositeScore);
    if (!rank.isColdStart) {
      hasSufficientSamples = true;
    }
  }

  if (!hasSufficientSamples) {
    return {
      entries: [...staticEntries],
      isAdaptive: false,
      telemetrySummary: `Cold-start: Đã ghi nhận ${ranks.reduce((a, r) => a + r.sampleCount, 0)} mẫu, cần thêm để kích hoạt adaptive routing.`,
    };
  }

  // Sort static entries based on dynamic score if available
  const sorted = [...staticEntries].sort((a, b) => {
    const keyA = `${a.provider}:${a.model || 'default'}`;
    const keyB = `${b.provider}:${b.model || 'default'}`;
    const scoreA = scoreMap.has(keyA) ? scoreMap.get(keyA)! : 50; // default middle
    const scoreB = scoreMap.has(keyB) ? scoreMap.get(keyB)! : 50;
    return scoreB - scoreA;
  });

  return {
    entries: sorted,
    isAdaptive: true,
    telemetrySummary: `Adaptive active: Sắp xếp theo hiệu năng thực tế (${ranks.length} model candidates đã đo lường).`,
  };
}

/**
 * Get dynamic router report for management and dashboard.
 */
export function getDynamicRouterReport(): {
  lastCalculatedAt: string;
  totalTelemetryCount: number;
  adaptiveRanks: Partial<Record<TaskType, ProviderAdaptiveRank[]>>;
  recentTelemetry: RouteExecutionTelemetry[];
} {
  const state = loadDynamicState();
  return {
    lastCalculatedAt: state.lastCalculatedAt,
    totalTelemetryCount: state.telemetryHistory.length,
    adaptiveRanks: state.adaptiveRanks,
    recentTelemetry: state.telemetryHistory.slice(-20).reverse(),
  };
}
