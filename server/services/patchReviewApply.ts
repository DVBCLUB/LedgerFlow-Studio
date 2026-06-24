import fs from 'node:fs';
import path from 'node:path';
import { backupAndWrite, rollbackFile } from './safeFileManager.ts';
import { listPatchReviewSessions, updatePatchReviewSessionStatus, type PatchReviewSession } from './patchReviewSessions.ts';

export const PATCH_APPLY_PHRASE = 'APPLY REVIEWED PATCH';
export const PATCH_ROLLBACK_PHRASE = 'ROLLBACK REVIEWED PATCH';

type PatchManifestFile = {
  path: string;
  newContent: string;
};

type PatchManifest = {
  schemaVersion?: string;
  runId?: string;
  stepId?: string;
  files?: PatchManifestFile[];
  targetFiles?: string[];
};

export interface PatchApplyResult {
  sessionId: string;
  appliedFiles: string[];
  backups: Array<{ filePath: string; backupId: string; strategy: string; commitHash?: string }>;
}

export interface PatchRollbackResult {
  sessionId: string;
  rolledBackFiles: string[];
  results: Array<{ filePath: string; message: string }>;
}

function workspacePath(relativePath: string) {
  const root = process.cwd();
  const resolved = path.resolve(root, relativePath);
  if (!resolved.startsWith(`${root}${path.sep}`)) throw new Error('Path escaped workspace root.');
  return resolved;
}

async function getSession(sessionId: string) {
  const sessions = await listPatchReviewSessions(200);
  const session = sessions.find((item) => item.id === sessionId);
  if (!session) throw new Error('Patch review session not found.');
  return session;
}

async function readManifest(session: PatchReviewSession): Promise<PatchManifest> {
  if (!session.manifestPath) throw new Error('Patch review session does not have a manifest path.');
  const file = workspacePath(session.manifestPath);
  const parsed = JSON.parse(await fs.promises.readFile(file, 'utf8')) as PatchManifest;
  return parsed;
}

function validateManifestFiles(manifest: PatchManifest) {
  const files = Array.isArray(manifest.files) ? manifest.files : [];
  if (!files.length) throw new Error('Patch manifest does not include applyable files. Expected files: [{ path, newContent }].');
  return files.map((file) => {
    if (!file || typeof file.path !== 'string' || typeof file.newContent !== 'string') throw new Error('Invalid patch manifest file entry.');
    workspacePath(file.path);
    return file;
  });
}

export async function applyReviewedPatchSession(input: { sessionId: string; phrase: string }) {
  if (input.phrase !== PATCH_APPLY_PHRASE) throw new Error('Patch apply phrase mismatch.');
  const session = await getSession(input.sessionId);
  if (session.status !== 'approved_to_apply') throw new Error('Patch review session must be approved_to_apply before applying.');
  const manifest = await readManifest(session);
  const files = validateManifestFiles(manifest);
  const backups: PatchApplyResult['backups'] = [];
  const appliedFiles: string[] = [];

  for (const file of files) {
    const result = await backupAndWrite(file.path, file.newContent, 'auto');
    backups.push({ filePath: file.path, backupId: result.backup.id, strategy: result.backup.strategy, commitHash: result.backup.commitHash });
    appliedFiles.push(file.path);
  }

  await updatePatchReviewSessionStatus(session.id, 'applied');
  return { sessionId: session.id, appliedFiles, backups } satisfies PatchApplyResult;
}

export async function rollbackReviewedPatchSession(input: { sessionId: string; phrase: string }) {
  if (input.phrase !== PATCH_ROLLBACK_PHRASE) throw new Error('Patch rollback phrase mismatch.');
  const session = await getSession(input.sessionId);
  if (session.status !== 'applied') throw new Error('Only applied patch sessions can be rolled back.');
  const manifest = await readManifest(session);
  const files = validateManifestFiles(manifest);
  const results: PatchRollbackResult['results'] = [];
  const rolledBackFiles: string[] = [];

  for (const file of files) {
    const result = await rollbackFile(file.path);
    results.push({ filePath: file.path, message: result.message });
    rolledBackFiles.push(file.path);
  }

  await updatePatchReviewSessionStatus(session.id, 'rolled_back');
  return { sessionId: session.id, rolledBackFiles, results } satisfies PatchRollbackResult;
}
