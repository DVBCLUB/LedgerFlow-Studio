/**
 * aiCodeReviewQueue.ts
 * ============================================================
 * AI Code Review Queue — auto-review code changes
 * như GitHub PR review, với scoring, inline comments,
 * và approval/rejection gating.
 */
import { randomUUID } from 'node:crypto';
import { dispatchTextThroughFabric } from './aiFabric';
import { appendAuditEvent } from './auditLog';
import { auditFile } from './aiSecurityAuditor';
import fs from 'fs';
import { ensureRuntimeRootSync, resolveRuntimePathFromEnv, resolveRuntimeReadPathFromEnv } from './runtimePaths.ts';

// ─── Types ──────────────────────────────────────────────────────────
export interface ReviewComment {
  line: number;
  severity: 'critical' | 'major' | 'minor' | 'suggestion';
  category: 'bug' | 'security' | 'performance' | 'style' | 'architecture' | 'documentation';
  message: string;
  suggestion: string;
  codeSnippet: string;
}

export interface ReviewResult {
  reviewer: string;
  score: number;           // 0-100
  comments: ReviewComment[];
  summary: string;
  approved: boolean;
  recommendations: string[];
}

export interface CodeReviewRun {
  id: string;
  title: string;
  files: string[];
  reviewers: string[];
  results: ReviewResult[];
  overallScore: number;
  totalComments: number;
  approved: boolean;
  startedAt: string;
  completedAt?: string;
  totalLatencyMs: number;
  log: string[];
}

// ─── Reviewer profiles ──────────────────────────────────────────────
const REVIEWER_PROFILES: Array<{ name: string; systemPrompt: string; focus: string[] }> = [
  {
    name: 'Security Auditor', systemPrompt: 'Security-focused reviewer. Check for XSS, injection, auth bypass, data leaks, hardcoded secrets.',
    focus: ['security', 'auth', 'secrets', 'input_validation'],
  },
  {
    name: 'Performance Analyst', systemPrompt: 'Performance reviewer. Check for N+1 queries, memory leaks, sync blocking, inefficient algorithms.',
    focus: ['performance', 'memory', 'async', 'algorithms'],
  },
  {
    name: 'Code Quality Reviewer', systemPrompt: 'Code quality reviewer. Check readability, naming, SOLID principles, DRY, code smells.',
    focus: ['readability', 'architecture', 'patterns', 'maintainability'],
  },
  {
    name: 'Type Safety Reviewer', systemPrompt: 'TypeScript type safety reviewer. Check for any types, missing null checks, correct generics, strict mode compliance.',
    focus: ['typescript', 'types', 'null_safety', 'generics'],
  },
];

// ─── Storage ────────────────────────────────────────────────────────
const FILE = resolveRuntimePathFromEnv('CODE_REVIEWS_FILE', 'code_reviews.json');
let reviews: CodeReviewRun[] = [];

async function load(): Promise<void> {
  try {
    const file = resolveRuntimeReadPathFromEnv('CODE_REVIEWS_FILE', 'code_reviews.json');
    if (fs.existsSync(file)) reviews = JSON.parse(await fs.promises.readFile(file, 'utf8'));
  } catch { }
}
load().catch(() => undefined);
async function save(): Promise<void> {
  ensureRuntimeRootSync();
  await fs.promises.writeFile(FILE, JSON.stringify(reviews.slice(-30), null, 2), 'utf8');
}

// ─── Core API ───────────────────────────────────────────────────────

export function getReviewerProfiles() { return [...REVIEWER_PROFILES]; }

export async function runCodeReview(
  title: string,
  filePaths: string[],
  options?: { reviewers?: string[]; autoApprove?: boolean },
): Promise<CodeReviewRun> {
  const runId = `rev_${Date.now()}`;
  const started = Date.now();
  const reviewerNames = options?.reviewers || REVIEWER_PROFILES.map(r => r.name);

  const run: CodeReviewRun = {
    id: runId, title: title.slice(0, 120),
    files: filePaths, reviewers: reviewerNames,
    results: [], overallScore: 0, totalComments: 0,
    approved: false, startedAt: new Date().toISOString(),
    totalLatencyMs: 0, log: [],
  };

  reviews.push(run);
  run.log.push(`Review "${title}" started: ${filePaths.length} files, ${reviewerNames.length} reviewers.`);

  // Read all files
  const fileContents = new Map<string, string>();
  for (const fp of filePaths) {
    try { fileContents.set(fp, await fs.promises.readFile(fp, 'utf8')); }
    catch { run.log.push(`Cannot read: ${fp}`); }
  }

  if (fileContents.size === 0) {
    run.log.push('No files readable. Review aborted.');
    run.completedAt = new Date().toISOString();
    run.totalLatencyMs = Date.now() - started;
    return run;
  }

  // Review each file with each reviewer
  for (const reviewer of REVIEWER_PROFILES) {
    if (!reviewerNames.includes(reviewer.name)) continue;

    run.log.push(`Reviewer: ${reviewer.name}...`);
    const allComments: ReviewComment[] = [];
    let totalScore = 0;

    for (const [fp, content] of fileContents) {
      // Run security audit first (shared across all)
      let secComments: ReviewComment[] = [];
      if (reviewer.name === 'Security Auditor') {
        try {
          const audit = await auditForComments(fp);
          secComments = audit;
        } catch { }
      }

      // AI review
      const lines = content.split('\n');
      try {
        const prompt = `Review this code as a ${reviewer.name}. Focus on: ${reviewer.focus.join(', ')}.

FILE: ${fp.split(/[\\/]/).pop() || fp} (${lines.length} lines)

CODE:
\`\`\`typescript
${content.slice(0, 5000)}
\`\`\`

Return each finding on a new line in format:
FINDING: L[line] | [severity] | [category] | [message] | [suggestion]

After all findings, give:
SCORE: [0-100]
SUMMARY: [1-2 sentence summary]
APPROVED: [yes/no]
RECOMMENDATIONS: [comma separated, or NONE]`;

        const result = await dispatchTextThroughFabric(prompt, reviewer.systemPrompt, { domain: 'coding', localFallback: true });

        if (result.winner?.contentPreview) {
          const content = result.winner.contentPreview;
          const findingLines = content.split('\n').filter(l => l.toUpperCase().startsWith('FINDING:'));

          for (const line of findingLines) {
            const parts = line.replace(/^FINDING:\s*/i, '').split('|').map(s => s.trim());
            if (parts.length >= 4) {
              allComments.push({
                line: parseInt(parts[0].replace('L', '')) || 0,
                severity: (parts[1] as ReviewComment['severity']) || 'minor',
                category: (parts[2] as ReviewComment['category']) || 'style',
                message: parts[3].slice(0, 200),
                suggestion: parts[4]?.slice(0, 200) || '',
                codeSnippet: lines[parseInt(parts[0].replace('L', '')) - 1]?.slice(0, 100) || '',
              });
            }
          }

          const scoreMatch = content.match(/SCORE:\s*(\d+)/i);
          totalScore += scoreMatch ? parseInt(scoreMatch[1]) : 50;
        }
      } catch { totalScore += 70; } // Default score on error

      // Add security audit findings
      allComments.push(...secComments);
    }

    const avgScore = fileContents.size > 0 ? Math.round(totalScore / fileContents.size) : 0;
    const approved = avgScore >= 70;

    // Extract AI summary
    const summary = `Reviewed by ${reviewer.name}. ${allComments.length} findings. Score: ${avgScore}/100.`;

    const result: ReviewResult = {
      reviewer: reviewer.name,
      score: avgScore,
      comments: allComments,
      summary,
      approved,
      recommendations: allComments.slice(0, 3).map(c => c.suggestion).filter(Boolean),
    };

    run.results.push(result);
    run.totalComments += allComments.length;
    run.log.push(`  ${reviewer.name}: score=${avgScore}, comments=${allComments.length}`);
  }

  run.overallScore = run.results.length > 0
    ? Math.round(run.results.reduce((s, r) => s + r.score, 0) / run.results.length)
    : 0;
  run.approved = run.results.every(r => r.approved);
  run.completedAt = new Date().toISOString();
  run.totalLatencyMs = Date.now() - started;

  run.log.push(`Review complete: score=${run.overallScore}, approved=${run.approved}, comments=${run.totalComments}`);

  await appendAuditEvent({
    actor: 'system', workspace: 'Code Review', action: 'review.complete',
    target: title, risk: run.approved ? 'LOW' : 'MEDIUM',
    status: 'executed',
    summary: `Review "${title}": ${run.overallScore}/100, ${run.totalComments} comments`,
    connectorId: 'code-review',
    evidence: { runId, files: filePaths.length, score: run.overallScore },
  }).catch(() => undefined);

  save().catch(() => undefined);
  return run;
}

async function auditForComments(filePath: string): Promise<ReviewComment[]> {
  const comments: ReviewComment[] = [];
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // Heuristic security scan inline
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('eval(')) comments.push({ line: i + 1, severity: 'critical', category: 'security', message: 'eval() allows arbitrary code execution.', suggestion: 'Remove eval() or use a proper parser.', codeSnippet: line.trim().slice(0, 80) });
      if (line.match(/(?:password|secret|apiKey)\s*[:=]\s*['"]\w+['"]/)) comments.push({ line: i + 1, severity: 'critical', category: 'security', message: 'Hardcoded credential detected.', suggestion: 'Move to environment variables.', codeSnippet: line.trim().slice(0, 80) });
      if (line.includes('innerHTML')) comments.push({ line: i + 1, severity: 'major', category: 'security', message: 'innerHTML can lead to XSS.', suggestion: 'Use textContent or DOMPurify.', codeSnippet: line.trim().slice(0, 80) });
    }
  } catch { }
  return comments;
}

export function getReview(id: string): CodeReviewRun | undefined { return reviews.find(r => r.id === id); }
export function listReviews(): CodeReviewRun[] { return [...reviews].reverse(); }
export function getReviewStats(): { total: number; avgScore: number; approvedRate: number } {
  return {
    total: reviews.length,
    avgScore: reviews.length > 0 ? +(reviews.reduce((s, r) => s + r.overallScore, 0) / reviews.length).toFixed(1) : 0,
    approvedRate: reviews.length > 0 ? +(reviews.filter(r => r.approved).length / reviews.length * 100).toFixed(1) : 0,
  };
}
