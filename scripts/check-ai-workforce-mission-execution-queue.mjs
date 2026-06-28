import fs from 'node:fs';

const requiredFiles = [
  'server/services/aiWorkforceMissionExecutionQueue.ts',
  'server/services/aiWorkforceMissionExecutionQueue.test.ts',
  'server/services/aiWorkforceMissionExecutionQueueStore.ts',
  'server/services/aiWorkforceMissionExecutionQueueStore.test.ts',
  'server/services/aiWorkforceMissionToolExecutor.ts',
  'server/services/aiWorkforceMissionToolExecutor.test.ts',
  'server/services/aiWorkforceRuntimeMissionToolExecutor.test.ts',
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
  'previewMissionStepToolExecution',
  'executeMissionStepToolSimulation',
  'createAgentToolExecutionPreview',
  'consumeAgentToolExecution',
  'toolAliases',
  'github_pr_control',
  'draft_patch',
  'mission_execution_queue',
  'mission_tool_execution',
  'mission_execution_queued',
  'mission_execution_resumed',
  'mission_step_approved',
  'mission_step_started',
  'mission_step_completed',
  'mission_tool_previewed',
  'mission_tool_executed',
  'mission_execution_cancelled',
  'buildRuntimeMissionExecutionQueue',
  'listRuntimeMissionExecutionQueues',
  'resumeRuntimeMissionExecutionQueue',
  'approveRuntimeMissionExecutionStep',
  'startRuntimeMissionExecutionStep',
  'completeRuntimeMissionExecutionStep',
  'previewRuntimeMissionStepToolExecution',
  'executeRuntimeMissionStepToolSimulation',
  'cancelRuntimeMissionExecutionQueue',
  '/api/ai-workforce/mission-execution-queues',
  '/api/ai-workforce/mission-execution-queue/resume',
  '/api/ai-workforce/mission-execution-queue/approve',
  '/api/ai-workforce/mission-execution-queue/start',
  '/api/ai-workforce/mission-execution-queue/complete',
  '/api/ai-workforce/mission-execution-queue/tool-preview',
  '/api/ai-workforce/mission-execution-queue/tool-execute',
  '/api/ai-workforce/mission-execution-queue/cancel',
  'previewMissionExecutionQueueTool',
  'executeMissionExecutionQueueTool',
  'Dry-run tool',
  'Execute sim',
  'missionQueueStats',
  'createSampleMissionExecutionQueue',
  'Queue mission',
  'Approval gates',
];

for (const token of requiredTokens) {
  if (!corpus.includes(token)) throw new Error(`Mission Execution Queue contract missing token: ${token}`);
}

console.log('AI Workforce Mission Execution Queue service, persistent store, tool execution adapter, resume/cancel/tool APIs, daemon bundle routes, UI client, approval gates, evidence trail, and tests are present.');
