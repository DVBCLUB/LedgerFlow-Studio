import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { resetAIRunMetricsForTest } from './aiBenchmarkObservability.ts';
import { createEmergencyStopContract } from './automationSafetyEnvelope.ts';
import { clearAIWorkforceOperationalLedgerForTest } from './aiWorkforceOperationalLedger.ts';
import { clearMissionExecutionQueueStoreForTest } from './aiWorkforceMissionExecutionQueueStore.ts';
import { clearAIWorkforceRunMetricStoreForTest, getAIWorkforceRunMetricStoreStats } from './aiWorkforceRunMetricStore.ts';
import { clearAIWorkforceRuntimeStoreForTest, getAIWorkforceRuntimeStoreStats } from './aiWorkforceRuntimeStore.ts';
import {
  approveRuntimeMissionExecutionStep,
  buildRuntimeGroundedContext,
  buildRuntimeMissionExecutionQueue,
  buildRuntimeMissionPlan,
  buildRuntimePRControlReport,
  cancelRuntimeMissionExecutionQueue,
  completeRuntimeMissionExecutionStep,
  getAIWorkforceRuntimeDashboard,
  listRuntimeMissionExecutionQueues,
  listRuntimeMissionQueueDrift,
  previewRuntimeAutomation,
  repairRuntimeMissionQueueDrift,
  resumeRuntimeMissionExecutionQueue,
  scoreRuntimePRReadiness,
  startRuntimeMissionExecutionStep,
} from './aiWorkforceRuntimeHub.ts';

async function withRuntimeStore(t: any) {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'ledgerflow-aiw-runtime-'));
  const previousRuntime = process.env.AI_WORKFORCE_RUNTIME_STORE_FILE;
  const previousLedger = process.env.AI_WORKFORCE_OPERATIONAL_LEDGER_FILE;
  const previousMetrics = process.env.AI_WORKFORCE_RUN_METRIC_STORE_FILE;
  const previousQueues = process.env.AI_WORKFORCE_MISSION_QUEUE_STORE_FILE;
  process.env.AI_WORKFORCE_RUNTIME_STORE_FILE = path.join(directory, 'runtime.json');
  process.env.AI_WORKFORCE_OPERATIONAL_LEDGER_FILE = path.join(directory, 'ledger.json');
  process.env.AI_WORKFORCE_RUN_METRIC_STORE_FILE = path.join(directory, 'metrics.json');
  process.env.AI_WORKFORCE_MISSION_QUEUE_STORE_FILE = path.join(directory, 'mission-queues.json');
  resetAIRunMetricsForTest();
  await clearAIWorkforceRuntimeStoreForTest();
  await clearAIWorkforceOperationalLedgerForTest();
  await clearAIWorkforceRunMetricStoreForTest();
  await clearMissionExecutionQueueStoreForTest();
  t.after(async () => {
    if (previousRuntime === undefined) delete process.env.AI_WORKFORCE_RUNTIME_STORE_FILE;
    else process.env.AI_WORKFORCE_RUNTIME_STORE_FILE = previousRuntime;
    if (previousLedger === undefined) delete process.env.AI_WORKFORCE_OPERATIONAL_LEDGER_FILE;
    else process.env.AI_WORKFORCE_OPERATIONAL_LEDGER_FILE = previousLedger;
    if (previousMetrics === undefined) delete process.env.AI_WORKFORCE_RUN_METRIC_STORE_FILE;
    else process.env.AI_WORKFORCE_RUN_METRIC_STORE_FILE = previousMetrics;
    if (previousQueues === undefined) delete process.env.AI_WORKFORCE_MISSION_QUEUE_STORE_FILE;
    else process.env.AI_WORKFORCE_MISSION_QUEUE_STORE_FILE = previousQueues;
    resetAIRunMetricsForTest();
    await fs.promises.rm(directory, { recursive: true, force: true });
  });
}

test('AI Workforce Runtime Hub persists context, mission plan, resumable execution queue, safety, PR readiness, PR control, dashboard, MCP telemetry, operational ledger, and run metrics', async (t) => {
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

  const missionInput = {
    goal: 'Ship AI Workforce Runtime Hub PR with approvals, CI, rollback plan and audit evidence.',
    owner: 'Founder',
    domains: ['github', 'software factory', 'runtime'],
    constraints: ['must preserve audit trail'],
    repoFullName: 'DVBCLUB/LedgerFlow-Studio',
    prNumber: 42,
    allowAutomation: true,
    sources: [
      { kind: 'sop' as const, title: 'Mission planning SOP', content: 'Mission plans require tool route, approval checkpoint, source map and audit trail.', tags: ['mission-planner'], confidence: 0.94 },
    ],
  };

  const mission = await buildRuntimeMissionPlan(missionInput);
  assert.equal(mission.contextGuard.ok, true);
  assert.equal(mission.summary.totalSteps, 5);
  assert.ok(mission.approvalCheckpoints.length >= 3);
  assert.ok(mission.steps.some((step) => step.toolId === 'github_pr_control'));

  const execution = await buildRuntimeMissionExecutionQueue(missionInput);
  assert.equal(execution.queue.status, 'needs_approval');
  assert.equal(execution.queue.summary.totalSteps, 5);
  assert.ok(execution.queue.summary.waitingApprovalSteps >= 3);
  const firstWaiting = execution.queue.steps.find((step) => step.status === 'waiting_approval')!;

  const listed = await listRuntimeMissionExecutionQueues();
  assert.equal(listed.queues.length, 1);
  assert.equal(listed.stats.total, 1);

  const resumed = await resumeRuntimeMissionExecutionQueue({ queueId: execution.queue.id, actor: 'Founder' });
  assert.equal(resumed.id, execution.queue.id);

  let queue = await approveRuntimeMissionExecutionStep({ queueId: execution.queue.id, stepId: firstWaiting.id, phrase: firstWaiting.approvalPhrase!, approver: 'Founder' });
  assert.ok(queue.steps.find((step) => step.id === firstWaiting.id)?.approval?.fingerprint.startsWith('approval_'));
  queue = await startRuntimeMissionExecutionStep({ queueId: queue.id, stepId: firstWaiting.id, actor: 'Founder' });
  assert.equal(queue.steps.find((step) => step.id === firstWaiting.id)?.status, 'running');
  queue = await completeRuntimeMissionExecutionStep({
    queueId: queue.id,
    stepId: firstWaiting.id,
    actor: 'Founder',
    evidence: [{ kind: 'operator_note', title: 'Context checkpoint', value: 'Context reviewed and approved.' }],
  });
  assert.equal(queue.summary.completedSteps, 1);
  queue = await cancelRuntimeMissionExecutionQueue({ queueId: queue.id, reason: 'Runtime smoke cancel after checkpoint.', actor: 'Founder' });
  assert.equal(queue.status, 'cancelled');

  const driftReport = await listRuntimeMissionQueueDrift({ limit: 50 });
  assert.ok(Array.isArray(driftReport.issues));
  const driftRepair = await repairRuntimeMissionQueueDrift({ limit: 50 });
  assert.ok(Array.isArray(driftRepair.issues));

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
  assert.ok(dashboard.observability.runs >= 10);
  assert.ok(dashboard.storeStats.total >= 10);
  assert.ok(dashboard.metricStoreStats.total >= 10);
  assert.equal(dashboard.missionQueueStats.total, 1);
  assert.equal(dashboard.missionQueueStats.byStatus.cancelled, 1);
  assert.equal(dashboard.readiness.rows.length, 8);
  assert.ok(dashboard.tooling.summary.total >= 10);
  assert.ok(dashboard.tooling.manifests.some((manifest: any) => manifest.id === 'robot_move' && manifest.approval.required));
  assert.ok(dashboard.tooling.health.some((row: any) => row.toolId === 'robot_move'));
  assert.ok(dashboard.ledger.graphStats.totalGraphs >= 3);
  assert.ok(dashboard.ledger.auditStats.totalEvents >= 10);
  assert.ok(dashboard.ledger.auditStats.latestEvents.some((event: any) => event.action === 'mission_execution_cancelled'));
  assert.ok(dashboard.ledger.trendStats.totalSnapshots >= 1);
  assert.equal(dashboard.storeStats.storage.driver, 'json-file');
  assert.equal(dashboard.metricStoreStats.storage.driver, 'json-file');
  assert.equal(dashboard.missionQueueStats.storage.driver, 'json-file');
  assert.equal(dashboard.ledger.storage.driver, 'json-file');

  const stats = await getAIWorkforceRuntimeStoreStats();
  assert.ok(stats.byType.context_pack >= 1);
  assert.ok(stats.byType.mission_plan >= 1);
  assert.ok(stats.byType.mission_execution_queue >= 5);
  assert.ok(stats.byType.safety_decision >= 1);
  assert.ok(stats.byType.pr_readiness >= 1);
  assert.ok(stats.byType.pr_control >= 1);
  assert.ok(stats.byType.runtime_snapshot >= 1);
  assert.ok(stats.storage.bytes > 0);

  const metricStats = await getAIWorkforceRunMetricStoreStats();
  assert.ok(metricStats.byLane['knowledge-spine'] >= 1);
  assert.ok(metricStats.byLane['execution-layer'] >= 1);
  assert.ok(metricStats.byLane['mission-control'] >= 8);
  assert.ok(metricStats.storage.bytes > 0);
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
