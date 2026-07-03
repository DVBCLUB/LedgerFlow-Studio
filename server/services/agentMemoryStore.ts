import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { ensureRuntimeRootSync, resolveRuntimePathFromEnv, resolveRuntimeReadPathFromEnv } from './runtimePaths.ts';

export type AgentMemoryKind = 'company' | 'session' | 'procedure' | 'observation' | 'feedback';
export type AgentMemoryStatus = 'draft' | 'reviewed' | 'rejected' | 'expired';

export interface AgentMemoryRecord {
  id: string;
  kind: AgentMemoryKind;
  status: AgentMemoryStatus;
  title: string;
  content: string;
  source: string;
  sourceRef?: string;
  tags: string[];
  confidence: number;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  version: number;
  supersedesId?: string;
  conflictIds: string[];
  sourceQuality: number;
}

let writeQueue = Promise.resolve();
const memoryBus = new EventEmitter();
memoryBus.setMaxListeners(100);

export type AgentMemoryTopic = 'agent-memory.created' | 'agent-memory.reviewed' | `mission:${string}` | string;
export type AgentMemoryHandler = (record: AgentMemoryRecord, topic: AgentMemoryTopic) => void;

export function subscribe(topic: AgentMemoryTopic, handler: AgentMemoryHandler): () => void {
  const wrapped = (record: AgentMemoryRecord) => handler(record, topic);
  memoryBus.on(topic, wrapped);
  return () => memoryBus.off(topic, wrapped);
}

export function publish(topic: AgentMemoryTopic, memoryEntry: AgentMemoryRecord): void {
  memoryBus.emit(topic, memoryEntry);
  for (const tag of memoryEntry.tags) {
    if (tag.startsWith('mission:')) memoryBus.emit(tag, memoryEntry);
  }
}

function storageFile() {
  return resolveRuntimePathFromEnv('AGENT_MEMORY_STORE_FILE', 'agent_memory.local.json');
}

async function readAllUnsafe(): Promise<AgentMemoryRecord[]> {
  try {
    const value = JSON.parse(await fs.promises.readFile(resolveRuntimeReadPathFromEnv('AGENT_MEMORY_STORE_FILE', 'agent_memory.local.json'), 'utf8'));
    return Array.isArray(value) ? value : [];
  } catch (error: any) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

async function mutate<T>(operation: (records: AgentMemoryRecord[]) => T | Promise<T>): Promise<T> {
  let result!: T;
  const task = async () => {
    const records = await readAllUnsafe();
    result = await operation(records);
    ensureRuntimeRootSync();
    const file = storageFile();
    const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
    try {
      await fs.promises.writeFile(temp, JSON.stringify(records.slice(0, 2_000), null, 2), 'utf8');
      await fs.promises.rename(temp, file);
    } finally {
      await fs.promises.rm(temp, { force: true }).catch(() => undefined);
    }
  };
  const queued = writeQueue.then(task, task);
  writeQueue = queued.catch(() => undefined);
  await queued;
  return result;
}

export async function createAgentMemory(input: {
  kind: AgentMemoryKind;
  title: string;
  content: string;
  source: string;
  sourceRef?: string;
  tags?: string[];
  confidence?: number;
  reviewed?: boolean;
  expiresAt?: string;
  supersedesId?: string;
  sourceQuality?: number;
}): Promise<AgentMemoryRecord> {
  const record = await mutate((records) => {
    const now = new Date().toISOString();
    const sameSource = input.sourceRef ? records.find((item) => item.source === input.source.trim() && item.sourceRef === input.sourceRef) : undefined;
    if (sameSource && sameSource.content.trim() === input.content.trim()) return sameSource;
    const normalizedTitle = input.title.trim().toLowerCase();
    const related = records.filter((item) => item.title.trim().toLowerCase() === normalizedTitle);
    const effectiveSupersedesId = input.supersedesId || sameSource?.id;
    const superseded = effectiveSupersedesId ? records.find((item) => item.id === effectiveSupersedesId) : undefined;
    if (effectiveSupersedesId && !superseded) throw new Error('Superseded memory record not found.');
    const conflictIds = related.filter((item) => item.status === 'reviewed' && item.content.trim() !== input.content.trim() && item.id !== effectiveSupersedesId).map((item) => item.id);
    const record: AgentMemoryRecord = {
      id: `memory_${randomUUID()}`,
      kind: input.kind,
      status: input.reviewed ? 'reviewed' : 'draft',
      title: input.title.trim(),
      content: input.content.trim(),
      source: input.source.trim(),
      sourceRef: input.sourceRef?.trim() || undefined,
      tags: [...new Set((input.tags || []).map((tag) => tag.trim().toLowerCase()).filter(Boolean))],
      confidence: Math.max(0, Math.min(1, input.confidence ?? 0.7)),
      createdAt: now,
      updatedAt: now,
      expiresAt: input.expiresAt,
      version: superseded ? superseded.version + 1 : Math.max(0, ...related.map((item) => item.version || 1)) + 1,
      supersedesId: effectiveSupersedesId,
      conflictIds,
      sourceQuality: Math.max(0, Math.min(1, input.sourceQuality ?? (input.sourceRef ? 0.85 : 0.65))),
    };
    records.unshift(record);
    return record;
  });
  publish('agent-memory.created', record);
  return record;
}

export async function reviewAgentMemory(id: string, status: Extract<AgentMemoryStatus, 'reviewed' | 'rejected'>) {
  const record = await mutate((records) => {
    const record = records.find((item) => item.id === id);
    if (!record) throw new Error('Memory record not found.');
    record.status = status;
    record.updatedAt = new Date().toISOString();
    return record;
  });
  publish('agent-memory.reviewed', record);
  return record;
}

function terms(value: string) {
  return [...new Set(value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z0-9]+/).filter((item) => item.length > 1))];
}

function vectorize(value: string, dimensions = 96) {
  const vector = Array.from({ length: dimensions }, () => 0);
  const normalized = value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
  for (let index = 0; index < Math.max(1, normalized.length - 2); index += 1) {
    const gram = normalized.slice(index, index + 3);
    let hash = 2166136261;
    for (const character of gram) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
    vector[Math.abs(hash) % dimensions] += 1;
  }
  const norm = Math.sqrt(vector.reduce((sum, item) => sum + item * item, 0)) || 1;
  return vector.map((item) => item / norm);
}

function cosine(left: number[], right: number[]) {
  return left.reduce((sum, value, index) => sum + value * (right[index] || 0), 0);
}

export async function searchAgentMemory(query: string, options: { limit?: number; includeDrafts?: boolean } = {}) {
  await writeQueue.catch(() => undefined);
  const now = Date.now();
  const queryTerms = terms(query);
  const queryVector = vectorize(query);
  const records = await readAllUnsafe();
  return records
    .filter((record) => (options.includeDrafts || record.status === 'reviewed') && record.status !== 'rejected')
    .filter((record) => !record.expiresAt || Date.parse(record.expiresAt) > now)
    .map((record) => {
      const haystack = terms(`${record.title} ${record.content} ${record.tags.join(' ')}`);
      const overlap = queryTerms.filter((term) => haystack.includes(term)).length;
      const exact = `${record.title} ${record.content}`.toLowerCase().includes(query.toLowerCase()) ? 2 : 0;
      const lexicalScore = queryTerms.length ? (overlap + exact) / (queryTerms.length + 2) : 1;
      const semanticScore = cosine(queryVector, vectorize(`${record.title} ${record.content} ${record.tags.join(' ')}`));
      const sourceQuality = record.sourceQuality ?? 0.65;
      const conflictPenalty = record.conflictIds?.length ? 0.75 : 1;
      const score = (lexicalScore * 0.55 + semanticScore * 0.3 + sourceQuality * 0.15) * record.confidence * conflictPenalty;
      return { record, score, lexicalScore, semanticScore, sourceQuality };
    })
    .filter((item) => item.score > 0 || queryTerms.length === 0)
    .sort((a, b) => b.score - a.score || b.record.updatedAt.localeCompare(a.record.updatedAt))
    .slice(0, Math.max(1, Math.min(options.limit || 8, 50)))
    .map(({ record, score, lexicalScore, semanticScore, sourceQuality }) => ({ ...record, score, scoreBreakdown: { lexical: lexicalScore, semantic: semanticScore, sourceQuality }, citation: `[${record.id}@v${record.version || 1}] ${record.title} (${record.source}${record.sourceRef ? `: ${record.sourceRef}` : ''})` }));
}
