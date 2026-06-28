import fs from 'node:fs';
import path from 'node:path';

const daemonPath = path.resolve('server/assistant-daemon.ts');

if (!fs.existsSync(daemonPath)) {
  throw new Error(`assistant daemon source not found: ${daemonPath}`);
}

let source = fs.readFileSync(daemonPath, 'utf8');
let changed = false;

function replaceOnce(search, replacement, label) {
  if (!source.includes(search)) throw new Error(`Cannot patch release gate export route: missing ${label}`);
  source = source.replace(search, replacement);
  changed = true;
}

const importAnchor = 'import { getGitHubCIFailureContext, analyzeGitHubCIFailure } from "./services/githubCiDoctor";';
if (!source.includes('buildAIWorkforceReleaseGateExport')) {
  replaceOnce(importAnchor, `${importAnchor}\nimport { buildAIWorkforceReleaseGateExport } from "./services/aiWorkforceReleaseGateExport";`, 'GitHub CI Doctor import anchor');
}

const routeAnchor = '// ---------------------------------------------------------------------------\n// Unified System Overview (cross-service data linker)\n// ---------------------------------------------------------------------------';
const routeBlock = `// ---------------------------------------------------------------------------
// AI Workforce Release Gate Export endpoint
// ---------------------------------------------------------------------------
app.post("/api/ai-workforce/release-gate-export", async (req: Request, res: Response) => {
  try {
    const body = (req.body || {}) as any;
    const format = body.format === "markdown" ? "markdown" : "json";
    const result = await buildAIWorkforceReleaseGateExport({ format });
    res.json({ ok: true, exportArtifact: result.exportArtifact, dashboard: result.dashboard });
  } catch (err: any) { res.status(500).json({ ok: false, error: err.message }); }
});`;

if (!source.includes('/api/ai-workforce/release-gate-export')) {
  replaceOnce(routeAnchor, `${routeBlock}\n\n${routeAnchor}`, 'Unified System Overview route anchor');
}

if (changed) {
  fs.writeFileSync(daemonPath, source);
  console.log('AI Workforce Release Gate export route patched into assistant-daemon.');
} else {
  console.log('AI Workforce Release Gate export route already applied.');
}
