#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const file = path.join(root, 'src/modules/ai-hr/AIOperationsCenter.tsx');
const source = fs.readFileSync(file, 'utf8');
let next = source;

const importLine = "import AIWorkforceRobotAutomationBridge from './AIWorkforceRobotAutomationBridge';";
if (!next.includes(importLine)) {
  const anchor = "import AIWorkforcePluginSecurityGuard from './AIWorkforcePluginSecurityGuard';";
  if (!next.includes(anchor)) throw new Error('Cannot find plugin security guard import anchor.');
  next = next.replace(anchor, `${anchor}\n${importLine}`);
}

if (!next.includes('<AIWorkforceRobotAutomationBridge />')) {
  const anchor = '<AIWorkforcePluginSecurityGuard />';
  if (!next.includes(anchor)) throw new Error('Cannot find plugin security guard render anchor.');
  next = next.replace(anchor, `${anchor}\n\n      <AIWorkforceRobotAutomationBridge />`);
}

if (next === source) {
  console.log('AIOperationsCenter already includes robot automation panel.');
  process.exit(0);
}

fs.writeFileSync(file, next);
console.log('Patched AIOperationsCenter with robot automation panel.');
