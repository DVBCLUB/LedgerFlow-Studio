#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const serviceFile = path.join(root, 'server/services/patchReviewSessions.ts');
const daemonFile = path.join(root, 'server/assistant-daemon.ts');
const routePatcherFile = path.join(root, 'scripts/patch-daemon-patch-review-routes.mjs');

if (!fs.existsSync(serviceFile)) {
  console.error('Missing server/services/patchReviewSessions.ts');
  process.exit(1);
}
if (!fs.existsSync(routePatcherFile)) {
  console.error('Missing scripts/patch-daemon-patch-review-routes.mjs');
  process.exit(1);
}

const source = fs.readFileSync(serviceFile, 'utf8');
const requiredTokens = [
  'createPatchReviewSessionsFromRun',
  'listPatchReviewSessions',
  'updatePatchReviewSessionStatus',
  'PatchReviewStatus',
  'waiting_review',
  'approved_to_apply',
  'rolled_back',
  'safeManifestPath',
  'rollbackHint',
];

let failed = false;
for (const token of requiredTokens) {
  if (!source.includes(token)) {
    console.error(`Patch review service missing token: ${token}`);
    failed = true;
  }
}

const forbiddenWritePatterns = [
  /backupAndWrite\s*\(/,
  /createFile\s*\(/,
  /fs\.promises\.writeFile\([^)]*target/i,
];

for (const pattern of forbiddenWritePatterns) {
  if (pattern.test(source)) {
    console.error(`Patch review service contains a write/apply pattern before approval workflow is complete: ${pattern}`);
    failed = true;
  }
}

if (fs.existsSync(daemonFile)) {
  const daemon = fs.readFileSync(daemonFile, 'utf8');
  if (!daemon.includes('/api/patch-review-sessions')) {
    console.warn('Warning: patch review routes are not wired into assistant-daemon.ts yet. Run npm run ai:patch-patch-review-routes locally.');
  }
}

if (failed) process.exit(1);
console.log('Patch review session service is present and does not directly apply repository writes.');
