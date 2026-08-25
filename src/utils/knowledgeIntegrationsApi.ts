/**
 * src/utils/knowledgeIntegrationsApi.ts
 * Frontend client cho Knowledge & Integrations engines (route /api/dormant/*).
 */

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

// ── Agent Long-Term Memory ───────────────────────────────────────
export interface LessonLearned {
  id: string;
  category: string;
  topic: string;
  insight: string;
  recommendedAction: string;
  confidence: number;
  reinforcements: number;
  decayFactor: number;
  tags: string[];
  sourceMissionId?: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
}
export function searchAgentMemory(query: string): Promise<{ success: boolean; results: LessonLearned[] }> {
  return request(`/api/dormant/agent-memory/search?q=${encodeURIComponent(query)}`);
}
export function saveAgentMemory(payload: { topic: string; insight: string; recommendedAction: string; category?: string; confidence?: number; tags?: string[] }): Promise<{ success: boolean; lesson: LessonLearned }> {
  return request('/api/dormant/agent-memory/save', { method: 'POST', body: JSON.stringify(payload) });
}

// ── Knowledge RAG Pipeline ───────────────────────────────────────
export interface KnowledgeDocument {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  source: string;
  updatedAt: string;
  relevanceScore?: number;
}
export interface RAGQueryResult {
  query: string;
  topDocuments: KnowledgeDocument[];
  formattedContextPack: string;
  totalTokensEstimate: number;
  retrievalLatencyMs: number;
  confidence: number;
}
export function queryKnowledgeRag(query: string, category?: string, topK?: number): Promise<{ success: boolean; result: RAGQueryResult }> {
  return request('/api/dormant/knowledge/rag-query', { method: 'POST', body: JSON.stringify({ query, category, topK }) });
}
export function listKnowledgeDocuments(category?: string): Promise<{ success: boolean; documents: KnowledgeDocument[]; count: number }> {
  const q = category ? `?category=${encodeURIComponent(category)}` : '';
  return request(`/api/dormant/knowledge/documents${q}`);
}
export function addKnowledgeDocument(payload: { title: string; content: string; category?: string; tags?: string[]; source?: string }): Promise<{ success: boolean; document: KnowledgeDocument }> {
  return request('/api/dormant/knowledge/documents', { method: 'POST', body: JSON.stringify(payload) });
}

// ── Continuous Learning Engine ───────────────────────────────────
export interface LearningInsight {
  id: string;
  source: string;
  agentRole: string;
  topic: string;
  lessonSummary: string;
  actionableRule: string;
  confidence: number;
  occurrences: number;
  promotedToKnowledgeBase: boolean;
  createdAt: string;
}
export function getLearningDashboard(): Promise<{ success: boolean; dashboard: { totalInsights: number; promotedToKB: number; avgConfidence: string; totalOccurrences: number; topAgents: string[] }; insights: LearningInsight[] }> {
  return request('/api/dormant/learning/dashboard');
}
export function recordTaskLearning(payload: { agentRole: string; topic: string; lessonSummary: string; source?: string; actionableRule?: string; confidence?: number }): Promise<{ success: boolean; insight: LearningInsight }> {
  return request('/api/dormant/learning/record', { method: 'POST', body: JSON.stringify(payload) });
}

// ── AI Media Hybrid Connectors ───────────────────────────────────
export interface MediaAIProviderMeta {
  id: string;
  name: string;
  category: string;
  capabilities: string[];
  recommendedPromptStyle: string;
  endpointUrl: string;
  defaultAspectRatio: string;
}
export interface HybridMediaJob {
  jobId: string;
  title: string;
  pipelineSteps: unknown[];
  status: string;
  resultAssets: { stepId: string; providerId: string; assetUrl: string; type: string }[];
  createdAt: string;
  completedAt?: string;
}
export function listMediaProviders(): Promise<{ success: boolean; providers: MediaAIProviderMeta[] }> {
  return request('/api/dormant/media-hybrid/providers');
}
export function dispatchMediaJob(payload: { title: string; steps: unknown[] }): Promise<{ success: boolean; job: HybridMediaJob }> {
  return request('/api/dormant/media-hybrid/dispatch', { method: 'POST', body: JSON.stringify(payload) });
}

// ── Figma Code Bridge ────────────────────────────────────────────
export interface FigmaConversionResult {
  id: string;
  figmaUrl: string;
  componentName: string;
  designTokens: Record<string, string>;
  jsxCode: string;
  cssVariables: string;
  convertedAt: string;
}
export function importFigmaComponent(payload: { figmaUrl?: string; componentName?: string }): Promise<{ success: boolean; result: FigmaConversionResult }> {
  return request('/api/dormant/figma-bridge/import', { method: 'POST', body: JSON.stringify(payload) });
}
