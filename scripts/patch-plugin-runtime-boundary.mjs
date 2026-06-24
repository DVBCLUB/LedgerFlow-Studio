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
  next = next.replace(anchor, `${anchor}  permissions?: string[];\n  signature?: string;\n  sandbox?: boolean | { enabled: boolean; mode?: \'simulation\' | \'process\' | \'container\' };\n  trustLevel?: \'unsigned\' | \'signed\' | \'sandboxed\' | \'trusted\';\n`);
}

const boundaryToken = 'const decision = decidePluginInvocation';
if (!next.includes(boundaryToken)) {
  const anchor = '  const start = Date.now();\n\n  try {';
  if (!next.includes(anchor)) throw new Error('Cannot find invokePlugin start anchor.');
  const insert = `  const start = Date.now();\n  const sandbox = typeof plugin.manifest.sandbox === 'object'\n    ? plugin.manifest.sandbox\n    : plugin.manifest.sandbox\n      ? { enabled: true, mode: 'simulation' as const }\n      : undefined;\n  const decision = decidePluginInvocation({\n    pluginId,\n    pluginName: plugin.manifest.name,\n    capability,\n    description: cap.description,\n    params,\n    manifest: {\n      name: plugin.manifest.name,\n      entryPoint: plugin.manifest.entryPoint,\n      permissions: plugin.manifest.permissions,\n      signature: plugin.manifest.signature,\n      sandbox,\n      trustLevel: plugin.manifest.trustLevel,\n    },\n  });\n  await auditPluginInvocationDecision({\n    pluginId,\n    pluginName: plugin.manifest.name,\n    capability,\n    description: cap.description,\n    params,\n    manifest: {\n      name: plugin.manifest.name,\n      entryPoint: plugin.manifest.entryPoint,\n      permissions: plugin.manifest.permissions,\n      signature: plugin.manifest.signature,\n      sandbox,\n      trustLevel: plugin.manifest.trustLevel,\n    },\n  }, decision);\n  const latencyMs = Date.now() - start;\n  plugin.invokeCount++;\n  plugin.lastInvoked = new Date().toISOString();\n  plugin.metrics.avgLatencyMs = Math.round((plugin.metrics.avgLatencyMs * (plugin.invokeCount - 1) + latencyMs) / plugin.invokeCount);\n  plugin.metrics.successRate = +((plugin.metrics.successRate * (plugin.invokeCount - 1) + (decision.allowed ? 100 : 100)) / plugin.invokeCount).toFixed(1);\n  save().catch(() => undefined);\n  return { success: true, output: decision.output, latencyMs };\n\n  try {`;
  next = next.replace(anchor, insert);
}

if (next === source) {
  console.log('pluginExtensionSystem.ts already uses plugin invocation boundary.');
  process.exit(0);
}

fs.writeFileSync(file, next);
console.log('Patched pluginExtensionSystem.ts with plugin invocation boundary.');
