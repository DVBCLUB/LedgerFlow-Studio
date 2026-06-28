import fs from 'node:fs';

const requiredFiles = [
  'server/services/aiWorkforceMissionExecutionQueue.ts',
  'server/services/aiWorkforceMissionExecutionQueue.test.ts',
  'server/services/aiWorkforceMissionExecutionQueueStore.ts',
  'server/services/aiWorkforceMissionExecutionQueueStore.test.ts',
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
  'saveMissionExecutionQueue',
  'listMissionExecutionQueues',
  'requireMissionExecutionQueue',
  'approveStoredMissionExecutionStep',
  'completeStoredMissionExecutionStep',
  'cancelStoredMissionExecutionQueue',
  'AI_WORKFORCE_MISSION_QUEUE_STORE_FILE',
  'ai_workforce_mission_queues.local.json',
  'MissionExecutionQueue',
  'MissionExecutionApproval',
  'MissionExecutionEvidence',
  'approvalFingerprint',
  'dependenciesCompleted',
  'mission_execution_queue',
  'mission_execution_queued',
  'mission_execution_resumed',
  'mission_step_approved',
  'mission_step_started',
  'mission_step_completed',
  'mission_execution_cancelled',
  'buildRuntimeMissionExecutionQueue',
  'listRuntimeMissionExecutionQueues',
  'resumeRuntimeMissionExecutionQueue',
  'approveRuntimeMissionExecutionStep',
  'startRuntimeMissionExecutionStep',
  'completeRuntimeMissionExecutionStep',
  'cancelRuntimeMissionExecutionQueue',
  '/api/ai-workforce/mission-execution-queues',
  '/api/ai-workforce/mission-execution-queue/resume',
  '/api/ai-workforce/mission-execution-queue/approve',
  '/api/ai-workforce/mission-execution-queue/start',
  '/api/ai-workforce/mission-execution-queue/complete',
  '/api/ai-workforce/mission-execution-queue/cancel',
  'missionQueueStats',
  'createSampleMissionExecutionQueue',
  'Queue mission',
  'Approval gates',
];

for (const token of requiredTokens) {
  if (!corpus.includes(token)) throw new Error(`Mission Execution Queue contract missing token: ${token}`);
}

console.log('AI Workforce Mission Execution Queue service, persistent store, resume/cancel APIs, daemon bundle routes, UI client, approval gates, evidence trail, and tests are present.');
