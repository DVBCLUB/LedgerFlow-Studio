#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = {
  ops: path.join(root, 'src/modules/ai-hr/AIOperationsCenter.tsx'),
  runbook: path.join(root, 'src/modules/ai-hr/AIWorkforcePatchSafetyRunbook.tsx'),
  runbookPatcher: path.join(root, 'scripts/patch-ai-ops-safety-runbook-panel.mjs'),
  oneShotPatcher: path.join(root, 'scripts/patch-ai-workforce-local.mjs'),
};

let failed = false;
for (const [label, file] of Object.entries(files)) {
  if (!fs.existsSync(file)) {
    console.error(`Missing ${label}: ${path.relative(root, file)}`);
    failed = true;
  }
}

if (fs.existsSync(files.runbook)) {
  const source = fs.readFileSync(files.runbook, 'utf8');
  for (const token of ['Patch Safety Runbook', 'Safety checklist', 'Local validation commands']) {
    if (!source.includes(token)) {
      console.error(`Patch Safety Runbook missing token: ${token}`);
      failed = true;
    }
  }
}

if (fs.existsSync(files.runbookPatcher)) {
  const source = fs.readFileSync(files.runbookPatcher, 'utf8');
  for (const token of ['AIWorkforcePatchSafetyRunbook', 'AIWorkforcePatchReviewSessions']) {
    if (!source.includes(token)) {
      console.error(`Runbook panel patcher missing token: ${token}`);
      failed = true;
    }
  }
}

if (fs.existsSync(files.oneShotPatcher)) {
  const source = fs.readFileSync(files.oneShotPatcher, 'utf8');
  if (!source.includes('patch-ai-ops-safety-runbook-panel.mjs')) {
    console.error('One-shot AI Workforce patcher does not run the safety runbook panel patcher.');
    failed = true;
  }
}

if (fs.existsSync(files.ops)) {
  const source = fs.readFileSync(files.ops, 'utf8');
  if (!source.includes('AIWorkforcePatchSafetyRunbook')) {
    console.warn('Warning: AIOperationsCenter.tsx is not patched yet. Run node scripts/patch-ai-workforce-local.mjs locally.');
  }
}

if (failed) process.exit(1);
console.log('AI Workforce UI wiring check completed. Warnings identify local patching still needed.');
