/**
 * contextWindowManager.ts
 * ============================================================
 * Context Window Manager — quản lý context window thông minh.
 * Tự động: estimate token count, summarize khi vượt limit,
 * cắt/prune context không quan trọng, inject curated memory.
 */
import { dispatchTextThroughFabric } from './aiFabric';
import { searchMemory } from './compoundMemory';
import { searchKnowledgeGraph } from './knowledgeGraph';

// ─── Types ──────────────────────────────────────────────────────────
export interface WindowSegment {
  id: string;
  type: 'system' | 'user' | 'assistant' | 'memory' | 'knowledge';
  content: string;
  tokenEstimate: number;
  priority: number;           // 0-10, càng cao càng quan trọng
  createdAt: string;
}

export interface ContextWindow {
  id: string;
  segments: WindowSegment[];
  maxTokens: number;
  currentTokens: number;
  summary: string;            // Tóm tắt các segment đã bị prune
  pruneHistory: Array<{ at: string; reason: string; prunedCount: number }>;
  createdAt?: string;
}

export interface ContextStrategy {
  maxTokens: number;          // Tổng token tối đa (default 4096)
  reserveForResponse: number; // Dự trữ cho response (default 1024)
  summarizationThreshold: number; // % vượt để trigger summarize (default 0.85)
  keepLastN: number;          // Luôn giữ N segment cuối (default 6)
  prioritySystemMin: number;  // Priority tối thiểu để giữ system prompt (default 9)
  autoInjectMemory: boolean;  // Tự động inject memory liên quan
}

// ─── Default strategy ───────────────────────────────────────────────
const DEFAULT_STRATEGY: ContextStrategy = {
  maxTokens: 4096,
  reserveForResponse: 1024,
  summarizationThreshold: 0.85,
  keepLastN: 6,
  prioritySystemMin: 9,
  autoInjectMemory: true,
};

// ─── Active windows ─────────────────────────────────────────────────
const activeWindows = new Map<string, ContextWindow>();

// ─── Core API ───────────────────────────────────────────────────────

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.5);
}

export function createContextWindow(
  id: string,
  strategy?: Partial<ContextStrategy>
): ContextWindow {
  const s = { ...DEFAULT_STRATEGY, ...strategy };
  const window: ContextWindow = {
    id,
    segments: [],
    maxTokens: s.maxTokens,
    currentTokens: 0,
    summary: '',
    pruneHistory: [],
    createdAt: new Date().toISOString(),
  };
  activeWindows.set(id, window);
  return window;
}

export function addSegment(
  windowId: string,
  type: WindowSegment['type'],
  content: string,
  priority = 5,
): void {
  const window = activeWindows.get(windowId);
  if (!window) return;

  const tokens = estimateTokens(content);
  const segment: WindowSegment = {
    id: `seg_${Date.now()}_${Math.random().toString(16).slice(2, 4)}`,
    type, content, tokenEstimate: tokens, priority,
    createdAt: new Date().toISOString(),
  };

  window.segments.push(segment);
  window.currentTokens += tokens;

  // Check if we need to prune
  const strategy = DEFAULT_STRATEGY;
  const effectiveMax = window.maxTokens - strategy.reserveForResponse;
  if (window.currentTokens > effectiveMax * strategy.summarizationThreshold) {
    pruneWindow(windowId, strategy);
  }
}

export async function injectMemoryContext(
  windowId: string,
  query: string,
  domain?: string,
): Promise<void> {
  try {
    const memResults = await searchMemory(query, { domain, limit: 3 });
    const kgResults = searchKnowledgeGraph(query, { maxResults: 2 });

    if (memResults.length > 0) {
      const memText = `[RELEVANT MEMORY]\n${memResults.map(m => `- ${m.title} (${m.domain}, confidence: ${(m.confidence * 100).toFixed(0)}%): ${m.content.slice(0, 200)}`).join('\n')}`;
      addSegment(windowId, 'memory', memText, 7);
    }

    if (kgResults.length > 0) {
      const kgText = `[KNOWLEDGE GRAPH]\n${kgResults.map(r => `- ${r.node.label} (${r.node.type}, ${r.relations.length} relations)`).join('\n')}`;
      addSegment(windowId, 'knowledge', kgText, 6);
    }
  } catch { /* memory is optional */ }
}

export function getContextWindow(id: string): ContextWindow | undefined {
  return activeWindows.get(id);
}

export function getAllSegments(windowId: string): WindowSegment[] {
  return activeWindows.get(windowId)?.segments || [];
}

export function removeWindow(id: string): void {
  activeWindows.delete(id);
}

// ─── Pruning ────────────────────────────────────────────────────────

function pruneWindow(windowId: string, strategy: ContextStrategy): void {
  const window = activeWindows.get(windowId);
  if (!window || window.segments.length <= strategy.keepLastN) return;

  const effectiveMax = window.maxTokens - strategy.reserveForResponse;
  const excessTokens = window.currentTokens - effectiveMax * strategy.summarizationThreshold;
  if (excessTokens <= 0) return;

  // Protect: keep last N segments + high-priority system messages
  const keepCount = strategy.keepLastN;
  const protectedIdx = window.segments.length - keepCount;
  let prunedCount = 0;
  let prunedTokens = 0;

  // Sort segments by priority (low to high) but only in the pruneable range
  const pruneableSegments = window.segments.slice(0, protectedIdx);
  pruneableSegments.sort((a, b) => a.priority - b.priority);

  const toRemove = new Set<string>();
  for (const seg of pruneableSegments) {
    if (prunedTokens >= excessTokens) break;
    if (seg.priority >= strategy.prioritySystemMin && seg.type === 'system') continue;
    toRemove.add(seg.id);
    prunedTokens += seg.tokenEstimate;
    prunedCount++;
  }

  if (toRemove.size === 0) return;

  // Save summary of pruned content
  const prunedContents = window.segments
    .filter(s => toRemove.has(s.id))
    .map(s => `[${s.type}] ${s.content.slice(0, 100)}`)
    .join(' | ');

  window.summary = `Previously: ${prunedContents}...`;
  window.segments = window.segments.filter(s => !toRemove.has(s.id));
  window.currentTokens = window.segments.reduce((sum, s) => sum + s.tokenEstimate, 0);
  window.pruneHistory.push({
    at: new Date().toISOString(),
    reason: `Exceeded ${effectiveMax * strategy.summarizationThreshold} tokens (was ${window.currentTokens + prunedTokens})`,
    prunedCount,
  });
}

export async function deepSummarize(windowId: string): Promise<string> {
  const window = activeWindows.get(windowId);
  if (!window || window.segments.length === 0) return '';

  const allContent = window.segments
    .map(s => `[${s.type}] ${s.content.slice(0, 300)}`)
    .join('\n---\n');

  try {
    const summary = await dispatchTextThroughFabric(
      `Summarize this conversation context in 3-5 bullet points:\n\n${allContent.slice(0, 4000)}`,
      'Trả lời bằng tiếng Việt, ngắn gọn, bullet points.',
      { domain: 'general', task: 'general', localFallback: true }
    );

    return summary.winner?.contentPreview || window.summary;
  } catch {
    return window.summary || allContent.slice(0, 500);
  }
}

// ─── Alias exports for assistant-daemon compatibility ──────────────

export async function addMemoryContext(windowId: string, _query: string, _limit?: number): Promise<number> {
  // Stub: inject memory context into window (delegates to existing injectMemoryContext)
  await injectMemoryContext(windowId, _query);
  return 1;
}

export function addKnowledgeContext(windowId: string, _query: string): number {
  // Stub: inject knowledge base context into window
  const window = activeWindows.get(windowId);
  if (!window) return 0;
  addSegment(windowId, 'knowledge', `KB context for: ${_query.slice(0, 200)}`, 5);
  return 1;
}

export function pruneContextWindow(windowId: string): { pruned: number; remainingTokens: number } {
  const window = activeWindows.get(windowId);
  if (!window) return { pruned: 0, remainingTokens: 0 };
  const before = window.segments.length;
  pruneWindow(windowId, { keepLastN: 10, reserveForResponse: 1000, summarizationThreshold: 0.8, prioritySystemMin: 8, maxTokens: window.maxTokens, autoInjectMemory: true });
  return { pruned: before - window.segments.length, remainingTokens: window.currentTokens };
}

export async function summarizeContext(windowId: string): Promise<string> {
  return deepSummarize(windowId);
}

export function listContextWindows() {
  return Array.from(activeWindows.entries()).map(([id, w]) => ({
    id,
    createdAt: w.createdAt,
    segments: w.segments.length,
    currentTokens: w.currentTokens,
    maxTokens: w.maxTokens,
  }));
}

export function deleteContextWindow(id: string): boolean {
  const existed = activeWindows.has(id);
  activeWindows.delete(id);
  return existed;
}
