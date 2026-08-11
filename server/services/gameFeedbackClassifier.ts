/**
 * gameFeedbackClassifier.ts
 * ============================================================
 * PC & Mobile Game Player Feedback Classifier & AI Bug Triage Engine for LedgerFlow OS.
 *
 * Scrapes & parses user reviews from Steam, Google Play, App Store, and WebGL builds:
 *  - Categories: 'bug_report' | 'feature_request' | 'positive_praise' | 'performance_issue'
 *  - Severity Ratings: 'critical' | 'high' | 'medium' | 'low'
 *  - Auto-routes critical bugs into actionable SWE Agent Fix Tasks.
 *  - Encrypted persistent storage in runtime/agent_game_feedback.local.enc.
 */

import { randomUUID } from 'node:crypto';
import { readSecureJson, writeSecureJson } from './secureJsonStore.ts';
import { resolveRuntimePathFromEnv } from './runtimePaths.ts';
import { appendAuditEvent } from './auditLog.ts';
import { emitTelemetryEvent } from './agentTelemetryStream.ts';
import { enqueueCloudAgentTask } from './cloudAgentWorker.ts';

// ─── Types ────────────────────────────────────────────────────────────────────

export type GamePlatform = 'steam_pc' | 'google_play_android' | 'app_store_ios' | 'web_gl';
export type FeedbackCategory = 'bug_report' | 'feature_request' | 'positive_praise' | 'performance_issue';
export type FeedbackSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface GamePlayerReview {
  id: string;
  gameTitle: string;
  platform: GamePlatform;
  author: string;
  rating: number; // 1 to 5 stars
  reviewText: string;
  category: FeedbackCategory;
  severity: FeedbackSeverity;
  autoTriaged: boolean;
  assignedAiDevTaskId?: string;
  createdAt: string;
}

interface FeedbackStore {
  reviews: Record<string, GamePlayerReview>;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

let store: FeedbackStore = { reviews: {} };
let writeQueue = Promise.resolve();

function storageFile() {
  return resolveRuntimePathFromEnv('GAME_FEEDBACK_FILE', 'agent_game_feedback.local.enc');
}

async function loadStore(): Promise<FeedbackStore> {
  const parsed = await readSecureJson<FeedbackStore>(storageFile(), { reviews: {} });
  store = { reviews: parsed.reviews || {} };
  return store;
}

async function saveStore(): Promise<void> {
  await writeSecureJson(storageFile(), store);
}

function queueSave(): void {
  const task = () => saveStore().catch(() => undefined);
  writeQueue = writeQueue.then(task, task);
}

loadStore().catch(() => undefined);

// ─── Core Classifier Logic ────────────────────────────────────────────────────

export function classifyFeedback(reviewText: string, rating: number): { category: FeedbackCategory; severity: FeedbackSeverity } {
  const lower = reviewText.toLowerCase();

  let category: FeedbackCategory = 'positive_praise';
  let severity: FeedbackSeverity = 'low';

  if (lower.includes('crash') || lower.includes('lỗi') || lower.includes('văng') || lower.includes('mất save') || lower.includes('freeze')) {
    category = 'bug_report';
    severity = rating <= 2 ? 'critical' : 'high';
  } else if (lower.includes('lag') || lower.includes('fps') || lower.includes('nóng máy') || lower.includes('tụt fps')) {
    category = 'performance_issue';
    severity = 'high';
  } else if (lower.includes('thêm') || lower.includes('nên có') || lower.includes('muốn') || lower.includes('feature') || lower.includes('update')) {
    category = 'feature_request';
    severity = 'medium';
  } else {
    category = rating >= 4 ? 'positive_praise' : 'bug_report';
    severity = rating <= 2 ? 'medium' : 'low';
  }

  return { category, severity };
}

export async function ingestPlayerReview(input: {
  gameTitle: string;
  platform: GamePlatform;
  author: string;
  rating: number;
  reviewText: string;
}): Promise<GamePlayerReview> {
  await writeQueue.catch(() => undefined);
  if (Object.keys(store.reviews).length === 0) await loadStore();

  const reviewId = `rev_${Date.now()}_${randomUUID().slice(0, 6)}`;
  const now = new Date().toISOString();
  const { category, severity } = classifyFeedback(input.reviewText, input.rating);

  let aiTaskId: string | undefined = undefined;

  // Auto-triage critical & high severity bugs into Cloud Agent Worker Tasks
  if (category === 'bug_report' && (severity === 'critical' || severity === 'high')) {
    const task = await enqueueCloudAgentTask({
      title: `[Game Bug Fix] ${input.gameTitle} (${input.platform}): ${input.reviewText.slice(0, 50)}`,
      goal: `AI Dev Staff: Traced and fix bug reported by player on ${input.platform}:\n"${input.reviewText}"`,
      priority: severity === 'critical' ? 'critical' : 'high',
      domain: 'coding',
    });
    aiTaskId = task.id;
  }

  const review: GamePlayerReview = {
    id: reviewId,
    gameTitle: input.gameTitle,
    platform: input.platform,
    author: input.author,
    rating: input.rating,
    reviewText: input.reviewText,
    category,
    severity,
    autoTriaged: Boolean(aiTaskId),
    assignedAiDevTaskId: aiTaskId,
    createdAt: now,
  };

  store.reviews[reviewId] = review;
  queueSave();

  emitTelemetryEvent({
    category: 'agent_runtime',
    eventType: 'game_feedback_triaged',
    source: 'game_feedback_classifier',
    summary: `Player review triaged for ${input.gameTitle} [${category.toUpperCase()} - ${severity.toUpperCase()}]`,
    payload: { reviewId, category, severity, autoTriaged: review.autoTriaged },
  });

  appendAuditEvent({
    actor: 'game-classifier',
    workspace: 'Game Studio',
    action: 'game.review_triaged',
    target: reviewId,
    risk: severity === 'critical' ? 'HIGH' : 'LOW',
    status: 'executed',
    summary: `Triaged review for "${input.gameTitle}" (${category}/${severity})`,
    evidence: { reviewId, platform: input.platform },
  }).catch(() => undefined);

  return review;
}

export async function listPlayerReviews(gameTitle?: string, category?: FeedbackCategory): Promise<GamePlayerReview[]> {
  await writeQueue.catch(() => undefined);
  if (Object.keys(store.reviews).length === 0) await loadStore();

  let list = Object.values(store.reviews);
  if (gameTitle) list = list.filter((r) => r.gameTitle.toLowerCase().includes(gameTitle.toLowerCase()));
  if (category) list = list.filter((r) => r.category === category);
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
