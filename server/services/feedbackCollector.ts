/**
 * feedbackCollector.ts
 * ============================================================
 * Human Feedback Loop — thu thập đánh giá của người dùng
 * về output của AI, dùng feedback để cải thiện prompt
 * và ưu tiên model/route tốt hơn.
 */
import { randomUUID } from 'node:crypto';
import { recordObservation } from './compoundMemory';
import { upsertNode, addEdge } from './knowledgeGraph';
import fs from 'fs';
import path from 'path';

// ─── Types ──────────────────────────────────────────────────────────
export type FeedbackRating = 'excellent' | 'good' | 'ok' | 'poor' | 'bad';
export type FeedbackCategory = 'accuracy' | 'code_quality' | 'speed' | 'clarity' | 'completeness' | 'other';

export interface FeedbackRecord {
  id: string;
  agent: string;
  model: string;
  domain: string;
  taskSummary: string;
  rating: FeedbackRating;
  categories: FeedbackCategory[];
  comment: string;
  helpful: boolean;
  usedSuggestion: boolean;
  createdAt: string;
  // Improvement tracking
  followUpAction?: string;
  resolvedAt?: string;
}

export interface FeedbackStats {
  total: number;
  byRating: Record<FeedbackRating, number>;
  byCategory: Record<FeedbackCategory, number>;
  byAgent: Record<string, { total: number; avgScore: number }>;
  byModel: Record<string, { total: number; avgScore: number }>;
  satisfactionRate: number; // % of good+excellent
  recentRecords: FeedbackRecord[];
}

export interface ImprovementSuggestion {
  fromFeedback: FeedbackRecord[];
  suggestion: string;
  affectedAgent: string;
  priority: 'high' | 'medium' | 'low';
}

// ─── Constants ──────────────────────────────────────────────────────
const RATING_SCORES: Record<FeedbackRating, number> = {
  excellent: 5, good: 4, ok: 3, poor: 2, bad: 1,
};

// ─── Storage ────────────────────────────────────────────────────────
const FILE = path.join(process.cwd(), 'feedback_records.json');
let records: FeedbackRecord[] = [];

async function load(): Promise<void> {
  try { if (fs.existsSync(FILE)) records = JSON.parse(await fs.promises.readFile(FILE, 'utf8')); } catch { }
}
load().catch(() => undefined);

async function save(): Promise<void> {
  await fs.promises.writeFile(FILE, JSON.stringify(records.slice(-500), null, 2), 'utf8');
}

// ─── Core API ───────────────────────────────────────────────────────

export function submitFeedback(input: {
  agent: string;
  model: string;
  domain: string;
  taskSummary: string;
  rating: FeedbackRating;
  categories?: FeedbackCategory[];
  comment?: string;
  helpful?: boolean;
  usedSuggestion?: boolean;
}): FeedbackRecord {
  const record: FeedbackRecord = {
    id: `fb_${Date.now()}_${randomUUID().slice(0, 6)}`,
    agent: input.agent,
    model: input.model,
    domain: input.domain,
    taskSummary: input.taskSummary.slice(0, 200),
    rating: input.rating,
    categories: input.categories || ['other'],
    comment: input.comment || '',
    helpful: input.helpful ?? true,
    usedSuggestion: input.usedSuggestion ?? true,
    createdAt: new Date().toISOString(),
  };

  records.push(record);

  // Record to compound memory for learning
  if (input.rating === 'excellent' || input.rating === 'good') {
    recordObservation(
      input.domain,
      `Positive feedback: ${input.taskSummary.slice(0, 80)}`,
      `Rating: ${input.rating}. ${input.comment || 'User satisfied.'}`,
      0.85,
      `feedback:${record.id}`,
      true,
    ).catch(() => undefined);
  }

  if (input.rating === 'poor' || input.rating === 'bad') {
    recordObservation(
      input.domain,
      `Negative feedback: ${input.taskSummary.slice(0, 80)}`,
      `Rating: ${input.rating}. ${input.comment || 'User dissatisfied.'}`,
      0.3,
      `feedback:${record.id}`,
      false,
    ).catch(() => undefined);
  }

  // Link to knowledge graph
  try {
    const fbNode = upsertNode('memory', record.id, input.comment || input.taskSummary.slice(0, 100), { rating: input.rating, agent: input.agent }, 0.7);
    const agentNode = upsertNode('memory', `agent_${input.agent}`, input.agent, {}, 1);
    addEdge(fbNode.id, agentNode.id, 'feedback_for', 1);
  } catch { /* non-critical */ }

  save().catch(() => undefined);
  return record;
}

export function getFeedbackStats(agent?: string, days = 30): FeedbackStats {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const filtered = agent
    ? records.filter(r => r.agent === agent && new Date(r.createdAt).getTime() >= cutoff)
    : records.filter(r => new Date(r.createdAt).getTime() >= cutoff);

  const byRating: Record<string, number> = { excellent: 0, good: 0, ok: 0, poor: 0, bad: 0 };
  const byCategory: Record<string, number> = {};
  const byAgent: Record<string, { total: number; sumScore: number }> = {};
  const byModel: Record<string, { total: number; sumScore: number }> = {};

  for (const r of filtered) {
    byRating[r.rating] = (byRating[r.rating] || 0) + 1;
    for (const cat of r.categories) {
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    }
    const ag = byAgent[r.agent] || { total: 0, sumScore: 0 };
    ag.total++;
    ag.sumScore += RATING_SCORES[r.rating];
    byAgent[r.agent] = ag;

    const md = byModel[r.model] || { total: 0, sumScore: 0 };
    md.total++;
    md.sumScore += RATING_SCORES[r.model] || 3;
    byModel[r.model] = md;
  }

  const goodCount = (byRating.excellent || 0) + (byRating.good || 0);
  const satisfactionRate = filtered.length > 0 ? goodCount / filtered.length : 0;

  return {
    total: filtered.length,
    byRating: byRating as Record<FeedbackRating, number>,
    byCategory: byCategory as Record<FeedbackCategory, number>,
    byAgent: Object.fromEntries(Object.entries(byAgent).map(([k, v]) => [k, { total: v.total, avgScore: +(v.sumScore / v.total).toFixed(1) }])),
    byModel: Object.fromEntries(Object.entries(byModel).map(([k, v]) => [k, { total: v.total, avgScore: +(v.sumScore / v.total).toFixed(1) }])),
    satisfactionRate,
    recentRecords: filtered.slice(-15).reverse(),
  };
}

export function listFeedback(limit = 50): FeedbackRecord[] {
  return records.slice(-limit).reverse();
}

export function generateImprovementSuggestions(agent: string, minRating: FeedbackRating = 'poor'): ImprovementSuggestion[] {
  const badFeedback = records.filter(r =>
    r.agent === agent &&
    (r.rating === 'poor' || r.rating === 'bad' || r.rating === minRating)
  );

  if (badFeedback.length < 2) return [];

  // Group by category
  const byCategory: Record<string, FeedbackRecord[]> = {};
  for (const fb of badFeedback) {
    for (const cat of fb.categories) {
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(fb);
    }
  }

  const suggestions: ImprovementSuggestion[] = [];
  for (const [cat, feedbacks] of Object.entries(byCategory)) {
    if (feedbacks.length < 2) continue;

    let suggestion = '';
    let priority: ImprovementSuggestion['priority'] = 'medium';

    switch (cat) {
      case 'accuracy':
        suggestion = `Cải thiện độ chính xác cho agent "${agent}". Có ${feedbacks.length} feedback tiêu cực. Cân nhắc thêm context từ knowledge graph hoặc dùng model mạnh hơn.`;
        priority = 'high';
        break;
      case 'code_quality':
        suggestion = `Nâng cao chất lượng code cho agent "${agent}". Agent nên chạy lint tự động sau khi generate code.`;
        priority = 'high';
        break;
      case 'speed':
        suggestion = `Tối ưu tốc độ cho agent "${agent}". Cân nhắc sử dụng model nhẹ hơn hoặc cache kết quả.`;
        priority = 'medium';
        break;
      case 'clarity':
        suggestion = `Cải thiện cách trình bày cho agent "${agent}". Response nên có format rõ ràng hơn.`;
        priority = 'low';
        break;
      default:
        suggestion = `Khắc phục vấn đề "${cat}" cho agent "${agent}" (${feedbacks.length} reports).`;
        priority = 'medium';
    }

    suggestions.push({ fromFeedback: feedbacks.slice(0, 3), suggestion, affectedAgent: agent, priority });
  }

  return suggestions;
}

export function resolveFeedback(id: string, action: string): boolean {
  const record = records.find(r => r.id === id);
  if (!record) return false;
  record.followUpAction = action;
  record.resolvedAt = new Date().toISOString();
  save().catch(() => undefined);
  return true;
}
