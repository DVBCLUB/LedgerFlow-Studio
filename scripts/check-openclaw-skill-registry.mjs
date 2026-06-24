#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const file = path.join(root, 'server/services/openClawSkillRegistry.ts');
let failed = false;

if (!fs.existsSync(file)) {
  console.error('Missing server/services/openClawSkillRegistry.ts');
  process.exit(1);
}

const source = fs.readFileSync(file, 'utf8');
for (const token of [
  'listOpenClawSkills',
  'getOpenClawSkill',
  'getOpenClawSkillSummary',
  'listAgentToolContracts',
  'listRobotCapabilities',
  'automation.scheduler.status',
  'governance.ai.emergency_stop',
]) {
  if (!source.includes(token)) {
    console.error(`OpenClaw skill registry missing token: ${token}`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log('OpenClaw skill registry check completed.');
