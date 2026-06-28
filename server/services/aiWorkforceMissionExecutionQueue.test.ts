import assert from 'node:assert/strict';
import test from 'node:test';
import { planAIWorkforceMission } from './aiWorkforceMissionPlanner.ts';
import {
  approveMissionExecutionStep,
  cancelMissionExecutionQueue,
  completeMissionExecutionStep,
  createMissionExecutionQueue,
  startMissionExecutionStep,
} from './aiWorkforceMissionExecutionQueue.ts';

function samplePlan() {
  return planAIWorkforceMission({
    goal: 'Ship a GitHub pull request with CI evidence, rollback plan, approval checkpoints and audit trail.',
    owner: 'Founder',
    domains: ['github', 'software factory', 'runtime'],
    constraints: ['must require approval before merge'],
    repoFullName: 'DVBCLUB/LedgerFlow-Studio',
    prNumber: 42,
    allowAutomation: true,
    sources: [
      {
        kind: 'sop',
        title: 'Mission Queue SOP',
        content: 'Mission execution requires dependency gates, approval fingerprints, evidence and audit timeline before completion.',
        tags: ['mission-planner'],
        confidence: 0.94,
      },
    ],
  });
}

test('Mission Execution Queue starts with approval gates and stable execution summary', () => {
  const queue = createMissionExecutionQueue(samplePlan());

  assert.match(queue.id, /^mission_queue_/);
  assert.equal(queue.status, 'needs_approval');
  assert.equal(queue.summary.totalSteps, 5);
  assert.ok(queue.summary.waitingApprovalSteps >= 3);
  assert.equal(queue.summary.completedSteps, 0);
  assert.ok(queue.steps.every((step) => step.expectedEvidence.length > 0));
  assert.ok(queue.timeline.some((event) => event.action === 'queue_created'));
});

test('Mission Execution Queue captures approval fingerprint and unlocks dependency-gated steps', () => {
  let queue = createMissionExecutionQueue(samplePlan());
  const first = queue.steps[0];
  assert.equal(first.status, 'waiting_approval');
  assert.ok(first.approvalPhrase);

  assert.throws(() => approveMissionExecutionStep(queue, first.id, 'WRONG PHRASE', 'Founder'), /Approval phrase mismatch/);

  queue = approveMissionExecutionStep(queue, first.id, first.approvalPhrase!, 'Founder');
  const approvedFirst = queue.steps.find((step) => step.id === first.id)!;
  assert.equal(approvedFirst.status, 'ready');
  assert.ok(approvedFirst.approval?.fingerprint.startsWith('approval_'));
  assert.equal(queue.summary.approvalsCaptured, 1);

  queue = startMissionExecutionStep(queue, first.id, 'Founder');
  assert.equal(queue.steps.find((step) => step.id === first.id)?.status, 'running');

  queue = completeMissionExecutionStep(queue, first.id, [
    { kind: 'operator_note', title: 'Context approved', value: 'Source map reviewed and accepted.' },
  ], 'Founder');
  assert.equal(queue.steps.find((step) => step.id === first.id)?.status, 'completed');
  assert.equal(queue.summary.completedSteps, 1);
  assert.equal(queue.summary.evidenceItems, 1);

  const second = queue.steps[1];
  assert.equal(second.status, 'waiting_approval');
  queue = approveMissionExecutionStep(queue, second.id, second.approvalPhrase!, 'Founder');
  assert.equal(queue.steps.find((step) => step.id === second.id)?.status, 'ready');
});

test('Mission Execution Queue cancellation preserves completed steps and cancels pending steps', () => {
  let queue = createMissionExecutionQueue(samplePlan());
  const first = queue.steps[0];
  queue = approveMissionExecutionStep(queue, first.id, first.approvalPhrase!, 'Founder');
  queue = completeMissionExecutionStep(queue, first.id, [
    { kind: 'audit', title: 'Checkpoint evidence', value: 'Context checkpoint captured.' },
  ]);

  queue = cancelMissionExecutionQueue(queue, 'Founder stopped the mission.', 'Founder');
  assert.equal(queue.status, 'cancelled');
  assert.equal(queue.steps.find((step) => step.id === first.id)?.status, 'completed');
  assert.ok(queue.steps.some((step) => step.status === 'cancelled'));
  assert.ok(queue.timeline.some((event) => event.action === 'queue_cancelled'));
});
