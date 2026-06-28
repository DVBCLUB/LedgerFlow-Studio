import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { planAIWorkforceMission } from './aiWorkforceMissionPlanner.ts';
import { createMissionExecutionQueue } from './aiWorkforceMissionExecutionQueue.ts';
import {
  buildStoredMissionOperatorReviewDossier,
  clearMissionOperatorReviewNoteStore,
  getMissionOperatorReviewNoteStoreStats,
  listMissionOperatorReviewNotes,
  saveMissionOperatorReviewNote,
} from './aiWorkforceMissionReviewNoteStore.ts';

process.env.AI_WORKFORCE_MISSION_REVIEW_NOTE_STORE_FILE = path.join(os.tmpdir(), `ai-workforce-review-notes-${process.pid}.json`);

function sampleQueue() {
  const plan = planAIWorkforceMission({
    goal: 'Persist operator review notes for a mission queue snapshot.',
    owner: 'Founder',
    domains: ['runtime', 'release'],
    constraints: ['review notes should appear in later exports'],
    allowAutomation: true,
    sources: [
      { kind: 'sop', title: 'Review Note Persistence SOP', content: 'Persisted operator review notes should be reusable by later queue snapshot exports.', tags: ['mission-planner'], confidence: 0.94 },
    ],
  });
  return createMissionExecutionQueue(plan, 'Founder');
}

test('mission review note store persists notes by queue', async () => {
  await clearMissionOperatorReviewNoteStore();
  const queue = sampleQueue();
  const saved = await saveMissionOperatorReviewNote(queue, {
    reviewer: 'Founder',
    decision: 'approved',
    summary: 'Approved after checking runbook and evidence.',
    requestedAction: 'Proceed after CI remains green.',
    createdAt: '2026-06-28T00:00:00.000Z',
  });

  const notes = await listMissionOperatorReviewNotes(queue.id);
  assert.equal(notes.length, 1);
  assert.equal(notes[0].id, saved.id);
  assert.equal(notes[0].decision, 'approved');

  const dossier = await buildStoredMissionOperatorReviewDossier(queue, [], '2026-06-28T00:01:00.000Z');
  assert.equal(dossier.status, 'release_ready');
  assert.equal(dossier.releaseReady, true);
  assert.equal(dossier.summary.totalNotes, 1);

  const stats = await getMissionOperatorReviewNoteStoreStats();
  assert.equal(stats.queues, 1);
  assert.equal(stats.totalNotes, 1);
});

test('mission review note store merges request-time notes with saved notes', async () => {
  await clearMissionOperatorReviewNoteStore();
  const queue = sampleQueue();
  await saveMissionOperatorReviewNote(queue, {
    reviewer: 'Founder',
    decision: 'approved',
    summary: 'Approved for handoff.',
    createdAt: '2026-06-28T00:00:00.000Z',
  });

  const dossier = await buildStoredMissionOperatorReviewDossier(queue, [
    { reviewer: 'Reviewer', decision: 'needs_changes', summary: 'Add one more evidence note.', requestedAction: 'Attach the evidence note.', createdAt: '2026-06-28T00:02:00.000Z' },
  ], '2026-06-28T00:03:00.000Z');

  assert.equal(dossier.status, 'changes_requested');
  assert.equal(dossier.releaseReady, false);
  assert.equal(dossier.summary.totalNotes, 2);
  assert.equal(dossier.summary.changesRequested, 1);
});
