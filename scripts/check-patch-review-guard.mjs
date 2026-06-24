#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const serviceFile = path.join(root, 'server/services/patchReviewApply.ts');
const routePatcherFile = path.join(root, 'scripts/patch-daemon-patch-review-routes.mjs');

let failed = false;

for (const file of [serviceFile, routePatcherFile]) {
  if (!fs.existsSync(file)) {
    console.error(`Missing required file: ${path.relative(root, file)}`);
    failed = true;
  }
}

if (fs.existsSync(serviceFile)) {
  const source = fs.readFileSync(serviceFile, 'utf8');
  for (const token of [
    'PATCH_APPLY_PHRASE',
    'PATCH_ROLLBACK_PHRASE',
    'approved_to_apply',
    'rolled_back',
    'workspacePath',
    'validateManifestFiles',
    'Path escaped workspace root',
    'Patch apply phrase mismatch',
    'Patch rollback phrase mismatch',
  ]) {
    if (!source.includes(token)) {
      console.error(`Guarded patch review service missing token: ${token}`);
      failed = true;
    }
  }
}

if (fs.existsSync(routePatcherFile)) {
  const source = fs.readFileSync(routePatcherFile, 'utf8');
  for (const token of [
    '/api/patch-review-sessions/:id/apply',
    '/api/patch-review-sessions/:id/rollback',
    'PATCH_APPLY_PHRASE',
    'PATCH_ROLLBACK_PHRASE',
  ]) {
    if (!source.includes(token)) {
      console.error(`Patch review route patcher missing token: ${token}`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log('Guarded patch review service check completed.');
