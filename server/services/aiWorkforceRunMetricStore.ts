import type { AIRunMetric } from './aiBenchmarkObservability.ts';
import { createJsonFileLocalStore } from './aiWorkforceLocalStore.ts';

interface AIRunMetricStoreFile extends Record<string, unknown> {
  version: 1;
  metrics: Record<string, AIRunMetric>;
}

const DEFAULT_STORE_FILE = 'ai_workforce_run_metrics.local.json';

const metricStore = createJsonFileLocalStore<AIRunMetricStoreFile>({
  filePath: () => process.env.AI_WORKFORCE_RUN_METRIC_STORE_FILE || DEFAULT_STORE_FILE,
  emptyState: () => ({ version: 1, metrics: {} }),
  normalizeState: (parsed) => {
    const candidate = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Partial<AIRunMetricStoreFile> : {};
    return {
      version: 1,
      metrics: candidate.metrics && typeof candidate.metrics === 'object' ? candidate.metrics : {},
    };
  },
});

export async function appendAIWorkforceRunMetric(metric: AIRunMetric) {
  await metricStore.mutate((store) => {
    store.metrics[metric.id] = { ...metric };
  });
  return metric;
}

export async function appendAIWorkforceRunMetrics(metrics: AIRunMetric[]) {
  await metricStore.mutate((store) => {
    for (const metric of metrics) store.metrics[metric.id] = { ...metric };
  });
  return metrics;
}

export async function listAIWorkforceRunMetrics(options: { limit?: number; lane?: string } = {}) {
  const store = await metricStore.read();
  return Object.values(store.metrics)
    .filter((metric) => !options.lane || metric.lane === options.lane)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, options.limit || 500)
    .map((metric) => ({ ...metric }));
}

export async function getAIWorkforceRunMetricStoreStats() {
  const metrics = await listAIWorkforceRunMetrics({ limit: 100000 });
  const lanes = Array.from(new Set(metrics.map((metric) => metric.lane))).sort();
  const byStatus = metrics.reduce<Record<string, number>>((acc, metric) => {
    acc[metric.status] = (acc[metric.status] || 0) + 1;
    return acc;
  }, {});
  const byLane = metrics.reduce<Record<string, number>>((acc, metric) => {
    acc[metric.lane] = (acc[metric.lane] || 0) + 1;
    return acc;
  }, {});
  const storage = await metricStore.stats();

  return {
    total: metrics.length,
    lanes,
    byStatus,
    byLane,
    latestMetric: metrics[0] || null,
    storage,
  };
}

export async function clearAIWorkforceRunMetricStoreForTest() {
  await metricStore.clear();
}
