#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const file = path.join(root, 'src/modules/ai-hr/AIOperationsCenter.tsx');
const source = fs.readFileSync(file, 'utf8');
let next = source;

const importLine = "import AIWorkforcePatchSafetyRunbook from './AIWorkforcePatchSafetyRunbook';";
if (!next.includes(importLine)) {
  const anchor = "import AIWorkforcePatchReviewSessions from './AIWorkforcePatchReviewSessions';";
  if (!next.includes(anchor)) throw new Error('Cannot find PatchReviewSessions import anchor in AIOperationsCenter.tsx');
  next = next.replace(anchor, `${anchor}\n${importLine}`);
}

const componentLine = '      <AIWorkforcePatchSafetyRunbook />';
if (!next.includes(componentLine)) {
  const anchor = '      <AIWorkforcePatchReviewSessions />';
  if (!next.includes(anchor)) throw new Error('Cannot find PatchReviewSessions component anchor in AIOperationsCenter.tsx');
  next = next.replace(anchor, `${anchor}\n${componentLine}`);
}

if (next === source) {
  console.log('AIOperationsCenter.tsx already includes AIWorkforcePatchSafetyRunbook.');
  process.exit(0);
}

fs.writeFileSync(file, next);
console.log('Patched AIOperationsCenter.tsx with AIWorkforcePatchSafetyRunbook.');
