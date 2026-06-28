import assert from 'node:assert/strict';
import test from 'node:test';
import { planAIWorkforceMission } from './aiWorkforceMissionPlanner.ts';
import { createMissionExecutionQueue } from './aiWorkforceMissionExecutionQueue.ts';
import { buildMissionOperatorReviewDossier, buildMissionOperatorReviewNote } from './aiWorkforceMissionReviewNotes.ts';

function sampleQueue() {
  const plan = planAIWorkforceMission({
    goal: 'Review a mission queue snapshot before handoff or release.',
    owner: 'Founder',
    domains: ['runtime', 'release'],
    constraints: ['must capture review decision'],
    allowAutomation: true,
    sources: [
      { kind: 'sop', title: 'Operator Review SOP', content: 'Operator review notes must capture reviewer, decision, requested action, checksum, blocker state and release readiness.', tags: ['mission-planner'], confidence: 0.94 },
    ],
  });
  return createMissionExecutionQueue(plan, 'Founder');
}

test('mission operator review note captures decision, requested action and checksum', () => {
  const queue = sampleQueue();
  const note = buildMissionOperatorReviewNote(queue, {
    reviewer: 'Founder',
    decision: 'needs_changes',
    summary: 'Snapshot needs clearer rollback evidence.',
    evidence: [{ title: 'Review finding', value: 'Rollback note is incomplete.' }],
    createdAt: '2026-06-28T00:00:00.000Z',
  });

  assert.equal(note.queueId, queue.id);
  assert.equal(note.decision, 'needs_changes');
  assert.ok(note.requestedAction.includes('Address requested changes'));
  assert.ok(note.checksum.length >= 32);
  assert.ok(note.id.startsWith('mission_review_note_'));
});

test('mission operator review dossier blocks release when blocker notes exist', () => {
  const queue = sampleQueue();
  const dossier = buildMissionOperatorReviewDossier(queue, [
    { reviewer: 'Founder', decision: 'approved', summary: 'Runbook is clear.' },
    { reviewer: 'Security', decision: 'blocked', summary: 'Security evidence missing.', requestedAction: 'Attach security evidence before release.' },
  ], '2026-06-28T00:00:00.000Z');

  assert.equal(dossier.status, 'blocked');
  assert.equal(dossier.releaseReady, false);
  assert.equal(dossier.summary.totalNotes, 2);
  assert.equal(dossier.summary.blockers, 1);
  assert.ok(dossier.nextReviewerAction.includes('Resolve blocker'));
  assert.ok(dossier.checksum.length >= 32);
});

test('mission operator review dossier marks approved notes as release ready when queue has no blockers', () => {
  const queue = sampleQueue();
  const dossier = buildMissionOperatorReviewDossier(queue, [
    { reviewer: 'Founder', decision: 'approved', summary: 'Approved for handoff.' },
  ], '2026-06-28T00:00:00.000Z');

  assert.equal(dossier.status, 'release_ready');
  assert.equal(dossier.releaseReady, true);
  assert.equal(dossier.latestDecision, 'approved');
});
