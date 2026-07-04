#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const pluginSystemFile = path.join(root, 'server/services/pluginExtensionSystem.ts');
const pluginPolicyFile = path.join(root, 'server/services/pluginSecurityPolicy.ts');
const pluginPanelFile = path.join(root, 'src/modules/ai-nhan-su/AIWorkforcePluginSecurityGuard.tsx');

let failed = false;

if (!fs.existsSync(pluginSystemFile)) {
  console.error('Missing server/services/pluginExtensionSystem.ts');
  process.exit(1);
}

if (!fs.existsSync(pluginPolicyFile)) {
  console.error('Missing server/services/pluginSecurityPolicy.ts');
  failed = true;
}

const source = fs.readFileSync(pluginSystemFile, 'utf8');

const riskFindings = [
  { token: 'require(entryPath)', message: 'Direct dynamic plugin entry execution is still present.' },
  { token: 'require(', message: 'Plugin system contains a runtime require call.' },
];

for (const finding of riskFindings) {
  if (source.includes(finding.token)) {
    console.warn(`Warning: ${finding.message}`);
  }
}

const expectedGuardConcepts = [
  'signature',
  'sandbox',
  'permissions',
  'entryPoint',
];

for (const token of expectedGuardConcepts) {
  if (!source.includes(token)) {
    console.warn(`Warning: plugin system does not yet expose guard concept: ${token}`);
  }
}

if (fs.existsSync(pluginPolicyFile)) {
  const policy = fs.readFileSync(pluginPolicyFile, 'utf8');
  for (const token of [
    'assessPluginSecurity',
    'allowedForSimulation',
    'allowedForHostInvocation',
    'simulate:tool',
    'read:knowledge',
    'write:artifact',
    'notify:founder',
    'signature',
    'sandbox',
    'entryPoint',
  ]) {
    if (!policy.includes(token)) {
      console.error(`Plugin security policy missing token: ${token}`);
      failed = true;
    }
  }
}

if (fs.existsSync(pluginPanelFile)) {
  const panel = fs.readFileSync(pluginPanelFile, 'utf8');
  for (const token of ['Signed manifest', 'Sandbox execution', 'Permission scopes', 'Entry point review']) {
    if (!panel.includes(token)) {
      console.error(`Plugin Security Guard panel missing: ${token}`);
      failed = true;
    }
  }
} else {
  console.error('Missing AIWorkforcePluginSecurityGuard.tsx');
  failed = true;
}

if (failed) process.exit(1);
console.log('Plugin security guard check completed. Warnings identify remaining backend hardening blockers.');
