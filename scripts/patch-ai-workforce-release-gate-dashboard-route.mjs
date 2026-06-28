import fs from 'node:fs';
import path from 'node:path';

const daemonPath = path.resolve('server/assistant-daemon.ts');

if (!fs.existsSync(daemonPath)) {
  throw new Error(`assistant daemon source not found: ${daemonPath}`);
}

let source = fs.readFileSync(daemonPath, 'utf8');
let changed = false;

function replaceOnce(search, replacement, label) {
  if (!source.includes(search)) throw new Error(`Cannot patch release gate dashboard route: missing ${label}`);
  source = source.replace(search, replacement);
  changed = true;
}

const importAnchor = 'import { getGitHubCIFailureContext, analyzeGitHubCIFailure } from "./services/githubCiDoctor";';
if (!source.includes('getAIWorkforceReleaseGateDashboard')) {
  replaceOnce(importAnchor, `${importAnchor}\nimport { getAIWorkforceReleaseGateDashboard } from "./services/aiWorkforceReleaseGateDashboard";`, 'GitHub CI Doctor import anchor');
}

if (!source.includes('/api/ai-workforce/runtime')) {
  throw new Error('Cannot patch release gate dashboard route: runtime route is not present.');
}

if (!source.includes('dashboard: { ...dashboard, releaseGate }')) {
  replaceOnce(
    '    const dashboard = await getAIWorkforceRuntimeDashboard();\n    res.json({ ok: true, dashboard });',
    '    const dashboard = await getAIWorkforceRuntimeDashboard();\n    const releaseGate = await getAIWorkforceReleaseGateDashboard();\n    res.json({ ok: true, dashboard: { ...dashboard, releaseGate } });',
    'runtime dashboard response anchor',
  );
}

if (changed) {
  fs.writeFileSync(daemonPath, source);
  console.log('AI Workforce Release Gate dashboard route surfaced in assistant-daemon.');
} else {
  console.log('AI Workforce Release Gate dashboard route already surfaced.');
}
