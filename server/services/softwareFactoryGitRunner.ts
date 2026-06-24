import { exec } from "child_process";
import {
  generateCommitMessage,
  generatePRDescription,
  getGitDiff,
  getGitLog,
  getGitStatus,
} from "./gitAssistant";

export interface SoftwareFactoryGitRunnerStatus {
  branch: string;
  status: Awaited<ReturnType<typeof getGitStatus>>;
  diff: Awaited<ReturnType<typeof getGitDiff>>;
  recentLog: string;
}

function gitExec(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, { cwd: process.cwd(), maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve(stdout.trim());
    });
  });
}

function safeBranchName(branchName: string) {
  const cleaned = branchName.trim().replace(/\s+/g, "-");
  if (!/^[a-zA-Z0-9._/-]{3,120}$/.test(cleaned)) {
    throw new Error("Invalid branch name. Use letters, numbers, dot, slash, underscore or dash.");
  }
  if (cleaned.includes("..") || cleaned.startsWith("/") || cleaned.endsWith("/")) {
    throw new Error("Invalid branch name format.");
  }
  return cleaned;
}

export async function getSoftwareFactoryGitRunnerStatus(): Promise<SoftwareFactoryGitRunnerStatus> {
  const [branch, status, diff, recentLog] = await Promise.all([
    gitExec("git branch --show-current").catch(() => "unknown"),
    getGitStatus(),
    getGitDiff(),
    getGitLog(8),
  ]);
  return { branch, status, diff, recentLog };
}

export async function createSoftwareFactoryWorkBranch(branchName: string) {
  const safeName = safeBranchName(branchName);
  const before = await gitExec("git branch --show-current").catch(() => "unknown");
  await gitExec(`git checkout -b ${safeName}`);
  const after = await gitExec("git branch --show-current").catch(() => safeName);
  return { ok: true, before, branch: after };
}

export async function prepareSoftwareFactoryCommitDraft() {
  const [status, diff, commitMessage] = await Promise.all([
    getGitStatus(),
    getGitDiff(),
    generateCommitMessage(),
  ]);
  return { status, diff, commitMessage };
}

export async function prepareSoftwareFactoryPullRequestDraft(base = "main") {
  const [runnerStatus, prDescription] = await Promise.all([
    getSoftwareFactoryGitRunnerStatus(),
    generatePRDescription(base),
  ]);
  return { base, runnerStatus, prDescription };
}
