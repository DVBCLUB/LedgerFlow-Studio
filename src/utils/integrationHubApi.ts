export type IntegrationStatus = 'connected' | 'local' | 'manual' | 'planned' | 'error';
export type IntegrationCategory = 'ai' | 'devops' | 'workspace' | 'accounting' | 'documents' | 'automation' | 'data';
export type IntegrationPriority = 'P0' | 'P1' | 'P2' | 'P3';

export interface IntegrationConnector {
  id: string;
  title: string;
  subtitle: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  priority: IntegrationPriority;
  enabled: boolean;
  url?: string;
  localCommand?: string;
  notes: string;
  capabilities: string[];
  quickActions: Array<{ label: string; href?: string; hash?: string }>;
  lastCheckedAt?: string;
  lastMessage?: string;
}

export interface IntegrationEvent {
  id: string;
  connectorId: string;
  type: 'status' | 'test' | 'config' | 'handoff' | 'note';
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  createdAt: string;
}

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

export interface GitHubConnectorSummary {
  repo: string;
  tokenConfigured: boolean;
  repository?: {
    fullName: string;
    private: boolean;
    defaultBranch: string;
    htmlUrl: string;
    description: string | null;
    openIssuesCount: number;
    pushedAt: string | null;
    updatedAt: string | null;
  };
  latestRuns: GitHubWorkflowRunSummary[];
  openIssues: GitHubIssueSummary[];
  openPullRequests: GitHubIssueSummary[];
  actionsUrl: string;
  issuesUrl: string;
  pullsUrl: string;
  lastCheckedAt: string;
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
}

export interface GitHubCIFailureContext {
  repo: string;
  selectedRun?: GitHubWorkflowRunSummary;
  latestRuns: GitHubWorkflowRunSummary[];
  failedJobs: GitHubCIJobSummary[];
  actionsUrl: string;
  lastCheckedAt: string;
}

async function readJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.success === false) {
    throw new Error(data?.error || `Request failed with status ${response.status}`);
  }
  return data as T;
}

function normalizeRepo(repo?: string): string {
  const value = (repo || 'DVBCLUB/LedgerFlow-Studio').trim();
  return value.includes('github.com/')
    ? value.replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '').replace(/\/$/, '')
    : value;
}

function mapWorkflowRun(run: Record<string, any>): GitHubWorkflowRunSummary {
  return {
    id: Number(run.id),
    name: String(run.name || run.display_title || 'Workflow run'),
    status: String(run.status || 'unknown'),
    conclusion: run.conclusion ? String(run.conclusion) : null,
    branch: String(run.head_branch || 'main'),
    event: String(run.event || 'unknown'),
    htmlUrl: String(run.html_url || ''),
    createdAt: String(run.created_at || ''),
    updatedAt: String(run.updated_at || ''),
  };
}

function mapJob(job: Record<string, any>): GitHubCIJobSummary {
  const failedSteps = Array.isArray(job.steps)
    ? job.steps
        .filter((step: Record<string, any>) => step.conclusion && !['success', 'skipped'].includes(String(step.conclusion)))
        .map((step: Record<string, any>) => ({ name: String(step.name || 'Step'), number: Number(step.number || 0), conclusion: step.conclusion ? String(step.conclusion) : null }))
    : [];
  return {
    id: Number(job.id),
    name: String(job.name || 'Job'),
    status: String(job.status || 'unknown'),
    conclusion: job.conclusion ? String(job.conclusion) : null,
    htmlUrl: String(job.html_url || ''),
    startedAt: job.started_at ? String(job.started_at) : null,
    completedAt: job.completed_at ? String(job.completed_at) : null,
    failedSteps,
  };
}

export async function fetchIntegrations(): Promise<{ connectors: IntegrationConnector[]; events: IntegrationEvent[] }> {
  const data = await readJson<{ success: true; connectors: IntegrationConnector[]; events: IntegrationEvent[] }>(await fetch('/api/integrations'));
  return { connectors: data.connectors, events: data.events };
}

export async function updateIntegrationConnector(
  id: string,
  patch: Partial<Pick<IntegrationConnector, 'enabled' | 'status' | 'priority' | 'url' | 'localCommand' | 'notes'>>,
): Promise<IntegrationConnector> {
  const data = await readJson<{ success: true; connector: IntegrationConnector }>(
    await fetch(`/api/integrations/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }),
  );
  return data.connector;
}

export async function testIntegrationConnector(id: string): Promise<{ connector: IntegrationConnector; events: IntegrationEvent[] }> {
  const data = await readJson<{ success: true; connector: IntegrationConnector; events: IntegrationEvent[] }>(
    await fetch(`/api/integrations/${encodeURIComponent(id)}/test`, { method: 'POST' }),
  );
  return { connector: data.connector, events: data.events };
}

export async function appendIntegrationEvent(
  id: string,
  input: { type?: IntegrationEvent['type']; level?: IntegrationEvent['level']; message: string },
): Promise<IntegrationEvent> {
  const data = await readJson<{ success: true; event: IntegrationEvent }>(
    await fetch(`/api/integrations/${encodeURIComponent(id)}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  );
  return data.event;
}

export async function fetchIntegrationEvents(limit = 100): Promise<IntegrationEvent[]> {
  const data = await readJson<{ success: true; events: IntegrationEvent[] }>(await fetch(`/api/integrations/events?limit=${limit}`));
  return data.events;
}

export async function clearIntegrationEvents(): Promise<void> {
  await readJson<{ success: true }>(await fetch('/api/integrations/events', { method: 'DELETE' }));
}

export async function fetchGitHubConnectorSummary(repo?: string): Promise<GitHubConnectorSummary> {
  const query = repo ? `?repo=${encodeURIComponent(repo)}` : '';
  const data = await readJson<{ success: true; summary: GitHubConnectorSummary }>(await fetch(`/api/integrations/github/summary${query}`));
  return data.summary;
}

export async function createGitHubConnectorIssue(input: {
  repo?: string;
  title: string;
  body?: string;
  labels?: string[];
}): Promise<GitHubIssueSummary> {
  const data = await readJson<{ success: true; issue: GitHubIssueSummary }>(
    await fetch('/api/integrations/github/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  );
  return data.issue;
}

export async function fetchGitHubCIFailureContext(repo?: string): Promise<GitHubCIFailureContext> {
  const normalizedRepo = normalizeRepo(repo);
  const runsResponse = await fetch(`https://api.github.com/repos/${normalizedRepo}/actions/runs?per_page=12`, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!runsResponse.ok) throw new Error(`Không đọc được GitHub Actions: ${runsResponse.status}`);
  const runsData = (await runsResponse.json()) as { workflow_runs?: Array<Record<string, any>> };
  const latestRuns = (runsData.workflow_runs || []).map(mapWorkflowRun);
  const selectedRun = latestRuns.find((run) => run.conclusion && run.conclusion !== 'success') || latestRuns.find((run) => run.status !== 'completed') || latestRuns[0];

  if (!selectedRun) {
    return { repo: normalizedRepo, latestRuns: [], failedJobs: [], actionsUrl: `https://github.com/${normalizedRepo}/actions`, lastCheckedAt: new Date().toISOString() };
  }

  const jobsResponse = await fetch(`https://api.github.com/repos/${normalizedRepo}/actions/runs/${selectedRun.id}/jobs?per_page=50`, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!jobsResponse.ok) throw new Error(`Không đọc được job của GitHub Actions: ${jobsResponse.status}`);
  const jobsData = (await jobsResponse.json()) as { jobs?: Array<Record<string, any>> };
  const mappedJobs = (jobsData.jobs || []).map(mapJob);
  const failedJobs = mappedJobs.filter((job) => job.conclusion && !['success', 'skipped'].includes(job.conclusion));

  return {
    repo: normalizedRepo,
    selectedRun,
    latestRuns,
    failedJobs: failedJobs.length > 0 ? failedJobs : mappedJobs.slice(0, 4),
    actionsUrl: `https://github.com/${normalizedRepo}/actions/runs/${selectedRun.id}`,
    lastCheckedAt: new Date().toISOString(),
  };
}

export async function analyzeGitHubCIFailureWithAI(context: GitHubCIFailureContext): Promise<{ analysis: string; modelUsed?: string; handoffPrompt: string }> {
  const jobText = context.failedJobs
    .map((job) => `Job: ${job.name}\nConclusion: ${job.conclusion}\nFailed steps: ${job.failedSteps.map((step) => `${step.number}. ${step.name} (${step.conclusion})`).join(', ') || 'n/a'}\nURL: ${job.htmlUrl}`)
    .join('\n\n---\n\n');

  const prompt = `Bạn là Senior CI Doctor cho repo React/TypeScript/Vite/Express/Electron.

Phân tích lỗi GitHub Actions này bằng tiếng Việt, gồm:
1. Kết luận nhanh
2. Nguyên nhân khả dĩ
3. File/khu vực cần kiểm tra
4. Cách sửa an toàn
5. Prompt ngắn đưa cho VS Code/Cursor
6. Checklist sau sửa

Repo: ${context.repo}
Run: ${context.selectedRun?.name || 'unknown'}
Status/conclusion: ${context.selectedRun?.status}/${context.selectedRun?.conclusion}
URL: ${context.actionsUrl}

Jobs/steps:\n${jobText || 'Không có job lỗi cụ thể.'}`;

  const data = await readJson<{ success: true; text: string; modelUsed?: string }>(
    await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, model: 'ai-assistant-pro' }),
    }),
  );

  const handoffPrompt = `Hãy sửa lỗi CI trong repo ${context.repo}. Không refactor ngoài phạm vi lỗi. Sau khi sửa chạy npm run lint và npm run build.\n\n${data.text}`;
  await appendIntegrationEvent('github', { type: 'handoff', level: 'success', message: `AI analyzed CI run ${context.selectedRun?.id || 'latest'}.` }).catch(() => undefined);
  return { analysis: data.text, modelUsed: data.modelUsed, handoffPrompt };
}
