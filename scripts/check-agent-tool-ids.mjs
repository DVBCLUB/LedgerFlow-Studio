#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const idsFile = path.join(root, 'server/services/agentToolIds.ts');
const registryFile = path.join(root, 'server/services/agentToolRegistry.ts');
const daemonFile = path.join(root, 'server/assistant-daemon.ts');

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function extractSharedIds(source) {
  const match = source.match(/AGENT_TOOL_IDS\s*=\s*\[([\s\S]*?)\]\s*as const/);
  if (!match) throw new Error('Cannot find AGENT_TOOL_IDS in agentToolIds.ts');
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function extractRegistryIds(source) {
  return [...source.matchAll(/id:\s*'([^']+)'/g)].map((m) => m[1]);
}

const sharedIds = extractSharedIds(read(idsFile));
const registryIds = extractRegistryIds(read(registryFile));
const daemon = read(daemonFile);

const missingInRegistry = sharedIds.filter((id) => !registryIds.includes(id));
const missingInShared = registryIds.filter((id) => !sharedIds.includes(id));
const missingInDaemonSchema = sharedIds.filter((id) => !daemon.includes(`"${id}"`) && !daemon.includes(`'${id}'`));

let failed = false;
if (missingInRegistry.length) {
  failed = true;
  console.error(`Missing in agentToolRegistry.ts: ${missingInRegistry.join(', ')}`);
}
if (missingInShared.length) {
  failed = true;
  console.error(`Missing in agentToolIds.ts: ${missingInShared.join(', ')}`);
}

if (missingInDaemonSchema.length) {
  console.warn(`Warning: daemon schema may not accept these shared tools yet: ${missingInDaemonSchema.join(', ')}`);
  console.warn('This is non-blocking for build, but it must be fixed before claiming full OpenClaw parity.');
}

if (failed) process.exit(1);
console.log(`Agent tool IDs are aligned between shared IDs and registry: ${sharedIds.length} shared IDs, ${registryIds.length} registry contracts.`);
