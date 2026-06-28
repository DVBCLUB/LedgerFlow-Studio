import fs from 'node:fs';

const files = [
  'server/services/aiWorkforceRuntimeRecordRetention.ts',
  'server/services/aiWorkforceReleaseGateExportRuntime.ts',
  'server/services/aiWorkforceRuntimeRecordRetention.test.ts',
];

for (const file of files) {
  if (!fs.existsSync(file)) throw new Error(`Missing retention policy file: ${file}`);
}

const corpus = files.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
for (const token of ['pruneRuntimeRecordsByType', 'AI_WORKFORCE_RELEASE_GATE_EXPORT_RETENTION', 'retentionLimit', 'release_gate_export']) {
  if (!corpus.includes(token)) throw new Error(`Missing retention policy token: ${token}`);
}

console.log('AI Workforce release gate retention policy contract is present.');
