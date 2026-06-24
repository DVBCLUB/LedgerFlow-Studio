#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const file = path.join(root, 'server/services/robotCapabilityRegistry.ts');
let failed = false;

if (!fs.existsSync(file)) {
  console.error('Missing server/services/robotCapabilityRegistry.ts');
  process.exit(1);
}

const source = fs.readFileSync(file, 'utf8');
for (const token of [
  'listRobotCapabilities',
  'getRobotCapability',
  'validateRobotCapabilityRequest',
  'auditRobotCapabilityRequest',
  'simulation',
  'digital_twin',
  'hardware',
  'blocked',
]) {
  if (!source.includes(token)) {
    console.error(`Robot capability registry missing token: ${token}`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log('Robot capability registry check completed.');
