/**
 * src/utils/glaciaKnowledgeApi.ts
 * Frontend Client SDK cho Glacia Dynamic Ingestion, Distillation & Native MCP Server.
 */

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`Glacia Knowledge API error: HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export interface TrustedSource {
  id: string;
  domain: string;
  name: string;
  domainCategory: string;
  trustScore: number;
  isOfficial: boolean;
  notes?: string;
}

export interface DocIngestionTarget {
  id: string;
  name: string;
  url: string;
  category: string;
  frequency: string;
  maxPages: number;
  lastCrawledAt?: string;
  totalChunksIngested?: number;
  status: 'idle' | 'running' | 'completed' | 'failed';
  enabled: boolean;
}

export interface DistilledLesson {
  id: string;
  summary: string;
  query: string;
  solution: string;
  codeSnippet?: string;
  sourceUrl?: string;
  tags: string[];
  ttlDays: number;
  createdAt: string;
  expiresAt: string;
  useCount: number;
  confidence: number;
}

export interface KnowledgeStats {
  totalDocsInVectorStore: number;
  activeTargetsCount: number;
  totalIngestionRuns: number;
  totalLessonsCount: number;
  lastIngestedAt?: string;
}

export interface McpManifest {
  name: string;
  version: string;
  protocolVersion: string;
  toolsCount: number;
  tools: Array<{
    name: string;
    description: string;
    inputSchema: any;
  }>;
}

// ─── Trusted Sources ──────────────────────────────────────────

export async function fetchTrustedSources(category?: string): Promise<TrustedSource[]> {
  const query = category ? `?category=${encodeURIComponent(category)}` : '';
  const res = await apiRequest<{ success: boolean; sources: TrustedSource[] }>(`/api/glacia/knowledge/sources${query}`);
  return res.sources || [];
}

export async function addTrustedSource(source: Omit<TrustedSource, 'id'>): Promise<TrustedSource> {
  const res = await apiRequest<{ success: boolean; source: TrustedSource }>('/api/glacia/knowledge/sources', {
    method: 'POST',
    body: JSON.stringify(source),
  });
  return res.source;
}

// ─── Doc Ingestion Targets ────────────────────────────────────

export async function fetchDocIngestionTargets(): Promise<DocIngestionTarget[]> {
  const res = await apiRequest<{ success: boolean; targets: DocIngestionTarget[] }>('/api/glacia/knowledge/targets');
  return res.targets || [];
}

export async function triggerDocIngestion(targetId: string): Promise<any> {
  const res = await apiRequest<{ success: boolean; result: any }>('/api/glacia/knowledge/crawl', {
    method: 'POST',
    body: JSON.stringify({ targetId }),
  });
  return res.result;
}

export async function fetchKnowledgeStats(): Promise<KnowledgeStats> {
  const res = await apiRequest<{ success: boolean; stats: KnowledgeStats }>('/api/glacia/knowledge/stats');
  return res.stats;
}

// ─── Distilled Lessons & Rules ────────────────────────────────

export async function fetchDistilledLessons(): Promise<DistilledLesson[]> {
  const res = await apiRequest<{ success: boolean; lessons: DistilledLesson[] }>('/api/glacia/knowledge/lessons');
  return res.lessons || [];
}

export async function distillLesson(payload: {
  summary: string;
  query: string;
  solution: string;
  codeSnippet?: string;
  sourceUrl?: string;
  tags?: string[];
  ttlDays?: number;
}): Promise<DistilledLesson> {
  const res = await apiRequest<{ success: boolean; lesson: DistilledLesson }>('/api/glacia/knowledge/distill', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.lesson;
}

export async function searchKnowledgeBase(query: string): Promise<{
  lessons: DistilledLesson[];
  vectorDocs: any[];
}> {
  const res = await apiRequest<{ success: boolean; lessons: DistilledLesson[]; vectorDocs: any[] }>('/api/glacia/knowledge/search', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
  return { lessons: res.lessons || [], vectorDocs: res.vectorDocs || [] };
}

// ─── Native MCP Server ────────────────────────────────────────

export async function fetchGlaciaMcpManifest(): Promise<McpManifest> {
  return await apiRequest<McpManifest>('/api/mcp/glacia/manifest');
}

export async function executeMcpTool(name: string, args: Record<string, any> = {}): Promise<any> {
  const res = await apiRequest<{ success: boolean; result: any }>('/api/mcp/glacia/tools/execute', {
    method: 'POST',
    body: JSON.stringify({ name, args }),
  });
  return res.result;
}
