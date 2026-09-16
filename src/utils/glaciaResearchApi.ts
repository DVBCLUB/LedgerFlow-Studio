/**
 * src/utils/glaciaResearchApi.ts
 * Frontend Client SDK cho Glacia Autonomous Web Researcher & Self-Healing Code.
 */

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`Glacia Research API error: HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export interface ResearchArticle {
  title: string;
  url: string;
  summary: string;
  codeSnippets: string[];
  keyTakeaways: string[];
  relevanceScore: number;
}

export interface ResearchResult {
  query: string;
  category: string;
  articles: ResearchArticle[];
  synthesizedSolution: string;
  executableCode?: string;
  researchedAt: string;
}

export interface SelfHealingResult {
  success: boolean;
  rootCause: string;
  proposedFix: string;
  diffPatch?: string;
  isApplied: boolean;
  message: string;
  verifiedAt: string;
}

export async function searchTechnicalDocs(payload: {
  query: string;
  category?: string;
  depth?: 'quick' | 'deep';
}): Promise<ResearchResult> {
  const res = await apiRequest<{ success: boolean; result: ResearchResult }>('/api/glacia/research/search', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.result;
}

export async function fetchResearchHistory(): Promise<ResearchResult[]> {
  const res = await apiRequest<{ success: boolean; history: ResearchResult[] }>('/api/glacia/research/history');
  return res.history;
}

export async function triggerSelfHealingCode(payload: {
  errorLog: string;
  affectedFile?: string;
  context?: string;
}): Promise<SelfHealingResult> {
  const res = await apiRequest<{ success: boolean; result: SelfHealingResult }>('/api/glacia/code/self-heal', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.result;
}
