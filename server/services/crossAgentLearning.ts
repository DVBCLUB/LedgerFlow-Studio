/**
 * crossAgentLearning.ts
 * ============================================================
 * Cross-Agent Learning — agents học hỏi từ experience
 * của nhau thông qua compound memory. Khi một agent thành
 * công, pattern được chia sẻ cho các agent khác cùng domain.
 */
import { searchMemory, recordObservation, type MemorySearchResult } from './compoundMemory';
import { dispatchTextThroughFabric } from './aiFabric';
import fs from 'fs';
import path from 'path';

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

// ─── Storage ────────────────────────────────────────────────────────
const FILE = path.join(process.cwd(), 'cross_learning_events.json');
let events: LearningEvent[] = [];

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

  // Also record to compound memory for all agents to access
  await recordObservation(
    domain,
    `[Shared] ${sourceAgent}: ${title}`,
    content,
    confidence,
    `cross-agent:${sourceAgent}`,
    kind === 'success',
  );

  save().catch(() => undefined);
  return event;
}

export async function discoverInsights(
  sourceAgent: string,
  targetAgent: string,
  domain: string,
): Promise<CrossLearningResult> {
  // Search for successful patterns from source agent
  const sourceSuccesses = await searchMemory(`success ${domain}`, {
    domain,
    kinds: ['pattern'],
    limit: 5,
  });

  // Search for failures to avoid
  const sourceFailures = await searchMemory(`failure ${domain}`, {
    domain,
    kinds: ['lesson'],
    limit: 3,
  });

  const recommendations: string[] = [];
  let sharedPatterns = 0;

  // Extract actionable insights
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

  // Search memory for which agent handles this task best
  const mems = await searchMemory(task, { domain, kinds: ['pattern'], limit: 10 });

  const agentScores = new Map<string, { score: number; reasons: string[] }>();
  for (const agent of availableAgents) {
    agentScores.set(agent, { score: 0, reasons: [] });
  }

  for (const mem of mems) {
    for (const agent of availableAgents) {
      if (mem.source.toLowerCase().includes(agent.toLowerCase())) {
        const entry = agentScores.get(agent)!;
        entry.score += mem.confidence * (mem.score || 1);
        entry.reasons.push(mem.title);
      }
    }
  }

  // Find best
  let bestAgent = availableAgents[0];
  let bestScore = 0;
  let bestReasons: string[] = [];

  for (const [agent, data] of agentScores) {
    if (data.score > bestScore) {
      bestScore = data.score;
      bestAgent = agent;
      bestReasons = data.reasons;
    }
  }

  const reason = bestReasons.length > 0
    ? `Dựa trên ${bestReasons.length} pattern đã học: ${bestReasons.slice(0, 2).join(', ')}.`
    : `Không có dữ liệu, dùng agent mặc định.`;

  return {
    agent: bestAgent,
    reason,
    confidence: Math.min(1, bestReasons.length / 5),
  };
}
