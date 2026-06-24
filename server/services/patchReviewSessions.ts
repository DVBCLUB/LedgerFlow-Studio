import fs from 'node:fs';
import path from 'node:path';
import { getAgentRun } from './agentRuntime.ts';

export type PatchReviewStatus = 'draft' | 'waiting_review' | 'approved_to_apply' | 'applied' | 'rolled_back' | 'rejected';

export interface PatchReviewSession {
  id: string;
  runId: string;
  stepId: string;
  artifactId?: string;
  status: PatchReviewStatus;
  goal: string;
  summary: string;
  manifestPath?: string;
  targetFiles: string[];
  approvalFingerprint?: string;
  rollbackHint: string;
  createdAt: string;
  updatedAt: string;
}

type SessionStore = { sessions: Record<string, PatchReviewSession> };

function storeFile() {
  return path.resolve(process.cwd(), process.env.PATCH_REVIEW_STORE_FILE || 'patch_review_sessions.local.json');
}

function sandboxRoot() {
  return path.resolve(process.cwd(), process.env.AGENT_SANDBOX_DIR || '.agent_sandbox');
}

async function readStore(): Promise<SessionStore> {
  try {
    const parsed = JSON.parse(await fs.promises.readFile(storeFile(), 'utf8')) as SessionStore;
    return { sessions: parsed.sessions || {} };
  } catch {
    return { sessions: {} };
  }
}

async function writeStore(store: SessionStore) {
  await fs.promises.writeFile(storeFile(), JSON.stringify(store, null, 2), 'utf8');
}

function safeManifestPath(runId: string, stepId: string) {
  if (!/^run_[a-zA-Z0-9-]+$/.test(runId)) throw new Error('Invalid run ID.');
  if (!/^step_[a-zA-Z0-9-]+$/.test(stepId)) throw new Error('Invalid step ID.');
  const root = sandboxRoot();
  const file = path.resolve(root, runId, `${stepId}.json`);
  if (!file.startsWith(`${root}${path.sep}`)) throw new Error('Patch manifest escaped sandbox root.');
  return file;
}

function extractTargetFiles(evidence: Record<string, unknown> | undefined) {
  const artifact = evidence?.artifact;
  if (artifact && typeof artifact === 'object' && Array.isArray((artifact as any).targetFiles)) {
    return (artifact as any).targetFiles.filter((item: unknown): item is string => typeof item === 'string');
  }
  const targetFiles = evidence?.targetFiles;
  if (Array.isArray(targetFiles)) return targetFiles.filter((item): item is string => typeof item === 'string');
  return [];
}

export async function createPatchReviewSessionsFromRun(runId: string) {
  const run = await getAgentRun(runId);
  if (!run) throw new Error('Agent run not found.');
  const now = new Date().toISOString();
  const store = await readStore();
  const created: PatchReviewSession[] = [];

  for (const step of run.steps.filter((item) => item.toolId === 'draft_patch')) {
    const sessionId = `patch_${run.id}_${step.id}`;
    const manifestPath = safeManifestPath(run.id, step.id);
    const artifact = run.artifacts.find((item) => item.evidence?.stepId === step.id || item.type === 'draft_patch');
    const targetFiles = extractTargetFiles(step.evidence);
    const session: PatchReviewSession = {
      id: sessionId,
      runId: run.id,
      stepId: step.id,
      artifactId: artifact?.id,
      status: step.status === 'completed' ? 'waiting_review' : 'draft',
      goal: run.goal,
      summary: step.observation || artifact?.summary || 'Draft patch session created from agent runtime.',
      manifestPath: fs.existsSync(manifestPath) ? path.relative(process.cwd(), manifestPath) : undefined,
      targetFiles,
      approvalFingerprint: step.approvalFingerprint,
      rollbackHint: 'Apply must use safeFileManager backups. Rollback must use recorded backup metadata or rollbackFile per target file.',
      createdAt: store.sessions[sessionId]?.createdAt || now,
      updatedAt: now,
    };
    store.sessions[sessionId] = session;
    created.push(session);
  }

  await writeStore(store);
  return created;
}

export async function listPatchReviewSessions(limit = 50) {
  const store = await readStore();
  return Object.values(store.sessions)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, Math.max(1, Math.min(limit, 200)));
}

export async function updatePatchReviewSessionStatus(id: string, status: PatchReviewStatus) {
  const store = await readStore();
  const session = store.sessions[id];
  if (!session) throw new Error('Patch review session not found.');
  session.status = status;
  session.updatedAt = new Date().toISOString();
  await writeStore(store);
  return session;
}
