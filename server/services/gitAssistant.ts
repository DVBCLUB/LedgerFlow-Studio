/**
 * gitAssistant.ts
 * AI tạo commit messages, PR descriptions, release notes.
 */
import { randomUUID } from 'node:crypto';
import { exec } from 'child_process';
import { dispatchTextThroughFabric } from './aiFabric';
import { appendAuditEvent } from './auditLog';

// ─── Types ──────────────────────────────────────────────────────────
export interface GitFiles { staged: string[]; modified: string[]; untracked: string[]; deleted: string[]; }
export interface GitDiff { summary: string; filesChanged: number; insertions: number; deletions: number; details: string; }
export interface CommitMessage { id: string; type: string; scope?: string; subject: string; body: string; conventionalFormat: string; generatedAt: string; }
export interface PRDescription { id: string; title: string; description: string; changes: string[]; testing: string; checklist: string[]; generatedAt: string; }

function gitExec(cmd: string): Promise<string> {
  return new Promise((resolve) => {
    exec(cmd, { cwd: process.cwd(), maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
      resolve(err ? '' : stdout.trim());
    });
  });
}

export async function getGitStatus(): Promise<GitFiles> {
  const raw = await gitExec('git status --porcelain');
  const files: GitFiles = { staged: [], modified: [], untracked: [], deleted: [] };
  for (const line of raw.split('\n').filter(Boolean)) {
    const s = line.slice(0, 2); const f = line.slice(3).trim();
    if (s[0] === 'M' || s[0] === 'A') files.staged.push(f);
    if (s[1] === 'M') files.modified.push(f);
    if (s.includes('?')) files.untracked.push(f);
    if (s[0] === 'D') files.deleted.push(f);
  }
  return files;
}

export async function getGitDiff(): Promise<GitDiff> {
  const staged = await gitExec('git diff --cached --stat');
  const detail = await gitExec('git diff --cached --unified=3');
  const lines = staged.split('\n').filter(Boolean);
  const last = lines[lines.length - 1] || '';
  const m = last.match(/(\d+)\s+files?\s+changed(?:,\s+(\d+)\s+insertions?)?(?:,\s+(\d+)\s+deletions?)?/);
  return { summary: staged.slice(0, 500), filesChanged: parseInt(m?.[1] || '0'), insertions: parseInt(m?.[2] || '0'), deletions: parseInt(m?.[3] || '0'), details: detail.slice(0, 3000) };
}

export async function getGitLog(count = 10): Promise<string> { return gitExec(`git log --oneline --no-decorate -${count}`); }

export async function generateCommitMessage(): Promise<CommitMessage> {
  const cmId = `cm_${Date.now()}`;
  const diff = await getGitDiff();
  if (diff.filesChanged === 0) return { id: cmId, type: 'chore', subject: 'Update files', body: 'No staged changes.', conventionalFormat: 'chore: update files', generatedAt: new Date().toISOString() };

  let type = 'chore', scope = '', subject = '';
  try {
    const result = await dispatchTextThroughFabric(
      `Generate conventional commit:\nFILES:\n${diff.summary.slice(0, 800)}\n\nReturn: TYPE: [type] | SUBJECT: [msg]`,
      undefined, { domain: 'general', localFallback: true }
    );
    if (result.winner?.contentPreview) {
      type = (result.winner.contentPreview.match(/TYPE:\s*(\w+)/i)?.[1] || 'chore').toLowerCase();
      subject = result.winner.contentPreview.match(/SUBJECT:\s*(.+)/i)?.[1]?.trim() || '';
    }
  } catch { }
  if (!subject) subject = `${type}: ${diff.filesChanged} file(s) changed`;
  return { id: cmId, type, scope, subject, body: '', conventionalFormat: `${type}${scope ? `(${scope})` : ''}: ${subject}`, generatedAt: new Date().toISOString() };
}

export async function generatePRDescription(base = 'main'): Promise<PRDescription> {
  const prId = `pr_${Date.now()}`;
  const diff = await getGitDiff();
  const log = await getGitLog(10);
  let title = '', desc = '', changes: string[] = [], testing = '', checklist: string[] = [];

  try {
    const result = await dispatchTextThroughFabric(
      `Generate PR description:\nLOG:\n${log.slice(0, 500)}\nDIFF:\n${diff.summary.slice(0, 800)}\n\nReturn: TITLE:|DESC:|CHANGES:(-lines)|TESTING:|CHECKLIST:(-lines)`,
      undefined, { domain: 'general', localFallback: true }
    );
    if (result.winner?.contentPreview) {
      const o = result.winner.contentPreview;
      title = o.match(/TITLE:\s*(.+)/i)?.[1]?.trim() || `PR: ${diff.filesChanged} files`;
      desc = o.match(/DESC:\s*([\s\S]*?)(?=\nCHANGES:|$)/i)?.[1]?.trim() || '';
      changes = (o.match(/CHANGES:\s*([\s\S]*?)(?=\nTESTING:|$)/i)?.[1] || '').split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^-\s*/, '').trim());
      testing = o.match(/TESTING:\s*([\s\S]*)(?=\nCHECKLIST:|$)/i)?.[1]?.trim() || 'Run tests and verify manually.';
      checklist = (o.match(/CHECKLIST:\s*([\s\S]*)$/i)?.[1] || '').split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^-\s*/, '').trim());
    }
  } catch { }

  await appendAuditEvent({ actor: 'system', workspace: 'Git Assistant', action: 'pr.generate', target: title, risk: 'LOW', status: 'executed', summary: `Generated PR: ${title}`, connectorId: 'git-assistant', evidence: { prId, files: diff.filesChanged } }).catch(() => undefined);
  return { id: prId, title: title || `Update ${diff.filesChanged} files`, description: desc, changes: changes.slice(0, 10), testing: testing || 'Verify all changes.', checklist: checklist.length > 0 ? checklist : ['Tests pass', 'No regressions', 'Code reviewed'], generatedAt: new Date().toISOString() };
}
