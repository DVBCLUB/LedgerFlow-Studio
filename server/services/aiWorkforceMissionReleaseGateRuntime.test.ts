import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { planAIWorkforceMission } from './aiWorkforceMissionPlanner.ts';
import { createMissionExecutionQueue } from './aiWorkforceMissionExecutionQueue.ts';
import { saveMissionExecutionQueue, clearMissionExecutionQueueStoreForTest } from './aiWorkforceMissionExecutionQueueStore.ts';
import { saveMissionOperatorReviewNote, clearMissionOperatorReviewNoteStore } from './aiWorkforceMissionReviewNoteStore.ts';
import { clearAIWorkforceRuntimeStoreForTest, listAIWorkforceRuntimeRecords } from './aiWorkforceRuntimeStore.ts';
import { clearAIWorkforceOperationalLedgerForTest, listAIWorkforceAuditEvents } from './aiWorkforceOperationalLedger.ts';
import { clearAIWorkforceRunMetricStoreForTest, listAIWorkforceRunMetrics } from './aiWorkforceRunMetricStore.ts';
import { buildRuntimeMissionReleaseGate } from './aiWorkforceMissionReleaseGateRuntime.ts';
import { getAIWorkforceReleaseGateDashboard } from './aiWorkforceReleaseGateDashboard.ts';

process.env.AI_WORKFORCE_MISSION_QUEUE_STORE_FILE = path.join(os.tmpdir(), `release-gate-q-${process.pid}.json`);
process.env.AI_WORKFORCE_MISSION_REVIEW_NOTE_STORE_FILE = path.join(os.tmpdir(), `release-gate-n-${process.pid}.json`);
process.env.AI_WORKFORCE_RUNTIME_STORE_FILE = path.join(os.tmpdir(), `release-gate-r-${process.pid}.json`);
process.env.AI_WORKFORCE_OPERATIONAL_LEDGER_FILE = path.join(os.tmpdir(), `release-gate-l-${process.pid}.json`);
process.env.AI_WORKFORCE_RUN_METRIC_STORE_FILE = path.join(os.tmpdir(), `release-gate-m-${process.pid}.json`);

async function resetStores() {
  await clearMissionExecutionQueueStoreForTest();
  await clearMissionOperatorReviewNoteStore();
  await clearAIWorkforceRuntimeStoreForTest();
  await clearAIWorkforceOperationalLedgerForTest();
  await clearAIWorkforceRunMetricStoreForTest();
}

async function storedQueue() {
  const plan = planAIWorkforceMission({
    goal: 'Record mission release gate evidence.',
    owner: 'Founder',
    domains: ['runtime'],
    constraints: ['record evidence'],
    allowAutomation: true,
    sources: [{ kind: 'sop', title: 'Gate SOP', content: 'Record gate result, checksum and reviewer note.', tags: ['mission-planner'], confidence: 0.94 }],
  });
  const queue = await saveMissionExecutionQueue(createMissionExecutionQueue(plan, 'Founder'));
  await saveMissionOperatorReviewNote(queue, { reviewer: 'Founder', decision: 'approved', summary: 'Approved.' });
  return queue;
}

test('runtime mission release gate stores record, event, metric and historical timeline', async () => {
  await resetStores();
  const queue = await storedQueue();
  const hold = await buildRuntimeMissionReleaseGate({
    queueId: queue.id,
    actor: 'Founder',
    createdAt: '2026-06-28T00:00:00.000Z',
    evidence: { ciStatus: 'pending', approvals: 0, requiredApprovals: 1 },
  });
  const ready = await buildRuntimeMissionReleaseGate({
    queueId: queue.id,
    actor: 'Founder',
    createdAt: '2026-06-28T00:01:00.000Z',
    evidence: { ciStatus: 'success', approvals: 1, requiredApprovals: 1, snapshotChecksum: 'snapshot_checksum_123', releaseLabel: true, rollbackConfirmed: true, operatorConfirmed: true },
  });

  assert.equal(ready.gate.decision, 'ready');
  assert.equal(ready.runtimeRecord.type, 'mission_release_gate');
  assert.equal(ready.auditEvent.action, 'mission_release_gate_recorded');
  assert.equal(ready.metric.toolId, 'mission_release_gate');

  assert.equal((await listAIWorkforceRuntimeRecords({ type: 'mission_release_gate' })).length, 2);
  assert.equal((await listAIWorkforceAuditEvents())[0].metadata?.checksum, ready.gate.checksum);
  assert.equal((await listAIWorkforceRunMetrics({ lane: 'mission-control' })).some((metric) => metric.toolId === 'mission_release_gate'), true);

  const dashboard = await getAIWorkforceReleaseGateDashboard();
  assert.equal(dashboard.latestDecision, 'ready');
  assert.equal(dashboard.latestReleaseReady, true);
  assert.equal(dashboard.latestChecksum, ready.gate.checksum);
  assert.equal(dashboard.latestMetric?.toolId, 'mission_release_gate');
  assert.equal(dashboard.timeline.length, 2);
  assert.equal(dashboard.timeline[0].decision, 'ready');
  assert.equal(dashboard.timeline.some((item) => item.checksum === hold.gate.checksum && item.decision === 'hold'), true);
});
