import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  appendAIWorkforceRunMetric,
  appendAIWorkforceRunMetrics,
  clearAIWorkforceRunMetricStoreForTest,
  getAIWorkforceRunMetricStoreStats,
  listAIWorkforceRunMetrics,
} from './aiWorkforceRunMetricStore.ts';

async function withMetricStore(t: any) {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'ledgerflow-aiw-metrics-'));
  const previous = process.env.AI_WORKFORCE_RUN_METRIC_STORE_FILE;
  process.env.AI_WORKFORCE_RUN_METRIC_STORE_FILE = path.join(directory, 'metrics.json');
  await clearAIWorkforceRunMetricStoreForTest();
  t.after(async () => {
    if (previous === undefined) delete process.env.AI_WORKFORCE_RUN_METRIC_STORE_FILE;
    else process.env.AI_WORKFORCE_RUN_METRIC_STORE_FILE = previous;
    await fs.promises.rm(directory, { recursive: true, force: true });
  });
}

test('AI Workforce run metric store persists, lists, filters, and summarizes metrics', async (t) => {
  await withMetricStore(t);

  await appendAIWorkforceRunMetric({
    id: 'run-1',
    lane: 'mission-control',
    agentRole: 'Software Factory',
    toolId: 'draft_patch',
    status: 'success',
    latencyMs: 120,
    qualityScore: 0.92,
    createdAt: '2026-01-01T00:00:00.000Z',
  });
  await appendAIWorkforceRunMetrics([
    {
      id: 'run-2',
      lane: 'execution-layer',
      agentRole: 'Automation Safety',
      toolId: 'robot_move',
      status: 'blocked',
      latencyMs: 300,
      safetyBlocks: 2,
      createdAt: '2026-01-01T00:01:00.000Z',
    },
  ]);

  const all = await listAIWorkforceRunMetrics();
  assert.equal(all.length, 2);
  assert.equal(all[0].id, 'run-2');

  const mission = await listAIWorkforceRunMetrics({ lane: 'mission-control' });
  assert.equal(mission.length, 1);
  assert.equal(mission[0].id, 'run-1');

  const stats = await getAIWorkforceRunMetricStoreStats();
  assert.equal(stats.total, 2);
  assert.equal(stats.byStatus.success, 1);
  assert.equal(stats.byStatus.blocked, 1);
  assert.equal(stats.byLane['mission-control'], 1);
  assert.equal(stats.latestMetric?.id, 'run-2');
});
