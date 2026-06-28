import type { MissionExecutionQueue } from './aiWorkforceMissionExecutionQueue.ts';
import {
  buildMissionOperatorReviewDossier,
  buildMissionOperatorReviewNote,
  type MissionOperatorReviewDossier,
  type MissionOperatorReviewNote,
  type MissionOperatorReviewNoteInput,
} from './aiWorkforceMissionReviewNotes.ts';
import { createJsonFileLocalStore } from './aiWorkforceLocalStore.ts';

export interface MissionOperatorReviewNoteStoreState {
  version: 1;
  notesByQueueId: Record<string, MissionOperatorReviewNote[]>;
}

function emptyState(): MissionOperatorReviewNoteStoreState {
  return { version: 1, notesByQueueId: {} };
}

function normalizeNote(value: any): MissionOperatorReviewNote | null {
  if (!value || typeof value !== 'object') return null;
  if (!value.id || !value.queueId || !value.missionId || !value.reviewer || !value.decision || !value.summary || !value.checksum || !value.createdAt) return null;
  return {
    id: String(value.id),
    queueId: String(value.queueId),
    missionId: String(value.missionId),
    stepId: value.stepId ? String(value.stepId) : undefined,
    reviewer: String(value.reviewer),
    decision: value.decision,
    summary: String(value.summary),
    requestedAction: String(value.requestedAction || ''),
    evidence: Array.isArray(value.evidence) ? value.evidence.map((item: any) => ({ title: String(item?.title || 'Evidence'), value: String(item?.value || '') })) : [],
    checksum: String(value.checksum),
    createdAt: String(value.createdAt),
  };
}

function normalizeState(parsed: unknown): MissionOperatorReviewNoteStoreState {
  const raw = parsed && typeof parsed === 'object' ? parsed as any : {};
  const source = raw.notesByQueueId && typeof raw.notesByQueueId === 'object' ? raw.notesByQueueId : {};
  const notesByQueueId: Record<string, MissionOperatorReviewNote[]> = {};
  for (const [queueId, notes] of Object.entries(source)) {
    notesByQueueId[String(queueId)] = Array.isArray(notes) ? notes.map(normalizeNote).filter(Boolean) as MissionOperatorReviewNote[] : [];
  }
  return { version: 1, notesByQueueId };
}

const store = createJsonFileLocalStore<MissionOperatorReviewNoteStoreState>({
  filePath: () => process.env.AI_WORKFORCE_MISSION_REVIEW_NOTE_STORE_FILE || 'ai_workforce_mission_review_notes.local.json',
  emptyState,
  normalizeState,
  serializeState: (state) => ({ version: 1, notesByQueueId: state.notesByQueueId }),
});

export async function saveMissionOperatorReviewNote(queue: MissionExecutionQueue, input: MissionOperatorReviewNoteInput) {
  const note = buildMissionOperatorReviewNote(queue, input);
  await store.mutate((state) => {
    const notes = state.notesByQueueId[queue.id] || [];
    const withoutDuplicate = notes.filter((existing) => existing.id !== note.id);
    state.notesByQueueId[queue.id] = [...withoutDuplicate, note].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  });
  return note;
}

export async function listMissionOperatorReviewNotes(queueId: string) {
  const state = await store.read();
  return [...(state.notesByQueueId[queueId] || [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function buildStoredMissionOperatorReviewDossier(queue: MissionExecutionQueue, transientNotes: MissionOperatorReviewNoteInput[] = [], createdAt = new Date().toISOString()): Promise<MissionOperatorReviewDossier> {
  const storedNotes = await listMissionOperatorReviewNotes(queue.id);
  const transient = transientNotes.map((input) => buildMissionOperatorReviewNote(queue, { ...input, createdAt: input.createdAt || createdAt }));
  const byId = new Map<string, MissionOperatorReviewNote>();
  for (const note of [...storedNotes, ...transient]) byId.set(note.id, note);
  const merged = Array.from(byId.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return buildMissionOperatorReviewDossier(queue, merged, createdAt);
}

export async function getMissionOperatorReviewNoteStoreStats() {
  const state = await store.read();
  const totalNotes = Object.values(state.notesByQueueId).reduce((sum, notes) => sum + notes.length, 0);
  return {
    ...(await store.stats()),
    queues: Object.keys(state.notesByQueueId).length,
    totalNotes,
  };
}

export async function clearMissionOperatorReviewNoteStore() {
  await store.clear();
}
