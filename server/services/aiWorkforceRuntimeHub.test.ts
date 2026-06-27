import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { resetAIRunMetricsForTest } from './aiBenchmarkObservability.ts';
import { createEmergencyStopContract } from './automationSafetyEnvelope.ts';
import { clearAIWorkforceOperationalLedgerForTest } from './aiWorkforceOperationalLedger.ts';
import { clearAIWorkforceRunMetricStoreForTest, getAIWorkforceRunMetricStoreStats } from './aiWorkforceRunMetricStore.ts';
import { clearAIWorkforceRuntimeStoreForTest, getAIWorkforceRuntimeStoreStats } from './aiWorkforceRuntimeStore.ts';
import {
  buildRuntimeGroundedContext,
  buildRuntimePRControlReport,
  getAIWorkforceRuntimeDashboard,
  previewRuntimeAutomation,
  scoreRuntimePRReadiness,
} from './aiWorkforceRuntimeHub.ts';

async function withRuntimeStore(t: any) {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'ledgerflow-aiw-runtime-'));
  const previousRuntime = process.env.AI_WORKFORCE_RUNTIME_STORE_FILE;
  const previousLedger = process.env.AI_WORKFORCE_OPERATIONAL_LEDGER_FILE;
  const previousMetrics = process.env.AI_WORKFORCE_RUN_METRIC_STORE_FILE;
  process.env.AI_WORKFORCE_RUNTIME_STORE_FILE = path.join(directory, 'runtime.json');
  process.env.AI_WORKFORCE_OPERATIONAL_LEDGER_FILE = path.join(directory, 'ledger.json');
  process.env.AI_WORKFORCE_RUN_METRIC_STORE_FILE = path.join(directory, 'metrics.json');
  resetAIRunMetricsForTest();
  await clearAIWorkforceRuntimeStoreForTest();
  await clearAIWorkforceOperationalLedgerForTest();
  await clearAIWorkforceRunMetricStoreForTest();
  t.after(async () => {
    if (previousRuntime === undefined) delete process.env.AI_WORKFORCE_RUNTIME_STORE_FILE;
    else process.env.AI_WORKFORCE_RUNTIME_STORE_FILE = previousRuntime;
    if (previousLedger === undefined) delete process.env.AI_WORKFORCE_OPERATIONAL_LEDGER_FILE;
    else process.env.AI_WORKFORCE_OPERATIONAL_LEDGER_FILE = previousLedger;
    if (previousMetrics === undefined) delete process.env.AI_WORKFORCE_RUN_METRIC_STORE_FILE;
    else process.env.AI_WORKFORCE_RUN_METRIC_STORE_FILE = previousMetrics;
    resetAIRunMetricsForTest();
    await fs.promises.rm(directory, { recursive: true, force: true });
  });
}

test('AI Workforce Runtime Hub persists context, safety, PR readiness, PR control, dashboard, MCP telemetry, operational ledger, and run metrics', async (t) => {
  await withRuntimeStore(t);

  const context = await buildRuntimeGroundedContext({
    question: 'AI Workforce memory grounding',
    highImpact: true,
    sources: [
      { kind: 'decision', title: 'Grounded Context', content: 'Use source map, confidence, contradiction flags.', tags: ['ai-workforce'], confidence: 0.9 },
    ],
  });
  assert.equal(context.guard.ok, true);
  assert.equal(context.pack.sourceMap.length, 1);

  const safety = await previewRuntimeAutomation({
    id: 'robot-safe-runtime',
    surface: 'robot',
    title: 'Robot simulation move',
    allowedTargets: ['robot://simulator/arm-a'],
    labOnly: true,
    humanCheckpoint: true,
    emergencyStop: createEmergencyStopContract(),
    actions: [{ id: 'move-1', type: 'move', target: 'robot://simulator/arm-a/joint-1' }],
  });
  assert.equal(safety.approved, true);
  assert.equal(safety.mode, 'lab_only');

  const readiness = await scoreRuntimePRReadiness({
    title: 'Runtime PR readiness smoke',
    changedFiles: [{ filename: 'src/modules/ai-hr/AIWorkforceCommandCenter.tsx', additions: 20, deletions: 1 }],
    checks: [{ name: 'test', status: 'success' }],
    ciLogSummary: 'Tests passed.',
    hasRollbackPlan: true,
  });
  assert.equal(readiness.verdict, 'ready');

  const prControl = await buildRuntimePRControlReport({
    id: '42',
    title: 'Runtime Hub PR Control smoke',
    baseBranch: 'main',
    headBranch: 'ai-workforce-implementation',
    changedFiles: [{ filename: 'src/modules/ai-hr/AIWorkforceRuntimePanel.tsx', additions: 24, deletions: 1 }],
    checks: [{ name: 'npm test', status: 'success' }],
    ciLogSummary: 'All checks passed.',
    hasRollbackPlan: true,
    hasHumanApproval: true,
    requestedReviewers: ['founder'],
    labels: ['runtime'],
  });
  assert.equal(prControl.mergeGate.allowed, true);
  assert.equal(prControl.mergeGate.mode, 'auto_merge_ready');

  const dashboard = await getAIWorkforceRuntimeDashboard();
  assert.ok(dashboard.observability.runs >= 4);
  assert.ok(dashboard.storeStats.total >= 4);
  assert.ok(dashboard.metricStoreStats.total >= 4);
  assert.equal(dashboard.readiness.rows.length, 8);
  assert.ok(dashboard.tooling.summary.total >= 10);
  assert.ok(dashboard.tooling.manifests.some((manifest: any) => manifest.id === 'robot_move' && manifest.approval.required));
  assert.ok(dashboard.tooling.health.some((row: any) => row.toolId === 'robot_move'));
  assert.ok(dashboard.ledger.graphStats.totalGraphs >= 1);
  assert.ok(dashboard.ledger.auditStats.totalEvents >= 4);
  assert.ok(dashboard.ledger.trendStats.totalSnapshots >= 1);

  const stats = await getAIWorkforceRuntimeStoreStats();
  assert.ok(stats.byType.context_pack >= 1);
  assert.ok(stats.byType.safety_decision >= 1);
  assert.ok(stats.byType.pr_readiness >= 2);
  assert.ok(stats.byType.runtime_snapshot >= 1);

  const metricStats = await getAIWorkforceRunMetricStoreStats();
  assert.ok(metricStats.byLane['knowledge-spine'] >= 1);
  assert.ok(metricStats.byLane['execution-layer'] >= 1);
  assert.ok(metricStats.byLane['mission-control'] >= 2);
});

test('AI Workforce Runtime Hub blocks high-impact context with contradictions', async (t) => {
  await withRuntimeStore(t);

  const result = await buildRuntimeGroundedContext({
    question: 'Robot policy',
    highImpact: true,
    sources: [
      { kind: 'sop', title: 'Robot SOP', content: 'Robot movement requires approval.', facts: { robot_policy: 'approval_required' } },
      { kind: 'runtime', title: 'Runtime Policy', content: 'Robot movement is automatic.', facts: { robot_policy: 'auto_allowed' } },
    ],
  });

  assert.equal(result.guard.ok, false);
  assert.ok(result.pack.contradictions.length >= 1);
});
