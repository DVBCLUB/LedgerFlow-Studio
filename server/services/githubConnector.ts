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

export interface GitHubWorkflowStepSummary {
  name: string;
  status: string;
  conclusion: string | null;
  number: number;
  startedAt: string | null;
  completedAt: string | null;
}

export interface GitHubWorkflowJobSummary {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  htmlUrl: string;
  startedAt: string | null;
  completedAt: string | null;
  failedSteps: GitHubWorkflowStepSummary[];
  steps: GitHubWorkflowStepSummary[];
}

export interface GitHubWorkflowRunJobsResult {
  repo: string;
  runId: number;
  jobs: GitHubWorkflowJobSummary[];
  failedJobs: GitHubWorkflowJobSummary[];
  hasFailures: boolean;
  lastCheckedAt: string;
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

export interface GitHubPullRequestSummary {
  number: number;
  title: string;
  state: string;
  htmlUrl: string;
  branch: string;
  base: string;
  draft: boolean;
}

export interface GitHubPullRequestFileSummary {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patchPreview: string | null;
}

export interface GitHubPullRequestDigest {
  repo: string;
  pullRequest: GitHubPullRequestSummary & {
    mergeable: boolean | null;
    mergeableState: string | null;
    changedFiles: number;
    additions: number;
    deletions: number;
    commits: number;
    headSha: string;
  };
  files: GitHubPullRequestFileSummary[];
  safety: {
    touchesBlockedPath: boolean;
    largeChange: boolean;
    hasDeletes: boolean;
    reviewNotes: string[];
  };
  lastCheckedAt: string;
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

export interface ApprovedChangeFile {
  path: string;
  content: string;
}

export interface ApprovedChangeRequestInput {
  repo?: string;
  title: string;
  summary: string;
  files: ApprovedChangeFile[];
  approvalPhrase: string;
  baseBranch?: string;
  branchName?: string;
  draft?: boolean;
}

export interface ApprovedChangeRequestResult {
  repo: string;
  branch: string;
  base: string;
  commitMessages: string[];
  pullRequest: GitHubPullRequestSummary;
}

export interface CloseGitHubPullRequestInput {
  repo?: string;
  pullNumber: number;
  reason: string;
  rollbackNote: string;
  approvalPhrase: string;
}

export interface CloseGitHubPullRequestResult {
  repo: string;
  pullRequest: GitHubPullRequestSummary;
  closedAt: string;
  reason: string;
  rollbackNote: string;
}

const DEFAULT_REPO = process.env.GITHUB_REPOSITORY || "DVBCLUB/LedgerFlow-Studio";
const GITHUB_API_BASE = "https://api.github.com";
const APPROVAL_PHRASE = "APPROVE AI GITHUB PUSH";
const CLOSE_APPROVAL_PHRASE = "APPROVE AI GITHUB CLOSE";
const MAX_FILES_PER_REQUEST = 10;
const MAX_FILE_CHARS = 250_000;
const BLOCKED_PATH_PATTERNS = [
  /^\.env(\.|$)?/i,
  /^\.ledgerflow_secret$/i,
  /^ai_keys\.vault\.json$/i,
  /^ai_usage\.log\.json$/i,
  /^integration_events\.log\.json$/i,
  /^integration_registry\.json$/i,
  /^\.ai_vault_session\.json$/i,
  /(^|\/)\.git(\/|$)/i,
  /(^|\/)node_modules(\/|$)/i,
  /(^|\/)dist(\/|$)/i,
  /(^|\/)release(\/|$)/i,
  /(^|\/)\.DS_Store$/i,
  /(^|\/)(id_rsa|id_ed25519|.*\.pem|.*\.p12|.*\.key)$/i,
];
const SENSITIVE_ASSIGNMENT_NAMES = ["token", "secret", "password", "passphrase", "credential", "private_key", "client_secret"];

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

function mapWorkflowStep(step: any): GitHubWorkflowStepSummary {
  return {
    name: String(step.name || "Step"),
    status: String(step.status || "unknown"),
    conclusion: step.conclusion ?? null,
    number: Number(step.number || 0),
    startedAt: step.started_at ?? null,
    completedAt: step.completed_at ?? null,
  };
}

function mapWorkflowJob(job: any): GitHubWorkflowJobSummary {
  const steps = Array.isArray(job.steps) ? job.steps.map(mapWorkflowStep) : [];
  return {
    id: Number(job.id),
    name: String(job.name || "Job"),
    status: String(job.status || "unknown"),
    conclusion: job.conclusion ?? null,
    htmlUrl: String(job.html_url || ""),
    startedAt: job.started_at ?? null,
    completedAt: job.completed_at ?? null,
    failedSteps: steps.filter((step: any) => step.conclusion === "failure" || step.conclusion === "cancelled"),
    steps,
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

function mapPullRequest(pr: any): GitHubPullRequestSummary {
  return {
    number: Number(pr.number),
    title: String(pr.title || ""),
    state: String(pr.state || "open"),
    htmlUrl: String(pr.html_url || ""),
    branch: String(pr.head?.ref || ""),
    base: String(pr.base?.ref || ""),
    draft: Boolean(pr.draft),
  };
}

function mapPrFile(file: any): GitHubPullRequestFileSummary {
  const patch = typeof file.patch === "string" ? file.patch : null;
  return {
    filename: String(file.filename || ""),
    status: String(file.status || "modified"),
    additions: Number(file.additions || 0),
    deletions: Number(file.deletions || 0),
    changes: Number(file.changes || 0),
    patchPreview: patch ? patch.slice(0, 4000) : null,
  };
}

function encodeRepo(repo: string): string {
  return repo.split("/").map(encodeURIComponent).join("/");
}

function sanitizeBranchName(input?: string): string {
  const suffix = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const raw = (input || `ai/approved-change-${suffix}`).trim().toLowerCase();
  const safe = raw
    .replace(/^refs\/heads\//, "")
    .replace(/[^a-z0-9/_-]+/g, "-")
    .replace(/\.{2,}/g, "-")
    .replace(/^\/+|\/+$/g, "")
    .slice(0, 90);
  if (!safe || ["main", "master", "develop", "production"].includes(safe)) return `ai/approved-change-${suffix}`;
  if (!safe.startsWith("ai/")) return `ai/${safe}`;
  return safe;
}

function looksLikeLongCredentialValue(value: string): boolean {
  const trimmed = value.trim().replace(/^[']|['"];?$/g, "");
  if (trimmed.length < 24) return false;
  if (/\s/.test(trimmed)) return false;
  const unique = new Set(trimmed.split("")).size;
  const hasMixed = /[a-z]/.test(trimmed) && /[A-Z]/.test(trimmed) && /\d/.test(trimmed);
  return unique >= 12 && hasMixed;
}

function assertNoHighRiskContent(file: ApprovedChangeFile): void {
  const lower = file.content.toLowerCase();
  if (lower.includes("-----begin ") && lower.includes("private") && lower.includes("-----end ")) {
    throw new Error(`Nội dung file có vật liệu khóa riêng tư, backend chặn push: ${file.path}`);
  }

  const lines = file.content.split(/\r?\n/).slice(0, 5000);
  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z0-9_.-]{3,60})\s*[:=]\s*(.+?)\s*$/);
    if (!match) continue;
    const name = match[1].toLowerCase();
    const value = match[2];
    if (SENSITIVE_ASSIGNMENT_NAMES.some((word) => name.includes(word)) && looksLikeLongCredentialValue(value)) {
      throw new Error(`Nội dung file có giá trị nhạy cảm dạng cấu hình, backend chặn push: ${file.path}`);
    }
  }
}

function validateChangeRequest(input: ApprovedChangeRequestInput): void {
  if (input.approvalPhrase !== APPROVAL_PHRASE) {
    throw new Error(`Founder approval phrase không đúng. Gõ chính xác: ${APPROVAL_PHRASE}`);
  }
  if (!input.title.trim() || !input.summary.trim()) throw new Error("Thiếu title hoặc summary cho change request.");
  if (!Array.isArray(input.files) || input.files.length === 0) throw new Error("Change request phải có ít nhất 1 file.");
  if (input.files.length > MAX_FILES_PER_REQUEST) throw new Error(`Mỗi lần AI push tối đa ${MAX_FILES_PER_REQUEST} file để dễ review.`);

  for (const file of input.files) {
    const normalized = file.path.replace(/\\/g, "/").replace(/^\/+/, "");
    if (normalized !== file.path) file.path = normalized;
    if (!normalized || normalized.includes("..")) throw new Error(`Đường dẫn file không hợp lệ: ${file.path}`);
    if (BLOCKED_PATH_PATTERNS.some((pattern) => pattern.test(normalized))) throw new Error(`File bị chặn vì rủi ro bảo mật: ${normalized}`);
    if (file.content.length > MAX_FILE_CHARS) throw new Error(`File quá lớn để AI tự push an toàn: ${normalized}`);
    assertNoHighRiskContent(file);
  }
}

function validateCloseRequest(input: CloseGitHubPullRequestInput): void {
  if (input.approvalPhrase !== CLOSE_APPROVAL_PHRASE) {
    throw new Error(`Founder close phrase không đúng. Gõ chính xác: ${CLOSE_APPROVAL_PHRASE}`);
  }
  if (!Number.isFinite(input.pullNumber) || input.pullNumber <= 0) throw new Error("Pull request number không hợp lệ.");
  if (input.reason.trim().length < 10) throw new Error("Reason đóng PR phải đủ rõ để audit.");
  if (input.rollbackNote.trim().length < 10) throw new Error("Rollback note phải đủ rõ để review.");
}

async function getDefaultBranchHeadSha(encodedRepo: string, branch: string): Promise<string> {
  const ref = await githubFetch<any>(`/repos/${encodedRepo}/git/ref/heads/${encodeURIComponent(branch)}`, {}, true);
  const sha = String(ref.object?.sha || "");
  if (!sha) throw new Error(`Không đọc được HEAD của branch ${branch}.`);
  return sha;
}

async function createBranch(encodedRepo: string, branch: string, sha: string): Promise<void> {
  await githubFetch<any>(
    `/repos/${encodedRepo}/git/refs`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha }),
    },
    true,
  );
}

async function getExistingFileSha(encodedRepo: string, filePath: string, branch: string): Promise<string | undefined> {
  const query = new URLSearchParams({ ref: branch }).toString();
  try {
    const existing = await githubFetch<any>(`/repos/${encodedRepo}/contents/${filePath.split("/").map(encodeURIComponent).join("/")}?${query}`, {}, true);
    return typeof existing.sha === "string" ? existing.sha : undefined;
  } catch (err: any) {
    if (String(err?.message || "").toLowerCase().includes("not found")) return undefined;
    throw err;
  }
}

export async function getGitHubSummary(inputRepo?: string): Promise<GitHubConnectorSummary> {
  const repo = normalizeGitHubRepo(inputRepo);
  const encodedRepo = encodeRepo(repo);

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

export async function getGitHubWorkflowRunJobs(inputRepo: string | undefined, runId: number): Promise<GitHubWorkflowRunJobsResult> {
  if (!Number.isFinite(runId) || runId <= 0) throw new Error("Workflow run id không hợp lệ.");
  const repo = normalizeGitHubRepo(inputRepo);
  const encodedRepo = encodeRepo(repo);
  const jobsResponse = await githubFetch<any>(`/repos/${encodedRepo}/actions/runs/${encodeURIComponent(String(runId))}/jobs?per_page=50`, {}, true).catch(async (err: any) => {
    if (String(err?.message || "").toLowerCase().includes("requires authentication")) throw err;
    return { jobs: [] };
  });
  const jobs = Array.isArray(jobsResponse.jobs) ? jobsResponse.jobs.map(mapWorkflowJob) : [];
  const failedJobs = jobs.filter((job: any) => job.conclusion === "failure" || job.failedSteps.length > 0);
  return {
    repo,
    runId,
    jobs,
    failedJobs,
    hasFailures: failedJobs.length > 0,
    lastCheckedAt: new Date().toISOString(),
  };
}

export async function getGitHubPullRequestDigest(inputRepo: string | undefined, pullNumber: number): Promise<GitHubPullRequestDigest> {
  if (!Number.isFinite(pullNumber) || pullNumber <= 0) throw new Error("Pull request number không hợp lệ.");
  const repo = normalizeGitHubRepo(inputRepo);
  const encodedRepo = encodeRepo(repo);
  const [pr, filesResponse] = await Promise.all([
    githubFetch<any>(`/repos/${encodedRepo}/pulls/${encodeURIComponent(String(pullNumber))}`, {}, true),
    githubFetch<any[]>(`/repos/${encodedRepo}/pulls/${encodeURIComponent(String(pullNumber))}/files?per_page=100`, {}, true).catch(() => []),
  ]);
  const files = (Array.isArray(filesResponse) ? filesResponse : []).map(mapPrFile);
  const touchesBlockedPath = files.some((file) => BLOCKED_PATH_PATTERNS.some((pattern) => pattern.test(file.filename)));
  const largeChange = files.reduce((sum, file) => sum + file.changes, 0) > 800 || files.length > 12;
  const hasDeletes = files.some((file) => file.status === "removed" || file.deletions > file.additions * 3);
  const reviewNotes = [
    touchesBlockedPath ? "PR chạm path bị chặn/rủi ro, cần kiểm tra kỹ trước merge." : "Không thấy path bị chặn trong danh sách file.",
    largeChange ? "PR có thay đổi lớn, nên chia nhỏ hoặc review kỹ." : "Quy mô thay đổi nằm trong ngưỡng dễ review.",
    hasDeletes ? "PR có xóa nhiều dòng/file, cần kiểm tra rollback plan." : "Không thấy dấu hiệu xóa lớn.",
    pr.draft ? "PR đang là Draft, phù hợp Fast Secure." : "PR không còn Draft, cần đảm bảo đã review xong.",
  ];
  return {
    repo,
    pullRequest: {
      ...mapPullRequest(pr),
      mergeable: pr.mergeable ?? null,
      mergeableState: pr.mergeable_state ?? null,
      changedFiles: Number(pr.changed_files || files.length),
      additions: Number(pr.additions || 0),
      deletions: Number(pr.deletions || 0),
      commits: Number(pr.commits || 0),
      headSha: String(pr.head?.sha || ""),
    },
    files,
    safety: { touchesBlockedPath, largeChange, hasDeletes, reviewNotes },
    lastCheckedAt: new Date().toISOString(),
  };
}

export async function createGitHubIssue(input: CreateGitHubIssueInput): Promise<GitHubIssueSummary> {
  const repo = normalizeGitHubRepo(input.repo);
  const encodedRepo = encodeRepo(repo);
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

export async function createApprovedGitHubChangeRequest(input: ApprovedChangeRequestInput): Promise<ApprovedChangeRequestResult> {
  validateChangeRequest(input);

  const repo = normalizeGitHubRepo(input.repo);
  const encodedRepo = encodeRepo(repo);
  const summary = await getGitHubSummary(repo);
  const base = input.baseBranch?.trim() || summary.repository?.defaultBranch || "main";
  if (["ai", "refs/heads/main"].includes(base) || base.startsWith("ai/")) throw new Error("Base branch không hợp lệ cho auto-push.");

  const branch = sanitizeBranchName(input.branchName);
  const baseSha = await getDefaultBranchHeadSha(encodedRepo, base);
  await createBranch(encodedRepo, branch, baseSha);

  const commitMessages: string[] = [];
  for (const file of input.files) {
    const sha = await getExistingFileSha(encodedRepo, file.path, branch);
    const message = `AI approved change: ${file.path}`;
    await githubFetch<any>(
      `/repos/${encodedRepo}/contents/${file.path.split("/").map(encodeURIComponent).join("/")}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          content: Buffer.from(file.content, "utf-8").toString("base64"),
          branch,
          sha,
        }),
      },
      true,
    );
    commitMessages.push(message);
  }

  const pr = await githubFetch<any>(
    `/repos/${encodedRepo}/pulls`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: input.title,
        head: branch,
        base,
        draft: input.draft ?? true,
        body: [
          "## AI approved change request",
          "",
          input.summary,
          "",
          "## Safety gates",
          "- Founder approval phrase was required before push.",
          "- Changes were pushed to an `ai/*` branch, not directly to main.",
          "- Secret/runtime paths are blocked by backend validation.",
          "- CI must pass before merge.",
          "",
          "## Files",
          ...input.files.map((file) => `- \`${file.path}\``),
        ].join("\n"),
      }),
    },
    true,
  );

  return { repo, branch, base, commitMessages, pullRequest: mapPullRequest(pr) };
}

export async function requestCloseGitHubPullRequest(input: CloseGitHubPullRequestInput): Promise<CloseGitHubPullRequestResult> {
  validateCloseRequest(input);
  const repo = normalizeGitHubRepo(input.repo);
  const encodedRepo = encodeRepo(repo);
  const pullNumber = encodeURIComponent(String(input.pullNumber));

  const existing = await githubFetch<any>(`/repos/${encodedRepo}/pulls/${pullNumber}`, {}, true);
  const current = mapPullRequest(existing);
  if (current.state === "closed") {
    return {
      repo,
      pullRequest: current,
      closedAt: new Date().toISOString(),
      reason: input.reason,
      rollbackNote: input.rollbackNote,
    };
  }

  await githubFetch<any>(
    `/repos/${encodedRepo}/issues/${pullNumber}/comments`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body: [
          "## Founder-approved PR close request",
          "",
          `Reason: ${input.reason}`,
          "",
          `Rollback note: ${input.rollbackNote}`,
          "",
          "Branch deletion is intentionally not automated by LedgerFlow Studio.",
        ].join("\n"),
      }),
    },
    true,
  );

  const closed = await githubFetch<any>(
    `/repos/${encodedRepo}/pulls/${pullNumber}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: "closed" }),
    },
    true,
  );

  return {
    repo,
    pullRequest: mapPullRequest(closed),
    closedAt: new Date().toISOString(),
    reason: input.reason,
    rollbackNote: input.rollbackNote,
  };
}

import { execFile } from "child_process";
import { promisify } from "util";
const execFileAsync = promisify(execFile);

export interface GitLocalStatus {
  branch: string;
  uncommittedFiles: number;
  uncommittedDetails: string[];
  ahead: number;
  behind: number;
}

export async function getGitLocalStatus(): Promise<GitLocalStatus> {
  try {
    const cwd = process.cwd();
    const branchRes = await execFileAsync("git", ["branch", "--show-current"], { cwd, timeout: 3000 });
    const branch = branchRes.stdout.trim() || "unknown";

    const statusRes = await execFileAsync("git", ["status", "-s"], { cwd, timeout: 3000 });
    const lines = statusRes.stdout.split("\n").map(l => l.trim()).filter(Boolean);
    const uncommittedFiles = lines.length;

    let ahead = 0;
    let behind = 0;
    try {
      const revRes = await execFileAsync("git", ["rev-list", "--count", "--left-right", "@{u}...HEAD"], { cwd, timeout: 3000 });
      const [bStr, aStr] = revRes.stdout.trim().split(/\s+/);
      behind = parseInt(bStr, 10) || 0;
      ahead = parseInt(aStr, 10) || 0;
    } catch {}

    return {
      branch,
      uncommittedFiles,
      uncommittedDetails: lines,
      ahead,
      behind,
    };
  } catch (err: any) {
    return {
      branch: "unknown",
      uncommittedFiles: 0,
      uncommittedDetails: [],
      ahead: 0,
      behind: 0,
    };
  }
}

export async function gitPullLocal(): Promise<{ success: boolean; log: string }> {
  try {
    const cwd = process.cwd();
    const res = await execFileAsync("git", ["pull", "--rebase"], { cwd, timeout: 20000 });
    return { success: true, log: res.stdout || res.stderr || "Đã kéo code mới nhất thành công." };
  } catch (err: any) {
    return { success: false, log: err.stdout || err.stderr || err.message || "Lỗi khi chạy git pull." };
  }
}

export async function gitPushLocal(): Promise<{ success: boolean; log: string }> {
  try {
    const cwd = process.cwd();
    const status = await getGitLocalStatus();
    const res = await execFileAsync("git", ["push", "origin", `HEAD:${status.branch}`], { cwd, timeout: 25000 });
    return { success: true, log: res.stdout || res.stderr || "Đã đẩy code lên remote repo thành công." };
  } catch (err: any) {
    return { success: false, log: err.stdout || err.stderr || err.message || "Lỗi khi chạy git push." };
  }
}
