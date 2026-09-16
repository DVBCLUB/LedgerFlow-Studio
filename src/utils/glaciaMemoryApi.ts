/**
 * glaciaMemoryApi.ts
 * ============================================================
 * Frontend API client for Glacia Persistent Memory & Learning
 * ============================================================
 */

export interface MemoryVaultItem {
  id: string;
  category: 'episodic' | 'semantic' | 'preference' | 'procedural' | 'insight';
  title: string;
  content: string;
  tags: string[];
  importance: 'critical' | 'high' | 'medium' | 'low';
  emotionalValence?: number;
  accessCount: number;
  lastRecalledAt: string;
  createdAt: string;
}

export interface MemoryVaultResponse {
  version: string;
  ownerEmail: string;
  memories: MemoryVaultItem[];
  lastConsolidatedAt: string;
  stats: {
    totalRecalls: number;
    consolidationsRun: number;
    topTopics: string[];
  };
}

export async function fetchMemoryVault(): Promise<MemoryVaultResponse> {
  const res = await fetch('/api/glacia/memory/vault');
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch memory vault');
  return json.vault;
}

export async function addMemoryVaultEntry(entry: {
  category: MemoryVaultItem['category'];
  title: string;
  content: string;
  tags: string[];
  importance: MemoryVaultItem['importance'];
  emotionalValence?: number;
}): Promise<MemoryVaultItem> {
  const res = await fetch('/api/glacia/memory/vault/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to add memory');
  return json.entry;
}

export async function deleteMemoryVaultEntry(id: string): Promise<boolean> {
  const res = await fetch('/api/glacia/memory/vault/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  const json = await res.json();
  return Boolean(json.success && json.deleted);
}

export async function searchSemanticMemoryVault(
  query: string,
  limit = 5,
  minScore = 0.15
): Promise<Array<MemoryVaultItem & { relevanceScore: number }>> {
  const res = await fetch('/api/glacia/memory/vault/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, limit, minScore }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to search memory');
  return json.results;
}

export async function consolidateMemoryVault(): Promise<{
  timestamp: string;
  totalBefore: number;
  totalAfter: number;
  mergedCount: number;
  dedupedCount: number;
  newInsightsGenerated: string[];
}> {
  const res = await fetch('/api/glacia/memory/vault/consolidate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to consolidate memory');
  return json.report;
}

export async function sendInteractionFeedback(feedback: {
  rating: 'thumbs_up' | 'thumbs_down';
  queryPrompt: string;
  responseSnippet: string;
  category?: 'code' | 'strategy' | 'creative' | 'general' | 'financial';
  correctionComment?: string;
}): Promise<any> {
  const res = await fetch('/api/glacia/learning/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feedback),
  });
  return res.json();
}

export async function fetchLearningInsights(): Promise<any> {
  const res = await fetch('/api/glacia/learning/insights');
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch learning insights');
  return json.insights;
}
