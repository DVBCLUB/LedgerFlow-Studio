import './aiWorkforceMissionReleaseGateRuntime.test.ts';
import assert from 'node:assert/strict';
import test from 'node:test';
import { planAIWorkforceMission } from './aiWorkforceMissionPlanner.ts';
import { createMissionExecutionQueue } from './aiWorkforceMissionExecutionQueue.ts';
import { buildMissionOperatorReviewDossier } from './aiWorkforceMissionReviewNotes.ts';
import { buildMissionOperatorReleaseGate } from './aiWorkforceMissionReleaseGate.ts';

function sampleQueue() {
  const plan = planAIWorkforceMission({
    goal: 'Build a release gate for snapshot handoff evidence.',
    owner: 'Founder',
    domains: ['runtime', 'release'],
    constraints: ['release gate requires review notes and CI evidence'],
    allowAutomation: true,
    sources: [
      { kind: 'sop', title: 'Release Gate SOP', content: 'Release gate should combine CI status, approvals, snapshot checksum, rollback confirmation and operator confirmation.', tags: ['mission-planner'], confidence: 0.94 },
    ],
  });
  return createMissionExecutionQueue(plan, 'Founder');
}

test('mission operator release gate is ready when evidence and review are ready', () => {
  const queue = sampleQueue();
  const dossier = buildMissionOperatorReviewDossier(queue, [
    { reviewer: 'Founder', decision: 'approved', summary: 'Approved for handoff.' },
  ], '2026-06-28T00:00:00.000Z');
  const gate = buildMissionOperatorReleaseGate(queue, dossier, {
    ciStatus: 'success',
    approvals: 2,
    requiredApprovals: 2,
    snapshotChecksum: 'checksum_123',
    releaseLabel: true,
    rollbackConfirmed: true,
    operatorConfirmed: true,
  }, '2026-06-28T00:01:00.000Z');

  assert.equal(gate.decision, 'ready');
  assert.equal(gate.releaseReady, true);
  assert.equal(gate.missingEvidence.length, 0);
  assert.ok(gate.score >= 90);
  assert.ok(gate.checksum.length >= 32);
});

test('mission operator release gate holds when required evidence is missing', () => {
  const queue = sampleQueue();
  const dossier = buildMissionOperatorReviewDossier(queue, [
    { reviewer: 'Founder', decision: 'info', summary: 'Review started.' },
  ], '2026-06-28T00:00:00.000Z');
  const gate = buildMissionOperatorReleaseGate(queue, dossier, {
    ciStatus: 'pending',
    approvals: 0,
    requiredApprovals: 1,
  }, '2026-06-28T00:01:00.000Z');

  assert.equal(gate.decision, 'hold');
  assert.equal(gate.releaseReady, false);
  assert.ok(gate.missingEvidence.some((item) => item.includes('CI status')));
  assert.ok(gate.missingEvidence.some((item) => item.includes('Snapshot checksum')));
  assert.ok(gate.finalAction.includes('Hold'));
});

test('mission operator release gate is not ready when CI failed', () => {
  const queue = sampleQueue();
  const dossier = buildMissionOperatorReviewDossier(queue, [
    { reviewer: 'Founder', decision: 'approved', summary: 'Approved for handoff.' },
  ], '2026-06-28T00:00:00.000Z');
  const gate = buildMissionOperatorReleaseGate(queue, dossier, {
    ciStatus: 'failed',
    approvals: 1,
    requiredApprovals: 1,
    snapshotChecksum: 'checksum_123',
    rollbackConfirmed: true,
    operatorConfirmed: true,
  }, '2026-06-28T00:01:00.000Z');

  assert.equal(gate.decision, 'not_ready');
  assert.equal(gate.releaseReady, false);
  assert.ok(gate.missingEvidence.some((item) => item.includes('failed')));
});
