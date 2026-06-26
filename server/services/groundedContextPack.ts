import { createHash } from 'node:crypto';

export type GroundedSourceKind = 'memory' | 'document' | 'decision' | 'sop' | 'runtime';

export interface GroundedKnowledgeSource {
  id?: string;
  kind: GroundedSourceKind;
  title: string;
  content: string;
  url?: string;
  tags?: string[];
  facts?: Record<string, string | number | boolean | null>;
  createdAt?: string;
  confidence?: number;
}

export interface GroundedContextRequest {
  question: string;
  sources: GroundedKnowledgeSource[];
  requiredTags?: string[];
  maxSources?: number;
}

export interface GroundedContextSourceMapEntry {
  id: string;
  kind: GroundedSourceKind;
  title: string;
  relevance: number;
  confidence: number;
  excerpt: string;
  tags: string[];
  url?: string;
}

export interface KnowledgeGraphNode {
  id: string;
  type: 'source' | 'entity' | 'fact';
  label: string;
}

export interface KnowledgeGraphEdge {
  from: string;
  to: string;
  type: 'mentions' | 'states' | 'contradicts';
}

export interface GroundedContradiction {
  factKey: string;
  values: Array<{ sourceId: string; value: string }>;
  severity: 'medium' | 'high';
}

export interface GroundedContextPack {
  id: string;
  question: string;
  context: string;
  sourceMap: GroundedContextSourceMapEntry[];
  contradictions: GroundedContradiction[];
  graph: { nodes: KnowledgeGraphNode[]; edges: KnowledgeGraphEdge[] };
  confidence: number;
  warnings: string[];
}

function stableId(value: unknown, prefix = 'gcp') {
  return `${prefix}_${createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16)}`;
}

function normalize(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function tokenize(value: string) {
  return normalize(value).split(/[^a-z0-9_]+/).filter((token) => token.length >= 3);
}

function excerpt(content: string, max = 280) {
  const compact = content.replace(/\s+/g, ' ').trim();
  return compact.length <= max ? compact : `${compact.slice(0, max - 1)}…`;
}

function scoreSource(questionTokens: Set<string>, source: GroundedKnowledgeSource, requiredTags: string[]) {
  const text = `${source.title} ${source.content} ${(source.tags || []).join(' ')}`;
  const sourceTokens = new Set(tokenize(text));
  let matches = 0;
  for (const token of questionTokens) if (sourceTokens.has(token)) matches += 1;
  const tagBonus = requiredTags.filter((tag) => source.tags?.includes(tag)).length * 0.2;
  const factBonus = source.facts && Object.keys(source.facts).length ? 0.15 : 0;
  return Math.min(1, matches / Math.max(1, questionTokens.size) + tagBonus + factBonus);
}

function detectContradictions(entries: GroundedContextSourceMapEntry[], sourceById: Map<string, GroundedKnowledgeSource>): GroundedContradiction[] {
  const valuesByFact = new Map<string, Map<string, string[]>>();

  for (const entry of entries) {
    const source = sourceById.get(entry.id);
    if (!source?.facts) continue;
    for (const [key, rawValue] of Object.entries(source.facts)) {
      if (rawValue === null || rawValue === undefined) continue;
      const normalizedValue = String(rawValue).trim().toLowerCase();
      if (!valuesByFact.has(key)) valuesByFact.set(key, new Map());
      const byValue = valuesByFact.get(key)!;
      byValue.set(normalizedValue, [...(byValue.get(normalizedValue) || []), entry.id]);
    }
  }

  return Array.from(valuesByFact.entries())
    .filter(([, byValue]) => byValue.size > 1)
    .map(([factKey, byValue]) => ({
      factKey,
      values: Array.from(byValue.entries()).flatMap(([value, sourceIds]) => sourceIds.map((sourceId) => ({ sourceId, value }))),
      severity: byValue.size >= 3 ? 'high' : 'medium',
    }));
}

function extractEntities(source: GroundedKnowledgeSource) {
  const tagEntities = (source.tags || []).map((tag) => tag.trim()).filter(Boolean);
  const titleEntities = source.title
    .split(/\s*[/:|>,-]\s*/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 3 && part.length <= 48);
  return Array.from(new Set([...tagEntities, ...titleEntities])).slice(0, 8);
}

export function buildGroundedContextPack(request: GroundedContextRequest): GroundedContextPack {
  const questionTokens = new Set(tokenize(request.question));
  const requiredTags = request.requiredTags || [];
  const maxSources = request.maxSources || 6;

  const scored = request.sources
    .map((source) => {
      const id = source.id || stableId({ title: source.title, content: source.content }, 'src');
      return { source: { ...source, id }, relevance: scoreSource(questionTokens, source, requiredTags) };
    })
    .filter(({ relevance }) => relevance > 0 || requiredTags.length === 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, maxSources);

  const sourceMap = scored.map(({ source, relevance }) => ({
    id: source.id!,
    kind: source.kind,
    title: source.title,
    relevance: Number(relevance.toFixed(3)),
    confidence: Number(Math.min(1, source.confidence ?? 0.72 + relevance * 0.2).toFixed(3)),
    excerpt: excerpt(source.content),
    tags: source.tags || [],
    url: source.url,
  }));

  const sourceById = new Map(scored.map(({ source }) => [source.id!, source]));
  const contradictions = detectContradictions(sourceMap, sourceById);
  const nodes = new Map<string, KnowledgeGraphNode>();
  const edges: KnowledgeGraphEdge[] = [];

  for (const entry of sourceMap) {
    nodes.set(entry.id, { id: entry.id, type: 'source', label: entry.title });
    const source = sourceById.get(entry.id)!;
    for (const entity of extractEntities(source)) {
      const entityId = stableId(entity, 'entity');
      nodes.set(entityId, { id: entityId, type: 'entity', label: entity });
      edges.push({ from: entry.id, to: entityId, type: 'mentions' });
    }
    for (const factKey of Object.keys(source.facts || {})) {
      const factId = stableId(factKey, 'fact');
      nodes.set(factId, { id: factId, type: 'fact', label: factKey });
      edges.push({ from: entry.id, to: factId, type: 'states' });
    }
  }

  for (const contradiction of contradictions) {
    const factId = stableId(contradiction.factKey, 'fact');
    for (const value of contradiction.values) edges.push({ from: value.sourceId, to: factId, type: 'contradicts' });
  }

  const warnings = [
    ...(sourceMap.length === 0 ? ['No grounded source matched the request.'] : []),
    ...(contradictions.length ? ['Contradictions detected. Require human review before high-impact output.'] : []),
  ];
  const confidence = sourceMap.length
    ? Math.max(0, Math.min(1, sourceMap.reduce((sum, item) => sum + item.confidence, 0) / sourceMap.length - contradictions.length * 0.12))
    : 0;

  return {
    id: stableId({ question: request.question, sourceIds: sourceMap.map((source) => source.id) }, 'context'),
    question: request.question,
    context: sourceMap.map((source, index) => `[S${index + 1} · ${source.kind} · ${source.confidence}] ${source.title}\n${source.excerpt}`).join('\n\n'),
    sourceMap,
    contradictions,
    graph: { nodes: Array.from(nodes.values()), edges },
    confidence: Number(confidence.toFixed(3)),
    warnings,
  };
}

export function requireGroundedContextForHighImpact(pack: GroundedContextPack) {
  if (!pack.sourceMap.length) throw new Error('High-impact output requires at least one grounded source.');
  if (pack.contradictions.length) throw new Error('High-impact output requires contradiction review before proceeding.');
  if (pack.confidence < 0.65) throw new Error('High-impact output confidence is below the allowed threshold.');
  return true;
}
