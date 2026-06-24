/**
 * knowledgeGraph.ts
 * ============================================================
 * Knowledge Graph — kết nối các thực thể trong hệ thống:
 * Code files ↔ Agent memories ↔ Runbook evidence ↔ Cost records
 * 
 * Agent có thể tìm kiếm theo ngữ cảnh đa chiều:
 * "File X có những memory nào liên quan?"
 * "Lỗi Y đã từng được sửa bởi agent nào?"
 * "Chi phí sửa bug trong file Z là bao nhiêu?"
 */
import fs from 'fs';
import path from 'path';

// ─── Types ──────────────────────────────────────────────────────────
export type NodeType = 'file' | 'memory' | 'runbook_step' | 'cost_record' | 'agent_loop' | 'trigger_event';

export interface KnowledgeNode {
  id: string;
  type: NodeType;
  label: string;
  description: string;
  meta: Record<string, unknown>;
  createdAt: string;
  confidence: number;
}

export interface KnowledgeEdge {
  from: string;
  to: string;
  relation: string;
  weight: number;
  evidence: string;
}

export interface KnowledgeSearchResult {
  node: KnowledgeNode;
  relations: Array<{ relation: string; targetNode: KnowledgeNode }>;
  score: number;
  matchReason: string;
}

// ─── In-memory store ────────────────────────────────────────────────
const nodes = new Map<string, KnowledgeNode>();
const edges: KnowledgeEdge[] = [];
const FILE = path.join(process.cwd(), 'knowledge_graph.json');

// ─── Init ───────────────────────────────────────────────────────────
async function load(): Promise<void> {
  try {
    if (!fs.existsSync(FILE)) return;
    const data = JSON.parse(await fs.promises.readFile(FILE, 'utf8'));
    for (const n of (data.nodes || [])) nodes.set(n.id, n);
    edges.push(...(data.edges || []));
  } catch { /* init empty */ }
}
load().catch(() => undefined);

async function save(): Promise<void> {
  await fs.promises.writeFile(FILE, JSON.stringify({ nodes: Array.from(nodes.values()), edges }, null, 2), 'utf8');
}

// ─── Node CRUD ──────────────────────────────────────────────────────

export function upsertNode(
  type: NodeType, label: string, description: string,
  meta: Record<string, unknown> = {}, confidence = 0.8
): KnowledgeNode {
  const id = `${type}_${label.replace(/[^a-z0-9]/gi, '_').slice(0, 60)}`;
  const existing = nodes.get(id);
  const node: KnowledgeNode = {
    id,
    type,
    label: label.slice(0, 120),
    description: description.slice(0, 500),
    meta: { ...existing?.meta, ...meta },
    createdAt: existing?.createdAt || new Date().toISOString(),
    confidence: Math.max(existing?.confidence || 0, confidence),
  };
  nodes.set(id, node);
  return node;
}

export function addEdge(fromId: string, toId: string, relation: string, weight = 1, evidence = ''): void {
  if (!nodes.has(fromId) || !nodes.has(toId)) return;
  const exists = edges.find(e => e.from === fromId && e.to === toId && e.relation === relation);
  if (exists) { exists.weight += weight; return; }
  edges.push({ from: fromId, to: toId, relation, weight, evidence: evidence.slice(0, 300) });
  // Persist periodically
  if (edges.length % 20 === 0) save().catch(() => undefined);
}

// ─── Search ──────────────────────────────────────────────────────────

export function searchKnowledgeGraph(
  query: string,
  options: { nodeTypes?: NodeType[]; maxResults?: number; minConfidence?: number } = {}
): KnowledgeSearchResult[] {
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/).filter(Boolean);
  const maxResults = options.maxResults || 10;
  const minConfidence = options.minConfidence || 0;
  const results: KnowledgeSearchResult[] = [];

  for (const node of nodes.values()) {
    if (options.nodeTypes && !options.nodeTypes.includes(node.type)) continue;
    if (node.confidence < minConfidence) continue;

    let score = 0;
    const labelLower = node.label.toLowerCase();
    const descLower = node.description.toLowerCase();

    if (labelLower.includes(queryLower)) score += 15;
    if (descLower.includes(queryLower)) score += 5;
    for (const term of queryTerms) {
      if (labelLower.includes(term)) score += 6;
      if (descLower.includes(term)) score += 2;
      if (JSON.stringify(node.meta).toLowerCase().includes(term)) score += 1;
    }

    if (score <= 0) continue;

    // Find related nodes
    const relatedEdges = edges.filter(e => e.from === node.id || e.to === node.id);
    const relations = relatedEdges.map(e => {
      const targetId = e.from === node.id ? e.to : e.from;
      const targetNode = nodes.get(targetId);
      return { relation: e.relation, targetNode: targetNode || { id: targetId, type: 'memory' as NodeType, label: targetId, description: '', meta: {}, createdAt: '', confidence: 0 } };
    });

    results.push({ node, relations: relations.slice(0, 5), score, matchReason: `Matched in ${node.type}` });
  }

  results.sort((a, b) => b.score - a.score || b.node.confidence - a.node.confidence);
  return results.slice(0, maxResults);
}

export function getNodeById(id: string): KnowledgeNode | undefined {
  return nodes.get(id);
}

export function getRelatedNodes(nodeId: string, maxDepth = 2): KnowledgeNode[] {
  const visited = new Set<string>();
  const result: KnowledgeNode[] = [];
  const queue: Array<{ id: string; depth: number }> = [{ id: nodeId, depth: 0 }];
  visited.add(nodeId);

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    if (depth > 0) {
      const node = nodes.get(id);
      if (node) result.push(node);
    }
    if (depth >= maxDepth) continue;

    for (const e of edges) {
      const target = e.from === id ? e.to : e.to === id ? e.from : null;
      if (target && !visited.has(target)) {
        visited.add(target);
        queue.push({ id: target, depth: depth + 1 });
      }
    }
  }
  return result;
}

export function getStats(): { totalNodes: number; totalEdges: number; byType: Record<string, number> } {
  const byType: Record<string, number> = {};
  for (const node of nodes.values()) {
    byType[node.type] = (byType[node.type] || 0) + 1;
  }
  return { totalNodes: nodes.size, totalEdges: edges.length, byType };
}

export async function flush(): Promise<void> { await save(); }
