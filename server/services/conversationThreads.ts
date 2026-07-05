/**
 * conversationThreads.ts
 * ============================================================
 * Multi-Turn Conversation Threads — persistent conversation
 * history cho từng thread. Agent có thể đọc lại toàn bộ
 * lịch sử, summarize, export, và continue.
 */
import { randomUUID } from 'node:crypto';
import fs from 'fs';
import path from 'path';
import { recordObservation } from './compoundMemory';
import { recordUsage } from './costObservability';
import { createContextWindow, addSegment, removeWindow, getAllSegments, deepSummarize, type ContextWindow, type WindowSegment, type ContextStrategy } from './contextWindowManager';
import { resolveRuntimeDirPath, resolveRuntimeReadDirFromEnv } from './runtimePaths.ts';

// ─── Types ──────────────────────────────────────────────────────────
export interface ConversationTurn {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata: Record<string, unknown>;
  tokenEstimate: number;
}

export interface ConversationThread {
  id: string;
  title: string;
  domain: string;
  agent: string;
  status: 'active' | 'archived' | 'summarized';
  turns: ConversationTurn[];
  summary: string;
  contextWindowId: string;
  tags: string[];
  messageCount: number;
  totalTokens: number;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export interface ThreadExport {
  thread: ConversationThread;
  format: 'json' | 'markdown' | 'text';
  content: string;
}

// ─── Storage ────────────────────────────────────────────────────────
const THREADS_DIR = resolveRuntimeDirPath('conversation_threads');
const THREADS_READ_DIR = resolveRuntimeReadDirFromEnv('CONVERSATION_THREADS_DIR', 'conversation_threads');
const INDEX_FILE = path.join(THREADS_DIR, '_index.json');
const INDEX_READ_FILE = path.join(THREADS_READ_DIR, '_index.json');

let threads: ConversationThread[] = [];
const activeContextWindows = new Map<string, ContextWindow>();

async function init(): Promise<void> {
  try {
    if (!fs.existsSync(THREADS_DIR)) {
      await fs.promises.mkdir(THREADS_DIR, { recursive: true });
    }
    if (fs.existsSync(INDEX_READ_FILE)) {
      threads = JSON.parse(await fs.promises.readFile(INDEX_READ_FILE, 'utf8'));
    }
  } catch { }
}
init().catch(() => undefined);

async function saveIndex(): Promise<void> {
  await fs.promises.writeFile(INDEX_FILE, JSON.stringify(threads, null, 2), 'utf8');
}

async function saveThread(thread: ConversationThread): Promise<void> {
  const file = path.join(THREADS_DIR, `${thread.id}.json`);
  await fs.promises.writeFile(file, JSON.stringify(thread, null, 2), 'utf8');
}

// ─── Core API ───────────────────────────────────────────────────────

export function createThread(
  title: string,
  options: { domain?: string; agent?: string; tags?: string[]; contextStrategy?: Partial<ContextStrategy> } = {}
): ConversationThread {
  const id = `thread_${Date.now()}_${randomUUID().slice(0, 6)}`;
  const now = new Date().toISOString();

  // Create context window
  const cw = createContextWindow(`ctx_${id}`, options.contextStrategy);

  const thread: ConversationThread = {
    id,
    title: title.slice(0, 120),
    domain: options.domain || 'general',
    agent: options.agent || 'fabric',
    status: 'active',
    turns: [],
    summary: '',
    contextWindowId: cw.id,
    tags: options.tags || [],
    messageCount: 0,
    totalTokens: 0,
    createdAt: now,
    updatedAt: now,
  };

  threads.push(thread);
  activeContextWindows.set(thread.id, cw);
  saveThread(thread).catch(() => undefined);
  saveIndex().catch(() => undefined);

  return thread;
}

export function addTurn(
  threadId: string,
  role: ConversationTurn['role'],
  content: string,
  metadata: Record<string, unknown> = {},
): ConversationTurn | undefined {
  const thread = threads.find(t => t.id === threadId);
  if (!thread || thread.status === 'archived') return undefined;

  const turn: ConversationTurn = {
    id: `turn_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
    role,
    content: content.slice(0, 10000),
    timestamp: new Date().toISOString(),
    metadata,
    tokenEstimate: Math.ceil(content.length / 3.5),
  };

  thread.turns.push(turn);
  thread.messageCount = thread.turns.filter(t => t.role === 'user').length + thread.turns.filter(t => t.role === 'assistant').length;
  thread.totalTokens += turn.tokenEstimate;
  thread.updatedAt = new Date().toISOString();

  // Also add to context window
  const priority = role === 'system' ? 10 : role === 'user' ? 8 : 6;
  addSegment(thread.contextWindowId, role, content.slice(0, 3000), priority);

  // Auto-save every 5 turns
  if (thread.turns.length % 5 === 0) {
    saveThread(thread).catch(() => undefined);
    saveIndex().catch(() => undefined);
  }

  return turn;
}

export function getThread(id: string): ConversationThread | undefined {
  return threads.find(t => t.id === id);
}

export function listThreads(filter?: {
  agent?: string;
  domain?: string;
  status?: ConversationThread['status'];
  limit?: number;
}): ConversationThread[] {
  let result = [...threads];
  if (filter?.agent) result = result.filter(t => t.agent === filter.agent);
  if (filter?.domain) result = result.filter(t => t.domain === filter.domain);
  if (filter?.status) result = result.filter(t => t.status === filter.status);
  result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return result.slice(0, filter?.limit || 50);
}

export function archiveThread(id: string): boolean {
  const thread = threads.find(t => t.id === id);
  if (!thread) return false;
  thread.status = 'archived';
  thread.archivedAt = new Date().toISOString();
  thread.updatedAt = thread.archivedAt;
  removeWindow(thread.contextWindowId);
  activeContextWindows.delete(thread.id);
  saveThread(thread).catch(() => undefined);
  saveIndex().catch(() => undefined);
  return true;
}

export async function summarizeThread(id: string): Promise<string> {
  const thread = threads.find(t => t.id === id);
  if (!thread) return '';

  // Use context window deep summarize
  const summary = await deepSummarize(thread.contextWindowId);
  if (summary) {
    thread.summary = summary;
    thread.updatedAt = new Date().toISOString();
    saveThread(thread).catch(() => undefined);
  }

  return summary || `Thread "${thread.title}" has ${thread.turns.length} turns, no summary available.`;
}

export function deleteThread(id: string): boolean {
  const idx = threads.findIndex(t => t.id === id);
  if (idx < 0) return false;

  const thread = threads[idx];
  removeWindow(thread.contextWindowId);
  activeContextWindows.delete(thread.id);
  threads.splice(idx, 1);

  // Delete file
  const file = path.join(THREADS_DIR, `${id}.json`);
  try { if (fs.existsSync(file)) fs.unlinkSync(file); } catch { }

  saveIndex().catch(() => undefined);
  return true;
}

export function exportThread(id: string, format: 'json' | 'markdown' | 'text' = 'markdown'): ThreadExport | undefined {
  const thread = threads.find(t => t.id === id);
  if (!thread) return undefined;

  let content = '';

  switch (format) {
    case 'json':
      content = JSON.stringify(thread, null, 2);
      break;
    case 'markdown':
      content = `# ${thread.title}\n\n**Agent:** ${thread.agent} | **Domain:** ${thread.domain} | **Turns:** ${thread.turns.length} | **Tags:** ${thread.tags.join(', ')}\n\n**Created:** ${thread.createdAt} | **Updated:** ${thread.updatedAt}\n\n${thread.summary ? `> ${thread.summary}\n\n` : ''}---\n\n`;
      for (const turn of thread.turns) {
        content += `### ${turn.role.toUpperCase()} (${turn.timestamp.slice(11, 19)})\n\n${turn.content}\n\n---\n\n`;
      }
      break;
    case 'text':
      for (const turn of thread.turns) {
        content += `[${turn.role}] ${turn.timestamp.slice(11, 19)}\n${turn.content}\n\n`;
      }
      break;
  }

  return { thread, format, content };
}

export function findRelevantThreads(query: string, limit = 5): ConversationThread[] {
  const q = query.toLowerCase();
  return threads
    .filter(t => t.title.toLowerCase().includes(q) || t.summary.toLowerCase().includes(q))
    .slice(0, limit);
}

export function getThreadStats(): {
  total: number;
  active: number;
  archived: number;
  totalMessages: number;
  totalTokens: number;
  byAgent: Record<string, number>;
  byDomain: Record<string, number>;
} {
  const byAgent: Record<string, number> = {};
  const byDomain: Record<string, number> = {};
  let totalMessages = 0;
  let totalTokens = 0;

  for (const t of threads) {
    byAgent[t.agent] = (byAgent[t.agent] || 0) + 1;
    byDomain[t.domain] = (byDomain[t.domain] || 0) + 1;
    totalMessages += t.messageCount;
    totalTokens += t.totalTokens;
  }

  return {
    total: threads.length,
    active: threads.filter(t => t.status === 'active').length,
    archived: threads.filter(t => t.status === 'archived').length,
    totalMessages,
    totalTokens,
    byAgent,
    byDomain,
  };
}

export function continueThread(id: string): ConversationThread | undefined {
  const thread = threads.find(t => t.id === id);
  if (!thread) return undefined;
  if (thread.status === 'archived') {
    thread.status = 'active';
    thread.archivedAt = undefined;
    thread.updatedAt = new Date().toISOString();
    // Re-create context window
    const cw = createContextWindow(thread.contextWindowId);
    activeContextWindows.set(thread.id, cw);
    saveThread(thread).catch(() => undefined);
    saveIndex().catch(() => undefined);
  }
  return thread;
}

/**
 * Tự động ghi thread thành memory observation khi archived
 */
export async function threadToMemory(id: string): Promise<boolean> {
  const thread = threads.find(t => t.id === id);
  if (!thread || thread.turns.length < 3) return false;

  const summary = thread.summary || await summarizeThread(id);
  await recordObservation(
    thread.domain,
    `Conversation: ${thread.title}`,
    `${thread.turns.length} turns. ${summary}`,
    0.7,
    `thread:${thread.id}`,
    true,
  );

  return true;
}
