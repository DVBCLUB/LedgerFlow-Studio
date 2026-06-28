import assert from 'node:assert/strict';
import test from 'node:test';
import { planAIWorkforceMission } from './aiWorkforceMissionPlanner.ts';
import {
  approveMissionExecutionStep,
  completeMissionExecutionStep,
  createMissionExecutionQueue,
  startMissionExecutionStep,
} from './aiWorkforceMissionExecutionQueue.ts';
import {
  executeMissionStepToolSimulation,
  previewMissionStepToolExecution,
} from './aiWorkforceMissionToolExecutor.ts';

function sampleQueue() {
  const plan = planAIWorkforceMission({
    goal: 'Ship a GitHub pull request with PR Control, CI evidence, rollback plan and audit trail.',
    owner: 'Founder',
    domains: ['github', 'software factory', 'runtime'],
    constraints: ['must require approval before merge gate'],
    repoFullName: 'DVBCLUB/LedgerFlow-Studio',
    prNumber: 42,
    allowAutomation: true,
    sources: [
      { kind: 'sop', title: 'Mission Tool Adapter SOP', content: 'Tool execution must use dry-run preview, safety envelope, approval fingerprint and simulation evidence before completion.', tags: ['mission-planner'], confidence: 0.94 },
    ],
  });
  return createMissionExecutionQueue(plan, 'Founder');
}

function approveFirstReady(queue: ReturnType<typeof sampleQueue>) {
  const first = queue.steps.find((step) => step.status === 'waiting_approval')!;
  queue = approveMissionExecutionStep(queue, first.id, first.approvalPhrase!, 'Founder');
  return { queue, step: queue.steps.find((item) => item.id === first.id)! };
}

test('mission tool execution adapter previews and executes an approved mission step through the safety gate', () => {
  let queue = sampleQueue();
  const approved = approveFirstReady(queue);
  queue = approved.queue;

  const preview = previewMissionStepToolExecution(queue, approved.step.id);
  assert.equal(preview.mode, 'dry_run');
  assert.equal(preview.requestedToolId, 'read_knowledge');
  assert.equal(preview.adapterToolId, 'read_knowledge');
  assert.equal(preview.safetyDecision.approved, true);
  assert.ok(preview.preview.fingerprint);

  queue = startMissionExecutionStep(queue, approved.step.id, 'Founder');
  const execution = executeMissionStepToolSimulation(queue, approved.step.id);
  assert.equal(execution.status, 'executed');
  assert.equal(execution.mode, 'simulation');
  assert.ok(execution.evidence.some((item) => item.title === 'Execution fingerprint'));

  queue = completeMissionExecutionStep(queue, approved.step.id, execution.evidence.map((item) => ({ kind: 'artifact' as const, title: item.title, value: item.value })), 'Founder');
  assert.equal(queue.summary.completedSteps, 1);
});

test('mission tool execution adapter blocks execution until approval exists', () => {
  const queue = sampleQueue();
  const first = queue.steps.find((step) => step.status === 'waiting_approval')!;
  assert.throws(() => executeMissionStepToolSimulation(queue, first.id), /ready or running/);
});

test('mission tool execution adapter aliases GitHub PR Control to safe draft patch simulation', () => {
  let queue = sampleQueue();
  for (let index = 0; index < 3; index += 1) {
    const waiting = queue.steps.find((step) => step.status === 'waiting_approval');
    if (waiting) queue = approveMissionExecutionStep(queue, waiting.id, waiting.approvalPhrase!, 'Founder');
    const ready = queue.steps.find((step) => step.status === 'ready');
    if (!ready) break;
    queue = completeMissionExecutionStep(queue, ready.id, [{ kind: 'operator_note', title: 'Prior checkpoint', value: `Completed ${ready.title}` }], 'Founder');
  }

  let prStep = queue.steps.find((step) => step.toolId === 'github_pr_control')!;
  if (prStep.status === 'waiting_approval') {
    queue = approveMissionExecutionStep(queue, prStep.id, prStep.approvalPhrase!, 'Founder');
    prStep = queue.steps.find((step) => step.toolId === 'github_pr_control')!;
  }
  assert.equal(prStep.status, 'ready');

  const preview = previewMissionStepToolExecution(queue, prStep.id);
  assert.equal(preview.requestedToolId, 'github_pr_control');
  assert.equal(preview.adapterToolId, 'draft_patch');
  assert.equal(preview.status, 'approval_required');
  assert.ok(preview.evidence.some((item) => item.value.includes('github_pr_control routed to draft_patch')));

  const execution = executeMissionStepToolSimulation(queue, prStep.id);
  assert.equal(execution.status, 'executed');
  assert.ok(execution.approval?.approvalToken);
});
