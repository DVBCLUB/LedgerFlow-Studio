import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { AgentToolId } from './agentPlanner.ts';

const execFileAsync = promisify(execFile);
const TERMINAL_COMMANDS = {
  git_status: { file: 'git', args: ['status', '--short'] },
  git_diff_stat: { file: 'git', args: ['diff', '--stat'] },
  npm_test_list: { file: 'npm.cmd', args: ['run'] },
} as const;

function sandboxRoot() {
  return path.resolve(process.cwd(), process.env.AGENT_SANDBOX_DIR || '.agent_sandbox');
}

function runFolder(runId: string) {
  if (!/^run_[a-zA-Z0-9-]+$/.test(runId)) throw new Error('Invalid agent run ID.');
  const root = sandboxRoot();
  const folder = path.resolve(root, runId);
  if (!folder.startsWith(`${root}${path.sep}`)) throw new Error('Sandbox path escaped its root.');
  return folder;
}

function validateBrowserTarget(raw: unknown) {
  const value = typeof raw === 'string' && raw ? raw : 'http://127.0.0.1:3000';
  const url = new URL(value);
  const allowed = ['127.0.0.1', 'localhost', '::1', ...String(process.env.BROWSER_SANDBOX_ALLOWED_HOSTS || '').split(',').map((item) => item.trim()).filter(Boolean)];
  if (!['http:', 'https:'].includes(url.protocol) || !allowed.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))) throw new Error('Browser target is not allowlisted.');
  return url.toString();
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];
}

function safeRelativeFile(value: string) {
  const normalized = value.replace(/\\/g, '/').trim();
  if (!normalized || normalized.startsWith('/') || normalized.includes('\0')) return '';
  const parts = normalized.split('/').filter(Boolean);
  if (parts.includes('..')) return '';
  return parts.join('/');
}

function draftPatchMetadata(toolInput: Record<string, unknown> | undefined) {
  const requested = [
    ...stringArray(toolInput?.targetFiles),
    ...stringArray(toolInput?.files),
    ...stringArray(toolInput?.paths),
  ];
  const targetFiles = [...new Set(requested.map(safeRelativeFile).filter(Boolean))];
  return {
    manifestKind: 'review_only_patch_manifest',
    applyable: false,
    targetFiles,
    patchIntent: typeof toolInput?.intent === 'string' ? toolInput.intent : 'Draft patch proposal for founder review.',
    requiredNextStep: 'Create a backend patch-review session, inspect target files, then produce an applyable manifest with files: [{ path, newContent }] only after approval.',
  };
}

export async function executeSandboxTool(input: { runId: string; stepId: string; toolId: AgentToolId; goal: string; toolInput?: Record<string, unknown> }) {
  const startedAt = new Date().toISOString();
  const folder = runFolder(input.runId);
  await fs.promises.mkdir(folder, { recursive: true });

  if (input.toolId === 'terminal_check') {
    const commandId = String(input.toolInput?.commandId || 'git_status') as keyof typeof TERMINAL_COMMANDS;
    const command = TERMINAL_COMMANDS[commandId];
    if (!command) throw new Error('Terminal command is not in the read-only allowlist.');
    const result = await execFileAsync(command.file, [...command.args], { cwd: process.cwd(), timeout: 30_000, windowsHide: true, maxBuffer: 512_000 });
    return { mode: 'sandbox', commandId, startedAt, completedAt: new Date().toISOString(), exitCode: 0, stdout: result.stdout.slice(0, 20_000), stderr: result.stderr.slice(0, 5_000) };
  }

  if (input.toolId === 'browser_check') {
    const target = validateBrowserTarget(input.toolInput?.target);
    return { mode: 'sandbox', target, startedAt, completedAt: new Date().toISOString(), preflight: 'allowlist_passed', note: 'Interactive browser execution remains in the controlled browser connector.' };
  }

  const patchMetadata = input.toolId === 'draft_patch' ? draftPatchMetadata(input.toolInput) : {};
  const artifact = {
    schemaVersion: 'ledgerflow_virtual_artifact_v1', runId: input.runId, stepId: input.stepId, toolId: input.toolId,
    goal: input.goal, createdAt: new Date().toISOString(), status: 'draft',
    note: input.toolId === 'draft_patch' ? 'Virtual review-only patch manifest. No repository file was changed.' : 'Sandbox planning artifact.',
    ...patchMetadata,
  };
  const artifactPath = path.join(folder, `${input.stepId}.json`);
  await fs.promises.writeFile(artifactPath, JSON.stringify(artifact, null, 2), 'utf8');
  return { mode: 'sandbox', startedAt, completedAt: new Date().toISOString(), artifactPath: path.relative(process.cwd(), artifactPath), artifact };
}
