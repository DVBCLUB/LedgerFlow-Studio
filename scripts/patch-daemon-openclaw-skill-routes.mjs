#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const file = path.join(root, 'server/assistant-daemon.ts');
const source = fs.readFileSync(file, 'utf8');
let next = source;

function findImportAnchor() {
  return [
    'import express, { Request, Response, NextFunction } from "express";',
    "import express, { Request, Response, NextFunction } from 'express';",
    "import express, { Request, Response } from 'express';",
    'import express, { Request, Response } from "express";',
  ].find((anchor) => next.includes(anchor));
}

const importLine = 'import { getOpenClawSkill, getOpenClawSkillSummary, listOpenClawSkills } from "./services/openClawSkillRegistry";';
if (!next.includes(importLine) && !next.includes("./services/openClawSkillRegistry")) {
  const anchor = findImportAnchor();
  if (!anchor) throw new Error('Cannot find express import anchor.');
  next = next.replace(anchor, `${anchor}\n${importLine}`);
}

const routeAnchor = '// --- Agent Memory ---';
if (!next.includes(routeAnchor)) throw new Error('Cannot find Agent Memory route anchor.');

const routeBlock = `
// --- Unified OpenClaw Skill Registry ---
app.get('/api/openclaw-skills', async (req: Request, res: Response) => {
  const domain = typeof req.query.domain === 'string' ? req.query.domain : undefined;
  const includeBlocked = req.query.includeBlocked === 'true';
  res.json({ ok: true, summary: getOpenClawSkillSummary(), skills: listOpenClawSkills({ domain: domain as never, includeBlocked }) });
});

app.get('/api/openclaw-skills/:id', async (req: Request, res: Response) => {
  const skill = getOpenClawSkill(req.params.id);
  if (!skill) return res.status(404).json({ ok: false, error: 'OpenClaw skill not found.' });
  res.json({ ok: true, skill });
});

`;

if (!next.includes('/api/openclaw-skills')) {
  next = next.replace(routeAnchor, `${routeBlock}${routeAnchor}`);
}

if (next === source) {
  console.log('assistant-daemon.ts already includes OpenClaw skill routes.');
  process.exit(0);
}

fs.writeFileSync(file, next);
console.log('Patched assistant-daemon.ts with OpenClaw skill registry routes.');
