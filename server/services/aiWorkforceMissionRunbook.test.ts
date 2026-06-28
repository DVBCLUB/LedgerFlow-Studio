import assert from 'node:assert/strict';
import test from 'node:test';
import { planAIWorkforceMission } from './aiWorkforceMissionPlanner.ts';
import {
  approveMissionExecutionStep,
  completeMissionExecutionStep,
  createMissionExecutionQueue,
} from './aiWorkforceMissionExecutionQueue.ts';
import { buildMissionOperatorRunbook } from './aiWorkforceMissionRunbook.ts';

function sampleQueue() {
  const plan = planAIWorkforceMission({
    goal: 'Ship a runtime queue with operator handoff, rollback note, evidence trail and next safe action.',
    owner: 'Founder',
    domains: ['github', 'software factory', 'runtime'],
    constraints: ['must preserve operator handoff'],
    repoFullName: 'DVBCLUB/LedgerFlow-Studio',
    prNumber: 42,
    allowAutomation: true,
    sources: [
      { kind: 'sop', title: 'Operator Handoff SOP', content: 'Every queue needs a runbook with next safe action, owner handoff, rollback note, checklist and evidence requirements.', tags: ['mission-planner'], confidence: 0.94 },
    ],
  });
  return createMissionExecutionQueue(plan, 'Founder');
}

test('mission operator runbook points to approval as the next safe action', () => {
  const queue = sampleQueue();
  const runbook = buildMissionOperatorRunbook(queue, '2026-06-28T00:00:00.000Z');

  assert.equal(runbook.queueId, queue.id);
  assert.equal(runbook.owner, 'Founder');
  assert.ok(runbook.nextSafeAction.includes('Capture human approval'));
  assert.ok(runbook.rollbackNote.includes('cancel'));
  assert.ok(runbook.handoffSummary.includes('Next safe action'));
  assert.ok(runbook.checklist.some((item) => item.title === 'Choose next safe action' && item.status === 'current'));
  assert.ok(runbook.steps.some((step) => step.checklist.some((item) => item.title === 'Approval gate' && item.status === 'current')));
});

test('mission operator runbook moves to dry-run after approval and tracks partial rollback', () => {
  let queue = sampleQueue();
  const waiting = queue.steps.find((step) => step.status === 'waiting_approval')!;
  queue = approveMissionExecutionStep(queue, waiting.id, waiting.approvalPhrase!, 'Founder');

  let runbook = buildMissionOperatorRunbook(queue, '2026-06-28T00:00:00.000Z');
  assert.ok(runbook.nextSafeAction.includes('Run Dry-run tool'));
  assert.ok(runbook.steps.find((step) => step.stepId === waiting.id)?.checklist.some((item) => item.title === 'Dry-run and safety replay' && item.status === 'current'));

  queue = completeMissionExecutionStep(queue, waiting.id, [{ kind: 'artifact', title: 'Execution fingerprint', value: 'fingerprint_123' }], 'Founder');
  runbook = buildMissionOperatorRunbook(queue, '2026-06-28T00:00:00.000Z');
  assert.ok(runbook.rollbackNote.includes('Partial work exists'));
  assert.ok(runbook.steps.find((step) => step.stepId === waiting.id)?.checklist.some((item) => item.title === 'Evidence capture' && item.status === 'done'));
});
