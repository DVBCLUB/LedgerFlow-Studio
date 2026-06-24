#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const boundaryFile = path.join(root, 'server/services/pluginInvocationBoundary.ts');
const policyFile = path.join(root, 'server/services/pluginSecurityPolicy.ts');

let failed = false;

for (const file of [boundaryFile, policyFile]) {
  if (!fs.existsSync(file)) {
    console.error(`Missing required file: ${path.relative(root, file)}`);
    failed = true;
  }
}

if (fs.existsSync(boundaryFile)) {
  const source = fs.readFileSync(boundaryFile, 'utf8');
  for (const token of [
    'decidePluginInvocation',
    'auditPluginInvocationDecision',
    'assessPluginSecurity',
    'allowedForHostInvocation',
    'simulation',
    'sandbox_required',
    'plugin.invoke.simulation_only',
    'plugin.invoke.sandbox_required',
  ]) {
    if (!source.includes(token)) {
      console.error(`Plugin invocation boundary missing token: ${token}`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log('Plugin invocation boundary check completed.');
