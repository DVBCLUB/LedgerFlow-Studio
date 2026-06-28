import assert from 'node:assert/strict';
import test from 'node:test';
import { planAIWorkforceMission } from './aiWorkforceMissionPlanner.ts';
import { approveMissionExecutionStep, createMissionExecutionQueue } from './aiWorkforceMissionExecutionQueue.ts';
import { previewMissionStepToolExecution } from './aiWorkforceMissionToolExecutor.ts';

test('mission evidence replay artifact captures safety timeline, artifacts, fingerprint and missing expected evidence', () => {
  const plan = planAIWorkforceMission({
    goal: 'Preview a high-impact runtime execution with source-mapped evidence replay.',
    owner: 'Founder',
    domains: ['runtime', 'automation'],
    constraints: ['must preserve replay artifacts'],
    allowAutomation: true,
    sources: [
      { kind: 'sop', title: 'Evidence Replay SOP', content: 'Execution evidence replay must include fingerprint, timeline, safety decision and generated artifacts.', tags: ['mission-planner'], confidence: 0.94 },
    ],
  });
  let queue = createMissionExecutionQueue(plan, 'Founder');
  const step = queue.steps.find((item) => item.status === 'waiting_approval')!;
  queue = approveMissionExecutionStep(queue, step.id, step.approvalPhrase!, 'Founder');
  const ready = queue.steps.find((item) => item.id === step.id)!;

  const result = previewMissionStepToolExecution(queue, ready.id);
  assert.equal(result.replayArtifact.queueId, queue.id);
  assert.equal(result.replayArtifact.stepId, ready.id);
  assert.equal(result.replayArtifact.fingerprint, result.preview.fingerprint);
  assert.equal(result.replayArtifact.safetyApproved, true);
  assert.ok(result.replayArtifact.timeline.length >= 1);
  assert.ok(result.replayArtifact.artifacts.some((artifact) => artifact.title === 'Execution fingerprint'));
  assert.ok(result.replayArtifact.summary.evidenceItems >= result.evidence.length);
  assert.ok(Array.isArray(result.replayArtifact.summary.missingExpectedEvidence));
});
