import { callAI } from "./aiClient.ts";
import { appendIntegrationEvent } from "./integrationRegistry.ts";

const DEFAULT_REPO = "DVBCLUB/LedgerFlow-Studio";
const GITHUB_API = "https://api.github.com";
const MAX_LOG_CHARS_PER_JOB = 18000;

export interface GitHubCIRunSummary {
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

export interface GitHubCIJobSummary {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  htmlUrl: string;
  startedAt: string | null;
  completedAt: string | null;
  failedSteps: Array<{ name: string; number: number; conclusion: string | null }>;
  logExcerpt?: string;
}

export interface GitHubCIFailureContext {
  repo: string;
  tokenConfigured: boolean;
  selectedRun?: GitHubCIRunSummary;
  failedJobs: GitHubCIJobSummary[];
  latestRuns: GitHubCIRunSummary[];
  actionsUrl: string;
  lastCheckedAt: string;
}

export interface GitHubCIAnalysisResult {
  context: GitHubCIFailureContext;
  analysis: string;
  handoffPrompt: string;
  modelUsed?: string;
}

function getGitHubToken(): string | undefined {
  return process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
}

function repoFromInput(repo?: string): string {
  const normalized = (repo || DEFAULT_REPO).trim();
  return normalized.includes("github.com/")
    ? normalized.replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "").replace(/\/$/, "")
    : normalized;
}

async function githubRequest<T>(path: string): Promise<T> {
  const token = getGitHubToken();
  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "LedgerFlow-Studio-Integration-Hub",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status}: ${body.slice(0, 300)}`);
  }
  return JSON.parse(body) as T;
}

async function githubTextRequest(path: string): Promise<string> {
  const token = getGitHubToken();
  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "LedgerFlow-Studio-Integration-Hub",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    redirect: "follow",
  });
  if (!response.ok) {
    return `Cannot download logs. GitHub returned ${response.status}.`;
  }
  return await response.text();
}

function mapRun(run: any): GitHubCIRunSummary {
  return {
    id: run.id,
    name: run.name || run.display_title || "Workflow run",
    status: run.status,
    conclusion: run.conclusion,
    branch: run.head_branch || "main",
    event: run.event || "unknown",
    htmlUrl: run.html_url,
    createdAt: run.created_at,
    updatedAt: run.updated_at,
  };
}

function mapJob(job: any, logExcerpt?: string): GitHubCIJobSummary {
  const failedSteps = Array.isArray(job.steps)
    ? job.steps
        .filter((step: any) => step.conclusion && !["success", "skipped"].includes(step.conclusion))
        .map((step: any) => ({ name: step.name, number: step.number, conclusion: step.conclusion }))
    : [];
  return {
    id: job.id,
    name: job.name,
    status: job.status,
    conclusion: job.conclusion,
    htmlUrl: job.html_url,
    startedAt: job.started_at,
    completedAt: job.completed_at,
    failedSteps,
    logExcerpt,
  };
}

function chooseProblemRun(runs: GitHubCIRunSummary[]): GitHubCIRunSummary | undefined {
  return runs.find((run) => run.conclusion && run.conclusion !== "success") || runs.find((run) => run.status !== "completed") || runs[0];
}

export async function getGitHubCIFailureContext(inputRepo?: string, runId?: number): Promise<GitHubCIFailureContext> {
  const repo = repoFromInput(inputRepo);
  const runsData = await githubRequest<{ workflow_runs: any[] }>(`/repos/${repo}/actions/runs?per_page=12`);
  const latestRuns = (runsData.workflow_runs || []).map(mapRun);
  const selectedRun = runId ? latestRuns.find((run) => run.id === runId) || { ...(await githubRequest<any>(`/repos/${repo}/actions/runs/${runId}`)), id: runId } : chooseProblemRun(latestRuns);

  if (!selectedRun) {
    return {
      repo,
      tokenConfigured: !!getGitHubToken(),
      failedJobs: [],
      latestRuns,
      actionsUrl: `https://github.com/${repo}/actions`,
      lastCheckedAt: new Date().toISOString(),
    };
  }

  const jobsData = await githubRequest<{ jobs: any[] }>(`/repos/${repo}/actions/runs/${selectedRun.id}/jobs?per_page=50`);
  const problemJobs = (jobsData.jobs || []).filter((job) => job.conclusion && !["success", "skipped"].includes(job.conclusion));
  const jobsToInspect = problemJobs.length > 0 ? problemJobs : (jobsData.jobs || []).slice(0, 3);

  const failedJobs: GitHubCIJobSummary[] = [];
  for (const job of jobsToInspect.slice(0, 5)) {
    const logText = await githubTextRequest(`/repos/${repo}/actions/jobs/${job.id}/logs`);
    failedJobs.push(mapJob(job, logText.slice(-MAX_LOG_CHARS_PER_JOB)));
  }

  await appendIntegrationEvent({
    connectorId: "github",
    type: "test",
    level: selectedRun.conclusion === "success" ? "success" : "warning",
    message: `CI Doctor loaded run ${selectedRun.name} (${selectedRun.conclusion || selectedRun.status}).`,
  }).catch(() => undefined);

  return {
    repo,
    tokenConfigured: !!getGitHubToken(),
    selectedRun,
    failedJobs,
    latestRuns,
    actionsUrl: `https://github.com/${repo}/actions/runs/${selectedRun.id}`,
    lastCheckedAt: new Date().toISOString(),
  };
}

function buildAnalysisPrompt(context: GitHubCIFailureContext): string {
  const run = context.selectedRun;
  const jobBlocks = context.failedJobs
    .map((job) => `## Job: ${job.name}\nConclusion: ${job.conclusion}\nFailed steps: ${job.failedSteps.map((s) => `${s.number}. ${s.name} (${s.conclusion})`).join(", ") || "n/a"}\n\nLOG EXCERPT:\n${job.logExcerpt || "No logs."}`)
    .join("\n\n---\n\n");

  return `Bạn là Senior TypeScript/React/Node CI Doctor cho repo LedgerFlow Studio.

Hãy phân tích lỗi GitHub Actions dưới đây và trả lời bằng tiếng Việt, cấu trúc rõ:
1. Kết luận nhanh
2. Nguyên nhân gốc khả dĩ
3. File/khu vực cần sửa
4. Các bước sửa cụ thể
5. Prompt ngắn để đưa cho VS Code/Cursor
6. Checklist sau sửa

Repo: ${context.repo}
Run: ${run?.name || "unknown"}
Status/conclusion: ${run?.status}/${run?.conclusion}
URL: ${context.actionsUrl}

${jobBlocks}`;
}

export async function analyzeGitHubCIFailure(inputRepo?: string, runId?: number): Promise<GitHubCIAnalysisResult> {
  const context = await getGitHubCIFailureContext(inputRepo, runId);
  const prompt = buildAnalysisPrompt(context);
  const result = await callAI(
    [
      { role: "system", content: "Bạn phân tích CI log chính xác, không bịa file nếu log không có, ưu tiên hướng sửa an toàn." },
      { role: "user", content: prompt },
    ],
    { model: "ai-assistant-pro", temperature: 0.2, maxTokens: 2200 },
  );

  const handoffPrompt = `Hãy sửa lỗi CI trong repo ${context.repo}.\n\nKhông refactor ngoài phạm vi lỗi. Sau khi sửa phải chạy npm run lint và npm run build.\n\nPhân tích CI:\n${result.content}`;

  await appendIntegrationEvent({
    connectorId: "github",
    type: "handoff",
    level: "success",
    message: `AI analyzed CI run ${context.selectedRun?.id || "latest"} with ${result.modelUsed || "AI Gateway"}.`,
  }).catch(() => undefined);

  return { context, analysis: result.content, handoffPrompt, modelUsed: result.modelUsed };
}
