import { readAIUsageLogs, type AIUsageLogEntry } from "./aiUsageLog";

export interface AIUsageProviderMetrics {
  provider: string;
  total: number;
  ok: number;
  quota: number;
  error: number;
  successRate: number;
  avgLatencyMs: number;
  estimatedCostUsd: number;
}

export interface AIUsageMetricsReport {
  generatedAt: string;
  windowHours: number;
  totals: {
    total: number;
    ok: number;
    quota: number;
    error: number;
    successRate: number;
    avgLatencyMs: number;
    p95LatencyMs: number;
    estimatedCostUsd: number;
    promptChars: number;
    outputChars: number;
  };
  providers: AIUsageProviderMetrics[];
}

function toSuccessRate(ok: number, total: number): number {
  if (!total) return 0;
  return Number(((ok / total) * 100).toFixed(2));
}

function toAverage(nums: number[]): number {
  if (!nums.length) return 0;
  return Math.round(nums.reduce((sum, n) => sum + n, 0) / nums.length);
}

function toP95(nums: number[]): number {
  if (!nums.length) return 0;
  const sorted = nums.slice().sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
  return sorted[idx] ?? 0;
}

function estimateCostUsd(entries: AIUsageLogEntry[]): number {
  // Conservative blended estimate for mixed models/providers.
  const inputTokens = entries.reduce((sum, item) => sum + Math.max(0, (item.promptChars ?? 0) / 4), 0);
  const outputTokens = entries.reduce((sum, item) => sum + Math.max(0, (item.outputChars ?? 0) / 4), 0);
  const inputCost = inputTokens * 0.000002;
  const outputCost = outputTokens * 0.000006;
  return Number((inputCost + outputCost).toFixed(6));
}

export async function buildAIUsageMetrics(windowHours = 24): Promise<AIUsageMetricsReport> {
  const logs = await readAIUsageLogs(300);
  const threshold = Date.now() - Math.max(1, windowHours) * 60 * 60 * 1000;
  const scoped = logs.filter((item) => {
    const ts = Date.parse(item.at);
    return Number.isFinite(ts) && ts >= threshold;
  });

  const latencies = scoped.map((item) => item.latencyMs).filter((value) => Number.isFinite(value) && value >= 0);
  const ok = scoped.filter((item) => item.status === "ok").length;
  const quota = scoped.filter((item) => item.status === "quota").length;
  const error = scoped.filter((item) => item.status === "error").length;

  const byProvider = new Map<string, AIUsageLogEntry[]>();
  for (const entry of scoped) {
    const provider = entry.provider || "unknown";
    const list = byProvider.get(provider) || [];
    list.push(entry);
    byProvider.set(provider, list);
  }

  const providers: AIUsageProviderMetrics[] = Array.from(byProvider.entries())
    .map(([provider, entries]) => {
      const total = entries.length;
      const okCount = entries.filter((item) => item.status === "ok").length;
      const quotaCount = entries.filter((item) => item.status === "quota").length;
      const errorCount = entries.filter((item) => item.status === "error").length;
      const avgLatencyMs = toAverage(entries.map((item) => item.latencyMs).filter((value) => Number.isFinite(value) && value >= 0));
      return {
        provider,
        total,
        ok: okCount,
        quota: quotaCount,
        error: errorCount,
        successRate: toSuccessRate(okCount, total),
        avgLatencyMs,
        estimatedCostUsd: estimateCostUsd(entries),
      };
    })
    .sort((a, b) => b.total - a.total || b.successRate - a.successRate);

  return {
    generatedAt: new Date().toISOString(),
    windowHours,
    totals: {
      total: scoped.length,
      ok,
      quota,
      error,
      successRate: toSuccessRate(ok, scoped.length),
      avgLatencyMs: toAverage(latencies),
      p95LatencyMs: toP95(latencies),
      estimatedCostUsd: estimateCostUsd(scoped),
      promptChars: scoped.reduce((sum, item) => sum + (item.promptChars ?? 0), 0),
      outputChars: scoped.reduce((sum, item) => sum + (item.outputChars ?? 0), 0),
    },
    providers,
  };
}
