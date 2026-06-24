#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const file = path.join(root, 'server/assistant-daemon.ts');
const source = fs.readFileSync(file, 'utf8');
let next = source;

if (!next.includes('rejectAgentRunStep')) {
  const anchor = '  approveAgentRunStep,\n';
  if (!next.includes(anchor)) throw new Error('Cannot find approveAgentRunStep import anchor.');
  next = next.replace(anchor, `${anchor}  rejectAgentRunStep,\n`);
}

const routePath = '/api/agent-runtime/runs/:id/reject';
if (!next.includes(routePath)) {
  const anchor = 'app.post("/api/agent-runtime/runs/:id/approve"';
  const start = next.indexOf(anchor);
  if (start < 0) throw new Error('Cannot find agent approve route anchor.');
  const followingRoute = next.indexOf('\napp.post("/api/agent-runtime/runs/:id/stop"', start);
  if (followingRoute < 0) throw new Error('Cannot find agent stop route anchor.');
  const route = `\napp.post("/api/agent-runtime/runs/:id/reject", async (req: Request, res: Response) => {\n  try {\n    const parsed = z.object({ stepId: z.string(), fingerprint: z.string().optional(), reason: z.string().optional() }).parse(req.body || {});\n    const run = await rejectAgentRunStep(req.params.id, parsed);\n    res.json({ ok: true, run });\n  } catch (err: unknown) {\n    const message = err instanceof Error ? err.message : String(err);\n    res.status(400).json({ ok: false, error: message });\n  }\n});\n`;
  next = `${next.slice(0, followingRoute)}${route}${next.slice(followingRoute)}`;
}

if (next === source) {
  console.log('assistant-daemon.ts already includes agent reject route.');
  process.exit(0);
}

fs.writeFileSync(file, next);
console.log('Patched assistant-daemon.ts with agent reject route.');
