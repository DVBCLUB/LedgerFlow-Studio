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

if (!source.includes('buildRuntimeMissionReleaseGate')) {
  replaceOnce(importAnchor, `${importAnchor}\nimport { buildRuntimeMissionReleaseGate } from "./services/aiWorkforceMissionReleaseGateRuntime";`, 'GitHub CI Doctor import anchor');
}

const legacyImports = [
  'import { buildMissionOperatorReleaseGate } from "./services/aiWorkforceMissionReleaseGate";\n',
  'import { requireMissionExecutionQueue } from "./services/aiWorkforceMissionExecutionQueueStore";\n',
  'import { buildStoredMissionOperatorReviewDossier } from "./services/aiWorkforceMissionReviewNoteStore";\n',
];
for (const legacyImport of legacyImports) {
  if (source.includes(legacyImport)) {
    source = source.replace(legacyImport, '');
    changed = true;
  }
}

const routeAnchor = '// ---------------------------------------------------------------------------\n// Unified System Overview (cross-service data linker)\n// ---------------------------------------------------------------------------';
const routeBlock = `// ---------------------------------------------------------------------------
// AI Workforce Mission Release Gate endpoint
// ---------------------------------------------------------------------------
app.post("/api/ai-workforce/mission-release-gate", async (req: Request, res: Response) => {
  try {
    const body = (req.body || {}) as any;
    const result = await buildRuntimeMissionReleaseGate({
      queueId: String(body.queueId || ""),
      actor: String(body.actor || "Mission Operator"),
      evidence: {
        ciStatus: body.ciStatus === "success" || body.ciStatus === "pending" || body.ciStatus === "failed" ? body.ciStatus : "unknown",
        approvals: Number(body.approvals || 0),
        requiredApprovals: Number(body.requiredApprovals || 1),
        snapshotChecksum: body.snapshotChecksum ? String(body.snapshotChecksum) : "",
        releaseLabel: Boolean(body.releaseLabel),
        rollbackConfirmed: Boolean(body.rollbackConfirmed),
        operatorConfirmed: Boolean(body.operatorConfirmed),
        notes: Array.isArray(body.notes) ? body.notes : [],
      },
    });
    res.json({ ok: true, gate: result.gate, dossier: result.dossier, runtimeRecord: result.runtimeRecord, auditEvent: result.auditEvent, metric: result.metric });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});`;

if (!source.includes('/api/ai-workforce/mission-release-gate')) {
  replaceOnce(routeAnchor, `${routeBlock}\n\n${routeAnchor}`, 'Unified System Overview route anchor');
} else if (!source.includes('runtimeRecord: result.runtimeRecord')) {
  const currentRoute = /\/\/ ---------------------------------------------------------------------------\n\/\/ AI Workforce Mission Release Gate endpoint\n\/\/ ---------------------------------------------------------------------------\napp\.post\("\/api\/ai-workforce\/mission-release-gate", async \(req: Request, res: Response\) => \{[\s\S]*?\n\}\);/;
  if (!currentRoute.test(source)) throw new Error('Cannot patch release gate route: route block not found');
  source = source.replace(currentRoute, routeBlock);
  changed = true;
}

if (changed) {
  fs.writeFileSync(daemonPath, source);
  console.log('AI Workforce Mission Release Gate route patched into assistant-daemon.');
} else {
  console.log('AI Workforce Mission Release Gate route already applied.');
}
