/**
 * aiObservabilityService.ts
 * ──────────────────────────────────────────────────────────────────
 * AI metrics collection and observability service for LedgerFlow Studio.
 *
 * Tracks:
 *  - Latency per AI model call
 *  - Token usage per agent role
 *  - Error rates by model provider
 *  - Cost estimation in VND
 *  - Aggregate statistics by time window
 * ──────────────────────────────────────────────────────────────────
 */

import { randomUUID } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AIProvider = 'openai' | 'gemini' | 'anthropic' | 'groq' | 'openrouter' | 'local' | 'unknown';
export type AICallStatus = 'success' | 'error' | 'timeout' | 'rate_limited';

export interface AIMetricRecord {
  id: string;
  timestamp: string;
  provider: AIProvider;
  model: string;
  agentRole?: string;
  taskType?: string;
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  estimatedCostVnd: number;
  status: AICallStatus;
  errorCode?: string;
}

export interface AIMetricsSummary {
  window: 'hour' | 'day' | 'week' | 'month';
  from: string;
  to: string;
  totalCalls: number;
  successCalls: number;
  errorCalls: number;
  successRate: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  totalTokens: number;
  totalCostUsd: number;
  totalCostVnd: number;
  costByProvider: Record<string, number>;
  callsByProvider: Record<string, number>;
  callsByAgentRole: Record<string, number>;
  latencyByProvider: Record<string, number>;
  errorsByProvider: Record<string, number>;
  topModels: Array<{ model: string; calls: number; avgLatencyMs: number; totalCostVnd: number }>;
}

// ─── Cost Estimation ──────────────────────────────────────────────────────────

/** USD/1K tokens pricing map — update when provider prices change */
const MODEL_PRICING: Record<string, { promptPer1k: number; completionPer1k: number }> = {
  'gpt-4o': { promptPer1k: 0.005, completionPer1k: 0.015 },
  'gpt-4o-mini': { promptPer1k: 0.00015, completionPer1k: 0.0006 },
  'gpt-4-turbo': { promptPer1k: 0.01, completionPer1k: 0.03 },
  'claude-3-5-sonnet': { promptPer1k: 0.003, completionPer1k: 0.015 },
  'claude-3-haiku': { promptPer1k: 0.00025, completionPer1k: 0.00125 },
  'gemini-1.5-pro': { promptPer1k: 0.00125, completionPer1k: 0.005 },
  'gemini-1.5-flash': { promptPer1k: 0.000075, completionPer1k: 0.0003 },
  'gemini-2.0-flash': { promptPer1k: 0.0001, completionPer1k: 0.0004 },
  'llama-3.1-70b': { promptPer1k: 0.00059, completionPer1k: 0.00079 },
  'mixtral-8x7b': { promptPer1k: 0.00024, completionPer1k: 0.00024 },
};

const USD_TO_VND = 25_400; // approximate rate — update periodically

function estimateCost(model: string, promptTokens: number, completionTokens: number): { usd: number; vnd: number } {
  const pricing = MODEL_PRICING[model.toLowerCase()];
  if (!pricing) {
    // Default conservative estimate for unknown models
    const usd = (promptTokens / 1000) * 0.002 + (completionTokens / 1000) * 0.006;
    return { usd, vnd: Math.round(usd * USD_TO_VND) };
  }
  const usd = (promptTokens / 1000) * pricing.promptPer1k + (completionTokens / 1000) * pricing.completionPer1k;
  return { usd, vnd: Math.round(usd * USD_TO_VND) };
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const MAX_RECORDS = 10_000;

function storageFile() {
  return path.resolve(process.cwd(), process.env.AI_OBSERVABILITY_FILE || 'ai_observability.local.json');
}

function readRecords(): AIMetricRecord[] {
  try {
    if (!fs.existsSync(storageFile())) return [];
    return JSON.parse(fs.readFileSync(storageFile(), 'utf-8')) as AIMetricRecord[];
  } catch {
    return [];
  }
}

function writeRecords(records: AIMetricRecord[]): void {
  try {
    fs.writeFileSync(storageFile(), JSON.stringify(records.slice(0, MAX_RECORDS), null, 2), 'utf-8');
  } catch (err) {
    console.error('[AIObservability] Failed to write metrics:', err);
  }
}

// ─── Record Tracking ──────────────────────────────────────────────────────────

export function recordAICall(input: {
  provider: AIProvider;
  model: string;
  agentRole?: string;
  taskType?: string;
  latencyMs: number;
  promptTokens?: number;
  completionTokens?: number;
  status: AICallStatus;
  errorCode?: string;
}): AIMetricRecord {
  const promptTokens = input.promptTokens ?? 0;
  const completionTokens = input.completionTokens ?? 0;
  const cost = estimateCost(input.model, promptTokens, completionTokens);

  const record: AIMetricRecord = {
    id: `obs_${randomUUID()}`,
    timestamp: new Date().toISOString(),
    provider: input.provider,
    model: input.model,
    agentRole: input.agentRole,
    taskType: input.taskType,
    latencyMs: input.latencyMs,
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    estimatedCostUsd: cost.usd,
    estimatedCostVnd: cost.vnd,
    status: input.status,
    errorCode: input.errorCode,
  };

  const records = readRecords();
  records.unshift(record);
  writeRecords(records);

  return record;
}

// ─── Summary Computation ──────────────────────────────────────────────────────

function windowToMs(window: AIMetricsSummary['window']): number {
  switch (window) {
    case 'hour': return 60 * 60 * 1_000;
    case 'day': return 24 * 60 * 60 * 1_000;
    case 'week': return 7 * 24 * 60 * 60 * 1_000;
    case 'month': return 30 * 24 * 60 * 60 * 1_000;
  }
}

export function getAIMetricsSummary(window: AIMetricsSummary['window'] = 'day'): AIMetricsSummary {
  const to = new Date();
  const from = new Date(to.getTime() - windowToMs(window));
  const records = readRecords().filter((r) => new Date(r.timestamp) >= from);

  const successCalls = records.filter((r) => r.status === 'success').length;
  const latencies = records.map((r) => r.latencyMs).sort((a, b) => a - b);
  const avgLatencyMs = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
  const p95LatencyMs = latencies.length ? latencies[Math.floor(latencies.length * 0.95)] ?? 0 : 0;

  const costByProvider: Record<string, number> = {};
  const callsByProvider: Record<string, number> = {};
  const callsByAgentRole: Record<string, number> = {};
  const latencyByProvider: Record<string, { total: number; count: number }> = {};
  const errorsByProvider: Record<string, number> = {};
  const modelStats: Record<string, { calls: number; latencyTotal: number; costVnd: number }> = {};

  for (const r of records) {
    costByProvider[r.provider] = (costByProvider[r.provider] ?? 0) + r.estimatedCostVnd;
    callsByProvider[r.provider] = (callsByProvider[r.provider] ?? 0) + 1;
    if (r.agentRole) callsByAgentRole[r.agentRole] = (callsByAgentRole[r.agentRole] ?? 0) + 1;
    if (!latencyByProvider[r.provider]) latencyByProvider[r.provider] = { total: 0, count: 0 };
    latencyByProvider[r.provider].total += r.latencyMs;
    latencyByProvider[r.provider].count += 1;
    if (r.status !== 'success') errorsByProvider[r.provider] = (errorsByProvider[r.provider] ?? 0) + 1;
    if (!modelStats[r.model]) modelStats[r.model] = { calls: 0, latencyTotal: 0, costVnd: 0 };
    modelStats[r.model].calls += 1;
    modelStats[r.model].latencyTotal += r.latencyMs;
    modelStats[r.model].costVnd += r.estimatedCostVnd;
  }

  const latencyByProviderAvg: Record<string, number> = {};
  for (const [k, v] of Object.entries(latencyByProvider)) {
    latencyByProviderAvg[k] = v.count ? Math.round(v.total / v.count) : 0;
  }

  const topModels = Object.entries(modelStats)
    .map(([model, stats]) => ({
      model,
      calls: stats.calls,
      avgLatencyMs: stats.calls ? Math.round(stats.latencyTotal / stats.calls) : 0,
      totalCostVnd: Math.round(stats.costVnd),
    }))
    .sort((a, b) => b.calls - a.calls)
    .slice(0, 10);

  return {
    window,
    from: from.toISOString(),
    to: to.toISOString(),
    totalCalls: records.length,
    successCalls,
    errorCalls: records.length - successCalls,
    successRate: records.length ? Math.round((successCalls / records.length) * 100) : 100,
    avgLatencyMs,
    p95LatencyMs,
    totalTokens: records.reduce((sum, r) => sum + r.totalTokens, 0),
    totalCostUsd: records.reduce((sum, r) => sum + r.estimatedCostUsd, 0),
    totalCostVnd: Math.round(records.reduce((sum, r) => sum + r.estimatedCostVnd, 0)),
    costByProvider,
    callsByProvider,
    callsByAgentRole,
    latencyByProvider: latencyByProviderAvg,
    errorsByProvider,
    topModels,
  };
}

export function getRecentAIMetrics(limit = 100): AIMetricRecord[] {
  return readRecords().slice(0, limit);
}

export function clearAIMetrics(): void {
  writeRecords([]);
}

export function getAICostTrend(days = 7): Array<{ date: string; totalCostVnd: number; totalCalls: number }> {
  const records = readRecords();
  const trend: Record<string, { costVnd: number; calls: number }> = {};

  for (let d = 0; d < days; d++) {
    const date = new Date(Date.now() - d * 24 * 60 * 60 * 1_000).toISOString().slice(0, 10);
    trend[date] = { costVnd: 0, calls: 0 };
  }

  for (const r of records) {
    const date = r.timestamp.slice(0, 10);
    if (trend[date]) {
      trend[date].costVnd += r.estimatedCostVnd;
      trend[date].calls += 1;
    }
  }

  return Object.entries(trend)
    .map(([date, stats]) => ({ date, totalCostVnd: Math.round(stats.costVnd), totalCalls: stats.calls }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
