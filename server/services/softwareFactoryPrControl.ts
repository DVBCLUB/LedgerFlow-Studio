import { createHash } from 'node:crypto';
import {
  scoreSoftwareFactoryReadiness,
  type PRChangedFileInput,
  type PRCheckInput,
  type SoftwareFactoryReadinessReport,
} from './softwareFactoryReadiness.ts';

export interface SoftwareFactoryPullRequestInput {
  id: string;
  title: string;
  url?: string;
  author?: string;
  baseBranch: string;
  headBranch: string;
  changedFiles: PRChangedFileInput[];
  checks: PRCheckInput[];
  ciLogSummary?: string;
  hasRollbackPlan?: boolean;
  hasHumanApproval?: boolean;
  hasSecurityApproval?: boolean;
  hasDataApproval?: boolean;
  requestedReviewers?: string[];
  labels?: string[];
}

export interface SoftwareFactoryPRControlReport {
  id: string;
  generatedAt: string;
  pr: Pick<SoftwareFactoryPullRequestInput, 'id' | 'title' | 'url' | 'author' | 'baseBranch' | 'headBranch'>;
  readiness: SoftwareFactoryReadinessReport;
  mergeGate: {
    allowed: boolean;
    mode: 'auto_merge_ready' | 'human_review_required' | 'blocked';
    reasons: string[];
  };
  evidence: {
    filesChanged: number;
    additions: number;
    deletions: number;
    checksTotal: number;
    checksSuccessful: number;
    checksFailed: number;
    rollbackPlan: boolean;
    approvals: {
      human: boolean;
      security: boolean;
      data: boolean;
    };
  };
  reviewerChecklist: string[];
  releaseNotesDraft: string;
  auditFingerprint: string;
}

function stableFingerprint(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function buildReviewerChecklist(input: SoftwareFactoryPullRequestInput, readiness: SoftwareFactoryReadinessReport) {
  const checklist = [
    'Confirm changed files match the stated PR scope.',
    'Verify CI/check evidence is attached and current.',
    'Confirm rollback plan is valid for desktop and daemon runtime.',
  ];

  if (readiness.riskSummary.high > 0) checklist.push('Technical owner must review high-risk paths.');
  if (readiness.requiredApprovals.includes('security')) checklist.push('Security approval required before merge.');
  if (readiness.requiredApprovals.includes('data-owner')) checklist.push('Data-owner approval required before merge.');
  if (input.labels?.some((label) => /runtime|daemon|agent|ai/i.test(label))) checklist.push('Run AI Workforce runtime smoke checks after patching daemon routes.');
  if (!input.requestedReviewers?.length) checklist.push('Assign at least one reviewer before making PR ready.');

  return checklist;
}

function buildReleaseNotesDraft(input: SoftwareFactoryPullRequestInput, readiness: SoftwareFactoryReadinessReport) {
  const riskyAreas = readiness.fileRisks
    .filter((file) => file.risk !== 'low')
    .map((file) => `${file.filename} (${file.risk})`)
    .slice(0, 5);
  return [
    `### ${input.title}`,
    `- PR: ${input.url || input.id}`,
    `- Readiness: ${readiness.verdict} (${readiness.score}/100).`,
    `- Changed files: ${input.changedFiles.length}; checks: ${input.checks.length}.`,
    riskyAreas.length ? `- Risk focus: ${riskyAreas.join(', ')}.` : '- Risk focus: no elevated-risk paths detected.',
    `- Rollback plan: ${input.hasRollbackPlan ? 'provided' : 'missing'}.`,
  ].join('\n');
}

export function buildSoftwareFactoryPRControlReport(input: SoftwareFactoryPullRequestInput, generatedAt = new Date().toISOString()): SoftwareFactoryPRControlReport {
  const readiness = scoreSoftwareFactoryReadiness({
    title: input.title,
    changedFiles: input.changedFiles,
    checks: input.checks,
    ciLogSummary: input.ciLogSummary,
    hasRollbackPlan: input.hasRollbackPlan,
    hasHumanApproval: input.hasHumanApproval,
    hasSecurityApproval: input.hasSecurityApproval,
    hasDataApproval: input.hasDataApproval,
  });

  const checksSuccessful = input.checks.filter((check) => check.status === 'success').length;
  const checksFailed = input.checks.filter((check) => check.status === 'failure' || check.status === 'cancelled').length;
  const reasons = [...readiness.blockers];
  if (readiness.verdict === 'needs_review') reasons.push('Readiness score or warning level requires human review.');
  if (!input.requestedReviewers?.length) reasons.push('No reviewer assigned.');

  const allowed = readiness.verdict === 'ready' && Boolean(input.requestedReviewers?.length);
  const mode: SoftwareFactoryPRControlReport['mergeGate']['mode'] = allowed
    ? 'auto_merge_ready'
    : readiness.verdict === 'blocked'
      ? 'blocked'
      : 'human_review_required';

  const reportCore = {
    pr: {
      id: input.id,
      title: input.title,
      url: input.url,
      author: input.author,
      baseBranch: input.baseBranch,
      headBranch: input.headBranch,
    },
    readiness,
    mergeGate: { allowed, mode, reasons },
    evidence: {
      filesChanged: input.changedFiles.length,
      additions: input.changedFiles.reduce((sum, file) => sum + file.additions, 0),
      deletions: input.changedFiles.reduce((sum, file) => sum + file.deletions, 0),
      checksTotal: input.checks.length,
      checksSuccessful,
      checksFailed,
      rollbackPlan: Boolean(input.hasRollbackPlan),
      approvals: {
        human: Boolean(input.hasHumanApproval),
        security: Boolean(input.hasSecurityApproval),
        data: Boolean(input.hasDataApproval),
      },
    },
    reviewerChecklist: buildReviewerChecklist(input, readiness),
    releaseNotesDraft: buildReleaseNotesDraft(input, readiness),
  };

  return {
    id: `pr_control_${stableFingerprint({ input, generatedAt }).slice(0, 16)}`,
    generatedAt,
    ...reportCore,
    auditFingerprint: stableFingerprint(reportCore),
  };
}

export function assertPRControlMergeAllowed(report: SoftwareFactoryPRControlReport) {
  if (!report.mergeGate.allowed) {
    throw new Error(`PR merge gate is not allowed: ${report.mergeGate.reasons.join('; ') || report.mergeGate.mode}`);
  }
  return report;
}
