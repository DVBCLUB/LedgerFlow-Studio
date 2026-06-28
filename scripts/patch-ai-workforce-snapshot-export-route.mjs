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
import { listMissionExecutionQueues, requireMissionExecutionQueue } from "./services/aiWorkforceMissionExecutionQueueStore";`;

if (!source.includes('buildMissionQueueSnapshotExport')) {
  replaceOnce(importAnchor, snapshotImports, 'GitHub CI Doctor import anchor');
}

const routeAnchor = '// ---------------------------------------------------------------------------\n// Unified System Overview (cross-service data linker)\n// ---------------------------------------------------------------------------';
const routeBlock = `// ---------------------------------------------------------------------------
// AI Workforce Mission Snapshot Export endpoint
// ---------------------------------------------------------------------------
app.post("/api/ai-workforce/mission-snapshot-export", async (req: Request, res: Response) => {
  try {
    const body = (req.body || {}) as any;
    const format = body.format === "markdown" ? "markdown" : "json";
    const queues = body.queueId ? [] : await listMissionExecutionQueues({ limit: 1 });
    const queue = body.queueId ? await requireMissionExecutionQueue(String(body.queueId)) : queues[0];
    if (!queue) return res.status(404).json({ ok: false, error: "No mission execution queue is available for snapshot export." });
    const snapshot = buildMissionQueueSnapshotExport(queue, {
      format,
      includeRawQueue: Boolean(body.includeRawQueue),
    });
    res.json({ ok: true, snapshot });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});`;

if (!source.includes('/api/ai-workforce/mission-snapshot-export')) {
  replaceOnce(routeAnchor, `${routeBlock}\n\n${routeAnchor}`, 'Unified System Overview route anchor');
}

if (changed) {
  fs.writeFileSync(daemonPath, source);
  console.log('AI Workforce Mission Snapshot Export route patched into assistant-daemon.');
} else {
  console.log('AI Workforce Mission Snapshot Export route already applied.');
}
