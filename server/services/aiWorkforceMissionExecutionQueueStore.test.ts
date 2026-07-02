import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { planAIWorkforceMission } from './aiWorkforceMissionPlanner.ts';
import {
  approveStoredMissionExecutionStep,
  cancelStoredMissionExecutionQueue,
  clearMissionExecutionQueueStoreForTest,
  completeStoredMissionExecutionStep,
  createAndSaveMissionExecutionQueue,
  getMissionExecutionQueue,
  getMissionExecutionQueueStoreStats,
  getMissionQueueRuntimeDriftReport,
  listMissionExecutionQueues,
  startStoredMissionExecutionStep,
} from './aiWorkforceMissionExecutionQueueStore.ts';

async function withQueueStore(t: any) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'ledgerflow-aiw-mission-queue-'));
  const previous = process.env.AI_WORKFORCE_MISSION_QUEUE_STORE_FILE;
  process.env.AI_WORKFORCE_MISSION_QUEUE_STORE_FILE = path.join(directory, 'mission-queues.json');
  await clearMissionExecutionQueueStoreForTest();
  t.after(async () => {
    if (previous === undefined) delete process.env.AI_WORKFORCE_MISSION_QUEUE_STORE_FILE;
    else process.env.AI_WORKFORCE_MISSION_QUEUE_STORE_FILE = previous;
    await fs.rm(directory, { recursive: true, force: true });
  });
}

function plan() {
  return planAIWorkforceMission({
    goal: 'Ship a GitHub pull request with CI evidence, rollback plan, approval checkpoints and audit trail.',
    owner: 'Founder',
    domains: ['github', 'runtime'],
    constraints: ['require approval before execution'],
    repoFullName: 'DVBCLUB/LedgerFlow-Studio',
    prNumber: 42,
    allowAutomation: true,
    sources: [
      { kind: 'sop', title: 'Persistent Queue SOP', content: 'Queue persistence must support resume, approve, start, complete and cancel after daemon restart.', tags: ['mission-planner'], confidence: 0.94 },
    ],
  });
}

test('persistent mission queue store saves, lists and resumes queues across step transitions', async (t) => {
  await withQueueStore(t);

  let queue = await createAndSaveMissionExecutionQueue(plan(), 'Founder');
  assert.equal(queue.status, 'needs_approval');
  assert.equal((await listMissionExecutionQueues()).length, 1);

  const waiting = queue.steps.find((step) => step.status === 'waiting_approval')!;
  queue = await approveStoredMissionExecutionStep({ queueId: queue.id, stepId: waiting.id, phrase: waiting.approvalPhrase!, approver: 'Founder' });
  assert.ok(queue.steps.find((step) => step.id === waiting.id)?.approval?.fingerprint.startsWith('approval_'));

  queue = await startStoredMissionExecutionStep({ queueId: queue.id, stepId: waiting.id, actor: 'Founder' });
  assert.equal(queue.steps.find((step) => step.id === waiting.id)?.status, 'running');

  queue = await completeStoredMissionExecutionStep({
    queueId: queue.id,
    stepId: waiting.id,
    actor: 'Founder',
    evidence: [{ kind: 'operator_note', title: 'Context checkpoint', value: 'Context reviewed and approved.' }],
  });
  assert.equal(queue.steps.find((step) => step.id === waiting.id)?.status, 'completed');
  assert.equal(queue.summary.completedSteps, 1);
  assert.equal(queue.summary.evidenceItems, 1);

  const resumed = await getMissionExecutionQueue(queue.id);
  assert.equal(resumed?.id, queue.id);
  assert.equal(resumed?.summary.completedSteps, 1);

  const stats = await getMissionExecutionQueueStoreStats();
  assert.equal(stats.total, 1);
  assert.ok(stats.storage.bytes > 0);
  assert.ok(stats.latestQueue?.id === queue.id);

  const drift = await getMissionQueueRuntimeDriftReport();
  assert.equal(typeof drift.checkedAgenticLoopRuns, 'number');
  assert.equal(typeof drift.checkedRuntimeRunRecords, 'number');
  assert.ok(Array.isArray(drift.agenticLoopRuns));
  assert.ok(Array.isArray(drift.runtimeRunRecords));
});

test('persistent mission queue store can cancel resumable queues', async (t) => {
  await withQueueStore(t);

  const queue = await createAndSaveMissionExecutionQueue(plan(), 'Founder');
  const cancelled = await cancelStoredMissionExecutionQueue({ queueId: queue.id, reason: 'Operator cancelled before execution.', actor: 'Founder' });
  assert.equal(cancelled.status, 'cancelled');
  assert.ok(cancelled.steps.some((step) => step.status === 'cancelled'));

  const queues = await listMissionExecutionQueues({ status: 'cancelled' });
  assert.equal(queues.length, 1);
  assert.equal(queues[0].id, queue.id);
});
