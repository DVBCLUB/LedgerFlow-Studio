import fs from 'node:fs';
import path from 'node:path';

const daemonPath = path.resolve('server/assistant-daemon.ts');

if (!fs.existsSync(daemonPath)) {
  throw new Error(`assistant daemon source not found: ${daemonPath}`);
}

let source = fs.readFileSync(daemonPath, 'utf8');
let changed = false;

function replaceOnce(search, replacement, label) {
  if (!source.includes(search)) throw new Error(`Cannot patch snapshot export route: missing ${label}`);
  source = source.replace(search, replacement);
  changed = true;
}

const importAnchor = 'import { getGitHubCIFailureContext, analyzeGitHubCIFailure } from "./services/githubCiDoctor";';
const snapshotImports = `import { getGitHubCIFailureContext, analyzeGitHubCIFailure } from "./services/githubCiDoctor";
import { buildMissionQueueSnapshotExport } from "./services/aiWorkforceMissionSnapshotExport";
import { listMissionExecutionQueues, requireMissionExecutionQueue } from "./services/aiWorkforceMissionExecutionQueueStore";
import { buildStoredMissionOperatorReviewDossier, getMissionOperatorReviewNoteStoreStats, listMissionOperatorReviewNotes, saveMissionOperatorReviewNote } from "./services/aiWorkforceMissionReviewNoteStore";`;

if (!source.includes('buildMissionQueueSnapshotExport')) {
  replaceOnce(importAnchor, snapshotImports, 'GitHub CI Doctor import anchor');
} else if (!source.includes('saveMissionOperatorReviewNote')) {
  replaceOnce(
    'import { listMissionExecutionQueues, requireMissionExecutionQueue } from "./services/aiWorkforceMissionExecutionQueueStore";',
    'import { listMissionExecutionQueues, requireMissionExecutionQueue } from "./services/aiWorkforceMissionExecutionQueueStore";\nimport { buildStoredMissionOperatorReviewDossier, getMissionOperatorReviewNoteStoreStats, listMissionOperatorReviewNotes, saveMissionOperatorReviewNote } from "./services/aiWorkforceMissionReviewNoteStore";',
    'mission review note store import anchor',
  );
}

const routeAnchor = '// ---------------------------------------------------------------------------\n// Unified System Overview (cross-service data linker)\n// ---------------------------------------------------------------------------';
const routeBlock = `// ---------------------------------------------------------------------------
// AI Workforce Mission Snapshot Export and Review Notes endpoints
// ---------------------------------------------------------------------------
app.post("/api/ai-workforce/mission-review-note", async (req: Request, res: Response) => {
  try {
    const body = (req.body || {}) as any;
    const queue = await requireMissionExecutionQueue(String(body.queueId || ""));
    const note = await saveMissionOperatorReviewNote(queue, {
      reviewer: String(body.reviewer || "Mission Operator"),
      decision: body.decision === "approved" || body.decision === "needs_changes" || body.decision === "blocked" ? body.decision : "info",
      summary: String(body.summary || "Operator review note recorded."),
      requestedAction: body.requestedAction ? String(body.requestedAction) : undefined,
      stepId: body.stepId ? String(body.stepId) : undefined,
      evidence: Array.isArray(body.evidence) ? body.evidence : [],
    });
    const notes = await listMissionOperatorReviewNotes(queue.id);
    const dossier = await buildStoredMissionOperatorReviewDossier(queue);
    const stats = await getMissionOperatorReviewNoteStoreStats();
    res.json({ ok: true, note, notes, dossier, stats });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});

app.post("/api/ai-workforce/mission-review-notes", async (req: Request, res: Response) => {
  try {
    const body = (req.body || {}) as any;
    const queues = body.queueId ? [] : await listMissionExecutionQueues({ limit: 1 });
    const queue = body.queueId ? await requireMissionExecutionQueue(String(body.queueId)) : queues[0];
    if (!queue) return res.status(404).json({ ok: false, error: "No mission execution queue is available for review notes." });
    const notes = await listMissionOperatorReviewNotes(queue.id);
    const dossier = await buildStoredMissionOperatorReviewDossier(queue);
    const stats = await getMissionOperatorReviewNoteStoreStats();
    res.json({ ok: true, queueId: queue.id, notes, dossier, stats });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});

app.post("/api/ai-workforce/mission-snapshot-export", async (req: Request, res: Response) => {
  try {
    const body = (req.body || {}) as any;
    const format = body.format === "markdown" ? "markdown" : "json";
    const queues = body.queueId ? [] : await listMissionExecutionQueues({ limit: 1 });
    const queue = body.queueId ? await requireMissionExecutionQueue(String(body.queueId)) : queues[0];
    if (!queue) return res.status(404).json({ ok: false, error: "No mission execution queue is available for snapshot export." });
    const persistedNotes = await listMissionOperatorReviewNotes(queue.id);
    const requestNotes = Array.isArray(body.reviewNotes) ? body.reviewNotes : [];
    const snapshot = buildMissionQueueSnapshotExport(queue, {
      format,
      includeRawQueue: Boolean(body.includeRawQueue),
      reviewNotes: [...persistedNotes, ...requestNotes],
    });
    res.json({ ok: true, snapshot, persistedReviewNotes: persistedNotes.length });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});`;

if (!source.includes('/api/ai-workforce/mission-snapshot-export')) {
  replaceOnce(routeAnchor, `${routeBlock}\n\n${routeAnchor}`, 'Unified System Overview route anchor');
} else {
  if (!source.includes('/api/ai-workforce/mission-review-note')) {
    replaceOnce('app.post("/api/ai-workforce/mission-snapshot-export"', `${routeBlock}\n\napp.post("/api/ai-workforce/mission-snapshot-export"`, 'snapshot export route expansion anchor');
  }
  if (!source.includes('const persistedNotes = await listMissionOperatorReviewNotes(queue.id);')) {
    replaceOnce(
      '    const snapshot = buildMissionQueueSnapshotExport(queue, {\n      format,\n      includeRawQueue: Boolean(body.includeRawQueue),\n      reviewNotes: Array.isArray(body.reviewNotes) ? body.reviewNotes : [],\n    });\n    res.json({ ok: true, snapshot });',
      '    const persistedNotes = await listMissionOperatorReviewNotes(queue.id);\n    const requestNotes = Array.isArray(body.reviewNotes) ? body.reviewNotes : [];\n    const snapshot = buildMissionQueueSnapshotExport(queue, {\n      format,\n      includeRawQueue: Boolean(body.includeRawQueue),\n      reviewNotes: [...persistedNotes, ...requestNotes],\n    });\n    res.json({ ok: true, snapshot, persistedReviewNotes: persistedNotes.length });',
      'snapshot export persisted review note upgrade anchor',
    );
  }
}

if (changed) {
  fs.writeFileSync(daemonPath, source);
  console.log('AI Workforce Mission Snapshot Export route patched into assistant-daemon.');
} else {
  console.log('AI Workforce Mission Snapshot Export route already applied.');
}
