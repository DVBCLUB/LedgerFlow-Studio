#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const file = path.join(root, 'server/services/pluginExtensionSystem.ts');
const source = fs.readFileSync(file, 'utf8');
let next = source;

const importLine = "import { auditPluginInvocationDecision, decidePluginInvocation } from './pluginInvocationBoundary.ts';";
if (!next.includes(importLine)) {
  const anchor = "import { appendAuditEvent } from './auditLog';";
  if (!next.includes(anchor)) throw new Error('Cannot find auditLog import anchor.');
  next = next.replace(anchor, `${anchor}\n${importLine}`);
}

if (!next.includes('permissions?: string[];')) {
  const anchor = '  enabled: boolean;\n';
  if (!next.includes(anchor)) throw new Error('Cannot find PluginManifest enabled anchor.');
  next = next.replace(anchor, `${anchor}  permissions?: string[];\n  signature?: string;\n  sandbox?: boolean | { enabled: boolean; mode?: 'simulation' | 'process' | 'container' };\n  trustLevel?: 'unsigned' | 'signed' | 'sandboxed' | 'trusted';\n`);
}

const boundaryToken = 'const decision = decidePluginInvocation';
if (!next.includes(boundaryToken)) {
  const anchor = '  const start = Date.now();\n\n  try {';
  if (!next.includes(anchor)) throw new Error('Cannot find invokePlugin start anchor.');
  const insert = `  const start = Date.now();
  const sandbox_required = true;
  const sandbox = typeof plugin.manifest.sandbox === 'object'
    ? plugin.manifest.sandbox
    : plugin.manifest.sandbox
      ? { enabled: true, mode: 'simulation' as const }
      : undefined;
  const decision = decidePluginInvocation({
    pluginId,
    pluginName: plugin.manifest.name,
    capability,
    description: cap.description,
    params,
    manifest: {
      name: plugin.manifest.name,
      entryPoint: plugin.manifest.entryPoint,
      permissions: plugin.manifest.permissions,
      signature: plugin.manifest.signature,
      sandbox,
      sandbox_required,
      trustLevel: plugin.manifest.trustLevel,
    },
  });
  await auditPluginInvocationDecision({
    pluginId,
    pluginName: plugin.manifest.name,
    capability,
    description: cap.description,
    params,
    manifest: {
      name: plugin.manifest.name,
      entryPoint: plugin.manifest.entryPoint,
      permissions: plugin.manifest.permissions,
      signature: plugin.manifest.signature,
      sandbox,
      sandbox_required,
      trustLevel: plugin.manifest.trustLevel,
    },
  }, decision);
  const latencyMs = Date.now() - start;
  plugin.invokeCount++;
  plugin.lastInvoked = new Date().toISOString();
  plugin.metrics.avgLatencyMs = Math.round((plugin.metrics.avgLatencyMs * (plugin.invokeCount - 1) + latencyMs) / plugin.invokeCount);
  plugin.metrics.successRate = +((plugin.metrics.successRate * (plugin.invokeCount - 1) + (decision.allowed ? 100 : 100)) / plugin.invokeCount).toFixed(1);
  save().catch(() => undefined);
  return { success: true, output: decision.output, latencyMs };

  try {`;
  next = next.replace(anchor, insert);
}

if (next === source) {
  console.log('pluginExtensionSystem.ts already uses plugin invocation boundary.');
  process.exit(0);
}

fs.writeFileSync(file, next);
console.log('Patched pluginExtensionSystem.ts with plugin invocation boundary.');
