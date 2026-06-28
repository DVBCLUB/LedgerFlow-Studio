import './check-ai-workforce-release-gate-retention-policy.mjs';
import fs from 'node:fs';

const files = [
  'server/services/aiWorkforceReleaseGateExport.ts',
  'server/services/aiWorkforceReleaseGateExport.test.ts',
  'scripts/patch-ai-workforce-release-gate-export-route.mjs',
  'scripts/patch-ai-workforce-snapshot-export-ui.mjs',
  'src/modules/ai-hr/ReleaseGateDashboardCard.tsx',
  'dist/assistant-daemon.cjs',
];

for (const file of files) {
  if (!fs.existsSync(file)) throw new Error(`Missing release gate export summary file: ${file}`);
}

const corpus = files.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
const tokens = [
  'AIWorkforceReleaseGateExport',
  'buildReleaseGateDashboardExport',
  'buildAIWorkforceReleaseGateExport',
  'ai_workforce_release_gate_dashboard_export',
  'AI Workforce Release Gate Export Summary',
  'Release Gate Export Summary',
  'release-gate-export',
  '/api/ai-workforce/release-gate-export',
  'Export JSON summary',
  'Export Markdown summary',
  'exportArtifact',
  'checksum',
  'filename',
  'Markdown handoff artifact',
  'AI Workforce Release Gate export route patched into assistant-daemon',
];

for (const token of tokens) {
  if (!corpus.includes(token)) throw new Error(`Release gate export summary contract missing token: ${token}`);
}

console.log('AI Workforce release gate export summary contract is present.');
