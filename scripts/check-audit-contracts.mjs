#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = [
  'server/services/automationRuleEngine.ts',
  'server/services/openClawSkillInvocationGateway.ts',
  'server/services/robotCapabilityRegistry.ts',
  'server/services/automationSchedulerLoop.ts',
  'server/services/pluginInvocationBoundary.ts',
];

const invalidTokens = [
  "actor: 'automation-engine'",
  "actor: \"automation-engine\"",
  "status: 'queued'",
  "status: \"queued\"",
];

let failed = false;
for (const relativeFile of files) {
  const file = path.join(root, relativeFile);
  if (!fs.existsSync(file)) continue;
  const source = fs.readFileSync(file, 'utf8');
  for (const token of invalidTokens) {
    if (source.includes(token)) {
      console.error(`Audit contract violation in ${relativeFile}: ${token}`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log('Audit contract check completed.');
