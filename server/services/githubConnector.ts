export interface GitHubWorkflowRunSummary {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  branch: string;
  event: string;
  htmlUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface GitHubIssueSummary {
  number: number;
  title: string;
  state: string;
  htmlUrl: string;
  createdAt: string;
  updatedAt: string;
  labels: string[];
  isPullRequest: boolean;
}

export interface GitHubRepositorySummary {
  fullName: string;
  private: boolean;
  defaultBranch: string;
  htmlUrl: string;
  description: string | null;
  openIssuesCount: number;
  pushedAt: string | null;
  updatedAt: string | null;
}

export interface GitHubConnectorSummary {
  repo: string;
  tokenConfigured: boolean;
  repository?: GitHubRepositorySummary;
  latestRuns: GitHubWorkflowRunSummary[];
  openIssues: GitHubIssueSummary[];
  openPullRequests: GitHubIssueSummary[];
  actionsUrl: string;
  issuesUrl: string;
  pullsUrl: string;
  lastCheckedAt: string;
}

export interface CreateGitHubIssueInput {
  repo?: string;
  title: string;
  body?: string;
  labels?: string[];
}

const DEFAULT_REPO = process.env.GITHUB_REPOSITORY || "DVBCLUB/LedgerFlow-Studio";
const GITHUB_API_BASE = "https://api.github.com";

function getGitHubToken(): string | undefined {
  return process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
}

export function normalizeGitHubRepo(input?: string): string {
  const raw = (input || DEFAULT_REPO).trim();
  if (!raw) return DEFAULT_REPO;

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      const url = new URL(raw);
      const [owner, repo] = url.pathname.replace(/^\/+/, "").split("/");
      if (owner && repo) return `${owner}/${repo.replace(/\.git$/, "")}`;
    } catch {
      return DEFAULT_REPO;
    }
  }

  const cleaned = raw.replace(/^git@github\.com:/, "").replace(/\.git$/, "");
  const [owner, repo] = cleaned.split("/");
  return owner && repo ? `${owner}/${repo}` : DEFAULT_REPO;
}

async function githubFetch<T>(path: string, init: RequestInit = {}, requireAuth = false): Promise<T> {
  const token = getGitHubToken();
  if (requireAuth && !token) {
    throw new Error("GITHUB_TOKEN hoặc GH_TOKEN chưa được cấu hình. Thao tác ghi GitHub cần token, còn đọc public repo vẫn dùng được.");
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "LedgerFlow-Studio-Integration-Hub",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${GITHUB_API_BASE}${path}`, { ...init, headers });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.message || `GitHub API returned ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

function mapRun(run: any): GitHubWorkflowRunSummary {
  return {
    id: Number(run.id),
    name: String(run.name || run.display_title || "Workflow"),
    status: String(run.status || "unknown"),
    conclusion: run.conclusion ?? null,
    branch: String(run.head_branch || ""),
    event: String(run.event || ""),
    htmlUrl: String(run.html_url || ""),
    createdAt: String(run.created_at || ""),
    updatedAt: String(run.updated_at || ""),
  };
}

function mapIssue(issue: any): GitHubIssueSummary {
  return {
    number: Number(issue.number),
    title: String(issue.title || ""),
    state: String(issue.state || "open"),
    htmlUrl: String(issue.html_url || ""),
    createdAt: String(issue.created_at || ""),
    updatedAt: String(issue.updated_at || ""),
    labels: Array.isArray(issue.labels) ? issue.labels.map((label: any) => String(label.name || label)).filter(Boolean) : [],
    isPullRequest: Boolean(issue.pull_request),
  };
}

export async function getGitHubSummary(inputRepo?: string): Promise<GitHubConnectorSummary> {
  const repo = normalizeGitHubRepo(inputRepo);
  const encodedRepo = repo.split("/").map(encodeURIComponent).join("/");

  const [repository, runsResponse, issuesResponse, pullsResponse] = await Promise.all([
    githubFetch<any>(`/repos/${encodedRepo}`),
    githubFetch<any>(`/repos/${encodedRepo}/actions/runs?per_page=5`).catch(() => ({ workflow_runs: [] })),
    githubFetch<any[]>(`/repos/${encodedRepo}/issues?state=open&per_page=8`).catch(() => []),
    githubFetch<any[]>(`/repos/${encodedRepo}/pulls?state=open&per_page=8`).catch(() => []),
  ]);

  const openIssues = (Array.isArray(issuesResponse) ? issuesResponse : []).map(mapIssue).filter((item) => !item.isPullRequest);
  const openPullRequests = (Array.isArray(pullsResponse) ? pullsResponse : []).map(mapIssue);

  return {
    repo,
    tokenConfigured: Boolean(getGitHubToken()),
    repository: {
      fullName: String(repository.full_name || repo),
      private: Boolean(repository.private),
      defaultBranch: String(repository.default_branch || "main"),
      htmlUrl: String(repository.html_url || `https://github.com/${repo}`),
      description: repository.description ?? null,
      openIssuesCount: Number(repository.open_issues_count || 0),
      pushedAt: repository.pushed_at ?? null,
      updatedAt: repository.updated_at ?? null,
    },
    latestRuns: Array.isArray(runsResponse.workflow_runs) ? runsResponse.workflow_runs.map(mapRun) : [],
    openIssues,
    openPullRequests,
    actionsUrl: `https://github.com/${repo}/actions`,
    issuesUrl: `https://github.com/${repo}/issues`,
    pullsUrl: `https://github.com/${repo}/pulls`,
    lastCheckedAt: new Date().toISOString(),
  };
}

export async function createGitHubIssue(input: CreateGitHubIssueInput): Promise<GitHubIssueSummary> {
  const repo = normalizeGitHubRepo(input.repo);
  const encodedRepo = repo.split("/").map(encodeURIComponent).join("/");
  const payload = {
    title: input.title,
    body: input.body || "",
    labels: input.labels?.filter(Boolean),
  };
  const issue = await githubFetch<any>(
    `/repos/${encodedRepo}/issues`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    true,
  );
  return mapIssue(issue);
}
