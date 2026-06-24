#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const runtimeFile = path.join(root, 'server/services/pluginExtensionSystem.ts');
const patcherFile = path.join(root, 'scripts/patch-plugin-runtime-boundary.mjs');
const boundaryFile = path.join(root, 'server/services/pluginInvocationBoundary.ts');

let failed = false;
for (const file of [runtimeFile, patcherFile, boundaryFile]) {
  if (!fs.existsSync(file)) {
    console.error(`Missing required file: ${path.relative(root, file)}`);
    failed = true;
  }
}

if (fs.existsSync(runtimeFile)) {
  const source = fs.readFileSync(runtimeFile, 'utf8');
  const alreadyPatched = source.includes('decidePluginInvocation') && source.includes('auditPluginInvocationDecision');
  const anchors = [
    "import { appendAuditEvent } from './auditLog';",
    '  enabled: boolean;\n',
    '  const start = Date.now();\n\n  try {',
  ];
  if (!alreadyPatched) {
    for (const anchor of anchors) {
      if (!source.includes(anchor)) {
        console.error(`Plugin runtime patch anchor missing: ${anchor.replace(/\n/g, '\\n')}`);
        failed = true;
      }
    }
  }
}

if (fs.existsSync(patcherFile)) {
  const source = fs.readFileSync(patcherFile, 'utf8');
  for (const token of ['pluginInvocationBoundary', 'decidePluginInvocation', 'auditPluginInvocationDecision', 'sandbox_required']) {
    if (!source.includes(token)) {
      console.error(`Plugin runtime boundary patcher missing token: ${token}`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log('Plugin runtime boundary patcher dry-run check completed.');
