#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const file = path.join(root, 'server/services/sandboxToolExecutor.ts');
let failed = false;

if (!fs.existsSync(file)) {
  console.error('Missing server/services/sandboxToolExecutor.ts');
  process.exit(1);
}

const source = fs.readFileSync(file, 'utf8');
for (const token of [
  'draftPatchMetadata',
  'review_only_patch_manifest',
  'applyable: false',
  'targetFiles',
  'patchIntent',
  'requiredNextStep',
  'Virtual review-only patch manifest',
  'safeRelativeFile',
]) {
  if (!source.includes(token)) {
    console.error(`Draft patch manifest contract missing token: ${token}`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log('Draft patch manifest contract check completed.');
