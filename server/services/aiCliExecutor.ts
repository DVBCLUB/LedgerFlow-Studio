/**
 * aiCliExecutor.ts
 * ============================================================
 * Chạy các AI coding agent qua CLI CHÍNH THỐNG (không browser automation):
 *   - Antigravity CLI (Google, free)
 *   - Claude Code CLI (Anthropic)
 *   - Gemini CLI (Google)
 *
 * An toàn: dùng spawn với mảng args (không shell interpolation), có timeout,
 * allowlist cố định, không cho phép lệnh shell tuỳ ý.
 */

import { spawn, execFile } from 'node:child_process';

export type CliAgentName = 'antigravity' | 'claude' | 'gemini';

const CLI_COMMANDS: Record<CliAgentName, { command: string; args: (prompt: string) => string[] }> = {
  antigravity: { command: 'antigravity', args: (p) => ['-p', p] },
  claude: { command: 'claude', args: (p) => ['-p', p] },
  gemini: { command: 'gemini', args: (p) => ['-p', p] },
};

export interface CliRunResult {
  cli: string;
  success: boolean;
  output: string;
  error?: string;
  exitCode: number | null;
}

export async function runCliAgent(input: {
  cli: CliAgentName;
  prompt: string;
  cwd?: string;
  timeoutMs?: number;
}): Promise<CliRunResult> {
  const cfg = CLI_COMMANDS[input.cli];
  if (!cfg) throw new Error(`Unknown CLI agent: ${input.cli}`);
  const timeout = input.timeoutMs || 120_000;

  return new Promise((resolve) => {
    const child = spawn(cfg.command, cfg.args(input.prompt), {
      cwd: input.cwd,
      shell: false,
      timeout,
    });

    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (d) => { stdout += String(d); });
    child.stderr?.on('data', (d) => { stderr += String(d); });
    child.on('error', (err) => resolve({ cli: input.cli, success: false, output: '', error: err.message, exitCode: null }));
    child.on('close', (code) => resolve({ cli: input.cli, success: code === 0, output: stdout, error: stderr || undefined, exitCode: code }));
  });
}

export async function listAvailableCliAgents(): Promise<Array<{ cli: CliAgentName; command: string; available: boolean }>> {
  const which = process.platform === 'win32' ? 'where' : 'which';
  const results: Array<{ cli: CliAgentName; command: string; available: boolean }> = [];

  for (const [cli, cfg] of Object.entries(CLI_COMMANDS) as Array<[CliAgentName, { command: string }]>) {
    const available = await new Promise<boolean>((resolve) => {
      execFile(which, [cfg.command], (err) => resolve(!err));
    });
    results.push({ cli, command: cfg.command, available });
  }
  return results;
}
