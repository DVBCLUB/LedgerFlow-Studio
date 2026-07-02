/**
 * sandboxCodeExecutor.ts
 * ============================================================
 * Sandbox Code Executor — chạy code test/NPM script trong
 * môi trường an toàn. Hỗ trợ Docker sandbox + fallback local.
 * Tích hợp với agentic loop để tự động chạy test + sửa lỗi.
 */
import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'node:crypto';
import { appendAuditEvent } from './auditLog.ts';

// ─── Types ──────────────────────────────────────────────────────────
export type SandboxMode = 'local' | 'docker' | 'dry_run';

export interface SandboxResult {
  ok: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  command: string;
  mode: SandboxMode;
  containerId?: string;
  artifacts?: string[];
}

export interface SandboxPolicy {
  mode: SandboxMode;
  timeoutMs: number;               // Max thời gian chạy (default 120s)
  maxOutputBytes: number;          // Max output size
  allowedCommands: string[];       // Whitelist lệnh
  blockedCommands: string[];       // Blacklist lệnh
  requireApproval: boolean;        // Cần approval trước khi chạy
  approvalPhrase?: string;         // Phrase cần có nếu requireApproval
  allowNetwork: boolean;           // Cho phép network trong sandbox
  allowFileWrite: boolean;         // Cho phép ghi file
  maxFileSizeBytes: number;        // Max file size được tạo
}

export interface SandboxSession {
  id: string;
  mode: SandboxMode;
  policy: SandboxPolicy;
  results: SandboxResult[];
  startedAt: string;
  completedAt?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  totalDurationMs: number;
  summary: string;
}

// ─── Default policy ─────────────────────────────────────────────────

const DEFAULT_POLICY: SandboxPolicy = {
  mode: 'local',
  timeoutMs: 120_000,
  maxOutputBytes: 500_000,
  allowedCommands: [
    'npm', 'npx', 'node', 'tsc', 'eslint', 'vitest', 'jest',
    'git', 'python', 'pip', 'echo', 'cat', 'dir', 'ls',
  ],
  blockedCommands: [
    'rm -rf', 'del /f', 'format', 'shutdown', 'reboot',
    'docker', 'kubectl', 'sudo', 'chmod 777',
    'DROP', 'DELETE FROM', 'TRUNCATE',
  ],
  requireApproval: false,
  allowNetwork: true,
  allowFileWrite: true,
  maxFileSizeBytes: 10 * 1024 * 1024, // 10MB
};

// ─── Active sessions ────────────────────────────────────────────────
const activeSessions = new Map<string, SandboxSession>();

// ─── Core API ───────────────────────────────────────────────────────

export function createSandboxSession(policy?: Partial<SandboxPolicy>): SandboxSession {
  const id = `sandbox_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`;
  const finalPolicy = { ...DEFAULT_POLICY, ...policy };
  const session: SandboxSession = {
    id,
    mode: finalPolicy.mode,
    policy: finalPolicy,
    results: [],
    startedAt: new Date().toISOString(),
    status: 'running',
    totalDurationMs: 0,
    summary: '',
  };
  activeSessions.set(id, session);
  return session;
}

export function getSandboxSession(id: string): SandboxSession | undefined {
  return activeSessions.get(id);
}

export function listSandboxSessions(): SandboxSession[] {
  return Array.from(activeSessions.values());
}

export async function executeInSandbox(
  sessionId: string,
  command: string,
  options?: { approvalPhrase?: string; cwd?: string; env?: Record<string, string> }
): Promise<SandboxResult> {
  const session = activeSessions.get(sessionId);
  if (!session) throw new Error(`Sandbox session "${sessionId}" not found.`);

  return runCommand(session, command, options);
}

export async function runTestSuiteInSandbox(
  sessionId: string,
  testCommand: string,
  options?: { filePattern?: string; approvalPhrase?: string }
): Promise<SandboxResult> {
  const session = activeSessions.get(sessionId);
  if (!session) throw new Error(`Sandbox session "${sessionId}" not found.`);

  const fullCmd = options?.filePattern
    ? `${testCommand} -- ${options.filePattern}`
    : testCommand;

  return runCommand(session, fullCmd, options);
}

export async function completeSandboxSession(sessionId: string): Promise<SandboxSession | undefined> {
  const session = activeSessions.get(sessionId);
  if (!session) return undefined;

  const failures = session.results.filter(r => !r.ok).length;
  session.status = failures > 0 ? 'failed' : 'completed';
  session.completedAt = new Date().toISOString();
  session.totalDurationMs = Date.now() - new Date(session.startedAt).getTime();
  session.summary = `${session.results.length - failures}/${session.results.length} commands passed, ${failures} failed in ${session.totalDurationMs}ms.`;

  await appendAuditEvent({
    actor: 'system',
    workspace: 'Sandbox Executor',
    action: 'sandbox.session.complete',
    target: session.id,
    risk: session.status === 'failed' ? 'HIGH' : 'LOW',
    status: session.status === 'completed' ? 'executed' : 'failed',
    summary: `Sandbox ${session.id} ${session.status}: ${session.summary}`,
    connectorId: 'sandbox-executor',
    evidence: { sessionId, results: session.results.length, failures },
  }).catch(() => undefined);

  return session;
}

// ─── Command execution ──────────────────────────────────────────────

async function runCommand(
  session: SandboxSession,
  command: string,
  options?: { approvalPhrase?: string; cwd?: string; env?: Record<string, string> }
): Promise<SandboxResult> {
  const policy = session.policy;
  const started = Date.now();

  // Security check: approval
  if (policy.requireApproval) {
    const expectedPhrase = policy.approvalPhrase || 'APPROVE SANDBOX EXEC';
    if (options?.approvalPhrase !== expectedPhrase) {
      return {
        ok: false, exitCode: -1, stdout: '', stderr: `Needs approval phrase: "${expectedPhrase}"`,
        durationMs: 0, command, mode: policy.mode,
      };
    }
  }

  // Security check: blocked commands
  const lowerCmd = command.toLowerCase();
  for (const blocked of policy.blockedCommands) {
    if (lowerCmd.includes(blocked.toLowerCase())) {
      return {
        ok: false, exitCode: -1, stdout: '', stderr: `BLOCKED: command contains "${blocked}"`,
        durationMs: 0, command, mode: policy.mode,
      };
    }
  }

  // Security check: allowed commands
  const cmdBase = command.split(/\s+/)[0].toLowerCase();
  const isAllowed = policy.allowedCommands.some(allowed =>
    cmdBase === allowed.toLowerCase() || cmdBase === `${allowed}.cmd`.toLowerCase() || cmdBase === `${allowed}.exe`.toLowerCase()
  );
  if (!isAllowed && !command.startsWith('echo ') && !command.startsWith('dir ') && !command.startsWith('ls ')) {
    return {
      ok: false, exitCode: -1, stdout: '', stderr: `BLOCKED: command "${cmdBase}" not in allow-list.`,
      durationMs: 0, command, mode: policy.mode,
    };
  }

  // Execute based on mode
  try {
    let result: Pick<SandboxResult, 'ok' | 'exitCode' | 'stdout' | 'stderr'>;

    switch (policy.mode) {
      case 'docker':
        result = await executeInDocker(command, policy, options);
        break;
      case 'dry_run':
        result = { ok: true, exitCode: 0, stdout: `[DRY RUN] Would execute: ${command}`, stderr: '' };
        break;
      case 'local':
      default:
        result = executeLocally(command, policy, options);
        break;
    }

    const sandboxResult: SandboxResult = {
      ...result,
      durationMs: Date.now() - started,
      command,
      mode: policy.mode,
    };

    session.results.push(sandboxResult);

    await appendAuditEvent({
      actor: 'system',
      workspace: 'Sandbox Executor',
      action: 'sandbox.command.execute',
      target: command.slice(0, 80),
      risk: result.ok ? 'LOW' : 'MEDIUM',
      status: result.ok ? 'executed' : 'failed',
      summary: `Sandbox command: ${command.slice(0, 60)} → ${result.ok ? 'OK' : 'FAIL'}`,
      connectorId: 'sandbox-executor',
      evidence: { sessionId: session.id, exitCode: result.exitCode },
    }).catch(() => undefined);

    return sandboxResult;
  } catch (err: any) {
    const errorResult: SandboxResult = {
      ok: false,
      exitCode: -1,
      stdout: '',
      stderr: err.message?.slice(0, 1000) || 'Unknown error',
      durationMs: Date.now() - started,
      command,
      mode: policy.mode,
    };
    session.results.push(errorResult);
    return errorResult;
  }
}

function executeLocally(
  command: string,
  policy: SandboxPolicy,
  options?: { cwd?: string; env?: Record<string, string> }
): { ok: boolean; exitCode: number; stdout: string; stderr: string } {
  try {
    const cwd = options?.cwd || process.cwd();
    const env = { ...process.env, ...options?.env };

    const output = execSync(command, {
      cwd,
      encoding: 'utf8',
      timeout: policy.timeoutMs,
      maxBuffer: policy.maxOutputBytes,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    return { ok: true, exitCode: 0, stdout: output.slice(0, policy.maxOutputBytes), stderr: '' };
  } catch (err: any) {
    const stdout = err.stdout?.toString()?.slice(0, policy.maxOutputBytes) || '';
    const stderr = err.stderr?.toString()?.slice(0, policy.maxOutputBytes) || err.message || '';
    return { ok: false, exitCode: err.status ?? -1, stdout, stderr };
  }
}

async function executeInDocker(
  command: string,
  policy: SandboxPolicy,
  options?: { cwd?: string }
): Promise<{ ok: boolean; exitCode: number; stdout: string; stderr: string }> {
  // Check if Docker is available
  try {
    execSync('docker --version', { encoding: 'utf8', timeout: 5000, windowsHide: true, stdio: 'ignore' });
  } catch {
    // Docker not available, fallback to local
    return executeLocally(command, policy, options);
  }

  const containerName = `ledgerflow_sandbox_${Date.now()}`;
  const cwd = options?.cwd || process.cwd();

  try {
    // Run in a temporary container
    const output = execSync(
      `docker run --rm --name "${containerName}" --network ${policy.allowNetwork ? 'bridge' : 'none'} -v "${cwd}:/workspace" -w /workspace node:22-alpine sh -c "${command.replace(/"/g, '\\"')}"`,
      { encoding: 'utf8', timeout: policy.timeoutMs, maxBuffer: policy.maxOutputBytes, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true }
    );

    return { ok: true, exitCode: 0, stdout: output.slice(0, policy.maxOutputBytes), stderr: '' };
  } catch (err: any) {
    const stdout = err.stdout?.toString()?.slice(0, policy.maxOutputBytes) || '';
    const stderr = err.stderr?.toString()?.slice(0, policy.maxOutputBytes) || '';
    // Clean up on failure
    try { execSync(`docker rm -f "${containerName}"`, { stdio: 'ignore', timeout: 5000, windowsHide: true }); } catch { }
    return { ok: false, exitCode: err.status ?? -1, stdout, stderr };
  }
}

// ─── Self-repair integration ────────────────────────────────────────

export async function autoTestAndRepair(
  sandboxId: string,
  testCommand: string,
  repairPrompt: string,
  maxAttempts = 3
): Promise<{ passed: boolean; attempts: number; results: SandboxResult[]; repairLog: string[] }> {
  const repairLog: string[] = [];
  const results: SandboxResult[] = [];

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await runTestSuiteInSandbox(sandboxId, testCommand);
    results.push(result);
    repairLog.push(`Attempt ${attempt}: ${result.ok ? 'PASS' : 'FAIL'} (exit ${result.exitCode})`);

    if (result.ok) {
      return { passed: true, attempts: attempt, results, repairLog };
    }

    if (attempt >= maxAttempts) break;

    // Log repair attempt
    repairLog.push(`Attempt ${attempt}: auto-repair with prompt "${repairPrompt.slice(0, 100)}"`);

    // The actual repair is done by the agentic loop — we just report here
  }

  return { passed: false, attempts: maxAttempts, results, repairLog };
}
