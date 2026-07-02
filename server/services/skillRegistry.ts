/**
 * skillRegistry.ts
 * ============================================================
 * AI Skill Registry — agent tự học và đăng ký skill mới.
 * Agents có thể: discover skill, register skill, rate skill,
 * và tìm skill phù hợp nhất cho task cụ thể.
 */
import { randomUUID } from 'node:crypto';
import { searchMemory } from './compoundMemory';
import fs from 'fs';
import { ensureRuntimeRootSync, resolveRuntimePathFromEnv, resolveRuntimeReadPathFromEnv } from './runtimePaths.ts';

// ─── Types ──────────────────────────────────────────────────────────
export type SkillStatus = 'draft' | 'published' | 'deprecated';
export type SkillCategory = 'coding' | 'testing' | 'analysis' | 'generation' | 'security' | 'other';

export interface SkillDefinition {
  id: string;
  name: string;
  version: string;
  category: SkillCategory;
  description: string;
  prompt: string;               // System prompt khi dùng skill này
  tools: string[];              // Tools cần thiết
  requiredModels: string[];     // Model được khuyên dùng
  minConfidence: number;        // Confidence tối thiểu để auto-apply
  tags: string[];
  author: string;               // Agent hoặc user tạo
  status: SkillStatus;
  usageCount: number;
  successRate: number;
  avgLatencyMs: number;
  ratings: number[];            // 1-5 stars
  createdAt: string;
  updatedAt: string;
  registeredFromMemory?: string; // ID của memory record đã học
}

export interface SkillRecommendation {
  skill: SkillDefinition;
  matchScore: number;
  matchReason: string;
}

// ─── Storage ────────────────────────────────────────────────────────
const FILE = resolveRuntimePathFromEnv('SKILL_REGISTRY_FILE', 'skill_registry.json');
let skills: SkillDefinition[] = [];

function loadSync(): void {
  try {
    const file = resolveRuntimeReadPathFromEnv('SKILL_REGISTRY_FILE', 'skill_registry.json');
    if (fs.existsSync(file)) skills = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch { }
}
loadSync();

async function save(): Promise<void> {
  ensureRuntimeRootSync();
  await fs.promises.writeFile(FILE, JSON.stringify(skills, null, 2), 'utf8');
}

// ─── Default skills ─────────────────────────────────────────────────
const DEFAULT_SKILLS: Omit<SkillDefinition, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'code-generator', version: '1.0.0', category: 'coding', status: 'published',
    description: 'Viết code từ yêu cầu bằng ngôn ngữ tự nhiên.',
    prompt: 'Bạn là Code Generator. Viết code sạch, type-safe, có comment. Chỉ trả về code.',
    tools: ['write_file', 'read_file'], requiredModels: ['gpt-4o', 'claude-3.5-sonnet'],
    minConfidence: 0.7, tags: ['code', 'generation', 'typescript'],
    author: 'system', usageCount: 0, successRate: 100, avgLatencyMs: 0, ratings: [],
  },
  {
    name: 'code-reviewer', version: '1.0.0', category: 'coding', status: 'published',
    description: 'Review code về security, performance, và best practices.',
    prompt: 'Bạn là Code Reviewer. Kiểm tra security, performance, best practices. Trả về findings cụ thể.',
    tools: ['read_file', 'security_scan'], requiredModels: ['gpt-4o'],
    minConfidence: 0.75, tags: ['review', 'security', 'quality'],
    author: 'system', usageCount: 0, successRate: 100, avgLatencyMs: 0, ratings: [],
  },
  {
    name: 'test-writer', version: '1.0.0', category: 'testing', status: 'published',
    description: 'Viết unit test cho code TypeScript/JavaScript.',
    prompt: 'Bạn là Test Writer. Viết test đầy đủ, bao phủ edge case. Dùng vitest hoặc jest.',
    tools: ['read_file', 'write_file', 'run_test'], requiredModels: ['gpt-4o-mini', 'claude-3.5-sonnet'],
    minConfidence: 0.65, tags: ['test', 'unit-test', 'coverage'],
    author: 'system', usageCount: 0, successRate: 100, avgLatencyMs: 0, ratings: [],
  },
  {
    name: 'data-analyzer', version: '1.0.0', category: 'analysis', status: 'published',
    description: 'Phân tích dữ liệu, tạo báo cáo và biểu đồ.',
    prompt: 'Bạn là Data Analyzer. Phân tích dữ liệu, tìm pattern, đưa ra insight.',
    tools: ['read_data', 'calculate', 'generate_report'], requiredModels: ['gpt-4o'],
    minConfidence: 0.7, tags: ['analysis', 'report', 'data'],
    author: 'system', usageCount: 0, successRate: 100, avgLatencyMs: 0, ratings: [],
  },
  {
    name: 'security-auditor', version: '1.0.0', category: 'security', status: 'published',
    description: 'Quét code tìm lỗ hổng bảo mật.',
    prompt: 'Bạn là Security Auditor. Tìm lỗ hổng XSS, SQLi, hardcoded secret, eval, path traversal.',
    tools: ['read_file', 'security_scan'], requiredModels: ['gpt-4o'],
    minConfidence: 0.8, tags: ['security', 'audit', 'vulnerability'],
    author: 'system', usageCount: 0, successRate: 100, avgLatencyMs: 0, ratings: [],
  },
];

// ─── Init defaults ──────────────────────────────────────────────────
function ensureDefaults(): void {
  if (skills.length > 0) return;
  const createdAt = '2026-01-01T00:00:00.000Z';
  for (const s of DEFAULT_SKILLS) skills.push({ ...s, id: `skill_default_${s.name.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}`, createdAt, updatedAt: createdAt });
  save().catch(() => undefined);
}
ensureDefaults();

// ─── Core API ───────────────────────────────────────────────────────

export function registerSkill(input: {
  name: string; version?: string; category?: SkillCategory;
  description: string; prompt: string; tools?: string[];
  requiredModels?: string[]; tags?: string[]; author?: string;
  registeredFromMemory?: string;
}): SkillDefinition {
  const now = new Date().toISOString();
  const skill: SkillDefinition = {
    id: `skill_${Date.now()}_${randomUUID().slice(0, 6)}`,
    name: input.name,
    version: input.version || '1.0.0',
    category: input.category || 'other',
    description: input.description.slice(0, 300),
    prompt: input.prompt.slice(0, 2000),
    tools: input.tools || [],
    requiredModels: input.requiredModels || [],
    minConfidence: 0.7,
    tags: input.tags || [],
    author: input.author || 'agent',
    status: 'published',
    usageCount: 0,
    successRate: 100,
    avgLatencyMs: 0,
    ratings: [],
    createdAt: now,
    updatedAt: now,
    registeredFromMemory: input.registeredFromMemory,
  };

  skills.push(skill);
  save().catch(() => undefined);
  return skill;
}

export function getSkill(id: string): SkillDefinition | undefined {
  return skills.find(s => s.id === id);
}

export function listSkills(filter?: {
  category?: SkillCategory;
  status?: SkillStatus;
  tags?: string[];
  limit?: number;
}): SkillDefinition[] {
  let result = [...skills];
  if (filter?.category) result = result.filter(s => s.category === filter.category);
  if (filter?.status) result = result.filter(s => s.status === filter.status);
  if (filter?.tags?.length) result = result.filter(s => filter.tags!.some(t => s.tags.includes(t)));
  result.sort((a, b) => b.usageCount - a.usageCount || b.successRate - a.successRate);
  return result.slice(0, filter?.limit || 50);
}

export async function learnSkillFromMemory(memoryId: string): Promise<SkillDefinition | undefined> {
  const mems = await searchMemory(`success pattern`, { kinds: ['pattern'], limit: 1 });
  const mem = mems.find(m => m.id === memoryId);
  if (!mem) return undefined;

  // Auto-create skill from successful memory
  return registerSkill({
    name: `learned-${mem.title.slice(0, 40).replace(/[^a-z0-9]/gi, '-').toLowerCase()}`,
    description: `Tự động học từ memory: ${mem.title}`,
    prompt: `Context từ experience trước: ${mem.content.slice(0, 500)}`,
    category: 'other',
    tags: ['auto-learned', mem.domain],
    author: 'auto-curator',
    registeredFromMemory: memoryId,
  });
}

export function recommendSkills(
  task: string,
  domain: string,
  limit = 5,
): SkillRecommendation[] {
  const taskLower = task.toLowerCase();
  const results: SkillRecommendation[] = [];

  for (const skill of skills) {
    if (skill.status !== 'published') continue;

    let score = 0;
    const reasons: string[] = [];

    // Tag match
    for (const tag of skill.tags) {
      if (taskLower.includes(tag.toLowerCase())) { score += 3; reasons.push(`tag:${tag}`); }
    }

    // Name match
    if (taskLower.includes(skill.name.toLowerCase())) { score += 5; reasons.push('name match'); }

    // Description match
    if (skill.description.toLowerCase().split(/\s+/).some(w => taskLower.includes(w))) {
      score += 2; reasons.push('desc match');
    }

    // Category + domain match
    if (domain && skill.category.toLowerCase().includes(domain.toLowerCase())) {
      score += 2; reasons.push('domain match');
    }

    // Boost by success rate
    score *= (0.5 + skill.successRate / 200);

    if (score > 0) {
      results.push({ skill, matchScore: Math.round(score * 10) / 10, matchReason: reasons.join(', ') });
    }
  }

  results.sort((a, b) => b.matchScore - a.matchScore);
  return results.slice(0, limit);
}

export function recordSkillUsage(skillId: string, success: boolean, latencyMs: number): void {
  const skill = skills.find(s => s.id === skillId);
  if (!skill) return;

  skill.usageCount++;
  skill.successRate = +((skill.successRate * (skill.usageCount - 1) + (success ? 100 : 0)) / skill.usageCount).toFixed(1);
  skill.avgLatencyMs = Math.round((skill.avgLatencyMs * (skill.usageCount - 1) + latencyMs) / skill.usageCount);
  skill.updatedAt = new Date().toISOString();

  if (skill.usageCount % 10 === 0) save().catch(() => undefined);
}

export function rateSkill(skillId: string, rating: number): boolean {
  if (rating < 1 || rating > 5) return false;
  const skill = skills.find(s => s.id === skillId);
  if (!skill) return false;
  skill.ratings.push(rating);
  save().catch(() => undefined);
  return true;
}

export function getSkillStats(): {
  total: number;
  published: number;
  byCategory: Record<string, number>;
  mostUsed: { name: string; usage: number } | null;
  topRated: { name: string; avgRating: number } | null;
} {
  const byCategory: Record<string, number> = {};
  for (const s of skills) {
    if (s.status === 'published') byCategory[s.category] = (byCategory[s.category] || 0) + 1;
  }

  const sorted = [...skills].sort((a, b) => b.usageCount - a.usageCount);
  const mostUsed = sorted.length > 0 ? { name: sorted[0].name, usage: sorted[0].usageCount } : null;

  const rated = [...skills].filter(s => s.ratings.length > 0);
  rated.sort((a, b) => {
    const avgA = a.ratings.reduce((s, r) => s + r, 0) / a.ratings.length;
    const avgB = b.ratings.reduce((s, r) => s + r, 0) / b.ratings.length;
    return avgB - avgA;
  });
  const topRated = rated.length > 0
    ? { name: rated[0].name, avgRating: +(rated[0].ratings.reduce((s, r) => s + r, 0) / rated[0].ratings.length).toFixed(1) }
    : null;

  return {
    total: skills.length,
    published: skills.filter(s => s.status === 'published').length,
    byCategory,
    mostUsed,
    topRated,
  };
}
