import fs from 'node:fs';
import path from 'node:path';

const daemonPath = path.resolve('server/assistant-daemon.ts');

if (!fs.existsSync(daemonPath)) {
  throw new Error(`assistant daemon source not found: ${daemonPath}`);
}

let source = fs.readFileSync(daemonPath, 'utf8');
let changed = false;

function replaceOnce(search, replacement, label) {
  if (!source.includes(search)) throw new Error(`Cannot patch release gate route: missing ${label}`);
  source = source.replace(search, replacement);
  changed = true;
}

const importAnchor = 'import { getGitHubCIFailureContext, analyzeGitHubCIFailure } from "./services/githubCiDoctor";';
const importBlock = `import { getGitHubCIFailureContext, analyzeGitHubCIFailure } from "./services/githubCiDoctor";
import { buildMissionOperatorReleaseGate } from "./services/aiWorkforceMissionReleaseGate";
import { requireMissionExecutionQueue } from "./services/aiWorkforceMissionExecutionQueueStore";
import { buildStoredMissionOperatorReviewDossier } from "./services/aiWorkforceMissionReviewNoteStore";`;

if (!source.includes('buildMissionOperatorReleaseGate')) {
  replaceOnce(importAnchor, importBlock, 'GitHub CI Doctor import anchor');
}

const routeAnchor = '// ---------------------------------------------------------------------------\n// Unified System Overview (cross-service data linker)\n// ---------------------------------------------------------------------------';
const routeBlock = `// ---------------------------------------------------------------------------
// AI Workforce Mission Release Gate endpoint
// ---------------------------------------------------------------------------
app.post("/api/ai-workforce/mission-release-gate", async (req: Request, res: Response) => {
  try {
    const body = (req.body || {}) as any;
    const queue = await requireMissionExecutionQueue(String(body.queueId || ""));
    const dossier = await buildStoredMissionOperatorReviewDossier(queue);
    const gate = buildMissionOperatorReleaseGate(queue, dossier, {
      ciStatus: body.ciStatus === "success" || body.ciStatus === "pending" || body.ciStatus === "failed" ? body.ciStatus : "unknown",
      approvals: Number(body.approvals || 0),
      requiredApprovals: Number(body.requiredApprovals || 1),
      snapshotChecksum: body.snapshotChecksum ? String(body.snapshotChecksum) : "",
      releaseLabel: Boolean(body.releaseLabel),
      rollbackConfirmed: Boolean(body.rollbackConfirmed),
      operatorConfirmed: Boolean(body.operatorConfirmed),
      notes: Array.isArray(body.notes) ? body.notes : [],
    });
    res.json({ ok: true, gate, dossier });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});`;

if (!source.includes('/api/ai-workforce/mission-release-gate')) {
  replaceOnce(routeAnchor, `${routeBlock}\n\n${routeAnchor}`, 'Unified System Overview route anchor');
}

if (changed) {
  fs.writeFileSync(daemonPath, source);
  console.log('AI Workforce Mission Release Gate route patched into assistant-daemon.');
} else {
  console.log('AI Workforce Mission Release Gate route already applied.');
}
