import {
  buildSoftwareFactoryPRControlReport,
  type SoftwareFactoryPRControlReport,
  type SoftwareFactoryPullRequestInput,
} from './softwareFactoryPrControl.ts';
import type { PRChangedFileInput, PRCheckInput, PRCheckStatus } from './softwareFactoryReadiness.ts';

export interface GitHubPRControlAdapterOptions {
  repoFullName: string;
  prNumber: number;
  token?: string;
  apiBaseUrl?: string;
  fetchImpl?: typeof fetch;
}

export interface GitHubPRControlAdapterResult {
  input: SoftwareFactoryPullRequestInput;
  report: SoftwareFactoryPRControlReport;
  adapter: {
    repoFullName: string;
    prNumber: number;
    headSha: string;
    labels: string[];
    requestedReviewers: string[];
    approvals: {
      human: boolean;
      security: boolean;
      data: boolean;
      approvedBy: string[];
      changesRequestedBy: string[];
    };
    evidence: {
      changedFilesFetched: number;
      checkRunsFetched: number;
      commitStatusesFetched: number;
      rollbackDetected: boolean;
    };
  };
}

type FetchLike = typeof fetch;

type GitHubPullRequest = {
  number: number;
  title: string;
  html_url?: string;
  body?: string | null;
  user?: { login?: string } | null;
  base?: { ref?: string } | null;
  head?: { ref?: string; sha?: string } | null;
  labels?: Array<{ name?: string }>;
  requested_reviewers?: Array<{ login?: string }>;
};

type GitHubChangedFile = {
  filename: string;
  additions?: number;
  deletions?: number;
  status?: PRChangedFileInput['status'];
};

type GitHubReview = {
  user?: { login?: string } | null;
  state?: string;
  submitted_at?: string;
};

type GitHubCheckRun = {
  name: string;
  status?: string;
  conclusion?: string | null;
  html_url?: string;
};

type GitHubCombinedStatus = {
  state?: string;
  statuses?: Array<{ context?: string; state?: string; description?: string; target_url?: string }>;
};

function normalizeApiBase(apiBaseUrl?: string) {
  return (apiBaseUrl || 'https://api.github.com').replace(/\/+$/, '');
}

function requireRepoParts(repoFullName: string) {
  const [owner, repo] = repoFullName.split('/');
  if (!owner || !repo || repoFullName.split('/').length !== 2) throw new Error('repoFullName must be in owner/repo format.');
  return { owner, repo };
}

function buildHeaders(token?: string) {
  return {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchJson<T>(fetchImpl: FetchLike, url: string, token?: string): Promise<T> {
  const response = await fetchImpl(url, { headers: buildHeaders(token) } as RequestInit);
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`GitHub request failed ${response.status}: ${url}${body ? ` — ${body.slice(0, 240)}` : ''}`);
  }
  return response.json() as Promise<T>;
}

async function fetchAllPages<T>(fetchImpl: FetchLike, url: string, token?: string, maxPages = 4): Promise<T[]> {
  const results: T[] = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const separator = url.includes('?') ? '&' : '?';
    const rows = await fetchJson<T[]>(fetchImpl, `${url}${separator}per_page=100&page=${page}`, token);
    results.push(...rows);
    if (rows.length < 100) break;
  }
  return results;
}

function mapFile(file: GitHubChangedFile): PRChangedFileInput {
  return {
    filename: file.filename,
    additions: Number(file.additions || 0),
    deletions: Number(file.deletions || 0),
    status: file.status,
  };
}

function mapCheckStatusFromConclusion(status?: string, conclusion?: string | null): PRCheckStatus {
  if (status && status !== 'completed') return 'pending';
  if (!conclusion) return 'pending';
  if (conclusion === 'success') return 'success';
  if (conclusion === 'skipped' || conclusion === 'neutral') return 'skipped';
  if (conclusion === 'cancelled') return 'cancelled';
  return 'failure';
}

function mapCommitStatus(state?: string): PRCheckStatus {
  if (state === 'success') return 'success';
  if (state === 'pending') return 'pending';
  if (state === 'failure' || state === 'error') return 'failure';
  return 'pending';
}

function latestReviewStates(reviews: GitHubReview[]) {
  const latest = new Map<string, GitHubReview>();
  for (const review of reviews) {
    const login = review.user?.login;
    if (!login) continue;
    const current = latest.get(login);
    if (!current || String(review.submitted_at || '') >= String(current.submitted_at || '')) latest.set(login, review);
  }
  const approvedBy: string[] = [];
  const changesRequestedBy: string[] = [];
  for (const [login, review] of latest) {
    const state = String(review.state || '').toUpperCase();
    if (state === 'APPROVED') approvedBy.push(login);
    if (state === 'CHANGES_REQUESTED') changesRequestedBy.push(login);
  }
  return { approvedBy: approvedBy.sort(), changesRequestedBy: changesRequestedBy.sort() };
}

function hasLabel(labels: string[], patterns: RegExp[]) {
  return labels.some((label) => patterns.some((pattern) => pattern.test(label)));
}

function approvalFromPeople(people: string[], patterns: RegExp[]) {
  return people.some((person) => patterns.some((pattern) => pattern.test(person)));
}

function detectRollback(body: string, labels: string[]) {
  return /rollback|backout|revert|roll back|khôi phục|hoàn tác/i.test(body) || hasLabel(labels, [/rollback/i, /release-ready/i]);
}

function summarizeChecks(checks: PRCheckInput[]) {
  if (!checks.length) return 'GitHub adapter found no check runs or commit statuses.';
  const failed = checks.filter((check) => check.status === 'failure' || check.status === 'cancelled').map((check) => check.name);
  const pending = checks.filter((check) => check.status === 'pending').map((check) => check.name);
  const success = checks.filter((check) => check.status === 'success' || check.status === 'skipped').length;
  return [
    `GitHub adapter fetched ${checks.length} checks/statuses: ${success} successful/skipped.`,
    failed.length ? `Failed/cancelled: ${failed.join(', ')}.` : '',
    pending.length ? `Pending: ${pending.join(', ')}.` : '',
  ].filter(Boolean).join(' ');
}

export async function fetchGitHubPullRequestControlInput(options: GitHubPRControlAdapterOptions): Promise<GitHubPRControlAdapterResult['input'] & { __adapter: GitHubPRControlAdapterResult['adapter'] }> {
  const { owner, repo } = requireRepoParts(options.repoFullName);
  const apiBase = normalizeApiBase(options.apiBaseUrl);
  const fetchImpl = options.fetchImpl || fetch;
  if (!fetchImpl) throw new Error('No fetch implementation is available for GitHub PR Control adapter.');

  const pr = await fetchJson<GitHubPullRequest>(fetchImpl, `${apiBase}/repos/${owner}/${repo}/pulls/${options.prNumber}`, options.token);
  const headSha = pr.head?.sha;
  if (!headSha) throw new Error('GitHub PR response is missing head SHA.');

  const [files, reviews, checkRunsResponse, combinedStatus] = await Promise.all([
    fetchAllPages<GitHubChangedFile>(fetchImpl, `${apiBase}/repos/${owner}/${repo}/pulls/${options.prNumber}/files`, options.token),
    fetchAllPages<GitHubReview>(fetchImpl, `${apiBase}/repos/${owner}/${repo}/pulls/${options.prNumber}/reviews`, options.token),
    fetchJson<{ check_runs?: GitHubCheckRun[] }>(fetchImpl, `${apiBase}/repos/${owner}/${repo}/commits/${headSha}/check-runs?per_page=100`, options.token).catch(() => ({ check_runs: [] })),
    fetchJson<GitHubCombinedStatus>(fetchImpl, `${apiBase}/repos/${owner}/${repo}/commits/${headSha}/status`, options.token).catch(() => ({ statuses: [] })),
  ]);

  const labels = (pr.labels || []).map((label) => label.name).filter((label): label is string => Boolean(label));
  const requestedReviewers = (pr.requested_reviewers || []).map((reviewer) => reviewer.login).filter((login): login is string => Boolean(login));
  const reviewState = latestReviewStates(reviews);
  const approvedBy = reviewState.approvedBy;
  const changesRequestedBy = reviewState.changesRequestedBy;
  const hasUnresolvedChangeRequest = changesRequestedBy.length > 0;
  const checks: PRCheckInput[] = [
    ...(checkRunsResponse.check_runs || []).map((check) => ({
      name: check.name,
      status: mapCheckStatusFromConclusion(check.status, check.conclusion),
      details: check.html_url,
    })),
    ...((combinedStatus.statuses || []).map((status) => ({
      name: status.context || 'commit-status',
      status: mapCommitStatus(status.state),
      details: status.description || status.target_url,
    }))),
  ];

  const humanApproval = approvedBy.length > 0 && !hasUnresolvedChangeRequest;
  const securityApproval = hasLabel(labels, [/security[-_ ]?approved/i, /sec[-_ ]?approved/i]) || approvalFromPeople(approvedBy, [/security/i, /secops/i, /appsec/i]);
  const dataApproval = hasLabel(labels, [/data[-_ ]?approved/i, /db[-_ ]?approved/i]) || approvalFromPeople(approvedBy, [/data/i, /database/i, /dba/i]);
  const rollbackDetected = detectRollback(pr.body || '', labels);

  const input: SoftwareFactoryPullRequestInput = {
    id: `${options.repoFullName}#${pr.number}`,
    title: pr.title,
    url: pr.html_url,
    author: pr.user?.login,
    baseBranch: pr.base?.ref || 'unknown-base',
    headBranch: pr.head?.ref || 'unknown-head',
    changedFiles: files.map(mapFile),
    checks,
    ciLogSummary: summarizeChecks(checks),
    hasRollbackPlan: rollbackDetected,
    hasHumanApproval: humanApproval,
    hasSecurityApproval: securityApproval,
    hasDataApproval: dataApproval,
    requestedReviewers,
    labels,
  };

  return {
    ...input,
    __adapter: {
      repoFullName: options.repoFullName,
      prNumber: options.prNumber,
      headSha,
      labels,
      requestedReviewers,
      approvals: {
        human: humanApproval,
        security: securityApproval,
        data: dataApproval,
        approvedBy,
        changesRequestedBy,
      },
      evidence: {
        changedFilesFetched: files.length,
        checkRunsFetched: checkRunsResponse.check_runs?.length || 0,
        commitStatusesFetched: combinedStatus.statuses?.length || 0,
        rollbackDetected,
      },
    },
  };
}

export async function buildGitHubSoftwareFactoryPRControlReport(options: GitHubPRControlAdapterOptions): Promise<GitHubPRControlAdapterResult> {
  const { __adapter, ...input } = await fetchGitHubPullRequestControlInput(options);
  const report = buildSoftwareFactoryPRControlReport(input);
  return { input, report, adapter: __adapter };
}
