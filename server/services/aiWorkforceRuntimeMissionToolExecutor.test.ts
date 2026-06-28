import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { resetAIRunMetricsForTest } from './aiBenchmarkObservability.ts';
import { clearAIWorkforceOperationalLedgerForTest } from './aiWorkforceOperationalLedger.ts';
import { clearMissionExecutionQueueStoreForTest } from './aiWorkforceMissionExecutionQueueStore.ts';
import { clearAIWorkforceRunMetricStoreForTest } from './aiWorkforceRunMetricStore.ts';
import { clearAIWorkforceRuntimeStoreForTest, getAIWorkforceRuntimeStoreStats } from './aiWorkforceRuntimeStore.ts';
import {
  approveRuntimeMissionExecutionStep,
  buildRuntimeMissionExecutionQueue,
  executeRuntimeMissionStepToolSimulation,
  getAIWorkforceRuntimeDashboard,
  previewRuntimeMissionStepToolExecution,
} from './aiWorkforceRuntimeHub.ts';

async function withRuntimeStores(t: any) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'ledgerflow-aiw-tool-runtime-'));
  const previousRuntime = process.env.AI_WORKFORCE_RUNTIME_STORE_FILE;
  const previousLedger = process.env.AI_WORKFORCE_OPERATIONAL_LEDGER_FILE;
  const previousMetrics = process.env.AI_WORKFORCE_RUN_METRIC_STORE_FILE;
  const previousQueues = process.env.AI_WORKFORCE_MISSION_QUEUE_STORE_FILE;
  process.env.AI_WORKFORCE_RUNTIME_STORE_FILE = path.join(directory, 'runtime.json');
  process.env.AI_WORKFORCE_OPERATIONAL_LEDGER_FILE = path.join(directory, 'ledger.json');
  process.env.AI_WORKFORCE_RUN_METRIC_STORE_FILE = path.join(directory, 'metrics.json');
  process.env.AI_WORKFORCE_MISSION_QUEUE_STORE_FILE = path.join(directory, 'queues.json');
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
    await fs.rm(directory, { recursive: true, force: true });
  });
}

function missionInput() {
  return {
    goal: 'Ship AI Workforce queue tool execution with dry-run adapter, safety gate, CI evidence and audit trail.',
    owner: 'Founder',
    domains: ['github', 'software factory', 'runtime'],
    constraints: ['must require approval before execution'],
    repoFullName: 'DVBCLUB/LedgerFlow-Studio',
    prNumber: 42,
    allowAutomation: true,
    sources: [
      { kind: 'sop' as const, title: 'Runtime Tool Executor SOP', content: 'Runtime tool execution must dry-run, pass safety envelope, capture approval and complete queue steps with evidence.', tags: ['mission-planner'], confidence: 0.94 },
    ],
  };
}

test('runtime mission tool executor previews and executes queue steps with persistent records', async (t) => {
  await withRuntimeStores(t);

  const { queue } = await buildRuntimeMissionExecutionQueue(missionInput());
  const waiting = queue.steps.find((step) => step.status === 'waiting_approval')!;
  const approvedQueue = await approveRuntimeMissionExecutionStep({ queueId: queue.id, stepId: waiting.id, phrase: waiting.approvalPhrase!, approver: 'Founder' });
  const ready = approvedQueue.steps.find((step) => step.id === waiting.id)!;

  const preview = await previewRuntimeMissionStepToolExecution({ queueId: queue.id, stepId: ready.id, actor: 'Founder' });
  assert.equal(preview.mode, 'dry_run');
  assert.equal(preview.safetyDecision.approved, true);
  assert.equal(preview.replayArtifact.status, 'preview');
  assert.ok(preview.replayArtifact.timeline.length >= 1);

  const executed = await executeRuntimeMissionStepToolSimulation({ queueId: queue.id, stepId: ready.id, actor: 'Founder' });
  assert.equal(executed.result.status, 'executed');
  assert.equal(executed.result.replayArtifact.status, 'executed');
  assert.equal(executed.result.replayArtifact.fingerprint, executed.result.preview.fingerprint);
  assert.equal(executed.queue.summary.completedSteps, 1);
  assert.ok(executed.queue.steps.find((step) => step.id === ready.id)?.evidence.some((item) => item.title === 'Execution fingerprint'));

  const dashboard = await getAIWorkforceRuntimeDashboard();
  assert.ok(dashboard.ledger.auditStats.latestEvents.some((event: any) => event.action === 'mission_tool_executed'));
  assert.ok(dashboard.metricStoreStats.byLane['mission-control'] >= 4);

  const stats = await getAIWorkforceRuntimeStoreStats();
  assert.ok(stats.byType.mission_tool_execution >= 2);
});
