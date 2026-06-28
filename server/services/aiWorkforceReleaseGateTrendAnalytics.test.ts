import './aiWorkforceReleaseGateExport.test.ts';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { planAIWorkforceMission } from './aiWorkforceMissionPlanner.ts';
import { createMissionExecutionQueue } from './aiWorkforceMissionExecutionQueue.ts';
import { saveMissionExecutionQueue, clearMissionExecutionQueueStoreForTest } from './aiWorkforceMissionExecutionQueueStore.ts';
import { saveMissionOperatorReviewNote, clearMissionOperatorReviewNoteStore } from './aiWorkforceMissionReviewNoteStore.ts';
import { clearAIWorkforceRuntimeStoreForTest } from './aiWorkforceRuntimeStore.ts';
import { clearAIWorkforceOperationalLedgerForTest } from './aiWorkforceOperationalLedger.ts';
import { clearAIWorkforceRunMetricStoreForTest } from './aiWorkforceRunMetricStore.ts';
import { buildRuntimeMissionReleaseGate } from './aiWorkforceMissionReleaseGateRuntime.ts';
import { getAIWorkforceReleaseGateDashboard } from './aiWorkforceReleaseGateDashboard.ts';

process.env.AI_WORKFORCE_MISSION_QUEUE_STORE_FILE = path.join(os.tmpdir(), `release-gate-trend-q-${process.pid}.json`);
process.env.AI_WORKFORCE_MISSION_REVIEW_NOTE_STORE_FILE = path.join(os.tmpdir(), `release-gate-trend-n-${process.pid}.json`);
process.env.AI_WORKFORCE_RUNTIME_STORE_FILE = path.join(os.tmpdir(), `release-gate-trend-r-${process.pid}.json`);
process.env.AI_WORKFORCE_OPERATIONAL_LEDGER_FILE = path.join(os.tmpdir(), `release-gate-trend-l-${process.pid}.json`);
process.env.AI_WORKFORCE_RUN_METRIC_STORE_FILE = path.join(os.tmpdir(), `release-gate-trend-m-${process.pid}.json`);

async function resetStores() {
  await clearMissionExecutionQueueStoreForTest();
  await clearMissionOperatorReviewNoteStore();
  await clearAIWorkforceRuntimeStoreForTest();
  await clearAIWorkforceOperationalLedgerForTest();
  await clearAIWorkforceRunMetricStoreForTest();
}

async function queue() {
  const plan = planAIWorkforceMission({
    goal: 'Trend release gate analytics.',
    owner: 'Founder',
    domains: ['runtime'],
    constraints: ['trend analytics'],
    allowAutomation: true,
    sources: [{ kind: 'sop', title: 'Trend SOP', content: 'Track release gate trend analytics.', tags: ['mission-planner'], confidence: 0.94 }],
  });
  const q = await saveMissionExecutionQueue(createMissionExecutionQueue(plan, 'Founder'));
  await saveMissionOperatorReviewNote(q, { reviewer: 'Founder', decision: 'approved', summary: 'Approved.' });
  return q;
}

test('release gate dashboard computes trend analytics', async () => {
  await resetStores();
  const q = await queue();
  await buildRuntimeMissionReleaseGate({ queueId: q.id, createdAt: '2026-06-28T00:00:00.000Z', evidence: { ciStatus: 'pending', approvals: 0, requiredApprovals: 1 } });
  await buildRuntimeMissionReleaseGate({ queueId: q.id, createdAt: '2026-06-28T00:01:00.000Z', evidence: { ciStatus: 'success', approvals: 1, requiredApprovals: 1, snapshotChecksum: 'checksum', releaseLabel: true, rollbackConfirmed: true, operatorConfirmed: true } });
  const dashboard = await getAIWorkforceReleaseGateDashboard();

  assert.equal(dashboard.trendAnalytics.total, 2);
  assert.equal(dashboard.trendAnalytics.readyCount, 1);
  assert.equal(dashboard.trendAnalytics.holdCount, 1);
  assert.equal(dashboard.trendAnalytics.readyRate, 0.5);
  assert.equal(dashboard.trendAnalytics.trendDirection, 'improving');
  assert.equal(dashboard.trendAnalytics.decisionBreakdown.ready, 1);
  assert.equal(dashboard.trendAnalytics.decisionBreakdown.hold, 1);
});
