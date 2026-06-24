#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const daemonFile = path.join(root, 'server/assistant-daemon.ts');
const source = fs.readFileSync(daemonFile, 'utf8');

const importLine = "import { AGENT_TOOL_IDS } from './services/agentToolIds.ts';";
let next = source;

if (!next.includes(importLine)) {
  const anchor = "import { z } from \"zod\";";
  if (!next.includes(anchor)) {
    throw new Error('Cannot find zod import anchor in server/assistant-daemon.ts');
  }
  next = next.replace(anchor, `${anchor}\n${importLine}`);
}

const oldSchema = /requestedTools:\s*z\.array\(z\.enum\(\["read_knowledge",\s*"draft_plan",\s*"draft_patch",\s*"browser_check",\s*"terminal_check",\s*"external_connector"\]\)\)\.max\(8\)\.optional\(\)/;
const newSchema = 'requestedTools: z.array(z.enum(AGENT_TOOL_IDS)).max(8).optional()';

if (!oldSchema.test(next) && !next.includes(newSchema)) {
  throw new Error('Cannot find legacy requestedTools schema. The daemon file may have changed; patch manually using docs/AI_WORKFORCE_BACKEND_PATCH_GUIDE.md');
}

next = next.replace(oldSchema, newSchema);

if (next === source) {
  console.log('Daemon tool schema already appears patched.');
  process.exit(0);
}

fs.writeFileSync(daemonFile, next);
console.log('Patched server/assistant-daemon.ts to use shared AGENT_TOOL_IDS.');
console.log('Next: run npm run check:agent-tool-ids && npm run lint && npm run build');
