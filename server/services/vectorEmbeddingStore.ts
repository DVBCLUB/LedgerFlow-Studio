/**
 * vectorEmbeddingStore.ts
 * ============================================================
 * Vector Embedding Store — lưu trữ và tìm kiếm semantic
 * với cosine similarity, không cần external vector DB.
 */
import { randomUUID } from 'node:crypto';
import fs from 'fs';
import path from 'path';
import { resolveRuntimeDirPath, resolveRuntimeReadDirFromEnv } from './runtimePaths.ts';

// ─── Types ──────────────────────────────────────────────────────────
export interface VectorDocument {
  id: string;
  content: string;
  embedding: number[];
  metadata: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface VectorSearchResult {
  document: VectorDocument;
  similarity: number;
}

export interface VectorNamespace {
  name: string;
  documents: VectorDocument[];
  dimension: number;
  createdAt: string;
  documentCount: number;
}

// ─── Simple TF-IDF based embedding ──────────────────────────────────
// Production would use OpenAI/Cohere embeddings, but this works zero-dependency

function computeTFIDFVector(text: string, dimension: number, globalDocFreq?: Map<string, number>, totalDocs?: number): number[] {
  // Tokenize and compute term frequencies
  const tokens = text.toLowerCase()
    .replace(/[^a-z0-9_\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);

  const termFreq = new Map<string, number>();
  for (const token of tokens) termFreq.set(token, (termFreq.get(token) || 0) + 1);

  // Hash terms into fixed-dimension vector
  const vector = new Array(dimension).fill(0);

  for (const [term, freq] of termFreq) {
    // Simple hash to distribute across dimensions
    let hash = 0;
    for (let i = 0; i < term.length; i++) {
      hash = ((hash << 5) - hash) + term.charCodeAt(i);
      hash = hash & hash;
    }
    const idx = Math.abs(hash) % dimension;

    // TF-IDF: tf * log(N/df)
    let tfidf = freq / tokens.length;
    if (globalDocFreq && totalDocs) {
      const df = globalDocFreq.get(term) || 1;
      tfidf *= Math.log10(totalDocs / df + 1);
    }
    vector[idx] += tfidf;
  }

  // L2 normalize
  const magnitude = Math.sqrt(vector.reduce((s, v) => s + v * v, 0));
  if (magnitude > 0) {
    for (let i = 0; i < dimension; i++) vector[i] /= magnitude;
  }

  return vector;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// ─── Storage ────────────────────────────────────────────────────────
const VECTOR_DIR = resolveRuntimeDirPath('vector_store');
const VECTOR_READ_DIR = resolveRuntimeReadDirFromEnv('VECTOR_STORE_DIR', 'vector_store');
const DIMENSION = 128;
let namespaces: Map<string, VectorNamespace> = new Map();

async function init(): Promise<void> {
  try {
    if (!fs.existsSync(VECTOR_DIR)) await fs.promises.mkdir(VECTOR_DIR, { recursive: true });
    const files = fs.existsSync(VECTOR_READ_DIR) ? fs.readdirSync(VECTOR_READ_DIR).filter(f => f.endsWith('.json')) : [];
    for (const file of files) {
      try {
        const data = JSON.parse(await fs.promises.readFile(path.join(VECTOR_READ_DIR, file), 'utf8'));
        const ns: VectorNamespace = { ...data, documents: data.documents || [] };
        namespaces.set(ns.name, ns);
      } catch { }
    }
  } catch { }
}
init().catch(() => undefined);

async function saveNamespace(ns: VectorNamespace): Promise<void> {
  const file = path.join(VECTOR_DIR, `${ns.name}.json`);
  await fs.promises.writeFile(file, JSON.stringify({ ...ns, documents: ns.documents.slice(-500) }, null, 2), 'utf8');
}

// ─── Core API ───────────────────────────────────────────────────────

export function createNamespace(name: string): VectorNamespace {
  if (namespaces.has(name)) return namespaces.get(name)!;

  const ns: VectorNamespace = {
    name, documents: [], dimension: DIMENSION,
    createdAt: new Date().toISOString(), documentCount: 0,
  };
  namespaces.set(name, ns);
  saveNamespace(ns).catch(() => undefined);
  return ns;
}

export function getNamespace(name: string): VectorNamespace | undefined {
  return namespaces.get(name);
}

export function listNamespaces(): VectorNamespace[] {
  return Array.from(namespaces.values());
}

export function deleteNamespace(name: string): boolean {
  const ns = namespaces.get(name);
  if (!ns) return false;
  namespaces.delete(name);
  const file = path.join(VECTOR_DIR, `${name}.json`);
  try { if (fs.existsSync(file)) fs.unlinkSync(file); } catch { }
  return true;
}

export function insertDocument(namespaceName: string, content: string, metadata: Record<string, string> = {}): VectorDocument | undefined {
  const ns = namespaces.get(namespaceName);
  if (!ns) return undefined;

  const embedding = computeTFIDFVector(content, DIMENSION);
  const doc: VectorDocument = {
    id: `vec_${Date.now()}_${randomUUID().slice(0, 6)}`,
    content: content.slice(0, 5000),
    embedding, metadata,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  ns.documents.push(doc);
  ns.documentCount = ns.documents.length;

  if (ns.documents.length % 20 === 0) saveNamespace(ns).catch(() => undefined);
  return doc;
}

export function searchSimilar(namespaceName: string, query: string, topK = 10, minSimilarity = 0.1): VectorSearchResult[] {
  const ns = namespaces.get(namespaceName);
  if (!ns || ns.documents.length === 0) return [];

  const queryVector = computeTFIDFVector(query, DIMENSION);
  const results: VectorSearchResult[] = [];

  for (const doc of ns.documents) {
    const similarity = cosineSimilarity(queryVector, doc.embedding);
    if (similarity >= minSimilarity) {
      results.push({ document: doc, similarity: +similarity.toFixed(4) });
    }
  }

  return results.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
}

export function batchInsert(namespaceName: string, items: Array<{ content: string; metadata?: Record<string, string> }>): number {
  const ns = namespaces.get(namespaceName);
  if (!ns) return 0;

  let inserted = 0;
  for (const item of items) {
    const doc = insertDocument(namespaceName, item.content, item.metadata);
    if (doc) inserted++;
  }

  saveNamespace(ns).catch(() => undefined);
  return inserted;
}

export function deleteDocument(namespaceName: string, docId: string): boolean {
  const ns = namespaces.get(namespaceName);
  if (!ns) return false;
  const idx = ns.documents.findIndex(d => d.id === docId);
  if (idx < 0) return false;
  ns.documents.splice(idx, 1);
  ns.documentCount = ns.documents.length;
  saveNamespace(ns).catch(() => undefined);
  return true;
}

export function getVectorStats(): {
  namespaces: number; totalDocuments: number; avgDocumentsPerNS: number;
} {
  const nsArray = Array.from(namespaces.values());
  return {
    namespaces: namespaces.size,
    totalDocuments: nsArray.reduce((s, ns) => s + ns.documents.length, 0),
    avgDocumentsPerNS: nsArray.length > 0 ? Math.round(nsArray.reduce((s, ns) => s + ns.documents.length, 0) / nsArray.length) : 0,
  };
}
