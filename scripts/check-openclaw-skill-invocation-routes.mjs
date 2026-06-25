#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const patcherFile = path.join(root, 'scripts/patch-daemon-openclaw-skill-invocation-routes.mjs');
const doctorFile = path.join(root, 'scripts/openclaw-plus-doctor.mjs');
const daemonFile = path.join(root, 'server/assistant-daemon.ts');
let failed = false;

for (const file of [patcherFile, doctorFile, daemonFile]) {
  if (!fs.existsSync(file)) {
    console.error(`Missing required file: ${path.relative(root, file)}`);
    failed = true;
  }
}

if (fs.existsSync(patcherFile)) {
  const source = fs.readFileSync(patcherFile, 'utf8');
  for (const token of ['openClawSkillInvocationGateway', '/api/openclaw-skills/:id/plan-invocation', 'auditOpenClawSkillInvocation']) {
    if (!source.includes(token)) {
      console.error(`OpenClaw skill invocation route patcher missing token: ${token}`);
      failed = true;
    }
  }
}

if (fs.existsSync(doctorFile)) {
  const source = fs.readFileSync(doctorFile, 'utf8');
  if (!source.includes('patch-daemon-openclaw-skill-invocation-routes.mjs')) {
    console.error('OpenClaw+ doctor does not run skill invocation route patcher.');
    failed = true;
  }
}

if (fs.existsSync(daemonFile)) {
  const source = fs.readFileSync(daemonFile, 'utf8');
  if (!source.includes('/api/openclaw-skills/:id/plan-invocation')) {
    console.warn('Warning: assistant-daemon.ts is not patched yet. Run npm run ai:openclaw-plus locally.');
  }
}

if (failed) process.exit(1);
console.log('OpenClaw skill invocation route check completed.');
