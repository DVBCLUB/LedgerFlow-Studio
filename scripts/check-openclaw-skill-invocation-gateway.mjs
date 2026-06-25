#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const file = path.join(root, 'server/services/openClawSkillInvocationGateway.ts');
let failed = false;

if (!fs.existsSync(file)) {
  console.error('Missing server/services/openClawSkillInvocationGateway.ts');
  process.exit(1);
}

const source = fs.readFileSync(file, 'utf8');
for (const token of [
  'decideOpenClawSkillInvocation',
  'auditOpenClawSkillInvocation',
  'pending_approval',
  'blocked',
  'dry_run',
  'openclaw.skill.blocked',
  'openclaw.skill.pending_approval',
  'openclaw.skill.dry_run',
  'No side effect is executed by the gateway',
]) {
  if (!source.includes(token)) {
    console.error(`OpenClaw skill invocation gateway missing token: ${token}`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log('OpenClaw skill invocation gateway check completed.');
