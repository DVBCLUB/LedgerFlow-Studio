import fs from 'node:fs';

const requiredFiles = [
  'src/data/aiWorkforceCommandCenter.ts',
  'src/modules/ai-hr/AIOperationsCenter.tsx',
  'src/modules/ai-hr/AIWorkforceCommandCenter.tsx',
  'src/modules/ai-hr/AIWorkforceRuntimePanel.tsx',
  'src/services/aiWorkforceRuntimeClient.ts',
  'server/services/aiWorkforceGapAssessment.ts',
  'server/services/aiWorkforceGapAssessment.test.ts',
  'server/services/groundedContextPack.ts',
  'server/services/groundedContextPack.test.ts',
  'server/services/aiWorkforcePipelineContextGuard.ts',
  'server/services/aiWorkforcePipelineContextGuard.test.ts',
  'server/services/aiBenchmarkObservability.ts',
  'server/services/aiBenchmarkObservability.test.ts',
  'server/services/automationSafetyEnvelope.ts',
  'server/services/automationSafetyEnvelope.test.ts',
  'server/services/softwareFactoryReadiness.ts',
  'server/services/softwareFactoryReadiness.test.ts',
  'server/services/softwareFactoryPrControl.ts',
  'server/services/softwareFactoryPrControl.test.ts',
  'server/services/aiWorkforceRunMetricStore.ts',
  'server/services/aiWorkforceRunMetricStore.test.ts',
  'server/services/mcpToolManifestRegistry.ts',
  'server/services/mcpToolManifestRegistry.test.ts',
  'server/services/aiWorkforceOperationalLedger.ts',
  'server/services/aiWorkforceOperationalLedger.test.ts',
  'server/services/aiWorkforceRuntimeStore.ts',
  'server/services/aiWorkforceRuntimeHub.ts',
  'server/services/aiWorkforceRuntimeHub.test.ts',
  'server/services/pipelineOrchestrator.ts',
  'scripts/patch-ai-workforce-command-center.mjs',
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing required AI Workforce file: ${file}`);
  }
}

const corpus = requiredFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n');

const requiredTokens = [
  'AI_WORKFORCE_CAPABILITIES',
  'AI_WORKFORCE_LANES',
  'AI_WORKFORCE_RUNBOOK',
  'AI_WORKFORCE_GAP_MATRIX',
  'AI_WORKFORCE_UPGRADE_BACKLOG',
  "import AIWorkforceCommandCenter from './AIWorkforceCommandCenter';",
  "import AIWorkforceRuntimePanel from './AIWorkforceRuntimePanel';",
  '<AIWorkforceCommandCenter />',
  '<AIWorkforceRuntimePanel />',
  'AIWorkforceCommandCenter',
  'AIWorkforceRuntimePanel',
  'fetchAIWorkforceRuntimeDashboard',
  'createSampleGroundedContextPack',
  'previewSampleAutomationSafety',
  'scoreSamplePRReadiness',
  'buildSamplePRControlReport',
  'Live Runtime Hub',
  'PR Control',
  'Gap Matrix',
  'Upgrade Backlog',
  'assessAIWorkforceReadiness',
  'buildAIWorkforceUpgradeBacklog',
  'benchmark_observability',
  'buildGroundedContextPack',
  'requireGroundedContextForHighImpact',
  'buildPipelineStepGroundedContext',
  'PipelineStepGroundingResult',
  'GROUNDED PIPELINE CONTEXT',
  'groundedContextPackId',
  'groundedContextGuardOk',
  'groundedContextContradictions',
  'recordAIRunMetric',
  'evaluateAIBaselineSuite',
  'validateAutomationSafetyEnvelope',
  'createEmergencyStopContract',
  'scoreSoftwareFactoryReadiness',
  'assertSoftwareFactoryReady',
  'buildSoftwareFactoryPRControlReport',
  'assertPRControlMergeAllowed',
  'reviewerChecklist',
  'releaseNotesDraft',
  'mergeGate',
  'buildMCPToolManifest',
  'exportMCPToolManifestCatalog',
  'validateMCPToolManifest',
  'assessMCPToolHealth',
  'credentialScopes',
  'fingerprint',
  'tooling',
  'persistKnowledgeGraphFromContextPack',
  'appendAIWorkforceAuditEvent',
  'appendAIWorkforceTrendSnapshot',
  'getAIWorkforceOperationalLedgerDashboard',
  'auditStats',
  'trendStats',
  'graphStats',
  'ledger',
  'appendAIWorkforceRuntimeRecord',
  'appendAIWorkforceRunMetric',
  'listAIWorkforceRunMetrics',
  'getAIWorkforceRunMetricStoreStats',
  'metricStoreStats',
  'dedupeMetrics',
  'Persistent metric store',
  'Persisted ${metricStoreStats',
  'latest: {metricStoreStats',
  'buildRuntimeGroundedContext',
  'previewRuntimeAutomation',
  'scoreRuntimePRReadiness',
  'buildRuntimePRControlReport',
  'getAIWorkforceRuntimeDashboard',
  'ensureRuntimeHubImport',
  'ensureRuntimeHubRoutes',
  'hasDirectCommandCenter',
  'hasDirectRuntimePanel',
  'previousImport',
  'AI Workforce PR Control route upgrade',
  '/api/ai-workforce/runtime',
  '/api/ai-workforce/context-pack',
  '/api/ai-workforce/safety-preview',
  '/api/ai-workforce/pr-readiness',
  '/api/ai-workforce/pr-control',
  'Grounded Context Pack',
  'PR readiness',
  'safety envelope',
  'AI Workforce overview slot',
  'AI Workforce Runtime Panel slot',
  'AI Workforce Runtime Hub route block',
];

for (const token of requiredTokens) {
  if (!corpus.includes(token)) {
    throw new Error(`AI Workforce Command Center contract missing token: ${token}`);
  }
}

const data = fs.readFileSync('src/data/aiWorkforceCommandCenter.ts', 'utf8');
const gapRowCount = (data.match(/status: '(achieved|partial|gap)'/g) || []).length;
if (gapRowCount < 8) {
  throw new Error(`AI Workforce gap matrix should track at least 8 rows; found ${gapRowCount}`);
}

console.log('AI Workforce Command Center, direct runtime UI integration, pipeline grounded context, persistent metrics UI, PR control, MCP tooling, operational ledger, patch hardening, upgrade services, and runtime hub contracts look healthy.');
