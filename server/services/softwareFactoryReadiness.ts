export type PRCheckStatus = 'success' | 'failure' | 'pending' | 'skipped';
export type FileRisk = 'low' | 'medium' | 'high';
export type PRReadinessVerdict = 'ready' | 'needs_review' | 'blocked';

export interface PRChangedFileInput {
  filename: string;
  additions: number;
  deletions: number;
  status?: 'added' | 'modified' | 'removed' | 'renamed';
}

export interface PRCheckInput {
  name: string;
  status: PRCheckStatus;
  details?: string;
}

export interface SoftwareFactoryReadinessInput {
  title: string;
  changedFiles: PRChangedFileInput[];
  checks: PRCheckInput[];
  ciLogSummary?: string;
  hasHumanApproval?: boolean;
  hasRollbackPlan?: boolean;
  touchesSecurity?: boolean;
  touchesDataModel?: boolean;
}

export interface FileRiskAssessment {
  filename: string;
  risk: FileRisk;
  reasons: string[];
}

export interface SoftwareFactoryReadinessReport {
  title: string;
  score: number;
  verdict: PRReadinessVerdict;
  fileRisks: FileRiskAssessment[];
  blockers: string[];
  warnings: string[];
  requiredApprovals: string[];
  summary: string;
}

const HIGH_RISK_PATTERNS = [
  /package-lock\.json$/,
  /pnpm-lock\.yaml$/,
  /yarn\.lock$/,
  /server\/services\/.*auth/i,
  /server\/services\/.*security/i,
  /migrations?\//i,
  /\.env/i,
  /desktop\/main\.cjs$/,
];

const MEDIUM_RISK_PATTERNS = [
  /package\.json$/,
  /server\//i,
  /scripts\//i,
  /src\/app\//i,
  /src\/modules\//i,
];

function classifyFileRisk(file: PRChangedFileInput): FileRiskAssessment {
  const reasons: string[] = [];
  const totalChanges = file.additions + file.deletions;
  let risk: FileRisk = 'low';

  if (HIGH_RISK_PATTERNS.some((pattern) => pattern.test(file.filename))) {
    risk = 'high';
    reasons.push('high-risk path');
  } else if (MEDIUM_RISK_PATTERNS.some((pattern) => pattern.test(file.filename))) {
    risk = 'medium';
    reasons.push('runtime or app path');
  }

  if (totalChanges > 600) {
    risk = 'high';
    reasons.push('large diff');
  } else if (totalChanges > 180 && risk === 'low') {
    risk = 'medium';
    reasons.push('medium diff size');
  }

  if (!reasons.length) reasons.push('small isolated change');
  return { filename: file.filename, risk, reasons };
}

function scoreChecks(checks: PRCheckInput[]) {
  if (!checks.length) return { score: 0, blockers: ['No CI/check evidence was provided.'], warnings: [] as string[] };
  const failures = checks.filter((check) => check.status === 'failure');
  const pending = checks.filter((check) => check.status === 'pending');
  const success = checks.filter((check) => check.status === 'success');
  const blockers = failures.map((check) => `Required check failed: ${check.name}`);
  const warnings = pending.map((check) => `Check still pending: ${check.name}`);
  const score = checks.length ? Math.round((success.length / checks.length) * 30) : 0;
  return { score, blockers, warnings };
}

export function scoreSoftwareFactoryReadiness(input: SoftwareFactoryReadinessInput): SoftwareFactoryReadinessReport {
  const fileRisks = input.changedFiles.map(classifyFileRisk);
  const highRiskFiles = fileRisks.filter((file) => file.risk === 'high');
  const mediumRiskFiles = fileRisks.filter((file) => file.risk === 'medium');
  const checkScore = scoreChecks(input.checks);
  const blockers = [...checkScore.blockers];
  const warnings = [...checkScore.warnings];
  const requiredApprovals: string[] = [];

  let score = 55 + checkScore.score;

  if (!input.changedFiles.length) blockers.push('No changed files were provided.');
  if (highRiskFiles.length) {
    score -= Math.min(25, highRiskFiles.length * 8);
    requiredApprovals.push('Technical owner approval for high-risk files');
  }
  if (mediumRiskFiles.length) score -= Math.min(12, mediumRiskFiles.length * 2);
  if (input.touchesSecurity) requiredApprovals.push('Security review');
  if (input.touchesDataModel) requiredApprovals.push('Data/model migration review');
  if ((input.touchesSecurity || input.touchesDataModel || highRiskFiles.length) && !input.hasHumanApproval) {
    blockers.push('Human approval is required for security, data model, or high-risk file changes.');
  }
  if (!input.hasRollbackPlan) {
    score -= 10;
    warnings.push('Rollback plan is missing.');
  }
  if (!input.ciLogSummary?.trim()) {
    score -= 8;
    warnings.push('CI log summary is missing.');
  }

  score = Math.max(0, Math.min(100, score));
  const verdict: PRReadinessVerdict = blockers.length ? 'blocked' : score >= 75 ? 'ready' : 'needs_review';

  return {
    title: input.title,
    score,
    verdict,
    fileRisks,
    blockers,
    warnings,
    requiredApprovals: Array.from(new Set(requiredApprovals)),
    summary: `${input.changedFiles.length} files, ${input.checks.length} checks, ${highRiskFiles.length} high-risk files, readiness ${score}/100.`,
  };
}

export function assertSoftwareFactoryReady(report: SoftwareFactoryReadinessReport) {
  if (report.verdict !== 'ready') {
    throw new Error(`Software factory PR is not ready: ${report.verdict} (${report.score}/100). ${report.blockers.join('; ')}`);
  }
  return true;
}
