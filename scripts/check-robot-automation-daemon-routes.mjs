#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const patcherFile = path.join(root, 'scripts/patch-daemon-robot-automation-routes.mjs');
const oneShotFile = path.join(root, 'scripts/patch-ai-workforce-local.mjs');
const daemonFile = path.join(root, 'server/assistant-daemon.ts');
let failed = false;

for (const file of [patcherFile, oneShotFile, daemonFile]) {
  if (!fs.existsSync(file)) {
    console.error(`Missing required file: ${path.relative(root, file)}`);
    failed = true;
  }
}

if (fs.existsSync(patcherFile)) {
  const source = fs.readFileSync(patcherFile, 'utf8');
  for (const token of [
    'robotCapabilityRegistry',
    'automationSchedulerLoop',
    '/api/robot-capabilities',
    '/api/automation-scheduler/status',
  ]) {
    if (!source.includes(token)) {
      console.error(`Robot automation route patcher missing token: ${token}`);
      failed = true;
    }
  }
}

if (fs.existsSync(oneShotFile)) {
  const source = fs.readFileSync(oneShotFile, 'utf8');
  if (!source.includes('patch-daemon-robot-automation-routes.mjs')) {
    console.error('One-shot patcher does not run robot automation route patcher.');
    failed = true;
  }
}

if (fs.existsSync(daemonFile)) {
  const source = fs.readFileSync(daemonFile, 'utf8');
  if (!source.includes('/api/robot-capabilities') || !source.includes('/api/automation-scheduler/status')) {
    console.error('assistant-daemon.ts must include robot capability and automation scheduler routes before this check runs. Run node scripts/patch-ai-workforce-local.mjs first.');
    failed = true;
  }
}

if (failed) process.exit(1);
console.log('Robot automation daemon route check completed.');
