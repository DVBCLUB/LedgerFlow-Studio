/**
 * compoundMemory.ts
 * ============================================================
 * Compound Memory System — ba tầng bộ nhớ cho AI agent.
 *
 * Tầng 1: Session Memory (in-memory, sống trong 1 phiên)
 * Tầng 2: Short-term Memory (JSON file, 30 ngày, tự động ghi)
 * Tầng 3: Long-term Memory (MEMORY.md, curated thủ công/auto-review)
 *
 * Mỗi tầng đều file-based, có thể đọc, debug, version-control.
 */
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'node:crypto';
import { ensureRuntimeRootSync, resolveRuntimePathFromEnv, resolveRuntimeReadPathFromEnv } from './runtimePaths.ts';

// ─── Types ──────────────────────────────────────────────────────────

export type MemoryTier = 'session' | 'short_term' | 'long_term';
export type MemoryKind = 'observation' | 'lesson' | 'pattern' | 'fact' | 'procedure';

export interface MemoryRecord {
  id: string;
  tier: MemoryTier;
  kind: MemoryKind;
  domain: string;
  title: string;
  content: string;
  confidence: number;              // 0-1, agent tự đánh giá độ tin cậy
  source: string;                  // VD: "agentic_loop:loop_123_step_2"
  tags: string[];
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;              // Cho short-term
  usageCount: number;              // Số lần được truy xuất
  lastAccessedAt?: string;
}

export interface MemorySearchResult extends MemoryRecord {
  score: number;                   // Relevance score
  matchReason: string;             // Why this was matched
}

export interface CompoundMemoryStats {
  session: { count: number };
  shortTerm: { count: number; oldestAt?: string };
  longTerm: { count: number; lastCuratedAt?: string };
  totalRecords: number;
}

// ─── Storage paths ──────────────────────────────────────────────────
const SHORT_TERM_FILE = resolveRuntimePathFromEnv('COMPOUND_MEMORY_SHORT_TERM_FILE', 'compound_memory_short_term.json');
const LONG_TERM_FILE = path.join(process.cwd(), 'MEMORY.md');
const CURATION_META_FILE = resolveRuntimePathFromEnv('COMPOUND_MEMORY_META_FILE', 'compound_memory_meta.json');

// ─── Session memory (in-memory) ─────────────────────────────────────
const sessionMemory = new Map<string, MemoryRecord>();

// ─── Short-term memory (persisted JSON) ────────────────────────────
let shortTermCache: MemoryRecord[] | null = null;

async function loadShortTerm(): Promise<MemoryRecord[]> {
  if (shortTermCache) return shortTermCache;
  try {
    const shortTermFile = resolveRuntimeReadPathFromEnv('COMPOUND_MEMORY_SHORT_TERM_FILE', 'compound_memory_short_term.json');
    if (!fs.existsSync(shortTermFile)) return [];
    const raw = await fs.promises.readFile(shortTermFile, 'utf8');
    shortTermCache = JSON.parse(raw) as MemoryRecord[];
    return shortTermCache!;
  } catch {
    return [];
  }
}

async function saveShortTerm(records: MemoryRecord[]): Promise<void> {
  shortTermCache = records;
  ensureRuntimeRootSync();
  await fs.promises.writeFile(SHORT_TERM_FILE, JSON.stringify(records, null, 2), 'utf8');
}

// ─── Long-term memory (MEMORY.md) ───────────────────────────────────
interface CurationMeta {
  lastCuratedAt?: string;
  curatedByIds: string[];
  version: number;
}

let curationMeta: CurationMeta | null = null;

async function loadCurationMeta(): Promise<CurationMeta> {
  if (curationMeta) return curationMeta;
  try {
    const curationMetaFile = resolveRuntimeReadPathFromEnv('COMPOUND_MEMORY_META_FILE', 'compound_memory_meta.json');
    if (!fs.existsSync(curationMetaFile)) {
      return { curatedByIds: [], version: 1 };
    }
    curationMeta = JSON.parse(await fs.promises.readFile(curationMetaFile, 'utf8'));
    return curationMeta!;
  } catch {
    return { curatedByIds: [], version: 1 };
  }
}

async function saveCurationMeta(meta: CurationMeta): Promise<void> {
  curationMeta = meta;
  ensureRuntimeRootSync();
  await fs.promises.writeFile(CURATION_META_FILE, JSON.stringify(meta, null, 2), 'utf8');
}

// ─── Core API ───────────────────────────────────────────────────────

export function createMemoryRecord(
  input: Omit<MemoryRecord, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>
): MemoryRecord {
  const now = new Date().toISOString();
  return {
    ...input,
    id: `mem_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
    createdAt: now,
    updatedAt: now,
    usageCount: 0,
  };
}

export function addSessionMemory(record: MemoryRecord): void {
  sessionMemory.set(record.id, record);
  // Auto-promote important records to short-term
  if (record.confidence >= 0.7 && record.tier !== 'long_term') {
    record.tier = 'short_term';
    persistToShortTerm(record).catch(() => undefined);
  }
}

export function getSessionMemory(id: string): MemoryRecord | undefined {
  return sessionMemory.get(id);
}

export function listSessionMemory(domain?: string): MemoryRecord[] {
  const all = Array.from(sessionMemory.values());
  return domain ? all.filter(r => r.domain === domain) : all;
}

export async function persistToShortTerm(record: MemoryRecord): Promise<void> {
  const records = await loadShortTerm();
  // Avoid duplicate by ID
  const existing = records.findIndex(r => r.id === record.id);
  if (existing >= 0) {
    records[existing] = { ...record, updatedAt: new Date().toISOString() };
  } else {
    record.tier = 'short_term';
    records.push(record);
  }
  // Purge expired
  const now = Date.now();
  const valid = records.filter(r => !r.expiresAt || new Date(r.expiresAt).getTime() > now);
  await saveShortTerm(valid.slice(-500)); // Keep last 500
}

export async function searchMemory(
  query: string,
  options: {
    domain?: string;
    tiers?: MemoryTier[];
    kinds?: MemoryKind[];
    limit?: number;
  } = {}
): Promise<MemorySearchResult[]> {
  const { domain, tiers = ['session', 'short_term', 'long_term'], kinds, limit = 10 } = options;
  const results: MemorySearchResult[] = [];

  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/).filter(Boolean);

  // Search in session
  if (tiers.includes('session')) {
    for (const record of sessionMemory.values()) {
      if (domain && record.domain !== domain) continue;
      if (kinds && !kinds.includes(record.kind)) continue;
      const score = computeRelevance(record, queryLower, queryTerms);
      if (score > 0) {
        results.push({ ...record, score, matchReason: `Matched in session (${record.kind})` });
      }
    }
  }

  // Search in short-term
  if (tiers.includes('short_term')) {
    const shortTerm = await loadShortTerm();
    for (const record of shortTerm) {
      if (domain && record.domain !== domain) continue;
      if (kinds && !kinds.includes(record.kind)) continue;
      const score = computeRelevance(record, queryLower, queryTerms);
      if (score > 0) {
        results.push({ ...record, score, matchReason: `Matched in short-term (${record.kind})` });
      }
    }
  }

  // Search in long-term (MEMORY.md)
  if (tiers.includes('long_term')) {
    try {
      if (fs.existsSync(LONG_TERM_FILE)) {
        const content = await fs.promises.readFile(LONG_TERM_FILE, 'utf8');
        const sections = content.split(/^## /m).filter(Boolean);
        for (const section of sections) {
          const score = computeTextRelevance(section, queryLower, queryTerms);
          if (score > 0) {
            const title = section.split('\n')[0].trim();
            const meta = await loadCurationMeta();
            results.push({
              id: `long_term_${title.slice(0, 20).replace(/[^a-z0-9]/gi, '_')}`,
              tier: 'long_term',
              kind: 'fact',
              domain: domain || 'general',
              title: title.slice(0, 80),
              content: section.slice(0, 500),
              confidence: 0.9,
              source: 'MEMORY.md',
              tags: [],
              createdAt: meta.lastCuratedAt || new Date().toISOString(),
              updatedAt: meta.lastCuratedAt || new Date().toISOString(),
              usageCount: 0,
              score,
              matchReason: `Matched in long-term MEMORY.md`,
            });
          }
        }
      }
    } catch { /* long-term not available */ }
  }

  // Sort by score desc, then by recency
  results.sort((a, b) => b.score - a.score || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Update usage counts
  for (const r of results.slice(0, limit)) {
    const record = sessionMemory.get(r.id);
    if (record) {
      record.usageCount++;
      record.lastAccessedAt = new Date().toISOString();
    }
  }

  return results.slice(0, limit);
}

export async function recordObservation(
  domain: string,
  title: string,
  content: string,
  confidence: number,
  source: string,
  success: boolean
): Promise<MemoryRecord> {
  const record = createMemoryRecord({
    tier: 'session',
    kind: success ? 'pattern' : 'lesson',
    domain,
    title: title.slice(0, 120),
    content: content.slice(0, 2000),
    confidence: Math.min(1, Math.max(0, confidence)),
    source,
    tags: [success ? 'success' : 'failure', domain],
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
  });

  addSessionMemory(record);
  return record;
}

export async function promoteToLongTerm(
  shortTermId: string,
  curatedTitle?: string,
  curatedContent?: string
): Promise<boolean> {
  const records = await loadShortTerm();
  const record = records.find(r => r.id === shortTermId);
  if (!record) {
    // Check session too
    const sessionRecord = sessionMemory.get(shortTermId);
    if (!sessionRecord) return false;

    // Append to MEMORY.md
    const entry = formatMemoryEntry(sessionRecord, curatedTitle, curatedContent);
    await appendToLongTermFile(entry);

    // Update curation meta
    const meta = await loadCurationMeta();
    meta.curatedByIds.push(shortTermId);
    meta.lastCuratedAt = new Date().toISOString();
    meta.version++;
    await saveCurationMeta(meta);

    return true;
  }

  const entry = formatMemoryEntry(record, curatedTitle, curatedContent);
  await appendToLongTermFile(entry);

  const meta = await loadCurationMeta();
  meta.curatedByIds.push(shortTermId);
  meta.lastCuratedAt = new Date().toISOString();
  meta.version++;
  await saveCurationMeta(meta);

  return true;
}

export async function getStats(): Promise<CompoundMemoryStats> {
  const shortTerm = await loadShortTerm();
  const meta = await loadCurationMeta();

  return {
    session: { count: sessionMemory.size },
    shortTerm: {
      count: shortTerm.length,
      oldestAt: shortTerm.length > 0
        ? shortTerm.reduce((oldest, r) => r.createdAt < oldest ? r.createdAt : oldest, shortTerm[0].createdAt)
        : undefined,
    },
    longTerm: {
      count: meta.curatedByIds.length,
      lastCuratedAt: meta.lastCuratedAt,
    },
    totalRecords: sessionMemory.size + shortTerm.length + meta.curatedByIds.length,
  };
}

export async function cleanExpiredShortTerm(): Promise<number> {
  const records = await loadShortTerm();
  const now = Date.now();
  const valid = records.filter(r => !r.expiresAt || new Date(r.expiresAt).getTime() > now);
  const cleaned = records.length - valid.length;
  if (cleaned > 0) {
    await saveShortTerm(valid);
  }
  return cleaned;
}

export function clearSessionMemory(): void {
  sessionMemory.clear();
}

// ─── Helpers ────────────────────────────────────────────────────────

function computeRelevance(record: MemoryRecord, queryLower: string, queryTerms: string[]): number {
  let score = 0;
  const titleLower = record.title.toLowerCase();
  const contentLower = record.content.toLowerCase();

  // Title match (high weight)
  if (titleLower.includes(queryLower)) score += 10;
  for (const term of queryTerms) {
    if (titleLower.includes(term)) score += 4;
    if (contentLower.includes(term)) score += 2;
    if (record.tags.some(t => t.toLowerCase().includes(term))) score += 3;
    if (record.domain.toLowerCase().includes(term)) score += 1;
  }

  // Boost by confidence and usage
  score *= (0.5 + record.confidence * 0.5);
  score *= (1 + Math.min(record.usageCount, 10) * 0.05);

  return score;
}

function computeTextRelevance(text: string, queryLower: string, queryTerms: string[]): number {
  const textLower = text.toLowerCase();
  let score = 0;
  if (textLower.includes(queryLower)) score += 8;
  for (const term of queryTerms) {
    if (textLower.includes(term)) score += 2;
  }
  return score;
}

function formatMemoryEntry(record: MemoryRecord, curatedTitle?: string, curatedContent?: string): string {
  const title = curatedTitle || record.title;
  const content = curatedContent || record.content;
  return `\n## ${title}\n\n**Domain:** ${record.domain} | **Kind:** ${record.kind} | **Confidence:** ${(record.confidence * 100).toFixed(0)}%\n\n${content}\n\n> Source: ${record.source} | Created: ${record.createdAt}\n`;
}

async function appendToLongTermFile(entry: string): Promise<void> {
  if (!fs.existsSync(LONG_TERM_FILE)) {
    await fs.promises.writeFile(LONG_TERM_FILE, `# LedgerFlow Agent Long-Term Memory\n\n> Auto-curated knowledge from agent observations. Version-controlled.\n\n`, 'utf8');
  }
  await fs.promises.appendFile(LONG_TERM_FILE, entry, 'utf8');
}
