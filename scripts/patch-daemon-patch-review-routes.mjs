#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const daemonFile = path.join(root, 'server/assistant-daemon.ts');
const source = fs.readFileSync(daemonFile, 'utf8');
let next = source;

const reviewImportLine = 'import { createPatchReviewSessionsFromRun, listPatchReviewSessions, updatePatchReviewSessionStatus } from "./services/patchReviewSessions";';
if (!next.includes(reviewImportLine)) {
  const anchor = '} from "./services/agentRuntime";';
  if (!next.includes(anchor)) throw new Error('Cannot find agentRuntime import anchor in assistant-daemon.ts');
  next = next.replace(anchor, `${anchor}\n${reviewImportLine}`);
}

const applyImportLine = 'import { applyReviewedPatchSession, rollbackReviewedPatchSession, PATCH_APPLY_PHRASE, PATCH_ROLLBACK_PHRASE } from "./services/patchReviewApply";';
if (!next.includes(applyImportLine)) {
  next = next.replace(reviewImportLine, `${reviewImportLine}\n${applyImportLine}`);
}

const routes = `
// --- Patch Review Sessions ---
app.get("/api/patch-review-sessions", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string ?? "50", 10);
    const sessions = await listPatchReviewSessions(limit);
    res.json({ success: true, sessions });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

app.post("/api/patch-review-sessions/from-run/:runId", async (req: Request, res: Response) => {
  try {
    const sessions = await createPatchReviewSessionsFromRun(req.params.runId);
    res.json({ success: true, sessions });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

app.patch("/api/patch-review-sessions/:id/status", async (req: Request, res: Response) => {
  try {
    const parsed = z.object({ status: z.enum(["draft", "waiting_review", "approved_to_apply", "applied", "rolled_back", "rejected"]) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") });
    const session = await updatePatchReviewSessionStatus(req.params.id, parsed.data.status);
    res.json({ success: true, session });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

app.post("/api/patch-review-sessions/:id/apply", async (req: Request, res: Response) => {
  try {
    const parsed = z.object({ phrase: z.literal(PATCH_APPLY_PHRASE) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: "Patch apply requires exact phrase confirmation." });
    const result = await applyReviewedPatchSession({ sessionId: req.params.id, phrase: parsed.data.phrase });
    res.json({ success: true, result });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});

app.post("/api/patch-review-sessions/:id/rollback", async (req: Request, res: Response) => {
  try {
    const parsed = z.object({ phrase: z.literal(PATCH_ROLLBACK_PHRASE) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: "Patch rollback requires exact phrase confirmation." });
    const result = await rollbackReviewedPatchSession({ sessionId: req.params.id, phrase: parsed.data.phrase });
    res.json({ success: true, result });
  } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
});
`;

if (!next.includes('/api/patch-review-sessions')) {
  const anchor = '\n// --- Agent Memory ---';
  if (!next.includes(anchor)) throw new Error('Cannot find Agent Memory route anchor in assistant-daemon.ts');
  next = next.replace(anchor, `${routes}${anchor}`);
} else {
  if (!next.includes('/api/patch-review-sessions/:id/apply')) {
    const anchor = '\n// --- Agent Memory ---';
    if (!next.includes(anchor)) throw new Error('Cannot find Agent Memory route anchor in assistant-daemon.ts');
    const applyRoutes = routes.split('app.post("/api/patch-review-sessions/:id/apply"')[1];
    next = next.replace(anchor, `\napp.post("/api/patch-review-sessions/:id/apply"${applyRoutes}${anchor}`);
  }
}

if (next === source) {
  console.log('assistant-daemon.ts already appears patched with patch review routes.');
  process.exit(0);
}

fs.writeFileSync(daemonFile, next);
console.log('Patched assistant-daemon.ts with Patch Review Session routes.');
console.log('Next: run npm run lint && npm run build');
