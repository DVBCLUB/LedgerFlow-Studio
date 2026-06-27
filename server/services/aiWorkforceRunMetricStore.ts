import fs from 'node:fs/promises';
import path from 'node:path';
import type { AIRunMetric } from './aiBenchmarkObservability.ts';

interface AIRunMetricStoreFile {
  version: 1;
  metrics: Record<string, AIRunMetric>;
}

const DEFAULT_STORE_FILE = 'ai_workforce_run_metrics.local.json';
let saveQueue = Promise.resolve();

function storeFilePath() {
  return path.resolve(process.env.AI_WORKFORCE_RUN_METRIC_STORE_FILE || DEFAULT_STORE_FILE);
}

async function emptyStore(): Promise<AIRunMetricStoreFile> {
  return { version: 1, metrics: {} };
}

async function loadStore(): Promise<AIRunMetricStoreFile> {
  try {
    const raw = await fs.readFile(storeFilePath(), 'utf8');
    const parsed = JSON.parse(raw) as AIRunMetricStoreFile;
    return {
      version: 1,
      metrics: parsed.metrics || {},
    };
  } catch (error: any) {
    if (error?.code === 'ENOENT') return emptyStore();
    throw error;
  }
}

async function saveStore(store: AIRunMetricStoreFile) {
  const file = storeFilePath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tempFile = `${file}.tmp`;
  await fs.writeFile(tempFile, JSON.stringify(store, null, 2));
  await fs.rename(tempFile, file);
}

async function mutateStore(mutator: (store: AIRunMetricStoreFile) => void | Promise<void>) {
  saveQueue = saveQueue.then(async () => {
    const store = await loadStore();
    await mutator(store);
    await saveStore(store);
  });
  await saveQueue;
}

export async function appendAIWorkforceRunMetric(metric: AIRunMetric) {
  await mutateStore((store) => {
    store.metrics[metric.id] = { ...metric };
  });
  return metric;
}

export async function appendAIWorkforceRunMetrics(metrics: AIRunMetric[]) {
  await mutateStore((store) => {
    for (const metric of metrics) store.metrics[metric.id] = { ...metric };
  });
  return metrics;
}

export async function listAIWorkforceRunMetrics(options: { limit?: number; lane?: string } = {}) {
  const store = await loadStore();
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

  return {
    total: metrics.length,
    lanes,
    byStatus,
    byLane,
    latestMetric: metrics[0] || null,
  };
}

export async function clearAIWorkforceRunMetricStoreForTest() {
  await mutateStore((store) => {
    store.metrics = {};
  });
}
