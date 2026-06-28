import fs from 'node:fs';

const requiredFiles = [
  'server/services/aiWorkforceMissionExecutionQueue.ts',
  'server/services/aiWorkforceMissionExecutionQueue.test.ts',
  'server/services/aiWorkforceRuntimeHub.ts',
  'server/services/aiWorkforceRuntimeStore.ts',
  'server/services/aiWorkforceOperationalLedger.ts',
  'src/services/aiWorkforceRuntimeClient.ts',
  'src/modules/ai-hr/AIWorkforceRuntimePanel.tsx',
  'dist/assistant-daemon.cjs',
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) throw new Error(`Missing Mission Execution Queue contract file: ${file}`);
}

const corpus = requiredFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
const requiredTokens = [
  'createMissionExecutionQueue',
  'approveMissionExecutionStep',
  'startMissionExecutionStep',
  'completeMissionExecutionStep',
  'cancelMissionExecutionQueue',
  'MissionExecutionQueue',
  'MissionExecutionApproval',
  'MissionExecutionEvidence',
  'approvalFingerprint',
  'dependenciesCompleted',
  'mission_execution_queue',
  'mission_execution_queued',
  'buildRuntimeMissionExecutionQueue',
  '/api/ai-workforce/mission-execution-queue',
  'createSampleMissionExecutionQueue',
  'Queue mission',
  'Approval gates',
];

for (const token of requiredTokens) {
  if (!corpus.includes(token)) throw new Error(`Mission Execution Queue contract missing token: ${token}`);
}

console.log('AI Workforce Mission Execution Queue service, runtime bridge, daemon bundle route, UI client, approval gates, evidence trail, and tests are present.');
