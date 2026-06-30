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

function replaceFirstAvailable(candidates, replacementFactory, label) {
  for (const search of candidates) {
    if (!source.includes(search)) continue;
    const replacement = typeof replacementFactory === 'function' ? replacementFactory(search) : replacementFactory;
    source = source.replace(search, replacement);
    changed = true;
    return;
  }
  throw new Error(`Cannot patch release gate export route: missing ${label}`);
}

const importAnchor = 'import { getGitHubCIFailureContext, analyzeGitHubCIFailure } from "./services/githubCiDoctor";';
if (!source.includes('buildAIWorkforceReleaseGateExport')) {
  replaceFirstAvailable(
    [
      importAnchor,
      'import { gatherSystemOverview } from "./services/crossServiceDataLinker";',
      'import express, { Request, Response, NextFunction } from "express";',
    ],
    (anchor) => anchor === importAnchor
      ? `${importAnchor}\nimport { buildAIWorkforceReleaseGateExport } from "./services/aiWorkforceReleaseGateExport";`
      : `${anchor}\nimport { buildAIWorkforceReleaseGateExport } from "./services/aiWorkforceReleaseGateExport";`,
    'release gate export import anchor',
  );
}

const routeAnchor = '// ---------------------------------------------------------------------------\n// Unified System Overview (cross-service data linker)\n// ---------------------------------------------------------------------------';
const fallbackRouteAnchors = [
  routeAnchor,
  '// ---------------------------------------------------------------------------\n// AI Workforce Mission Release Gate endpoint\n// ---------------------------------------------------------------------------',
  '// ---------------------------------------------------------------------------\n// AI Workforce Mission Snapshot Export and Review Notes endpoints\n// ---------------------------------------------------------------------------',
  '// ---------------------------------------------------------------------------\n// Agent Control Plane endpoints\n// ---------------------------------------------------------------------------',
  '// ---------------------------------------------------------------------------\n// Robot Adapter Boundary endpoints (P2)\n// ---------------------------------------------------------------------------',
  '// ---------------------------------------------------------------------------\n// Browser Runbook endpoints (P2)\n// ---------------------------------------------------------------------------',
  'const PORT = Number(process.env.ASSISTANT_DAEMON_PORT ?? 3001);',
  'app.listen(PORT',
];

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
  replaceFirstAvailable(
    fallbackRouteAnchors,
    (anchor) => `${routeBlock}\n\n${anchor}`,
    'release gate export route anchor',
  );
}

if (changed) {
  fs.writeFileSync(daemonPath, source);
  console.log('AI Workforce Release Gate export route patched into assistant-daemon.');
} else {
  console.log('AI Workforce Release Gate export route already applied.');
}
