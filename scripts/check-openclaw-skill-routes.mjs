#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const patcherFile = path.join(root, 'scripts/patch-daemon-openclaw-skill-routes.mjs');
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
  for (const token of ['openClawSkillRegistry', '/api/openclaw-skills', 'listOpenClawSkills', 'getOpenClawSkillSummary']) {
    if (!source.includes(token)) {
      console.error(`OpenClaw skill route patcher missing token: ${token}`);
      failed = true;
    }
  }
}

if (fs.existsSync(doctorFile)) {
  const source = fs.readFileSync(doctorFile, 'utf8');
  if (!source.includes('patch-daemon-openclaw-skill-routes.mjs')) {
    console.error('OpenClaw+ doctor does not run skill route patcher.');
    failed = true;
  }
}

if (fs.existsSync(daemonFile)) {
  const source = fs.readFileSync(daemonFile, 'utf8');
  if (!source.includes('/api/openclaw-skills')) {
    console.error('assistant-daemon.ts must include /api/openclaw-skills before this check runs. Run node scripts/patch-ai-workforce-local.mjs first.');
    failed = true;
  }
}

if (failed) process.exit(1);
console.log('OpenClaw skill route check completed.');
