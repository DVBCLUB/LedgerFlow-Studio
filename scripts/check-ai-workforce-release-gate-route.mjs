import './check-ai-workforce-release-gate-trend-analytics.mjs';
import fs from 'node:fs';

const files = [
  'server/services/aiWorkforceMissionReleaseGate.ts',
  'server/services/aiWorkforceMissionReleaseGateRuntime.ts',
  'server/services/aiWorkforceMissionReleaseGateRuntime.test.ts',
  'server/services/aiWorkforceMissionReleaseGate.test.ts',
  'server/services/aiWorkforceMissionSnapshotExport.ts',
  'server/services/aiWorkforceReleaseGateDashboard.ts',
  'server/services/aiWorkforceRuntimeStore.ts',
  'server/services/aiWorkforceOperationalLedger.ts',
  'scripts/patch-ai-workforce-release-gate-route.mjs',
  'scripts/patch-ai-workforce-release-gate-dashboard-route.mjs',
  'scripts/patch-ai-workforce-release-gate-dashboard-ui.mjs',
  'scripts/patch-ai-workforce-snapshot-release-evidence.mjs',
  'scripts/patch-ai-workforce-snapshot-export-ui.mjs',
  'src/services/aiWorkforceRuntimeClient.ts',
  'src/modules/ai-hr/MissionReleaseGatePanel.tsx',
  'src/modules/ai-hr/ReleaseGateDashboardCard.tsx',
  'src/modules/ai-hr/AIWorkforceRuntimePanel.tsx',
  'src/modules/ai-hr/AIOperationsCenter.tsx',
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
  'buildRuntimeMissionReleaseGate',
  'getAIWorkforceReleaseGateDashboard',
  'releaseGateTimelineItem',
  'timeline',
  'Release Gate Historical Timeline',
  'historical timeline và trend analytics surfaced',
  'mission_release_gate',
  'mission_release_gate_recorded',
  'runtimeRecord',
  'auditEvent',
  'metric',
  'dashboard: { ...dashboard, releaseGate }',
  'ReleaseGateDashboardCard',
  'Release Gate Dashboard',
  '<ReleaseGateDashboardCard releaseGate={releaseGate} />',
  'latestDecision',
  'latestReleaseReady',
  'latestChecksum',
  'latestFinalAction',
  'mission-release-gate',
  '/api/ai-workforce/mission-release-gate',
  '/api/ai-workforce/mission-snapshot-export',
  'AI Workforce Mission Release Gate route patched into assistant-daemon',
  'AI Workforce Release Gate dashboard route surfaced in assistant-daemon',
  'AI Workforce Release Gate dashboard UI card mounted in Runtime Panel',
  'AI Workforce Mission Snapshot Release Evidence binding patched into assistant-daemon',
  'releaseEvidence',
  'body.releaseEvidence',
  'buildMissionQueueReleaseGate',
  'MissionReleaseGatePanel',
  'Mission Release Gate',
  'Run release gate',
  'Bind snapshot release gate',
  'Release Gate UI Snapshot Binding',
  'payload.snapshot?.releaseGate',
  '<MissionReleaseGatePanel />',
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
