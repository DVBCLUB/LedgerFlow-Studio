export type ApprovedGitHubChangeFile = {
  path: string;
  content: string;
};

export type ApprovedGitHubChangeInput = {
  repo?: string;
  title: string;
  summary: string;
  approvalPhrase: 'APPROVE AI GITHUB PUSH';
  baseBranch?: string;
  branchName?: string;
  draft?: boolean;
  files: ApprovedGitHubChangeFile[];
};

export type ApprovedGitHubChangeResult = {
  repo: string;
  branch: string;
  base: string;
  commitMessages: string[];
  pullRequest: {
    number: number;
    title: string;
    state?: string;
    htmlUrl?: string;
    url?: string;
    branch?: string;
    base?: string;
    draft?: boolean;
  };
};

export type CloseGitHubPullRequestInput = {
  repo?: string;
  pullNumber: number;
  reason: string;
  rollbackNote: string;
  approvalPhrase: 'APPROVE AI GITHUB CLOSE';
};

export type CloseGitHubPullRequestResult = {
  repo: string;
  pullRequest: {
    number: number;
    title: string;
    state: string;
    htmlUrl: string;
    branch: string;
    base: string;
    draft: boolean;
  };
  closedAt: string;
  reason: string;
  rollbackNote: string;
};

export type GitHubPullRequestDigest = {
  repo: string;
  pullRequest: {
    number: number;
    title: string;
    state: string;
    htmlUrl: string;
    branch: string;
    base: string;
    draft: boolean;
    mergeable: boolean | null;
    mergeableState: string | null;
    changedFiles: number;
    additions: number;
    deletions: number;
    commits: number;
    headSha: string;
  };
  files: Array<{
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
    patchPreview: string | null;
  }>;
  safety: {
    touchesBlockedPath: boolean;
    largeChange: boolean;
    hasDeletes: boolean;
    reviewNotes: string[];
  };
  lastCheckedAt: string;
};

export type GitHubWorkflowStepSummary = {
  name: string;
  status: string;
  conclusion: string | null;
  number: number;
  startedAt: string | null;
  completedAt: string | null;
};

export type GitHubWorkflowJobSummary = {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  htmlUrl: string;
  startedAt: string | null;
  completedAt: string | null;
  failedSteps: GitHubWorkflowStepSummary[];
  steps: GitHubWorkflowStepSummary[];
};

export type GitHubWorkflowRunJobsResult = {
  repo: string;
  runId: number;
  jobs: GitHubWorkflowJobSummary[];
  failedJobs: GitHubWorkflowJobSummary[];
  hasFailures: boolean;
  lastCheckedAt: string;
};

async function readJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.success === false) {
    throw new Error(data?.error || `Request failed with status ${response.status}`);
  }
  return data as T;
}

function repoQuery(repo?: string) {
  const value = repo?.trim();
  return value ? `?repo=${encodeURIComponent(value)}` : '';
}

export async function createApprovedGitHubChangeRequest(input: ApprovedGitHubChangeInput): Promise<ApprovedGitHubChangeResult> {
  const data = await readJson<{ success: true; result: ApprovedGitHubChangeResult }>(
    await fetch('/api/integrations/github/approved-change-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  );
  return data.result;
}

export async function requestCloseGitHubPullRequest(input: CloseGitHubPullRequestInput): Promise<CloseGitHubPullRequestResult> {
  const data = await readJson<{ success: true; result: CloseGitHubPullRequestResult }>(
    await fetch(`/api/integrations/github/prs/${encodeURIComponent(String(input.pullNumber))}/request-close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        repo: input.repo,
        reason: input.reason,
        rollbackNote: input.rollbackNote,
        approvalPhrase: input.approvalPhrase,
      }),
    }),
  );
  return data.result;
}

export async function fetchGitHubPullRequestDigest(repo: string | undefined, pullNumber: number): Promise<GitHubPullRequestDigest> {
  const data = await readJson<{ success: true; result: GitHubPullRequestDigest }>(
    await fetch(`/api/integrations/github/prs/${encodeURIComponent(String(pullNumber))}/digest${repoQuery(repo)}`),
  );
  return data.result;
}

export async function fetchGitHubWorkflowRunJobs(repo: string | undefined, runId: number): Promise<GitHubWorkflowRunJobsResult> {
  const data = await readJson<{ success: true; result: GitHubWorkflowRunJobsResult }>(
    await fetch(`/api/integrations/github/runs/${encodeURIComponent(String(runId))}/jobs${repoQuery(repo)}`),
  );
  return data.result;
}
