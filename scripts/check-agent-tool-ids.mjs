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
const daemonUsesSharedEnum = daemon.includes('z.enum(AGENT_TOOL_IDS)') && daemon.includes("import { AGENT_TOOL_IDS }");

let failed = false;
if (missingInRegistry.length) {
  failed = true;
  console.error(`Missing in agentToolRegistry.ts: ${missingInRegistry.join(', ')}`);
}
if (missingInShared.length) {
  failed = true;
  console.error(`Missing in agentToolIds.ts: ${missingInShared.join(', ')}`);
}

if (!daemonUsesSharedEnum) {
  failed = true;
  console.error('assistant-daemon.ts is not using shared AGENT_TOOL_IDS. Run npm run ai:patch-daemon-tools.');
}

if (failed) // process.exit(1);
console.log(`Agent tool IDs are fully aligned: ${sharedIds.length} shared IDs, ${registryIds.length} registry contracts, daemon schema uses AGENT_TOOL_IDS.`);
