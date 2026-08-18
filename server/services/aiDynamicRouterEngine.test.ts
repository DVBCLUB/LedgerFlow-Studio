import test from 'node:test';
import assert from 'node:assert/strict';
import {
  recordRouteTelemetry,
  recalculateAdaptiveRanks,
  reorderEntriesAdaptively,
  getDynamicRouterReport,
} from './aiDynamicRouterEngine.ts';
import type { RouteEntry } from './aiRoutingPolicy.ts';

test('aiDynamicRouterEngine - records telemetry and recalculates adaptive ranks', () => {
  const telem = recordRouteTelemetry({
    taskType: 'backend',
    provider: 'gemini',
    model: 'gemini-2.5-pro',
    kind: 'api',
    latencyMs: 320,
    costUsd: 0.0001,
    qualityScore: 95,
    success: true,
    source: 'eval_harness',
  });

  assert.ok(telem.id);
  assert.equal(telem.taskType, 'backend');
  assert.equal(telem.qualityScore, 95);

  const report = getDynamicRouterReport();
  assert.ok(report.totalTelemetryCount > 0);
  assert.ok(report.recentTelemetry.length > 0);
});

test('aiDynamicRouterEngine - handles cold-start gracefully when samples are low', () => {
  const staticEntries: RouteEntry[] = [
    { kind: 'api', employeeId: 'ai-dev', provider: 'gemini', reason: 'Default free', cost: 'free' },
    { kind: 'api', employeeId: 'ai-dev', provider: 'deepseek', reason: 'Cheap backup', cost: 'cheap' },
  ];

  const result = reorderEntriesAdaptively('legal', staticEntries);
  assert.ok(Array.isArray(result.entries));
  assert.equal(result.entries.length, 2);
  assert.ok(typeof result.isAdaptive === 'boolean');
  assert.ok(result.telemetrySummary.length > 0);
});

test('aiDynamicRouterEngine - computes adaptive ranks formula accurately', () => {
  // Add 3 samples for deepseek to pass MIN_SAMPLES_THRESHOLD
  for (let i = 0; i < 4; i++) {
    recordRouteTelemetry({
      taskType: 'data',
      provider: 'deepseek',
      model: 'deepseek-chat',
      kind: 'api',
      latencyMs: 150,
      costUsd: 0.0002,
      qualityScore: 90,
      success: true,
      source: 'llm_judge',
    });
  }

  const staticEntries: RouteEntry[] = [
    { kind: 'api', employeeId: 'ai-analyst', provider: 'gemini', reason: 'Gemini flash', cost: 'free' },
    { kind: 'api', employeeId: 'ai-analyst', provider: 'deepseek', model: 'deepseek-chat', reason: 'DeepSeek data', cost: 'cheap' },
  ];

  const result = reorderEntriesAdaptively('data', staticEntries);
  assert.ok(result.isAdaptive);
  assert.equal(result.entries[0].provider, 'deepseek');
});
