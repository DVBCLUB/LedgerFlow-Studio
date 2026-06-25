#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const file = path.join(root, 'src/modules/ai-hr/AIOperationsCenter.tsx');
const source = fs.readFileSync(file, 'utf8');
let next = source;

const importLine = "import AIWorkforceSkillInvocationPlanner from './AIWorkforceSkillInvocationPlanner';";
if (!next.includes(importLine)) {
  const anchor = "import AIWorkforceSkillDirectory from './AIWorkforceSkillDirectory';";
  if (!next.includes(anchor)) throw new Error('Cannot find skill directory import anchor. Run patch-ai-ops-skill-directory-panel.mjs first.');
  next = next.replace(anchor, `${anchor}\n${importLine}`);
}

if (!next.includes('<AIWorkforceSkillInvocationPlanner />')) {
  const anchor = '<AIWorkforceSkillDirectory />';
  if (!next.includes(anchor)) throw new Error('Cannot find skill directory render anchor. Run patch-ai-ops-skill-directory-panel.mjs first.');
  next = next.replace(anchor, `${anchor}\n\n      <AIWorkforceSkillInvocationPlanner />`);
}

if (next === source) {
  console.log('AIOperationsCenter already includes skill invocation planner panel.');
  process.exit(0);
}

fs.writeFileSync(file, next);
console.log('Patched AIOperationsCenter with OpenClaw skill invocation planner panel.');
