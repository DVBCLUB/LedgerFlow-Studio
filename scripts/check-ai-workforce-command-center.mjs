import fs from 'node:fs';

const requiredFiles = [
  'src/data/aiWorkforceCommandCenter.ts',
  'src/modules/ai-hr/AIWorkforceCommandCenter.tsx',
  'server/services/aiWorkforceGapAssessment.ts',
  'server/services/aiWorkforceGapAssessment.test.ts',
  'scripts/patch-ai-workforce-command-center.mjs',
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing required AI Workforce file: ${file}`);
  }
}

const data = fs.readFileSync('src/data/aiWorkforceCommandCenter.ts', 'utf8');
const panel = fs.readFileSync('src/modules/ai-hr/AIWorkforceCommandCenter.tsx', 'utf8');
const gapService = fs.readFileSync('server/services/aiWorkforceGapAssessment.ts', 'utf8');
const gapTest = fs.readFileSync('server/services/aiWorkforceGapAssessment.test.ts', 'utf8');
const patch = fs.readFileSync('scripts/patch-ai-workforce-command-center.mjs', 'utf8');

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
  'AgentAssemblyBuilder lazy import',
  'AI Workforce overview slot',
];

for (const token of requiredTokens) {
  const found = data.includes(token) || panel.includes(token) || gapService.includes(token) || gapTest.includes(token) || patch.includes(token);
  if (!found) {
    throw new Error(`AI Workforce Command Center contract missing token: ${token}`);
  }
}

const gapRowCount = (data.match(/status: '(achieved|partial|gap)'/g) || []).length;
if (gapRowCount < 8) {
  throw new Error(`AI Workforce gap matrix should track at least 8 rows; found ${gapRowCount}`);
}

console.log('AI Workforce Command Center contract looks healthy.');
