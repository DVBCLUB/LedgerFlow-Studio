/**
 * server/services/glaciaKnowledgeDistiller.ts
 * ============================================================================
 * Glacia Knowledge Distillation & Project Rule Engine
 * ============================================================================
 * Đúc kết kinh nghiệm sau khi giải quyết bài toán kỹ thuật, lưu trữ dạng Lesson
 * có TTL (Time-To-Live), lập chỉ mục Vector RAG và xuất ra file .glaciarules.
 */

import fs from 'fs';
import path from 'path';
import { createNamespace, insertDocument, searchSimilar } from './vectorEmbeddingStore.ts';
import { addMemoryEntry } from './glaciaMemoryVault.ts';
import { resolveRuntimeDirPath } from './runtimePaths.ts';

export interface DistilledLesson {
  id: string;
  summary: string;
  query: string;
  solution: string;
  codeSnippet?: string;
  sourceUrl?: string;
  tags: string[];
  ttlDays: number;
  createdAt: string;
  expiresAt: string;
  useCount: number;
  confidence: number; // 0 - 100
}

export interface CreateLessonInput {
  summary: string;
  query: string;
  solution: string;
  codeSnippet?: string;
  sourceUrl?: string;
  tags?: string[];
  ttlDays?: number;
  confidence?: number;
}

const LESSONS_FILE = path.join(resolveRuntimeDirPath('glacia'), 'distilled_lessons.json');
const GLACIA_LESSONS_NAMESPACE = 'glacia_lessons';

function ensureLessonsNamespace() {
  try {
    createNamespace(GLACIA_LESSONS_NAMESPACE);
  } catch {}
}

function loadLessons(): DistilledLesson[] {
  try {
    if (!fs.existsSync(LESSONS_FILE)) {
      const dir = path.dirname(LESSONS_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const initial: DistilledLesson[] = [
        {
          id: 'lesson_blender_eevee_next',
          summary: 'Blender 4.2 EEVEE Next: Tối ưu vật liệu kính pha lê băng',
          query: 'Blender 4.2 shader pha lê băng trong suốt',
          solution: 'Sử dụng Transmission Weight = 0.95 và IOR = 1.45 trên Principled BSDF node.',
          codeSnippet: "mat.node_tree.nodes['Principled BSDF'].inputs['Transmission Weight'].default_value = 0.95",
          sourceUrl: 'https://docs.blender.org/manual/en/latest/render/eevee/materials.html',
          tags: ['blender', 'eevee_next', 'materials', 'shader'],
          ttlDays: 90,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 90 * 86400000).toISOString(),
          useCount: 3,
          confidence: 98,
        },
      ];
      fs.writeFileSync(LESSONS_FILE, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const raw = fs.readFileSync(LESSONS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLessons(lessons: DistilledLesson[]): void {
  try {
    const dir = path.dirname(LESSONS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LESSONS_FILE, JSON.stringify(lessons, null, 2), 'utf8');
  } catch {}
}

/**
 * Đúc kết một bài học mới vào bộ nhớ dài hạn
 */
export function distillKnowledgeLesson(input: CreateLessonInput): DistilledLesson {
  ensureLessonsNamespace();
  const lessons = loadLessons();

  const ttl = input.ttlDays ?? 30;
  const now = new Date();
  const expires = new Date(now.getTime() + ttl * 86400000);

  const lesson: DistilledLesson = {
    id: `lesson_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    summary: input.summary,
    query: input.query,
    solution: input.solution,
    codeSnippet: input.codeSnippet,
    sourceUrl: input.sourceUrl,
    tags: input.tags || ['general_dev'],
    ttlDays: ttl,
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    useCount: 1,
    confidence: input.confidence ?? 95,
  };

  // 1. Lưu vào file danh sách lessons
  lessons.unshift(lesson);
  saveLessons(lessons);

  // 2. Vectorize vào glacia_lessons namespace
  const vectorContent = `Lesson: ${lesson.summary}\nProblem: ${lesson.query}\nSolution: ${lesson.solution}\nTags: ${lesson.tags.join(', ')}`;
  insertDocument(GLACIA_LESSONS_NAMESPACE, vectorContent, {
    lessonId: lesson.id,
    summary: lesson.summary,
    tags: lesson.tags.join(','),
    expiresAt: lesson.expiresAt,
  });

  // 3. Đưa vào Glacia Memory Vault dạng insight
  try {
    addMemoryEntry({
      category: 'insight',
      title: `[Distilled Lesson] ${lesson.summary}`,
      content: `Vấn đề: ${lesson.query}\nGiải pháp đã kiểm chứng: ${lesson.solution}\nSource: ${lesson.sourceUrl || 'Tự đúc kết'}`,
      tags: ['distilled_lesson', ...lesson.tags],
      importance: lesson.confidence >= 90 ? 'high' : 'medium',
      emotionalValence: 0.8,
    });
  } catch {}

  return lesson;
}

/**
 * Tra cứu bài học bằng Semantic Vector Search hoặc Keyword matching
 */
export function searchKnowledgeLessons(query: string, limit = 5): DistilledLesson[] {
  ensureLessonsNamespace();
  const lessons = loadLessons();
  const now = new Date().toISOString();

  // Filter unexpired lessons first
  const activeLessons = lessons.filter((l) => l.expiresAt >= now);

  // Try semantic vector search
  const vectorHits = searchSimilar(GLACIA_LESSONS_NAMESPACE, query, limit);
  const matchedIds = new Set(vectorHits.map((h) => h.document.metadata?.lessonId).filter(Boolean));

  // Combine vector hits with keyword substring matches
  const qLower = query.toLowerCase();
  const results = activeLessons.filter((l) => {
    if (matchedIds.has(l.id)) return true;
    return (
      l.summary.toLowerCase().includes(qLower) ||
      l.query.toLowerCase().includes(qLower) ||
      l.tags.some((t) => t.toLowerCase().includes(qLower))
    );
  });

  // Increment use count for top matched lessons
  for (const match of results.slice(0, limit)) {
    match.useCount += 1;
  }
  saveLessons(lessons);

  return results.slice(0, limit);
}

/**
 * Lấy toàn bộ danh sách bài học đã đúc kết
 */
export function listDistilledLessons(): DistilledLesson[] {
  return loadLessons();
}

/**
 * Tự động xóa hoặc lọc bỏ các bài học đã quá hạn TTL
 */
export function expireStaleLessons(): { expiredCount: number; activeCount: number } {
  const lessons = loadLessons();
  const now = new Date().toISOString();
  const active = lessons.filter((l) => l.expiresAt >= now);
  const expiredCount = lessons.length - active.length;

  if (expiredCount > 0) {
    saveLessons(active);
  }

  return { expiredCount, activeCount: active.length };
}

/**
 * Xuất các bài học tích lũy thành file định dạng .glaciarules cho IDE
 */
export function exportProjectRules(): string {
  const lessons = loadLessons();
  const now = new Date().toISOString();
  const active = lessons.filter((l) => l.expiresAt >= now);

  const lines = [
    '# Glacia Distilled Project Rules & Learned Knowledge',
    `# Generated at: ${now}`,
    `# Total Active Lessons: ${active.length}`,
    '',
  ];

  for (const l of active) {
    lines.push(`## [${l.tags.join(', ')}] ${l.summary}`);
    lines.push(`- **Problem Context**: ${l.query}`);
    lines.push(`- **Verified Solution**: ${l.solution}`);
    if (l.codeSnippet) {
      lines.push('```');
      lines.push(l.codeSnippet);
      lines.push('```');
    }
    lines.push(`- *Confidence: ${l.confidence}% | Source: ${l.sourceUrl || 'Internal Experience'}*`);
    lines.push('');
  }

  return lines.join('\n');
}
