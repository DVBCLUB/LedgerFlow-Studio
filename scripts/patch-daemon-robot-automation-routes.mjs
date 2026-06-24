#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const file = path.join(root, 'server/assistant-daemon.ts');
const source = fs.readFileSync(file, 'utf8');
let next = source;

const imports = [
  "import { listRobotCapabilities, getRobotCapability, auditRobotCapabilityRequest } from './services/robotCapabilityRegistry';",
  "import { getAutomationSchedulerStatus, runAutomationSchedulerTick, startAutomationScheduler, stopAutomationScheduler } from './services/automationSchedulerLoop';",
];

for (const importLine of imports) {
  if (!next.includes(importLine)) {
    const anchor = "import express, { Request, Response } from 'express';";
    if (!next.includes(anchor)) throw new Error('Cannot find express import anchor.');
    next = next.replace(anchor, `${anchor}\n${importLine}`);
  }
}

const routeAnchor = '// --- Agent Memory ---';
if (!next.includes(routeAnchor)) throw new Error('Cannot find Agent Memory route anchor.');

const routeBlock = `
// --- Robot Capability Registry + Automation Scheduler ---
app.get('/api/robot-capabilities', async (req: Request, res: Response) => {
  const mode = typeof req.query.mode === 'string' ? req.query.mode : undefined;
  const includeBlocked = req.query.includeBlocked === 'true';
  res.json({ ok: true, capabilities: listRobotCapabilities({ mode: mode as never, includeBlocked }) });
});

app.get('/api/robot-capabilities/:id', async (req: Request, res: Response) => {
  const capability = getRobotCapability(req.params.id);
  if (!capability) return res.status(404).json({ ok: false, error: 'Robot capability not found.' });
  res.json({ ok: true, capability });
});

app.post('/api/robot-capabilities/:id/validate', async (req: Request, res: Response) => {
  try {
    const parsed = z.object({ approvalPhrase: z.string().optional(), mode: z.enum(['simulation', 'digital_twin', 'hardware']).optional() }).parse(req.body || {});
    const result = await auditRobotCapabilityRequest({ capabilityId: req.params.id, approvalPhrase: parsed.approvalPhrase, mode: parsed.mode, actor: 'founder' });
    res.status(result.ok ? 200 : 400).json({ ok: result.ok, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ ok: false, error: message });
  }
});

app.get('/api/automation-scheduler/status', async (_req: Request, res: Response) => {
  res.json({ ok: true, status: getAutomationSchedulerStatus() });
});

app.post('/api/automation-scheduler/tick', async (_req: Request, res: Response) => {
  const result = await runAutomationSchedulerTick();
  res.json({ ok: true, ...result });
});

app.post('/api/automation-scheduler/start', async (req: Request, res: Response) => {
  const parsed = z.object({ intervalMs: z.number().int().positive().optional() }).parse(req.body || {});
  res.json({ ok: true, status: startAutomationScheduler(parsed) });
});

app.post('/api/automation-scheduler/stop', async (_req: Request, res: Response) => {
  res.json({ ok: true, status: stopAutomationScheduler() });
});

`;

if (!next.includes('/api/robot-capabilities') && !next.includes('/api/automation-scheduler/status')) {
  next = next.replace(routeAnchor, `${routeBlock}${routeAnchor}`);
}

if (next === source) {
  console.log('assistant-daemon.ts already includes robot capability and automation scheduler routes.');
  process.exit(0);
}

fs.writeFileSync(file, next);
console.log('Patched assistant-daemon.ts with robot capability and automation scheduler routes.');
