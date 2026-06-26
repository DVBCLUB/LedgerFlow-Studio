import fs from 'node:fs';

const requiredFiles = [
  'src/data/aiWorkforceCommandCenter.ts',
  'src/modules/ai-hr/AIWorkforceCommandCenter.tsx',
  'server/services/aiWorkforceGapAssessment.ts',
  'server/services/aiWorkforceGapAssessment.test.ts',
  'server/services/groundedContextPack.ts',
  'server/services/groundedContextPack.test.ts',
  'server/services/aiBenchmarkObservability.ts',
  'server/services/aiBenchmarkObservability.test.ts',
  'server/services/automationSafetyEnvelope.ts',
  'server/services/automationSafetyEnvelope.test.ts',
  'server/services/softwareFactoryReadiness.ts',
  'server/services/softwareFactoryReadiness.test.ts',
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
  'AIWorkforceCommandCenter',
  'Gap Matrix',
  'Upgrade Backlog',
  'assessAIWorkforceReadiness',
  'buildAIWorkforceUpgradeBacklog',
  'benchmark_observability',
  'buildGroundedContextPack',
  'requireGroundedContextForHighImpact',
  'recordAIRunMetric',
  'evaluateAIBaselineSuite',
  'validateAutomationSafetyEnvelope',
  'createEmergencyStopContract',
  'scoreSoftwareFactoryReadiness',
  'assertSoftwareFactoryReady',
  'AgentAssemblyBuilder lazy import',
  'AI Workforce overview slot',
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

console.log('AI Workforce Command Center and upgrade contracts look healthy.');
