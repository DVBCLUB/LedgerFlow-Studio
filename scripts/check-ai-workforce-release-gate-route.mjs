import fs from 'node:fs';

const files = [
  'server/services/aiWorkforceMissionReleaseGate.ts',
  'server/services/aiWorkforceMissionReleaseGate.test.ts',
  'server/services/aiWorkforceMissionSnapshotExport.ts',
  'scripts/patch-ai-workforce-release-gate-route.mjs',
  'scripts/patch-ai-workforce-snapshot-export-ui.mjs',
  'src/services/aiWorkforceRuntimeClient.ts',
  'dist/assistant-daemon.cjs',
];

for (const file of files) {
  if (!fs.existsSync(file)) throw new Error(`Missing release gate contract file: ${file}`);
}

const corpus = files.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
const tokens = [
  'MissionOperatorReleaseGate',
  'MissionOperatorReleaseEvidence',
  'buildMissionOperatorReleaseGate',
  'mission-release-gate',
  '/api/ai-workforce/mission-release-gate',
  'AI Workforce Mission Release Gate route patched into assistant-daemon',
  'buildMissionQueueReleaseGate',
  'releaseGateDecision',
  'releaseGateReady',
  'releaseGateScore',
  'Operator release gate',
  'missingEvidence',
  'finalAction',
];

for (const token of tokens) {
  if (!corpus.includes(token)) throw new Error(`Release gate route contract missing token: ${token}`);
}

console.log('AI Workforce release gate route contract is present.');
