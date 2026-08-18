/**
 * localLearningStore.ts
 * ============================================================
 * "AI local học hỏi từ các AI khác" — bản NHẸ, bền vững, không tốn RAM:
 *
 *  - Không fine-tune (fine-tune cần GPU/RAM lớn).
 *  - Chỉ lưu bài học dạng text vào 1 file JSON (cap 2000 mục).
 *  - Tìm kiếm bằng keyword overlap (KHÔNG dùng embedding model → 0 RAM/GPU).
 *  - Mỗi lần AI local chạy sẽ nhận context là top-k bài học liên quan.
 *
 * Dùng chung bởi mọi nhân viên: mọi AI đều ghi bài học, AI local cũng đọc được.
 */

import fs from 'node:fs';
import { ensureRuntimeRootSync, resolveRuntimePathFromEnv, resolveRuntimeReadPathFromEnv } from './runtimePaths.ts';
import { isSupabaseConfigured, supabaseAdmin } from './supabaseClient.ts';

export interface CrossAiLesson {
  id: string;
  domain: string;
  title: string;
  content: string;
  source: string;
  success: boolean;
  confidence: number;
  createdAt: string;
}

const FILE = resolveRuntimePathFromEnv('CROSS_AI_LESSONS_FILE', 'cross_ai_lessons.json');
const MAX_LESSONS = 2000;
const MAX_CONTENT = 1200;

let cache: CrossAiLesson[] | null = null;

function load(): CrossAiLesson[] {
  if (cache) return cache;
  try {
    const p = resolveRuntimeReadPathFromEnv('CROSS_AI_LESSONS_FILE', 'cross_ai_lessons.json');
    if (!fs.existsSync(p)) {
      cache = [];
      return cache;
    }
    cache = JSON.parse(fs.readFileSync(p, 'utf8')) as CrossAiLesson[];
    return cache!;
  } catch {
    cache = [];
    return cache;
  }
}

function save(list: CrossAiLesson[]): void {
  cache = list;
  try {
    ensureRuntimeRootSync();
    fs.writeFileSync(FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (err) {
    console.error('[LearningStore] persist failed:', err);
  }
}

export function recordCrossAiLesson(input: {
  domain: string;
  title: string;
  content: string;
  source: string;
  success: boolean;
  confidence?: number;
}): CrossAiLesson {
  const list = load();
  const lesson: CrossAiLesson = {
    id: `lesson_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
    domain: input.domain || 'general',
    title: input.title.slice(0, 120),
    content: input.content.slice(0, MAX_CONTENT),
    source: input.source,
    success: input.success,
    confidence: Math.min(1, Math.max(0, input.confidence ?? (input.success ? 0.8 : 0.5))),
    createdAt: new Date().toISOString(),
  };
  list.unshift(lesson);
  if (list.length > MAX_LESSONS) list.length = MAX_LESSONS;
  save(list);
  return lesson;
}

function relevance(lesson: CrossAiLesson, terms: string[]): number {
  const hay = `${lesson.title} ${lesson.content} ${lesson.domain}`.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (hay.includes(term)) score += 1;
  }
  return score;
}

export function retrieveLessons(
  query: string,
  domain?: string,
  limit = 6
): Array<CrossAiLesson & { score: number }> {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const list = load().filter((l) => (domain ? l.domain === domain : true));
  const scored = list.map((l) => ({ ...l, score: terms.length ? relevance(l, terms) : 1 }));
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export function buildLocalContext(query: string, domain?: string, limit = 6): string {
  const lessons = retrieveLessons(query, domain, limit);
  if (!lessons.length) return '';
  const lines = lessons.map(
    (l) => `- [${l.domain}/${l.source}] ${l.title}: ${l.content.slice(0, 300)}`
  );
  return `\n\n## Kinh nghiệm đã học (từ các AI khác)\n${lines.join('\n')}`;
}

export function getLearningStats() {
  const list = load();
  const byDomain: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  for (const l of list) {
    byDomain[l.domain] = (byDomain[l.domain] || 0) + 1;
    bySource[l.source] = (bySource[l.source] || 0) + 1;
  }
  const success = list.filter((l) => l.success).length;
  return {
    total: list.length,
    successRate: list.length ? Math.round((success / list.length) * 100) : 0,
    byDomain,
    bySource,
  };
}

// ─── Training-set exporter (để fine-tune QLoRA sau này) ──────────────────────
export interface FinetuneSample {
  instruction: string;
  input: string;
  output: string;
}

export function exportLessonsForFinetune(options?: {
  domain?: string;
  minConfidence?: number;
  onlySuccess?: boolean;
  limit?: number;
}): FinetuneSample[] {
  const minConfidence = options?.minConfidence ?? 0.7;
  const onlySuccess = options?.onlySuccess !== false;
  const list = load()
    .filter((l) => (options?.domain ? l.domain === options.domain : true))
    .filter((l) => (onlySuccess ? l.success : true))
    .filter((l) => l.confidence >= minConfidence)
    .slice(0, options?.limit ?? 500);

  return list.map((l) => ({
    instruction: l.title,
    input: l.domain,
    output: l.content,
  }));
}

export function exportLessonsForFinetuneJsonl(options?: Parameters<typeof exportLessonsForFinetune>[0]): string {
  return exportLessonsForFinetune(options).map((s) => JSON.stringify(s)).join('\n');
}

// ─── Supabase offload: tri thức lên cloud, máy nhẹ, bền vững ──────────────────
export async function syncLessonsToSupabase(): Promise<{ synced: number; skipped: number; reason?: string }> {
  if (!isSupabaseConfigured()) return { synced: 0, skipped: 0, reason: 'Supabase chưa cấu hình.' };
  const list = load();
  if (!list.length) return { synced: 0, skipped: 0 };
  try {
    const sb = supabaseAdmin();
    const rows = list.map((l) => ({
      id: l.id,
      domain: l.domain,
      title: l.title,
      content: l.content,
      source: l.source,
      success: l.success,
      confidence: l.confidence,
      created_at: l.createdAt,
    }));
    const { error } = await sb.from('ai_lessons').upsert(rows, { onConflict: 'id' });
    if (error) return { synced: 0, skipped: list.length, reason: error.message };
    return { synced: rows.length, skipped: 0 };
  } catch (err) {
    return { synced: 0, skipped: 0, reason: err instanceof Error ? err.message : String(err) };
  }
}

export async function fetchLessonsFromSupabase(limit = 50, domain?: string): Promise<CrossAiLesson[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const sb = supabaseAdmin();
    let q = sb.from('ai_lessons').select('*').order('created_at', { ascending: false }).limit(limit);
    if (domain) q = q.eq('domain', domain);
    const { data, error } = await q;
    if (error || !data) return [];
    return data.map((r: any) => ({
      id: r.id,
      domain: r.domain,
      title: r.title,
      content: r.content,
      source: r.source,
      success: !!r.success,
      confidence: r.confidence,
      createdAt: r.created_at,
    }));
  } catch {
    return [];
  }
}

export async function pruneLocalLessons(keep = 200): Promise<{ pruned: number; cloud: { synced: number } }> {
  const sync = await syncLessonsToSupabase();
  const list = load();
  const before = list.length;
  // CHỈ cắt local khi đã sync thành công lên cloud (tránh mất dữ liệu).
  if (sync.synced > 0 && before > keep) save(list.slice(0, keep));
  return { pruned: sync.synced > 0 ? Math.max(0, before - keep) : 0, cloud: { synced: sync.synced } };
}
