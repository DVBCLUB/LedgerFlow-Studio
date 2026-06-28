import { createHash } from 'node:crypto';
import type { MissionExecutionQueue } from './aiWorkforceMissionExecutionQueue.ts';

export type MissionOperatorReviewDecision = 'approved' | 'needs_changes' | 'blocked' | 'info';

export interface MissionOperatorReviewNoteInput {
  reviewer: string;
  decision: MissionOperatorReviewDecision;
  summary: string;
  requestedAction?: string;
  stepId?: string;
  evidence?: Array<{ title: string; value: string }>;
  createdAt?: string;
}

export interface MissionOperatorReviewNote {
  id: string;
  queueId: string;
  missionId: string;
  stepId?: string;
  reviewer: string;
  decision: MissionOperatorReviewDecision;
  summary: string;
  requestedAction: string;
  evidence: Array<{ title: string; value: string }>;
  checksum: string;
  createdAt: string;
}

export interface MissionOperatorReviewDossier {
  queueId: string;
  missionId: string;
  status: 'release_ready' | 'changes_requested' | 'blocked' | 'informational';
  releaseReady: boolean;
  latestDecision: MissionOperatorReviewDecision | null;
  nextReviewerAction: string;
  notes: MissionOperatorReviewNote[];
  summary: {
    totalNotes: number;
    approvals: number;
    changesRequested: number;
    blockers: number;
    informational: number;
  };
  checksum: string;
  createdAt: string;
}

function digest(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function clean(value: string | undefined, fallback: string) {
  const trimmed = String(value || '').trim();
  return trimmed || fallback;
}

function defaultRequestedAction(decision: MissionOperatorReviewDecision) {
  if (decision === 'approved') return 'Proceed with handoff or release once CI evidence remains green.';
  if (decision === 'needs_changes') return 'Address requested changes, regenerate the snapshot, and ask for another review.';
  if (decision === 'blocked') return 'Stop release handoff until blocker evidence is resolved and owner approves.';
  return 'Record this note as context for the next operator review.';
}

export function buildMissionOperatorReviewNote(queue: MissionExecutionQueue, input: MissionOperatorReviewNoteInput): MissionOperatorReviewNote {
  const createdAt = input.createdAt || new Date().toISOString();
  const body = {
    queueId: queue.id,
    missionId: queue.missionId,
    stepId: input.stepId,
    reviewer: clean(input.reviewer, 'Mission Operator'),
    decision: input.decision,
    summary: clean(input.summary, 'Operator review note recorded.'),
    requestedAction: clean(input.requestedAction, defaultRequestedAction(input.decision)),
    evidence: input.evidence || [],
    createdAt,
  };
  const checksum = digest(body);
  return { id: `mission_review_note_${checksum.slice(0, 16)}`, checksum, ...body };
}

export function buildMissionOperatorReviewDossier(queue: MissionExecutionQueue, inputs: MissionOperatorReviewNoteInput[] = [], createdAt = new Date().toISOString()): MissionOperatorReviewDossier {
  const notes = inputs.map((input) => buildMissionOperatorReviewNote(queue, { ...input, createdAt: input.createdAt || createdAt }));
  const blockers = notes.filter((note) => note.decision === 'blocked').length;
  const changesRequested = notes.filter((note) => note.decision === 'needs_changes').length;
  const approvals = notes.filter((note) => note.decision === 'approved').length;
  const informational = notes.filter((note) => note.decision === 'info').length;
  const latestDecision = notes[notes.length - 1]?.decision || null;
  const status = blockers > 0 ? 'blocked' : changesRequested > 0 ? 'changes_requested' : approvals > 0 ? 'release_ready' : 'informational';
  const releaseReady = status === 'release_ready' && queue.summary.blockedSteps === 0 && queue.summary.cancelledSteps === 0;
  const nextReviewerAction = status === 'blocked'
    ? 'Resolve blocker notes before handoff or release.'
    : status === 'changes_requested'
      ? 'Complete requested changes, regenerate snapshot, and request review again.'
      : status === 'release_ready'
        ? 'Proceed with handoff or release after confirming CI and snapshot checksum.'
        : 'Add an approval, changes-requested, or blocked note before release handoff.';
  const summary = { totalNotes: notes.length, approvals, changesRequested, blockers, informational };
  const checksum = digest({ queueId: queue.id, missionId: queue.missionId, status, releaseReady, summary, notes });
  return { queueId: queue.id, missionId: queue.missionId, status, releaseReady, latestDecision, nextReviewerAction, notes, summary, checksum, createdAt };
}
