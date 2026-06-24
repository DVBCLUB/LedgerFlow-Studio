/**
 * agenticRagRouter.ts
 * ============================================================
 * Agentic RAG Router — agent tự quyết định khi nào cần retrieve
 * từ knowledge base, cách reformulate query, và khi nào đã
 * đủ bằng chứng. Không retrieve một cách thụ động.
 */
import { searchMemory, type MemorySearchResult } from './compoundMemory';
import { dispatchTextThroughFabric } from './aiFabric';

// ─── Types ──────────────────────────────────────────────────────────
export interface RagDecision {
  needsRetrieval: boolean;
  reasoning: string;
  reformulatedQueries: string[];
  confidence: number; // 0-1: độ tin cậy của quyết định
}

export interface RagCycle {
  query: string;
  results: MemorySearchResult[];
  evaluated: boolean;
  sufficient: boolean;
  summary: string;
}

export interface AgenticRagResult {
  originalQuery: string;
  cycles: RagCycle[];
  finalContext: string;
  totalRetrieved: number;
  used: number;
  decision: RagDecision;
}

export interface RagOptions {
  domain?: string;
  maxCycles?: number;
  minConfidence?: number;
  minResults?: number;
}

// ─── Core Router ────────────────────────────────────────────────────

export async function agenticRetrieve(
  userQuery: string,
  context: string,
  options: RagOptions = {}
): Promise<AgenticRagResult> {
  const maxCycles = options.maxCycles ?? 3;
  const minConfidence = options.minConfidence ?? 0.6;
  const domain = options.domain;

  const result: AgenticRagResult = {
    originalQuery: userQuery,
    cycles: [],
    finalContext: '',
    totalRetrieved: 0,
    used: 0,
    decision: { needsRetrieval: false, reasoning: 'No decision yet', reformulatedQueries: [], confidence: 0 },
  };

  // Step 1: Decide if retrieval is needed
  const decision = await shouldRetrieve(userQuery, context);
  result.decision = decision;

  if (!decision.needsRetrieval) {
    return result;
  }

  // Step 2: Iterative retrieval
  let accumulatedContext = context;
  let allResults: MemorySearchResult[] = [];

  for (let cycle = 0; cycle < maxCycles; cycle++) {
    const query = decision.reformulatedQueries[cycle] || decision.reformulatedQueries[0] || userQuery;

    // Search across all memory tiers
    const searchResults = await searchMemory(query, {
      domain,
      tiers: ['session', 'short_term', 'long_term'],
      limit: 10,
    });

    result.totalRetrieved += searchResults.length;
    allResults.push(...searchResults);

    // Deduplicate by ID
    const seen = new Set<string>();
    allResults = allResults.filter(r => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });

    // Evaluate: is this enough?
    const evaluation = await evaluateResults(userQuery, accumulatedContext, allResults, searchResults);

    const cycleResult: RagCycle = {
      query,
      results: searchResults,
      evaluated: true,
      sufficient: evaluation.sufficient,
      summary: evaluation.summary,
    };
    result.cycles.push(cycleResult);

    if (evaluation.sufficient) {
      result.used = allResults.length;
      break;
    }

    // Reformulate for next cycle
    if (cycle < maxCycles - 1) {
      const reformulated = await reformulateQuery(userQuery, accumulatedContext, allResults);
      if (reformulated && !decision.reformulatedQueries.includes(reformulated)) {
        decision.reformulatedQueries.push(reformulated);
      }
    }
  }

  // Build final context from used results
  result.finalContext = buildContextFromResults(allResults.slice(0, Math.max(result.used, 5)), userQuery);

  return result;
}

// ─── Decision: Should we retrieve? ──────────────────────────────────

async function shouldRetrieve(query: string, context: string): Promise<RagDecision> {
  // Quick heuristic: if query is simple greeting or very short, skip
  const shortQuery = query.trim().toLowerCase();
  if (shortQuery.length < 10 || /^(hi|hello|ok|yes|no|thanks|bye|test)/i.test(shortQuery)) {
    return {
      needsRetrieval: false,
      reasoning: 'Simple or greeting query, no knowledge needed.',
      reformulatedQueries: [],
      confidence: 0.95,
    };
  }

  // Heuristic: if context already has relevant info, skip
  if (context.length > 500 && context.toLowerCase().includes(shortQuery.slice(0, 20))) {
    return {
      needsRetrieval: false,
      reasoning: 'Context already contains relevant information.',
      reformulatedQueries: [],
      confidence: 0.8,
    };
  }

  // Heuristic: if query contains question words or technical terms, retrieve
  const needsKnowledge = /(là gì|như thế nào|làm sao|tại sao|hướng dẫn|cách |fix |sửa |lỗi |error |bug |API |endpoint |function |type |interface )/i.test(query);
  if (needsKnowledge) {
    return {
      needsRetrieval: true,
      reasoning: 'Query indicates need for specific knowledge.',
      reformulatedQueries: [query],
      confidence: 0.7,
    };
  }

  // Default: retrieve for any substantial query
  return {
    needsRetrieval: true,
    reasoning: 'Default retrieval for substantial query.',
    reformulatedQueries: [query],
    confidence: 0.5,
  };
}

// ─── Evaluate: Is this enough evidence? ─────────────────────────────

async function evaluateResults(
  originalQuery: string,
  context: string,
  allResults: MemorySearchResult[],
  latestResults: MemorySearchResult[]
): Promise<{ sufficient: boolean; summary: string }> {
  // Heuristic: enough if we have 3+ high-confidence results
  const highConfidence = latestResults.filter(r => r.confidence >= 0.7 && r.score >= 2);
  if (highConfidence.length >= 3) {
    return {
      sufficient: true,
      summary: `Found ${highConfidence.length} high-confidence matches.`,
    };
  }

  // Heuristic: enough if total results >= 8
  if (allResults.length >= 8) {
    return {
      sufficient: true,
      summary: `Collected ${allResults.length} total results. Sufficient.`,
    };
  }

  // Heuristic: enough if latest query returned 0 results (no more to find)
  if (latestResults.length === 0) {
    return {
      sufficient: true,
      summary: 'No more results available in memory.',
    };
  }

  return {
    sufficient: false,
    summary: `Need more evidence. Have ${allResults.length} results, seeking more.`,
  };
}

// ─── Reformulate query for next cycle ───────────────────────────────

async function reformulateQuery(
  originalQuery: string,
  context: string,
  existingResults: MemorySearchResult[]
): Promise<string | null> {
  // Extract key terms from results we already have
  const existingTitles = existingResults.map(r => r.title.toLowerCase());
  const queryTerms = originalQuery.toLowerCase().split(/\s+/).filter(Boolean);

  // Find terms we haven't searched yet
  const newTerms: string[] = [];
  for (const term of queryTerms) {
    if (term.length < 3) continue;
    const alreadyFound = existingTitles.some(t => t.includes(term));
    if (!alreadyFound) newTerms.push(term);
  }

  if (newTerms.length >= 2) {
    return newTerms.join(' ');
  }

  // Try alternate formulations
  const alternates: Record<string, string[]> = {
    'lỗi': ['error', 'bug', 'fix', 'sửa'],
    'fix': ['sửa', 'repair', 'patch'],
    'api': ['endpoint', 'route', 'handler'],
    'code': ['source', 'file', 'module', 'function'],
    'type': ['typescript', 'interface', 'typedef'],
    'test': ['testing', 'validate', 'verify', 'check'],
  };

  for (const [term, alts] of Object.entries(alternates)) {
    if (queryTerms.includes(term)) {
      const unused = alts.filter(a => !existingTitles.some(t => t.includes(a)));
      if (unused.length > 0) {
        return [...newTerms, ...unused.slice(0, 2)].join(' ');
      }
    }
  }

  return null;
}

// ─── Build final context ────────────────────────────────────────────

function buildContextFromResults(results: MemorySearchResult[], query: string): string {
  if (results.length === 0) return '';

  const parts: string[] = ['## Relevant Knowledge from Memory\n'];

  for (const r of results) {
    parts.push(`### ${r.title} (${r.domain}, confidence: ${(r.confidence * 100).toFixed(0)}%)\n${r.content.slice(0, 500)}\n`);
  }

  // Add a summary instruction
  parts.push(`\n> Use the above knowledge to answer: ${query}`);

  return parts.join('\n');
}

// ─── Enriched dispatch (RAG-aware) ──────────────────────────────────

export async function dispatchWithRag(
  query: string,
  systemInstruction?: string,
  options: RagOptions & { webPlatform?: string; profileId?: string } = {}
): Promise<{ fabricResult: any; ragResult: AgenticRagResult }> {
  // Run RAG first
  const ragResult = await agenticRetrieve(query, '', options);

  // Build enriched context
  let enrichedInstruction = systemInstruction || '';
  if (ragResult.finalContext) {
    enrichedInstruction = `${enrichedInstruction}\n\n${ragResult.finalContext}`;
  }

  // Dispatch through fabric with enriched context
  const fabricResult = await dispatchTextThroughFabric(query, enrichedInstruction, {
    domain: options.domain as any,
    webPlatform: options.webPlatform,
    profileId: options.profileId,
    localFallback: true,
  });

  return { fabricResult, ragResult };
}
