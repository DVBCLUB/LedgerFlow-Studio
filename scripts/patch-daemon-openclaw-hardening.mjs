#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const daemonFile = path.join(root, 'server/assistant-daemon.ts');
const source = fs.readFileSync(daemonFile, 'utf8');
let next = source;

function ensureImport(line, anchor) {
  if (next.includes(line)) return;
  if (!next.includes(anchor)) throw new Error(`Cannot find import anchor: ${anchor}`);
  next = next.replace(anchor, `${anchor}\n${line}`);
}

ensureImport('import { createDaemonLocalGuard } from "./services/daemonLocalGuard";', 'import { z } from "zod";');

if (!next.includes('rejectAgentRunStep')) {
  next = next.replace('  stopAgentRun\n} from "./services/agentRuntime";', '  stopAgentRun,\n  rejectAgentRunStep\n} from "./services/agentRuntime";');
}

if (!next.includes('createDaemonLocalGuard()')) {
  const anchor = 'app.use(express.urlencoded({ extended: true }));';
  if (!next.includes(anchor)) throw new Error('Cannot find app middleware anchor.');
  next = next.replace(anchor, `${anchor}\napp.use(createDaemonLocalGuard());`);
}

const rejectSchema = `
const agentRunRejectSchema = z.object({
  stepId: z.string().min(1),
  fingerprint: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  reason: z.string().min(3).max(500).optional()
});
`;
if (!next.includes('const agentRunRejectSchema = z.object')) {
  const anchor = `const agentRunApprovalSchema = z.object({
  stepId: z.string().min(1),
  fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  signature: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  phrase: z.literal("APPROVE AGENT STEP")
});`;
  if (!next.includes(anchor)) throw new Error('Cannot find approval schema anchor.');
  next = next.replace(anchor, `${anchor}\n${rejectSchema}`);
}

const rejectRoute = `
app.post("/api/agent-runtime/runs/:id/reject", async (req: Request, res: Response) => {
  try {
    const parsed = agentRunRejectSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") });
    const run = await rejectAgentRunStep(req.params.id, parsed.data);
    res.json({ success: true, run });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});
`;
if (!next.includes('/api/agent-runtime/runs/:id/reject')) {
  const anchor = `app.post("/api/agent-runtime/runs/:id/approve", async (req: Request, res: Response) => {
  try {
    const parsed = agentRunApprovalSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") });
    const run = await approveAgentRunStep(req.params.id, parsed.data);
    res.json({ success: true, run });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});`;
  if (!next.includes(anchor)) throw new Error('Cannot find approve route anchor.');
  next = next.replace(anchor, `${anchor}\n${rejectRoute}`);
}

if (next === source) {
  console.log('assistant-daemon.ts already appears hardened.');
  process.exit(0);
}

fs.writeFileSync(daemonFile, next);
console.log('Patched assistant-daemon.ts with local guard and reject-step route.');
