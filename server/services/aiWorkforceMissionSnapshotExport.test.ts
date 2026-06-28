import assert from 'node:assert/strict';
import test from 'node:test';
import { planAIWorkforceMission } from './aiWorkforceMissionPlanner.ts';
import {
  approveMissionExecutionStep,
  completeMissionExecutionStep,
  createMissionExecutionQueue,
} from './aiWorkforceMissionExecutionQueue.ts';
import { buildMissionQueueSnapshotExport } from './aiWorkforceMissionSnapshotExport.ts';

function sampleQueue() {
  const plan = planAIWorkforceMission({
    goal: 'Export a mission queue handoff artifact with runbook, evidence, rollback and timeline.',
    owner: 'Founder',
    domains: ['runtime', 'release'],
    constraints: ['must be reviewable offline'],
    allowAutomation: true,
    sources: [
      { kind: 'sop', title: 'Snapshot Export SOP', content: 'Mission queue snapshot exports must include next safe action, owner handoff, rollback note, checklist, evidence artifacts and timeline.', tags: ['mission-planner'], confidence: 0.94 },
    ],
  });
  let queue = createMissionExecutionQueue(plan, 'Founder');
  const waiting = queue.steps.find((step) => step.status === 'waiting_approval')!;
  queue = approveMissionExecutionStep(queue, waiting.id, waiting.approvalPhrase!, 'Founder');
  queue = completeMissionExecutionStep(queue, waiting.id, [{ kind: 'artifact', title: 'Execution fingerprint', value: 'fingerprint_abc' }], 'Founder');
  return queue;
}

test('mission queue snapshot export creates a JSON handoff artifact with checksum and evidence', () => {
  const queue = sampleQueue();
  const snapshot = buildMissionQueueSnapshotExport(queue, { format: 'json', createdAt: '2026-06-28T00:00:00.000Z', includeRawQueue: true });
  const payload = JSON.parse(snapshot.content);

  assert.equal(snapshot.format, 'json');
  assert.match(snapshot.filename, /\.json$/);
  assert.equal(snapshot.summary.queueStatus, queue.status);
  assert.equal(snapshot.summary.evidenceItems, queue.summary.evidenceItems);
  assert.ok(snapshot.checksum.length >= 32);
  assert.equal(payload.kind, 'ai_workforce_mission_queue_snapshot');
  assert.ok(payload.nextSafeAction);
  assert.ok(payload.rollbackNote.includes('Partial work exists'));
  assert.ok(payload.handoffSummary.includes(queue.id));
  assert.ok(payload.artifacts.some((item: any) => item.title === 'Execution fingerprint'));
  assert.ok(payload.rawQueue.id === queue.id);
});

test('mission queue snapshot export creates a Markdown handoff artifact', () => {
  const queue = sampleQueue();
  const snapshot = buildMissionQueueSnapshotExport(queue, { format: 'markdown', createdAt: '2026-06-28T00:00:00.000Z' });

  assert.equal(snapshot.format, 'markdown');
  assert.match(snapshot.filename, /\.md$/);
  assert.ok(snapshot.content.includes('# AI Workforce Mission Queue Snapshot'));
  assert.ok(snapshot.content.includes('## Next safe action'));
  assert.ok(snapshot.content.includes('## Owner handoff'));
  assert.ok(snapshot.content.includes('## Rollback note'));
  assert.ok(snapshot.content.includes('## Evidence artifacts'));
  assert.ok(snapshot.content.includes('Execution fingerprint'));
});
