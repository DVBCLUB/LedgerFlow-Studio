#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const file = path.join(root, 'server/services/automationSchedulerLoop.ts');
let failed = false;

if (!fs.existsSync(file)) {
  console.error('Missing server/services/automationSchedulerLoop.ts');
  process.exit(1);
}

const source = fs.readFileSync(file, 'utf8');
for (const token of [
  'runAutomationSchedulerTick',
  'startAutomationScheduler',
  'stopAutomationScheduler',
  'getAutomationSchedulerStatus',
  'AutomationSchedulerStatus',
]) {
  if (!source.includes(token)) {
    console.error(`Automation scheduler loop missing token: ${token}`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log('Automation scheduler loop check completed.');
