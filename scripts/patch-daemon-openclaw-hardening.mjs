#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const daemonFile = path.join(root, 'server/assistant-daemon.ts');
const source = fs.readFileSync(daemonFile, 'utf8');
let next = source;

function ensureImport(line, anchors) {
  if (next.includes(line)) return;
  const candidates = Array.isArray(anchors) ? anchors : [anchors];
  for (const anchor of candidates) {
    if (!next.includes(anchor)) continue;
    next = next.replace(anchor, `${anchor}\n${line}`);
    return;
  }
  throw new Error(`Cannot find import anchor for: ${line}`);
}

function ensureAgentRuntimeImport(name) {
  if (next.includes(name)) return;
  const directAnchor = '  approveAgentRunStep,\n';
  if (next.includes(directAnchor)) {
    next = next.replace(directAnchor, `${directAnchor}  ${name},\n`);
    return;
  }
  const importMatch = next.match(/import \{[\s\S]*?\} from "\.\/services\/agentRuntime";/);
  if (!importMatch) throw new Error(`Cannot find agentRuntime import anchor for ${name}.`);
  const importBlock = importMatch[0];
  const updatedImportBlock = importBlock.replace(/\n\} from "\.\/services\/agentRuntime";/, `,\n  ${name}\n} from "./services/agentRuntime";`);
  next = next.replace(importBlock, updatedImportBlock);
}

function insertAfterFirstAnchor(anchors, insertion, label) {
  for (const anchor of anchors) {
    if (!next.includes(anchor)) continue;
    next = next.replace(anchor, `${anchor}\n${insertion}`);
    return true;
  }
  throw new Error(`Cannot find ${label}.`);
}

ensureImport('import { createDaemonLocalGuard } from "./services/daemonLocalGuard";', [
  'import { z } from "zod";',
  'import express, { Request, Response, NextFunction } from "express";',
]);

ensureAgentRuntimeImport('rejectAgentRunStep');

if (!next.includes('createDaemonLocalGuard()')) {
  insertAfterFirstAnchor([
    'app.use(express.urlencoded({ extended: true }));',
    'app.use(express.json());',
  ], 'app.use(createDaemonLocalGuard());', 'app middleware anchor');
}

const rejectRoute = `
app.post("/api/agent-runtime/runs/:id/reject", async (req: Request, res: Response) => {
  try {
    const parsed = z.object({
      stepId: z.string().min(1),
      fingerprint: z.string().regex(/^[a-f0-9]{64}$/).optional(),
      reason: z.string().min(3).max(500).optional()
    }).parse(req.body || {});
    const run = await rejectAgentRunStep(req.params.id, parsed);
    res.json({ success: true, ok: true, run });
  } catch (err: any) { res.status(400).json({ success: false, ok: false, error: err.message }); }
});
`;

if (!next.includes('/api/agent-runtime/runs/:id/reject')) {
  const approveStart = next.indexOf('app.post("/api/agent-runtime/runs/:id/approve"');
  if (approveStart < 0) throw new Error('Cannot find approve route anchor.');
  const followingRoute = next.indexOf('\napp.post("/api/agent-runtime/runs/:id/stop"', approveStart);
  if (followingRoute < 0) throw new Error('Cannot find stop route anchor after approve route.');
  next = `${next.slice(0, followingRoute)}${rejectRoute}${next.slice(followingRoute)}`;
}

if (next === source) {
  console.log('assistant-daemon.ts already appears hardened.');
  process.exit(0);
}

fs.writeFileSync(daemonFile, next);
console.log('Patched assistant-daemon.ts with local guard and reject-step route.');
