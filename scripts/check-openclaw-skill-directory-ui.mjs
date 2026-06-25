#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const panelFile = path.join(root, 'src/modules/ai-hr/AIWorkforceSkillDirectory.tsx');
const patcherFile = path.join(root, 'scripts/patch-ai-ops-skill-directory-panel.mjs');
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
  for (const token of ['OpenClaw Skill Directory', '/api/openclaw-skills', 'requiresApproval', 'includeBlocked']) {
    if (!source.includes(token)) {
      console.error(`OpenClaw skill directory panel missing token: ${token}`);
      failed = true;
    }
  }
}

if (fs.existsSync(patcherFile)) {
  const source = fs.readFileSync(patcherFile, 'utf8');
  for (const token of ['AIWorkforceSkillDirectory', 'AIWorkforcePluginSecurityGuard']) {
    if (!source.includes(token)) {
      console.error(`OpenClaw skill directory patcher missing token: ${token}`);
      failed = true;
    }
  }
}

if (fs.existsSync(doctorFile)) {
  const source = fs.readFileSync(doctorFile, 'utf8');
  if (!source.includes('patch-ai-ops-skill-directory-panel.mjs')) {
    console.error('OpenClaw+ doctor does not run skill directory UI patcher.');
    failed = true;
  }
}

if (fs.existsSync(opsFile)) {
  const source = fs.readFileSync(opsFile, 'utf8');
  if (!source.includes('AIWorkforceSkillDirectory')) {
    console.warn('Warning: AIOperationsCenter.tsx is not patched yet. Run npm run ai:openclaw-plus locally.');
  }
}

if (failed) process.exit(1);
console.log('OpenClaw skill directory UI check completed.');
