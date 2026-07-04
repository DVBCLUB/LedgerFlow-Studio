#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const runtimeFile = path.join(root, 'server/services/agentRuntime.ts');
const missionControlFile = path.join(root, 'src/modules/ai-nhan-su/AIWorkforceMissionControl.tsx');
const telegramFile = path.join(root, 'server/services/telegramMissionCommands.ts');

let failed = false;

for (const file of [runtimeFile, missionControlFile, telegramFile]) {
  if (!fs.existsSync(file)) {
    console.error(`Missing required file: ${path.relative(root, file)}`);
    failed = true;
  }
}

if (fs.existsSync(runtimeFile)) {
  const source = fs.readFileSync(runtimeFile, 'utf8');
  for (const token of [
    "'rejected'",
    'rejectAgentRunStep',
    'step.rejected',
    'agent.step.rejected',
    'Rejection fingerprint does not match',
    'Founder rejected',
  ]) {
    if (!source.includes(token)) {
      console.error(`Agent runtime rejection missing token: ${token}`);
      failed = true;
    }
  }
}

if (fs.existsSync(telegramFile)) {
  const source = fs.readFileSync(telegramFile, 'utf8');
  for (const token of ['rejectAgentRunStep', "case 'reject'", '/mission reject']) {
    if (!source.includes(token)) {
      console.error(`Telegram rejection missing token: ${token}`);
      failed = true;
    }
  }
}

if (fs.existsSync(missionControlFile)) {
  const source = fs.readFileSync(missionControlFile, 'utf8');
  if (!source.includes('Reject Step')) {
    console.warn('Warning: Mission Control UI does not expose Reject Step yet. Founder can reject through Telegram or daemon route after wiring.');
  }
}

if (failed) process.exit(1);
console.log('Agent runtime rejection check completed. Warnings identify UI or daemon route wiring still needed.');
