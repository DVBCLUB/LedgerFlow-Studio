const DEFAULT_REPO = process.env.GITHUB_REPOSITORY || "DVBCLUB/LedgerFlow-Studio";
const GITHUB_API_BASE = "https://api.github.com";

export interface GitHubWorkflowArtifactSummary {
  id: number;
  name: string;
  sizeInBytes: number;
  expired: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  archiveDownloadUrl: string;
}

export interface GitHubWorkflowRunArtifactsResult {
  repo: string;
  runId: number;
  artifacts: GitHubWorkflowArtifactSummary[];
  totalCount: number;
  hasArtifacts: boolean;
  lastCheckedAt: string;
}

function getGitHubToken(): string | undefined {
  return process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
}

function normalizeGitHubRepo(input?: string): string {
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

function encodeRepo(repo: string): string {
  return repo.split("/").map(encodeURIComponent).join("/");
}

async function githubFetch<T>(path: string): Promise<T> {
  const token = getGitHubToken();
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "LedgerFlow-Studio-Artifact-Reader",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${GITHUB_API_BASE}${path}`, { headers });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = data?.message || `GitHub API returned ${response.status}`;
    throw new Error(message);
  }
  return data as T;
}

function mapArtifact(artifact: any): GitHubWorkflowArtifactSummary {
  return {
    id: Number(artifact.id),
    name: String(artifact.name || "Artifact"),
    sizeInBytes: Number(artifact.size_in_bytes || 0),
    expired: Boolean(artifact.expired),
    createdAt: String(artifact.created_at || ""),
    updatedAt: String(artifact.updated_at || ""),
    expiresAt: artifact.expires_at ?? null,
    archiveDownloadUrl: String(artifact.archive_download_url || ""),
  };
}

export async function getGitHubWorkflowRunArtifacts(inputRepo: string | undefined, runId: number): Promise<GitHubWorkflowRunArtifactsResult> {
  if (!Number.isFinite(runId) || runId <= 0) throw new Error("Workflow run id không hợp lệ.");
  const repo = normalizeGitHubRepo(inputRepo);
  const encodedRepo = encodeRepo(repo);
  const response = await githubFetch<any>(`/repos/${encodedRepo}/actions/runs/${encodeURIComponent(String(runId))}/artifacts?per_page=50`);
  const artifacts = Array.isArray(response.artifacts) ? response.artifacts.map(mapArtifact) : [];
  return {
    repo,
    runId,
    artifacts,
    totalCount: Number(response.total_count || artifacts.length),
    hasArtifacts: artifacts.length > 0,
    lastCheckedAt: new Date().toISOString(),
  };
}
