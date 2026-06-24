/**
 * unifiedSearchEngine.ts
 * ============================================================
 * Unified Search Engine — tìm kiếm xuyên suốt toàn bộ hệ thống:
 * 1. Codebase (localSearchService TF-IDF)
 * 2. Agent Memory (compoundMemory)
 * 3. Knowledge Graph (knowledgeGraph)
 * 4. Runbook Evidence (browserRunbookEngine)
 *
 * Đây là engine chính cho Agentic RAG Deep Integration.
 */
import { searchCodebase as searchCode, buildSearchIndex } from './localSearchService';
import { searchMemory, type MemorySearchResult } from './compoundMemory';
import { searchKnowledgeGraph, type KnowledgeSearchResult } from './knowledgeGraph';

// ─── Types ──────────────────────────────────────────────────────────
export type SearchSource = 'codebase' | 'memory' | 'knowledge_graph' | 'runbook';

export interface UnifiedSearchHit {
  source: SearchSource;
  score: number;
  title: string;
  snippet: string;
  detail: Record<string, unknown>;
  id: string;
}

export interface UnifiedSearchResult {
  query: string;
  hits: UnifiedSearchHit[];
  bySource: Record<SearchSource, UnifiedSearchHit[]>;
  totalHits: number;
  searchMs: number;
  suggestions: string[];
}

export interface SearchContext {
  query: string;
  domain?: string;
  filePath?: string;
  maxResults?: number;
  sources?: SearchSource[];
}

// ─── Core ───────────────────────────────────────────────────────────

export async function searchEverything(ctx: SearchContext): Promise<UnifiedSearchResult> {
  const started = Date.now();
  const sources = ctx.sources || ['codebase', 'memory', 'knowledge_graph'];
  const maxPerSource = Math.ceil((ctx.maxResults || 20) / sources.length);
  const allHits: UnifiedSearchHit[] = [];
  const suggestions: string[] = [];

  // Search in parallel
  const promises: Promise<UnifiedSearchHit[]>[] = [];

  // 1. Codebase search (TF-IDF)
  if (sources.includes('codebase')) {
    promises.push((async () => {
      try {
        const fileResults = await searchCode(ctx.query, maxPerSource * 2 || 10);
        return fileResults.map(r => ({
          source: 'codebase' as SearchSource,
          score: r.score,
          title: r.relativePath,
          snippet: r.snippet?.slice(0, 250) || '',
          detail: { relativePath: r.relativePath },
          id: `cb_${r.relativePath}`,
        }));
      } catch { return []; }
    })());
  }

  // 2. Memory search (compound)
  if (sources.includes('memory')) {
    promises.push((async () => {
      try {
        const memResults = await searchMemory(ctx.query, { domain: ctx.domain, limit: maxPerSource * 2 });
        return memResults.map((r: MemorySearchResult) => ({
          source: 'memory' as SearchSource,
          score: r.score || 0,
          title: r.title,
          snippet: r.content?.slice(0, 250) || '',
          detail: { domain: r.domain, kind: r.kind, confidence: r.confidence },
          id: r.id,
        }));
      } catch { return []; }
    })());
  }

  // 3. Knowledge Graph search
  if (sources.includes('knowledge_graph')) {
    promises.push((async () => {
      try {
        const kgResults = searchKnowledgeGraph(ctx.query, { maxResults: maxPerSource * 2 });
        return kgResults.map((r: KnowledgeSearchResult) => ({
          source: 'knowledge_graph' as SearchSource,
          score: r.score,
          title: r.node.label,
          snippet: r.node.description?.slice(0, 250) || '',
          detail: { type: r.node.type, relations: r.relations.length },
          id: r.node.id,
        }));
      } catch { return []; }
    })());
  }

  const results = await Promise.all(promises);
  for (const hits of results) allHits.push(...hits);

  // Sort by score
  allHits.sort((a, b) => b.score - a.score);

  // By source
  const bySource: Record<SearchSource, UnifiedSearchHit[]> = { codebase: [], memory: [], knowledge_graph: [], runbook: [] };
  for (const hit of allHits) bySource[hit.source].push(hit);

  // Generate suggestions
  if (allHits.length === 0) {
    suggestions.push('Thử rút gọn query hoặc dùng từ khóa đơn giản hơn.');
    suggestions.push('Kiểm tra xem codebase index đã được build chưa (POST /api/search/reindex).');
    suggestions.push('Chạy agent loop vài lần để tích lũy memory.');
  } else if (bySource.codebase.length === 0) {
    suggestions.push('Hãy build code index: POST /api/search/reindex.');
  }

  return {
    query: ctx.query,
    hits: allHits.slice(0, ctx.maxResults || 20),
    bySource,
    totalHits: allHits.length,
    searchMs: Date.now() - started,
    suggestions,
  };
}

export async function searchWithRagContext(
  userQuery: string,
  options: { domain?: string; filePath?: string; maxResults?: number } = {}
): Promise<{ enrichedContext: string; sourceSummary: string }> {
  const result = await searchEverything({
    query: userQuery,
    domain: options.domain,
    filePath: options.filePath,
    maxResults: options.maxResults || 15,
    sources: ['codebase', 'memory', 'knowledge_graph'],
  });

  if (result.totalHits === 0) return { enrichedContext: '', sourceSummary: 'No relevant knowledge found.' };

  const parts: string[] = ['## Unified Knowledge Context\n'];

  // Code files found
  if (result.bySource.codebase.length > 0) {
    parts.push('### Relevant Code Files');
    for (const h of result.bySource.codebase.slice(0, 5)) {
      parts.push(`- \`${h.title}\`: ${h.snippet}`);
    }
  }

  // Memory records
  if (result.bySource.memory.length > 0) {
    parts.push('\n### Past Agent Experience');
    for (const h of result.bySource.memory.slice(0, 5)) {
      parts.push(`- **${h.title}** (${h.detail.domain}, conf: ${(Number(h.detail.confidence)*100).toFixed(0)}%): ${h.snippet}`);
    }
  }

  // Knowledge graph
  if (result.bySource.knowledge_graph.length > 0) {
    parts.push('\n### Connected Knowledge');
    for (const h of result.bySource.knowledge_graph.slice(0, 3)) {
      parts.push(`- ${h.title} (${h.detail.type}, ${h.detail.relations} relations)`);
    }
  }

  const sourceSummary = `${result.bySource.codebase.length} files, ${result.bySource.memory.length} memories, ${result.bySource.knowledge_graph.length} graph nodes matched.`;

  return { enrichedContext: parts.join('\n'), sourceSummary };
}
