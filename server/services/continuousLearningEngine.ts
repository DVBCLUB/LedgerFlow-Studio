/**
 * continuousLearningEngine.ts
 * ============================================================
 * Continuous Learning & Experience Distillation Engine for LedgerFlow OS.
 *
 * Implements Level 5 Continuous Feedback Loop:
 *  - Captures task outcomes from 25 AI Agents
 *  - Distills successful patterns into SOPs / golden templates
 *  - Extracts lessons learned from failed tasks
 *  - Automatically indexes insights into knowledgeRAGPipeline.ts
 */

import { randomUUID } from 'node:crypto';
import { appendAuditEvent } from './auditLog.ts';
import { addKnowledgeDocument } from './knowledgeRAGPipeline.ts';
import { publishSystemEvent } from './crossSystemEventBus.ts';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LearningSource = 'agent_run' | 'human_feedback' | 'error_recovery' | 'sales_outcome' | 'ci_build';

export interface LearningInsight {
  id: string;
  source: LearningSource;
  agentRole: string;
  topic: string;
  lessonSummary: string;
  actionableRule: string;
  confidence: number;
  occurrences: number;
  promotedToKnowledgeBase: boolean;
  createdAt: string;
}

// ─── Live In-Memory Insights Store ────────────────────────────────────────────

const INSIGHTS: LearningInsight[] = [
  {
    id: 'learn_001',
    source: 'sales_outcome',
    agentRole: 'AI Sales',
    topic: 'Chốt hợp đồng công ty xây dựng',
    lessonSummary: 'Khách hàng xây dựng ưu tiên tính năng kế toán công trình và hóa đơn điện tử TT78 hơn là CRM.',
    actionableRule: 'Khi tư vấn khách hàng xây dựng, tập trung demo phân hệ Dự án & Xuất hóa đơn TT78 trước.',
    confidence: 0.95,
    occurrences: 12,
    promotedToKnowledgeBase: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'learn_002',
    source: 'error_recovery',
    agentRole: 'AI Dev',
    topic: 'ESM strict TypeScript imports',
    lessonSummary: 'Node.js native ESM yêu cầu đuôi .ts rõ ràng trong relative imports ở backend.',
    actionableRule: 'Mọi import tương đối trong server/services/* bắt buộc phải kèm đuôi .ts.',
    confidence: 0.99,
    occurrences: 34,
    promotedToKnowledgeBase: true,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'learn_003',
    source: 'human_feedback',
    agentRole: 'AI CFO',
    topic: 'Duyệt chi tiêu vượt ngưỡng',
    lessonSummary: 'CEO yêu cầu mọi khoản chi trên 5 triệu VND phải qua HITL approval.',
    actionableRule: 'Tự động tạm dừng và tạo HITL approval card nếu khoản chi đề xuất >= 5,000,000 VND.',
    confidence: 1.0,
    occurrences: 8,
    promotedToKnowledgeBase: true,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

// ─── Engine APIs ──────────────────────────────────────────────────────────────

/**
 * Records a task outcome and extracts a learning insight.
 */
export async function recordTaskLearning(input: {
  source: LearningSource;
  agentRole: string;
  topic: string;
  lessonSummary: string;
  actionableRule: string;
  confidence?: number;
}): Promise<LearningInsight> {
  const existing = INSIGHTS.find(i => i.topic.toLowerCase() === input.topic.toLowerCase() && i.agentRole === input.agentRole);

  if (existing) {
    existing.occurrences += 1;
    existing.confidence = Math.min(1.0, existing.confidence + 0.05);
    existing.lessonSummary = input.lessonSummary;
    existing.actionableRule = input.actionableRule;
    return existing;
  }

  const insight: LearningInsight = {
    id: `learn_${randomUUID().slice(0, 8)}`,
    source: input.source,
    agentRole: input.agentRole,
    topic: input.topic,
    lessonSummary: input.lessonSummary,
    actionableRule: input.actionableRule,
    confidence: input.confidence ?? 0.85,
    occurrences: 1,
    promotedToKnowledgeBase: false,
    createdAt: new Date().toISOString(),
  };

  INSIGHTS.unshift(insight);

  // Auto-promote high-confidence insights into live RAG corpus
  if (insight.confidence >= 0.90 && !insight.promotedToKnowledgeBase) {
    await addKnowledgeDocument({
      title: `[Tự Học] ${insight.topic} (${insight.agentRole})`,
      category: 'agent_guidelines',
      content: `${insight.lessonSummary}\n\nQuy tắc hành động: ${insight.actionableRule}`,
      tags: ['auto-learned', insight.agentRole.toLowerCase().replace(/\s+/g, '-'), 'continuous-learning'],
      source: `Continuous Learning Engine (${insight.source})`,
    }).catch(() => undefined);
    insight.promotedToKnowledgeBase = true;
  }

  await publishSystemEvent(
    'agent.auto_repair_completed',
    'continuous-learning-engine',
    `Đúc kết tri thức mới từ ${input.agentRole}: ${input.topic}`,
    { insightId: insight.id, confidence: insight.confidence }
  ).catch(() => undefined);

  return insight;
}

/**
 * Returns all continuous learning insights.
 */
export function listLearningInsights(): LearningInsight[] {
  return [...INSIGHTS];
}

/**
 * Returns learning engine dashboard metrics.
 */
export function getLearningDashboard() {
  return {
    totalInsights: INSIGHTS.length,
    promotedToKB: INSIGHTS.filter(i => i.promotedToKnowledgeBase).length,
    avgConfidence: (INSIGHTS.reduce((s, i) => s + i.confidence, 0) / (INSIGHTS.length || 1)).toFixed(2),
    totalOccurrences: INSIGHTS.reduce((s, i) => s + i.occurrences, 0),
    topAgents: ['AI Sales', 'AI Dev', 'AI CFO'],
  };
}
