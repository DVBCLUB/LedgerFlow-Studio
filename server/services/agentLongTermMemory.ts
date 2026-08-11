/**
 * agentLongTermMemory.ts
 * ============================================================
 * Agent Long-Term Memory & Continuous Learning Consolidation Engine for LedgerFlow OS.
 *
 * Consolidates transient agent observations, cross-agent learnings,
 * and performance ledger outcomes into persistent, structured "Lessons Learned":
 *  - Deduplicates knowledge using TF-IDF term overlap scoring (local).
 *  - Dynamically injects top relevant lessons into system prompts.
 *  - Supports Reinforcement (boost confidence on success) & Decay (fade obsolete lessons).
 *  - Stores in encrypted local store runtime/agent_long_term_memory.local.enc.
 */

import { randomUUID } from 'node:crypto';
import { readSecureJson, writeSecureJson } from './secureJsonStore.ts';
import { resolveRuntimePathFromEnv } from './runtimePaths.ts';
import { appendAuditEvent } from './auditLog.ts';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LessonCategory = 'coding' | 'finance' | 'rpa' | 'robotics' | 'workflow' | 'general';

export interface LessonLearned {
  id: string;
  category: LessonCategory;
  topic: string;
  insight: string;
  recommendedAction: string;
  confidence: number;            // 0.0 - 1.0
  reinforcements: number;        // Times validated successfully
  decayFactor: number;           // 0.0 - 1.0
  tags: string[];
  sourceMissionId?: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
}

interface MemoryStore {
  lessons: Record<string, LessonLearned>;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

let store: MemoryStore = { lessons: {} };
let writeQueue = Promise.resolve();

function storageFile() {
  return resolveRuntimePathFromEnv('LONG_TERM_MEMORY_FILE', 'agent_long_term_memory.local.enc');
}

async function loadStore(): Promise<MemoryStore> {
  const parsed = await readSecureJson<MemoryStore>(storageFile(), { lessons: {} });
  store = { lessons: parsed.lessons || {} };
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

// ─── TF-IDF Similarity & Term Overlap ─────────────────────────────────────────

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9_àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệđìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/gi, ' ')
      .split(/\s+/)
      .filter((word) => word.length >= 2)
  );
}

function computeJaccardSimilarity(textA: string, textB: string): number {
  const tokensA = tokenize(textA);
  const tokensB = tokenize(textB);

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) intersection++;
  }

  const union = new Set([...tokensA, ...tokensB]).size;
  return union > 0 ? intersection / union : 0;
}

// ─── Core API ─────────────────────────────────────────────────────────────────

export async function addLessonLearned(input: {
  category: LessonCategory;
  topic: string;
  insight: string;
  recommendedAction: string;
  confidence?: number;
  tags?: string[];
  sourceMissionId?: string;
}): Promise<LessonLearned> {
  await writeQueue.catch(() => undefined);

  // Check for duplicate/similar existing lesson (similarity > 0.65)
  const existingLessons = Object.values(store.lessons).filter((l) => l.category === input.category);
  for (const existing of existingLessons) {
    const sim = computeJaccardSimilarity(`${input.topic} ${input.insight}`, `${existing.topic} ${existing.insight}`);
    if (sim >= 0.65) {
      // Reinforce existing lesson instead of duplicating
      existing.reinforcements += 1;
      existing.confidence = Math.min(1.0, existing.confidence + 0.05);
      existing.updatedAt = new Date().toISOString();
      queueSave();
      return existing;
    }
  }

  const now = new Date().toISOString();
  const lesson: LessonLearned = {
    id: `lesson_${Date.now()}_${randomUUID().slice(0, 6)}`,
    category: input.category,
    topic: input.topic.trim(),
    insight: input.insight.trim(),
    recommendedAction: input.recommendedAction.trim(),
    confidence: Math.min(1.0, Math.max(0.1, input.confidence ?? 0.8)),
    reinforcements: 1,
    decayFactor: 1.0,
    tags: input.tags || [input.category],
    sourceMissionId: input.sourceMissionId,
    createdAt: now,
    updatedAt: now,
  };

  store.lessons[lesson.id] = lesson;
  queueSave();

  await appendAuditEvent({
    actor: 'long-term-memory',
    workspace: 'AI-Ops',
    action: 'memory.lesson_added',
    target: lesson.id,
    risk: 'LOW',
    status: 'executed',
    summary: `Lesson learned added: "${lesson.topic}" (${lesson.category})`,
    evidence: { category: lesson.category, topic: lesson.topic, confidence: lesson.confidence },
  }).catch(() => undefined);

  return lesson;
}

export async function searchLongTermMemory(
  query: string,
  category?: LessonCategory,
  limit = 5
): Promise<LessonLearned[]> {
  await writeQueue.catch(() => undefined);
  const lessons = Object.values(store.lessons);

  const scored = lessons
    .filter((l) => !category || l.category === category)
    .map((l) => {
      const score = computeJaccardSimilarity(query, `${l.topic} ${l.insight} ${l.tags.join(' ')}`);
      // Weighted by confidence and decay
      const finalScore = score * l.confidence * l.decayFactor;
      return { lesson: l, score: finalScore };
    })
    .filter((item) => item.score > 0.05)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, Math.min(limit, 20)))
    .map((item) => {
      item.lesson.lastUsedAt = new Date().toISOString();
      return item.lesson;
    });

  if (scored.length > 0) {
    queueSave();
  }

  return scored;
}

export async function injectLessonsIntoSystemPrompt(
  baseSystemPrompt: string,
  category: LessonCategory,
  taskDescription: string,
  maxLessons = 3
): Promise<string> {
  const relevantLessons = await searchLongTermMemory(taskDescription, category, maxLessons);
  if (relevantLessons.length === 0) return baseSystemPrompt;

  const lessonsBlock = [
    '',
    '─── LESSONS LEARNED & BEST PRACTICES (FROM PAST MISSIONS) ───',
    ...relevantLessons.map(
      (l, idx) =>
        `${idx + 1}. [${l.topic}] ${l.insight} -> Action: ${l.recommendedAction} (Confidence: ${(l.confidence * 100).toFixed(0)}%)`
    ),
    '─────────────────────────────────────────────────────────────',
    '',
  ].join('\n');

  return `${baseSystemPrompt}\n${lessonsBlock}`;
}

export async function reinforceLesson(lessonId: string, success: boolean): Promise<LessonLearned | null> {
  await writeQueue.catch(() => undefined);
  const lesson = store.lessons[lessonId];
  if (!lesson) return null;

  if (success) {
    lesson.reinforcements += 1;
    lesson.confidence = Math.min(1.0, lesson.confidence + 0.05);
    lesson.decayFactor = 1.0;
  } else {
    lesson.confidence = Math.max(0.1, lesson.confidence - 0.1);
    lesson.decayFactor = Math.max(0.2, lesson.decayFactor - 0.15);
  }

  lesson.updatedAt = new Date().toISOString();
  queueSave();
  return lesson;
}

export async function listLessonsLearned(category?: LessonCategory, limit = 50): Promise<LessonLearned[]> {
  await writeQueue.catch(() => undefined);
  let lessons = Object.values(store.lessons);
  if (category) lessons = lessons.filter((l) => l.category === category);
  return lessons.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, limit);
}
