#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const file = path.join(root, 'server/assistant-daemon.ts');
const source = fs.readFileSync(file, 'utf8');
let next = source;

const importLine = "import { auditOpenClawSkillInvocation } from './services/openClawSkillInvocationGateway';";
if (!next.includes(importLine)) {
  const anchor = next.match(/import express, \{[^}]*Request[^}]*Response[^}]*\} from ["']express["'];/)?.[0];
  if (!next.includes(anchor)) throw new Error('Cannot find express import anchor.');
  next = next.replace(anchor, `${anchor}\n${importLine}`);
}

const routeAnchor = '// --- Agent Memory ---';
if (!next.includes(routeAnchor)) throw new Error('Cannot find Agent Memory route anchor.');

const routeBlock = `
// --- OpenClaw Skill Invocation Gateway ---
app.post('/api/openclaw-skills/:id/plan-invocation', async (req: Request, res: Response) => {
  try {
    const parsed = z.object({
      actor: z.enum(['founder', 'ai-agent', 'automation', 'system']).default('founder'),
      payload: z.record(z.string(), z.unknown()).optional(),
      reason: z.string().optional(),
    }).parse(req.body || {});
    const decision = await auditOpenClawSkillInvocation({ skillId: req.params.id, actor: parsed.actor, payload: parsed.payload, reason: parsed.reason });
    res.status(decision.mode === 'blocked' ? 403 : 200).json({ ok: decision.ok, decision });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ ok: false, error: message });
  }
});

`;

if (!next.includes('/api/openclaw-skills/:id/plan-invocation')) {
  next = next.replace(routeAnchor, `${routeBlock}${routeAnchor}`);
}

if (next === source) {
  console.log('assistant-daemon.ts already includes OpenClaw skill invocation route.');
  process.exit(0);
}

fs.writeFileSync(file, next);
console.log('Patched assistant-daemon.ts with OpenClaw skill invocation route.');
