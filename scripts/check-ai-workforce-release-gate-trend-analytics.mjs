import fs from 'node:fs';

const files = [
  'server/services/aiWorkforceReleaseGateDashboard.ts',
  'server/services/aiWorkforceReleaseGateTrendAnalytics.test.ts',
  'src/modules/ai-hr/ReleaseGateDashboardCard.tsx',
  'dist/assistant-daemon.cjs',
];

for (const file of files) {
  if (!fs.existsSync(file)) throw new Error(`Missing release gate trend analytics file: ${file}`);
}

const corpus = files.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
const tokens = [
  'buildReleaseGateTrendAnalytics',
  'trendAnalytics',
  'readyRate',
  'averageScore',
  'scoreDelta',
  'trendDirection',
  'decisionBreakdown',
  'Release Gate Trend Analytics',
  'Avg score',
  'Score delta',
  'Decision breakdown',
];

for (const token of tokens) {
  if (!corpus.includes(token)) throw new Error(`Release gate trend analytics contract missing token: ${token}`);
}

console.log('AI Workforce release gate trend analytics contract is present.');
