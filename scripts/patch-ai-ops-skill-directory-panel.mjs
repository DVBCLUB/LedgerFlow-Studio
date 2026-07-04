#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const file = path.join(root, 'src/modules/ai-nhan-su/AIOperationsCenter.tsx');
const source = fs.readFileSync(file, 'utf8');
let next = source;

const importLine = "import AIWorkforceSkillDirectory from './AIWorkforceSkillDirectory';";
if (!next.includes(importLine)) {
  const anchor = "import AIWorkforcePluginSecurityGuard from './AIWorkforcePluginSecurityGuard';";
  if (!next.includes(anchor)) throw new Error('Cannot find plugin security guard import anchor.');
  next = next.replace(anchor, `${anchor}\n${importLine}`);
}

if (!next.includes('<AIWorkforceSkillDirectory />')) {
  const preferredAnchor = '<AIWorkforceRobotAutomationBridge />';
  const fallbackAnchor = '<AIWorkforcePluginSecurityGuard />';
  if (next.includes(preferredAnchor)) next = next.replace(preferredAnchor, `${preferredAnchor}\n\n      <AIWorkforceSkillDirectory />`);
  else if (next.includes(fallbackAnchor)) next = next.replace(fallbackAnchor, `${fallbackAnchor}\n\n      <AIWorkforceSkillDirectory />`);
  else throw new Error('Cannot find skill directory render anchor.');
}

if (next === source) {
  console.log('AIOperationsCenter already includes skill directory panel.');
  process.exit(0);
}

fs.writeFileSync(file, next);
console.log('Patched AIOperationsCenter with OpenClaw skill directory panel.');
