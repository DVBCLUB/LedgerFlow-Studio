import fs from 'node:fs';

const requiredFiles = [
  'src/data/aiWorkforceCommandCenter.ts',
  'src/modules/ai-hr/AIWorkforceCommandCenter.tsx',
  'scripts/patch-ai-workforce-command-center.mjs',
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing required AI Workforce file: ${file}`);
  }
}

const data = fs.readFileSync('src/data/aiWorkforceCommandCenter.ts', 'utf8');
const panel = fs.readFileSync('src/modules/ai-hr/AIWorkforceCommandCenter.tsx', 'utf8');
const patch = fs.readFileSync('scripts/patch-ai-workforce-command-center.mjs', 'utf8');

const requiredTokens = [
  'AI_WORKFORCE_CAPABILITIES',
  'AI_WORKFORCE_LANES',
  'AI_WORKFORCE_RUNBOOK',
  'AIWorkforceCommandCenter',
  'AgentAssemblyBuilder lazy import',
  'AI Workforce overview slot',
];

for (const token of requiredTokens) {
  const found = data.includes(token) || panel.includes(token) || patch.includes(token);
  if (!found) {
    throw new Error(`AI Workforce Command Center contract missing token: ${token}`);
  }
}

console.log('AI Workforce Command Center contract looks healthy.');
