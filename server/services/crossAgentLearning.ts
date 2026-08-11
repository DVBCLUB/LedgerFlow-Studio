/**
 * crossAgentLearning.ts
 * ============================================================
 * Cross-Agent Learning — agents học hỏi từ experience
 * của nhau thông qua compound memory và vector semantic search.
 * Khi một agent thành công, pattern được chia sẻ cho các agent
 * khác cùng domain dưới dạng embedding để tìm kiếm theo nghĩa.
 */
import { searchMemory, recordObservation, type MemorySearchResult } from './compoundMemory.ts';
import { dispatchTextThroughFabric } from './aiFabric.ts';
import {
  createNamespace,
  insertDocument,
  searchSimilar,
  type VectorSearchResult,
} from './vectorEmbeddingStore.ts';
import fs from 'node:fs';
import path from 'node:path';

// ─── Types ──────────────────────────────────────────────────────────
export interface LearningEvent {
  id: string;
  sourceAgent: string;
  domain: string;
  kind: 'success' | 'failure' | 'insight';
  title: string;
  content: string;
  confidence: number;
  tags: string[];
  recordedAt: string;
}

export interface CrossLearningResult {
  sourceAgent: string;
  targetAgent: string;
  domain: string;
  recommendations: string[];
  sharedPatterns: number;
  learnedAt: string;
}

export interface LearningReport {
  generatedAt: string;
  crossLearning: CrossLearningResult[];
  totalRecommendations: number;
  domainInsights: Array<{ domain: string; insight: string; agents: string[] }>;
}

// ─── Storage ──────────────────────────────────────────────────────────────────────
const FILE = path.join(process.cwd(), 'cross_learning_events.json');
let events: LearningEvent[] = [];

// Vector namespace for semantic search — persisted in runtime/vector_store/
const VECTOR_NS = 'agent_learning';
createNamespace(VECTOR_NS);

async function load(): Promise<void> {
  try { if (fs.existsSync(FILE)) events = JSON.parse(await fs.promises.readFile(FILE, 'utf8')); } catch { }
}
load().catch(() => undefined);

async function save(): Promise<void> {
  await fs.promises.writeFile(FILE, JSON.stringify(events.slice(-500), null, 2), 'utf8');
}

// ─── Core API ───────────────────────────────────────────────────────

export async function shareLearning(
  sourceAgent: string,
  domain: string,
  kind: LearningEvent['kind'],
  title: string,
  content: string,
  confidence = 0.8,
  tags: string[] = [],
): Promise<LearningEvent> {
  const event: LearningEvent = {
    id: `learn_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
    sourceAgent,
    domain,
    kind,
    title: title.slice(0, 120),
    content: content.slice(0, 2000),
    confidence,
    tags: [...tags, sourceAgent, domain, kind],
    recordedAt: new Date().toISOString(),
  };

  events.push(event);

  // Record to compound memory for all agents to access
  await recordObservation(
    domain,
    `[Shared] ${sourceAgent}: ${title}`,
    content,
    confidence,
    `cross-agent:${sourceAgent}`,
    kind === 'success',
  );

  // Also embed into vector store for semantic similarity search
  insertDocument(VECTOR_NS, `${title}\n${content}`, {
    agent: sourceAgent,
    domain,
    kind,
    confidence: String(confidence),
    recordedAt: event.recordedAt,
    tags: event.tags.join(','),
  });

  save().catch(() => undefined);
  return event;
}

export async function discoverInsights(
  sourceAgent: string,
  targetAgent: string,
  domain: string,
): Promise<CrossLearningResult> {
  // 1. Compound-memory keyword search (existing behaviour)
  const [sourceSuccesses, sourceFailures] = await Promise.all([
    searchMemory(`success ${domain}`, { domain, kinds: ['pattern'], limit: 5 }),
    searchMemory(`failure ${domain}`, { domain, kinds: ['lesson'], limit: 3 }),
  ]);

  // 2. Semantic vector search for richer recall
  const vectorResults: VectorSearchResult[] = searchSimilar(
    VECTOR_NS,
    `${sourceAgent} ${domain} success pattern`,
    8,
    0.12,
  ).filter((r) => r.document.metadata.agent === sourceAgent || r.document.metadata.domain === domain);

  const recommendations: string[] = [];
  let sharedPatterns = 0;

  // Process compound-memory results
  for (const mem of sourceSuccesses) {
    if (mem.confidence >= 0.7) {
      recommendations.push(`Học từ ${sourceAgent}: ${mem.title} — ${mem.content.slice(0, 150)}`);
      sharedPatterns++;
    }
  }
  for (const mem of sourceFailures) {
    if (mem.confidence >= 0.5) {
      recommendations.push(`Tránh lỗi của ${sourceAgent}: ${mem.title} — ${mem.content.slice(0, 150)}`);
    }
  }

  // Merge unique vector-search results (avoid duplicates)
  const existingSnippets = new Set(recommendations.map((r) => r.slice(0, 60)));
  for (const vr of vectorResults) {
    if (vr.similarity >= 0.15) {
      const snippet = `[semantic ${(vr.similarity * 100).toFixed(0)}%] ${vr.document.metadata.agent || sourceAgent}: ${vr.document.content.slice(0, 150)}`;
      if (!existingSnippets.has(snippet.slice(0, 60))) {
        recommendations.push(snippet);
        existingSnippets.add(snippet.slice(0, 60));
        sharedPatterns++;
      }
    }
  }

  const result: CrossLearningResult = {
    sourceAgent,
    targetAgent,
    domain,
    recommendations,
    sharedPatterns,
    learnedAt: new Date().toISOString(),
  };

  // Record the cross-learning event
  await shareLearning(
    targetAgent,
    domain,
    'insight',
    `Học từ ${sourceAgent}`,
    `Đã học ${recommendations.length} pattern từ ${sourceAgent} trong domain ${domain}.`,
    0.7,
    ['cross-learning'],
  );

  return result;
}

export async function generateLearningReport(
  agents: string[],
  domain?: string,
): Promise<LearningReport> {
  const crossLearning: CrossLearningResult[] = [];
  const domainInsightsMap = new Map<string, { insights: string[]; agents: Set<string> }>();

  if (agents.length < 2) {
    return { generatedAt: new Date().toISOString(), crossLearning: [], totalRecommendations: 0, domainInsights: [] };
  }

  // Cross-learning between each pair of agents
  for (let i = 0; i < agents.length; i++) {
    for (let j = 0; j < agents.length; j++) {
      if (i === j) continue;
      try {
        const result = await discoverInsights(agents[i], agents[j], domain || 'general');
        if (result.recommendations.length > 0) {
          crossLearning.push(result);
        }
      } catch { /* skip failed pairs */ }
    }
  }

  // Extract domain insights
  for (const cl of crossLearning) {
    const dom = cl.domain;
    if (!domainInsightsMap.has(dom)) {
      domainInsightsMap.set(dom, { insights: [], agents: new Set() });
    }
    const entry = domainInsightsMap.get(dom)!;
    entry.insights.push(...cl.recommendations);
    entry.agents.add(cl.sourceAgent);
    entry.agents.add(cl.targetAgent);
  }

  const domainInsights = Array.from(domainInsightsMap.entries())
    .map(([domain, data]) => ({
      domain,
      insight: `Domain "${domain}" có ${data.insights.length} insights từ ${data.agents.size} agents.`,
      agents: Array.from(data.agents).slice(0, 5),
    }));

  return {
    generatedAt: new Date().toISOString(),
    crossLearning,
    totalRecommendations: crossLearning.reduce((s, c) => s + c.recommendations.length, 0),
    domainInsights,
  };
}

export function listLearningEvents(limit = 50): LearningEvent[] {
  return events.slice(-limit).reverse();
}

export async function recommendBestAgent(
  task: string,
  domain: string,
  availableAgents: string[],
): Promise<{ agent: string; reason: string; confidence: number }> {
  if (availableAgents.length === 0) return { agent: 'general', reason: 'Fallback', confidence: 0.5 };

  const agentScores = new Map<string, { score: number; reasons: string[] }>();
  for (const agent of availableAgents) agentScores.set(agent, { score: 0, reasons: [] });

  // 1. Compound-memory keyword match (existing)
  const mems = await searchMemory(task, { domain, kinds: ['pattern'], limit: 10 });
  for (const mem of mems) {
    for (const agent of availableAgents) {
      if (mem.source.toLowerCase().includes(agent.toLowerCase())) {
        const entry = agentScores.get(agent)!;
        entry.score += mem.confidence * (mem.score || 1);
        entry.reasons.push(mem.title);
      }
    }
  }

  // 2. Semantic vector search — find agents with similar successful patterns
  const vectorHits = searchSimilar(VECTOR_NS, `${task} ${domain}`, 15, 0.1);
  for (const vr of vectorHits) {
    const hitAgent = vr.document.metadata.agent || '';
    const hitKind = vr.document.metadata.kind || '';
    for (const agent of availableAgents) {
      if (hitAgent.toLowerCase().includes(agent.toLowerCase())) {
        const entry = agentScores.get(agent)!;
        // Weight successes positively, failures negatively
        const weight = hitKind === 'success' ? vr.similarity : hitKind === 'failure' ? -vr.similarity * 0.5 : vr.similarity * 0.3;
        entry.score += weight;
        if (hitKind === 'success') entry.reasons.push(`[vec ${(vr.similarity * 100).toFixed(0)}%] ${vr.document.content.slice(0, 80)}`);
      }
    }
  }

  // Find best scoring agent
  let bestAgent = availableAgents[0];
  let bestScore = -Infinity;
  let bestReasons: string[] = [];

  for (const [agent, data] of agentScores) {
    if (data.score > bestScore) {
      bestScore = data.score;
      bestAgent = agent;
      bestReasons = data.reasons;
    }
  }

  const reason = bestReasons.length > 0
    ? `Dựa trên ${bestReasons.length} pattern (keyword + semantic): ${bestReasons.slice(0, 2).join(', ')}.`
    : `Không có dữ liệu, dùng agent mặc định.`;

  return {
    agent: bestAgent,
    reason,
    confidence: Math.min(1, Math.max(0, bestScore / 5)),
  };
}

export function broadcastCrossAgentInsight(input: {
  sourceAgent: string;
  domain: string;
  title: string;
  content: string;
  confidence?: number;
  tags?: string[];
}): LearningEvent {
  const now = new Date().toISOString();
  const event: LearningEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    sourceAgent: input.sourceAgent,
    domain: input.domain,
    kind: 'insight',
    title: input.title,
    content: input.content,
    confidence: input.confidence ?? 0.9,
    tags: input.tags || ['collective_learning'],
    recordedAt: now,
  };

  events.push(event);
  save().catch(() => undefined);

  // Index into Vector Embedding Store for semantic search
  insertDocument(VECTOR_NS, `${event.title} - ${event.content}`, {
    agent: event.sourceAgent,
    domain: event.domain,
    kind: 'insight',
  });

  return event;
}

export function queryCollectiveAgentKnowledge(query: string, domain?: string, limit = 5): VectorSearchResult[] {
  const searchQuery = domain ? `${query} ${domain}` : query;
  return searchSimilar(VECTOR_NS, searchQuery, limit, 0.1);
}
