#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const panelFile = path.join(root, 'src/modules/ai-hr/AIWorkforceRobotAutomationBridge.tsx');
const patcherFile = path.join(root, 'scripts/patch-ai-ops-robot-automation-panel.mjs');
const doctorFile = path.join(root, 'scripts/openclaw-plus-doctor.mjs');
const opsFile = path.join(root, 'src/modules/ai-hr/AIOperationsCenter.tsx');
let failed = false;

for (const file of [panelFile, patcherFile, doctorFile, opsFile]) {
  if (!fs.existsSync(file)) {
    console.error(`Missing required file: ${path.relative(root, file)}`);
    failed = true;
  }
}

if (fs.existsSync(panelFile)) {
  const source = fs.readFileSync(panelFile, 'utf8');
  for (const token of ['Robot + Automation Bridge', '/api/robot-capabilities', '/api/automation-scheduler/status', 'schedulerAction']) {
    if (!source.includes(token)) {
      console.error(`Robot automation panel missing token: ${token}`);
      failed = true;
    }
  }
}

if (fs.existsSync(patcherFile)) {
  const source = fs.readFileSync(patcherFile, 'utf8');
  for (const token of ['AIWorkforceRobotAutomationBridge', 'AIWorkforcePluginSecurityGuard']) {
    if (!source.includes(token)) {
      console.error(`Robot automation UI patcher missing token: ${token}`);
      failed = true;
    }
  }
}

if (fs.existsSync(doctorFile)) {
  const source = fs.readFileSync(doctorFile, 'utf8');
  if (!source.includes('patch-ai-ops-robot-automation-panel.mjs')) {
    console.error('OpenClaw+ doctor does not run robot automation UI patcher.');
    failed = true;
  }
}

if (fs.existsSync(opsFile)) {
  const source = fs.readFileSync(opsFile, 'utf8');
  if (!source.includes('AIWorkforceRobotAutomationBridge')) {
    console.error('AIOperationsCenter.tsx must render AIWorkforceRobotAutomationBridge so the panel is visible in the app.');
    failed = true;
  }
}

if (failed) process.exit(1);
console.log('Robot automation UI wiring check completed.');
