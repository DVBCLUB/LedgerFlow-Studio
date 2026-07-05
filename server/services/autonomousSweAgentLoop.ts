import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { executeWebAIAutomation, extractCodeBlocks, WebAIError } from './webAiAutomator.ts';
import { createSandboxSession, runTestSuiteInSandbox, executeInSandbox } from './sandboxCodeExecutor.ts';
import { createApprovedGitHubChangeRequest } from './githubConnector.ts';
import { appendAuditEvent } from './auditLog.ts';
import { generateUnifiedDiff } from './vscodeContextExporter.ts';

export type MissionStatus =
  | 'running_ai_query'
  | 'testing'
  | 'repairing'
  | 'awaiting_human_approval'
  | 'pushing_to_github'
  | 'completed'
  | 'failed'
  | 'rejected'
  | 'cancelled';

export interface MissionConfig {
  id?: string;
  goalPrompt: string;
  platform: string;
  profileId?: string;
  testCommand: string;
  maxAttempts?: number;
  targetFiles: string[];
  repoBaseBranch?: string;
  requireHumanApprovalBeforePush?: boolean;
}

export interface MissionAttemptLog {
  attempt: number;
  aiPromptSent: string;
  aiRawResponsePreview: string;
  codeBlocksExtracted: number;
  testResult: { ok: boolean; exitCode: number; stderrPreview: string };
}

export interface MissionSafetyReview {
  riskScore: number;
  fileCount: number;
  changedLines: number;
  maxFileBytes: number;
  approvalBlocked: boolean;
  reasons: string[];
}

export interface MissionState {
  id: string;
  config: Required<Pick<MissionConfig, 'id' | 'goalPrompt' | 'platform' | 'testCommand' | 'maxAttempts' | 'targetFiles' | 'requireHumanApprovalBeforePush'>> &
    Omit<MissionConfig, 'id' | 'goalPrompt' | 'platform' | 'testCommand' | 'maxAttempts' | 'targetFiles' | 'requireHumanApprovalBeforePush'>;
  status: MissionStatus;
  attempts: MissionAttemptLog[];
  createdAt: string;
  updatedAt: string;
  finalError?: string;
  pendingChangeRequest?: {
    branchName: string;
    files: { path: string; content: string; diff: string }[];
  };
  safetyReview?: MissionSafetyReview;
  githubResult?: { branch: string; prUrl?: string };
  rejectedReason?: string;
}

const missions = new Map<string, MissionState>();
const sandboxWorkspaces = new Map<string, string>();
const missionStorePath = path.resolve(process.cwd(), 'runtime', 'swe_agent_missions.json');
const MAX_PENDING_FILES = 5;
const MAX_CHANGED_LINES = 800;
const MAX_FILE_BYTES = 400_000;

hydrateMissionsFromDisk();

export function createMission(config: MissionConfig): MissionState {
  validateMissionConfig(config);
  const id = config.id?.trim() || `mission_${Date.now()}_${randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  const mission: MissionState = {
    id,
    config: {
      ...config,
      id,
      maxAttempts: Math.max(1, Math.min(config.maxAttempts ?? 3, 8)),
      targetFiles: config.targetFiles.map(normalizeRelativePath),
      requireHumanApprovalBeforePush: config.requireHumanApprovalBeforePush ?? true,
    },
    status: 'running_ai_query',
    attempts: [],
    createdAt: now,
    updatedAt: now,
  };
  missions.set(mission.id, mission);
  persistMissions();
  return mission;
}

export function getMission(id: string): MissionState | undefined {
  return missions.get(id);
}

export function listMissions(limit = 25): MissionState[] {
  return Array.from(missions.values())
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, Math.max(1, Math.min(limit, 100)));
}

export async function runMission(missionId: string): Promise<MissionState> {
  const mission = missions.get(missionId);
  if (!mission) throw new Error(`Mission ${missionId} not found.`);
  const { config } = mission;

  const sandbox = createSandboxSession({ mode: 'docker', isolationRequired: true });
  const sandboxWorkspace = await prepareSandboxWorkspace(sandbox.id, mission.id);
  const preflight = await executeInSandbox(sandbox.id, 'node --version', { cwd: sandboxWorkspace });
  if (!preflight.ok) {
    mission.status = 'failed';
    mission.finalError = preflight.stderr || 'Sandbox Docker preflight failed.';
    touchMission(mission);
    await auditMission(mission, 'mission.sandbox_unavailable', 'failed', mission.finalError, 'HIGH', { sandboxId: sandbox.id });
    return mission;
  }

  let currentPrompt = buildInitialPrompt(config.goalPrompt, config.targetFiles);
  let lastFilesWritten: { path: string; content: string }[] = [];

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    mission.status = attempt === 1 ? 'running_ai_query' : 'repairing';
    touchMission(mission);

    let aiResult: Awaited<ReturnType<typeof executeWebAIAutomation>>;
    try {
      aiResult = await executeWebAIAutomation(config.platform, currentPrompt, undefined, {
        profileId: config.profileId,
      });
    } catch (err) {
      mission.status = 'failed';
      mission.finalError = err instanceof WebAIError ? err.message : String(err);
      touchMission(mission);
      await auditMission(mission, 'mission.ai_call_failed', 'failed', mission.finalError, 'MEDIUM', { attempt });
      return mission;
    }

    const codeBlocks = extractCodeBlocks(aiResult.text);
    if (codeBlocks.length === 0) {
      mission.attempts.push({
        attempt,
        aiPromptSent: previewForMission(currentPrompt, 300),
        aiRawResponsePreview: previewForMission(aiResult.text, 300),
        codeBlocksExtracted: 0,
        testResult: { ok: false, exitCode: -1, stderrPreview: 'No code blocks parsed.' },
      });
      currentPrompt = buildRepairPrompt(config.goalPrompt, config.targetFiles, 'AI did not return valid <code_block file="..."> blocks.', '');
      touchMission(mission);
      continue;
    }

    const allowedFiles = new Set(config.targetFiles.map(normalizeRelativePath));
    lastFilesWritten = codeBlocks
      .map((block) => ({ path: block.targetFile ? normalizeRelativePath(block.targetFile) : '', content: block.code }))
      .filter((file) => file.path && allowedFiles.has(file.path));

    if (lastFilesWritten.length === 0) {
      mission.attempts.push({
        attempt,
        aiPromptSent: previewForMission(currentPrompt, 300),
        aiRawResponsePreview: previewForMission(aiResult.text, 300),
        codeBlocksExtracted: codeBlocks.length,
        testResult: { ok: false, exitCode: -1, stderrPreview: 'No whitelisted files were returned.' },
      });
      currentPrompt = buildRepairPrompt(config.goalPrompt, config.targetFiles, `AI returned files outside the whitelist. Allowed files: ${config.targetFiles.join(', ')}`, '');
      touchMission(mission);
      continue;
    }

    await writeFilesToSandboxWorkspace(sandbox.id, lastFilesWritten);

    mission.status = 'testing';
    touchMission(mission);
    const testResult = await runTestSuiteInSandbox(sandbox.id, config.testCommand, { cwd: sandboxWorkspace });

    mission.attempts.push({
      attempt,
      aiPromptSent: previewForMission(currentPrompt, 300),
      aiRawResponsePreview: previewForMission(aiResult.text, 300),
      codeBlocksExtracted: codeBlocks.length,
      testResult: { ok: testResult.ok, exitCode: testResult.exitCode, stderrPreview: previewForMission(testResult.stderr, 800) },
    });
    touchMission(mission);

    if (testResult.ok) {
      const pendingFiles = await buildPendingFileChanges(lastFilesWritten);
      mission.pendingChangeRequest = {
        branchName: `ai/mission-${mission.id.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80)}`,
        files: pendingFiles,
      };
      mission.safetyReview = reviewPendingChanges(pendingFiles);
      break;
    }

    currentPrompt = buildRepairPrompt(config.goalPrompt, config.targetFiles, testResult.stderr.slice(0, 2000), testResult.stdout.slice(0, 1000));
  }

  if (!mission.pendingChangeRequest) {
    mission.status = 'failed';
    mission.finalError = `Het ${config.maxAttempts} lan thu, test van fail.`;
    touchMission(mission);
    await auditMission(mission, 'mission.exhausted', 'failed', mission.finalError, 'MEDIUM', { attempts: mission.attempts.length });
    return mission;
  }

  if (config.requireHumanApprovalBeforePush) {
    mission.status = 'awaiting_human_approval';
    touchMission(mission);
    await auditMission(mission, 'mission.awaiting_approval', 'pending_approval', 'Test passed, waiting for human approval before GitHub push.', 'MEDIUM', {
      files: mission.pendingChangeRequest.files.map((file) => file.path),
    });
    return mission;
  }

  return finalizeMissionPush(mission);
}

export async function confirmMissionPush(missionId: string): Promise<MissionState> {
  const mission = missions.get(missionId);
  if (!mission) throw new Error(`Mission ${missionId} not found.`);
  if (mission.status !== 'awaiting_human_approval') throw new Error('Mission is not awaiting approval.');
  if (mission.safetyReview?.approvalBlocked) throw new Error(`Mission approval is blocked by safety review: ${mission.safetyReview.reasons.join('; ')}`);
  return finalizeMissionPush(mission);
}

export async function rejectMission(missionId: string, reason = 'Founder rejected pending SWE mission.'): Promise<MissionState> {
  const mission = missions.get(missionId);
  if (!mission) throw new Error(`Mission ${missionId} not found.`);
  if (!mission.pendingChangeRequest) throw new Error('Mission has no pending change to reject.');
  if (mission.status === 'completed') throw new Error('Completed mission cannot be rejected.');

  mission.status = 'rejected';
  mission.rejectedReason = reason.trim() || 'Founder rejected pending SWE mission.';
  touchMission(mission);
  await auditMission(mission, 'mission.rejected', 'failed', mission.rejectedReason, 'LOW', {
    files: mission.pendingChangeRequest.files.map((file) => file.path),
  });
  return mission;
}

async function finalizeMissionPush(mission: MissionState): Promise<MissionState> {
  if (!mission.pendingChangeRequest) throw new Error('No pending change to push.');
  mission.status = 'pushing_to_github';
  touchMission(mission);

  try {
    const result = await createApprovedGitHubChangeRequest({
      title: `AI SWE mission: ${mission.config.goalPrompt.slice(0, 80)}`,
      summary: [
        `Mission ${mission.id} passed sandbox tests before GitHub push.`,
        `Test command: ${mission.config.testCommand}`,
        `Attempts: ${mission.attempts.length}`,
      ].join('\n'),
      approvalPhrase: 'APPROVE AI GITHUB PUSH',
      branchName: mission.pendingChangeRequest.branchName,
      baseBranch: mission.config.repoBaseBranch,
      files: mission.pendingChangeRequest.files,
      draft: true,
    });
    mission.githubResult = { branch: result.branch, prUrl: result.pullRequest.htmlUrl };
    mission.status = 'completed';
    touchMission(mission);
    await auditMission(mission, 'mission.pushed', 'executed', `Pushed to branch ${result.branch}`, 'LOW', {
      files: mission.pendingChangeRequest.files.map((file) => file.path),
      prUrl: result.pullRequest.htmlUrl,
    });
  } catch (err: any) {
    mission.status = 'failed';
    mission.finalError = err.message || String(err);
    touchMission(mission);
    await auditMission(mission, 'mission.push_failed', 'failed', mission.finalError, 'HIGH', {
      files: mission.pendingChangeRequest.files.map((file) => file.path),
    });
  }

  return mission;
}

function buildInitialPrompt(goal: string, targetFiles: string[]): string {
  return [
    goal,
    '',
    `Only edit these files: ${targetFiles.join(', ')}.`,
    'Return the full content for every changed file using exactly this format. Do not add explanations between blocks:',
    '<code_block file="path/to/file.ts">',
    '...full file content...',
    '</code_block>',
  ].join('\n');
}

function buildRepairPrompt(goal: string, targetFiles: string[], errorLog: string, stdout: string): string {
  return [
    `Original request: ${goal}`,
    '',
    `Only edit these files: ${targetFiles.join(', ')}.`,
    '',
    'Previous code failed validation or tests. Error log:',
    errorLog,
    stdout ? `\nOutput:\n${stdout}` : '',
    '',
    'Return the corrected full file content using only this format for each file. Do not add explanations between blocks:',
    '<code_block file="path/to/file.ts">',
    '...full corrected file content...',
    '</code_block>',
  ].join('\n');
}

async function prepareSandboxWorkspace(sandboxId: string, missionId: string): Promise<string> {
  const root = path.resolve(process.cwd());
  const sandboxRoot = path.resolve(root, '.agent_sandbox');
  const missionRoot = path.resolve(sandboxRoot, `mission_${missionId.replace(/[^a-zA-Z0-9_-]/g, '_')}`);
  if (!missionRoot.startsWith(`${sandboxRoot}${path.sep}`)) throw new Error('Sandbox workspace escaped root.');

  await fs.promises.rm(missionRoot, { recursive: true, force: true });
  await fs.promises.mkdir(missionRoot, { recursive: true });
  await fs.promises.cp(root, missionRoot, {
    recursive: true,
    filter: (source) => {
      const relative = path.relative(root, source).replace(/\\/g, '/');
      if (!relative) return true;
      return !shouldSkipSandboxCopy(relative);
    },
  });
  sandboxWorkspaces.set(sandboxId, missionRoot);
  return missionRoot;
}

async function writeFilesToSandboxWorkspace(sandboxId: string, files: { path: string; content: string }[]): Promise<void> {
  const workspace = sandboxWorkspaces.get(sandboxId);
  if (!workspace) throw new Error(`Sandbox workspace for ${sandboxId} not found.`);

  for (const file of files) {
    const relativePath = normalizeRelativePath(file.path);
    const target = path.resolve(workspace, relativePath);
    if (!target.startsWith(`${workspace}${path.sep}`)) throw new Error(`Refusing to write outside sandbox: ${file.path}`);
    await fs.promises.mkdir(path.dirname(target), { recursive: true });
    await fs.promises.writeFile(target, file.content, 'utf8');
  }
}

async function buildPendingFileChanges(files: { path: string; content: string }[]): Promise<{ path: string; content: string; diff: string }[]> {
  const root = path.resolve(process.cwd());
  const changes: { path: string; content: string; diff: string }[] = [];

  for (const file of files) {
    const relativePath = normalizeRelativePath(file.path);
    const absolutePath = path.resolve(root, relativePath);
    if (!absolutePath.startsWith(`${root}${path.sep}`)) throw new Error(`Refusing to diff outside workspace: ${file.path}`);

    let originalContent = '';
    try {
      originalContent = await fs.promises.readFile(absolutePath, 'utf8');
    } catch (err: any) {
      if (err?.code !== 'ENOENT') throw err;
    }

    changes.push({
      path: relativePath,
      content: file.content,
      diff: generateUnifiedDiff(originalContent, file.content, relativePath),
    });
  }

  return changes;
}

function reviewPendingChanges(files: { path: string; content: string; diff: string }[]): MissionSafetyReview {
  const fileCount = files.length;
  const changedLines = files.reduce((sum, file) => sum + countChangedLines(file.diff), 0);
  const maxFileBytes = files.reduce((max, file) => Math.max(max, Buffer.byteLength(file.content, 'utf8')), 0);
  const reasons: string[] = [];

  if (fileCount > MAX_PENDING_FILES) reasons.push(`Too many pending files: ${fileCount}/${MAX_PENDING_FILES}.`);
  if (changedLines > MAX_CHANGED_LINES) reasons.push(`Diff too large: ${changedLines}/${MAX_CHANGED_LINES} changed lines.`);
  if (maxFileBytes > MAX_FILE_BYTES) reasons.push(`File content too large: ${maxFileBytes}/${MAX_FILE_BYTES} bytes.`);

  return {
    riskScore: Math.min(100, Math.round(fileCount * 8 + changedLines / 10 + maxFileBytes / 25_000 + reasons.length * 20)),
    fileCount,
    changedLines,
    maxFileBytes,
    approvalBlocked: reasons.length > 0,
    reasons,
  };
}

function countChangedLines(diff: string): number {
  return diff
    .split(/\r?\n/)
    .filter((line) => (line.startsWith('+') && !line.startsWith('+++')) || (line.startsWith('-') && !line.startsWith('---')))
    .length;
}

function shouldSkipSandboxCopy(relativePath: string): boolean {
  const fileName = path.basename(relativePath).toLowerCase();
  if (
    fileName === '.env' ||
    fileName.startsWith('.env.') ||
    fileName === '.ledgerflow_secret' ||
    fileName === 'ai_keys.vault.json' ||
    fileName === '.ai_vault_session.json'
  ) {
    return true;
  }

  return [
    '.git',
    'node_modules',
    'dist',
    'release',
    'runtime',
    '.agent_sandbox',
    '.chrome_profile',
    '.chrome_profiles',
  ].some((segment) => relativePath === segment || relativePath.startsWith(`${segment}/`));
}

function validateMissionConfig(config: MissionConfig): void {
  if (!config.goalPrompt?.trim()) throw new Error('Mission goalPrompt is required.');
  if (!config.platform?.trim()) throw new Error('Mission platform is required.');
  if (!config.testCommand?.trim()) throw new Error('Mission testCommand is required.');
  if (!Array.isArray(config.targetFiles) || config.targetFiles.length === 0) throw new Error('Mission targetFiles must contain at least one file.');
  for (const file of config.targetFiles) normalizeRelativePath(file);
}

function normalizeRelativePath(filePath: string): string {
  const normalized = filePath.trim().replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalized || normalized.includes('..') || path.isAbsolute(normalized)) throw new Error(`Invalid mission file path: ${filePath}`);
  return normalized;
}

function previewForMission(text: string, maxChars: number): string {
  const tokenValues = [process.env.GITHUB_TOKEN, process.env.GH_TOKEN].filter((value): value is string => Boolean(value));
  return tokenValues.reduce((acc, token) => acc.split(token).join('[REDACTED_GITHUB_TOKEN]'), text).slice(0, maxChars);
}

function touchMission(mission: MissionState): void {
  mission.updatedAt = new Date().toISOString();
  missions.set(mission.id, mission);
  persistMissions();
}

function hydrateMissionsFromDisk(): void {
  try {
    if (!fs.existsSync(missionStorePath)) return;
    const raw = fs.readFileSync(missionStorePath, 'utf8');
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed?.missions) ? parsed.missions : [];
    for (const item of items) {
      if (item?.id && item?.config && item?.status) missions.set(String(item.id), item as MissionState);
    }
  } catch {
    missions.clear();
  }
}

function persistMissions(): void {
  try {
    fs.mkdirSync(path.dirname(missionStorePath), { recursive: true });
    const missionsToSave = listMissions(100);
    fs.writeFileSync(missionStorePath, JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), missions: missionsToSave }, null, 2), 'utf8');
  } catch {
    // Runtime history is helpful but must not break the safe execution loop.
  }
}

async function auditMission(
  mission: MissionState,
  action: string,
  status: 'pending_approval' | 'executed' | 'failed',
  summary: string,
  risk: 'LOW' | 'MEDIUM' | 'HIGH',
  evidence: Record<string, unknown>
): Promise<void> {
  await appendAuditEvent({
    actor: status === 'executed' ? 'founder' : 'system',
    workspace: 'autonomous-swe-loop',
    action,
    target: mission.id,
    risk,
    status,
    summary,
    connectorId: 'autonomous-swe-loop',
    evidence,
  }).catch(() => undefined);
}
