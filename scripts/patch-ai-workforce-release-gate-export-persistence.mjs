import './patch-ai-workforce-release-gate-export-smoke.mjs';
import fs from 'node:fs';
import path from 'node:path';

const daemonPath = path.resolve('server/assistant-daemon.ts');

if (!fs.existsSync(daemonPath)) {
  throw new Error(`assistant daemon source not found: ${daemonPath}`);
}

let source = fs.readFileSync(daemonPath, 'utf8');
let changed = false;

function replaceOnce(search, replacement, label) {
  if (!source.includes(search)) throw new Error(`Cannot patch release gate export persistence: missing ${label}`);
  source = source.replace(search, replacement);
  changed = true;
}

const importAnchor = 'import { getGitHubCIFailureContext, analyzeGitHubCIFailure } from "./services/githubCiDoctor";';
if (!source.includes('buildRuntimeReleaseGateExport')) {
  replaceOnce(importAnchor, `${importAnchor}\nimport { buildRuntimeReleaseGateExport } from "./services/aiWorkforceReleaseGateExportRuntime";`, 'GitHub CI Doctor import anchor');
}

const oldCall = '    const result = await buildAIWorkforceReleaseGateExport({ format });\n    res.json({ ok: true, exportArtifact: result.exportArtifact, dashboard: result.dashboard });';
const newCall = '    const result = await buildRuntimeReleaseGateExport({ format, actor: String(body.actor || "Mission Operator") });\n    res.json({ ok: true, exportArtifact: result.exportArtifact, dashboard: result.dashboard, runtimeRecord: result.runtimeRecord, auditEvent: result.auditEvent, metric: result.metric, retention: result.retention });';
const previousCall = '    const result = await buildRuntimeReleaseGateExport({ format, actor: String(body.actor || "Mission Operator") });\n    res.json({ ok: true, exportArtifact: result.exportArtifact, dashboard: result.dashboard, runtimeRecord: result.runtimeRecord, auditEvent: result.auditEvent, metric: result.metric });';

if (source.includes(oldCall)) {
  replaceOnce(oldCall, newCall, 'release gate export route response anchor');
} else if (source.includes(previousCall)) {
  replaceOnce(previousCall, newCall, 'release gate export retention response anchor');
}

if (changed) {
  fs.writeFileSync(daemonPath, source);
  console.log('AI Workforce Release Gate export persistence patched into assistant-daemon.');
} else {
  console.log('AI Workforce Release Gate export persistence already applied.');
}
