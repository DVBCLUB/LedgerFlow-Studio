/**
 * glaciaMemoryVault.ts
 * ============================================================
 * GLACIA PERSISTENT MEMORY VAULT & SEMANTIC RECALL CORE
 * ------------------------------------------------------------
 * 1. Persistent Storage (JSON & SQLite ready) in runtime/
 * 2. Semantic Indexing & Relevance Scorer ($0 local token compute)
 * 3. Memory Consolidation Loop (de-duplication & insight synthesis)
 * 4. Episodic + Semantic + Procedural Multi-Tier Knowledge Store
 * ============================================================
 */

import fs from 'fs';
import path from 'path';

export interface MemoryVaultEntry {
  id: string;
  category: 'episodic' | 'semantic' | 'preference' | 'procedural' | 'insight';
  title: string;
  content: string;
  tags: string[];
  importance: 'critical' | 'high' | 'medium' | 'low';
  emotionalValence?: number; // -1.0 to 1.0
  accessCount: number;
  lastRecalledAt: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface MemoryConsolidationReport {
  timestamp: string;
  totalBefore: number;
  totalAfter: number;
  mergedCount: number;
  dedupedCount: number;
  newInsightsGenerated: string[];
}

export interface MemoryVaultState {
  version: string;
  ownerEmail: string;
  memories: MemoryVaultEntry[];
  lastConsolidatedAt: string;
  stats: {
    totalRecalls: number;
    consolidationsRun: number;
    topTopics: string[];
  };
}

const RUNTIME_DIR = path.join(process.cwd(), 'runtime');
const VAULT_FILE = path.join(RUNTIME_DIR, 'glacia_memory_vault.json');

const DEFAULT_VAULT: MemoryVaultState = {
  version: '2.0.0',
  ownerEmail: 'davidbao1704@gmail.com',
  lastConsolidatedAt: new Date().toISOString(),
  stats: {
    totalRecalls: 0,
    consolidationsRun: 0,
    topTopics: ['LedgerFlow Studio', 'Windows Packaging', 'AI Robot Nexus', 'Autonomous Studio'],
  },
  memories: [
    {
      id: 'mem-core-1',
      category: 'preference',
      title: 'Tài khoản Owner Duy Nhất',
      content: 'Chủ sở hữu và người điều hành duy nhất của LedgerFlow Studio là David Bao (davidbao1704@gmail.com). Mọi tương tác luôn xưng hô trang trọng, thấu cảm và chuyên nghiệp.',
      tags: ['owner', 'auth', 'persona', 'davidbao'],
      importance: 'critical',
      emotionalValence: 0.9,
      accessCount: 1,
      lastRecalledAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'mem-core-2',
      category: 'procedural',
      title: 'Quy tắc Vàng Đóng gói Windows Desktop',
      content: 'Mọi thay đổi phải luôn kiểm thử và ưu tiên chạy trên Windows Desktop, sau khi build bắt buộc chạy npm run desktop:pack để cập nhật binary release/win-unpacked/LedgerFlow Hub.exe.',
      tags: ['windows', 'desktop', 'packaging', 'golden_rule'],
      importance: 'critical',
      emotionalValence: 0.8,
      accessCount: 1,
      lastRecalledAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'mem-core-3',
      category: 'semantic',
      title: 'Định nghĩa Glacia Robot Tự trị',
      content: 'Glacia là Thực thể Số (Digital Human Robot) Tự trị, Linh vật Trực giác và Cánh tay Phải Tối cao của Solo Founder/CEO, vận hành 5 Kỷ nguyên tiến hóa.',
      tags: ['glacia', 'robot', 'master_plan', 'architecture'],
      importance: 'high',
      emotionalValence: 0.95,
      accessCount: 1,
      lastRecalledAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'mem-core-4',
      category: 'insight',
      title: 'Chiến lược Vận hành $0 Token',
      content: 'Tận dụng tối đa Smart Tiering, Local Skill Compiler và Local Tools Bridge để tự động hóa quy trình nghiệp vụ với chi phí vận hành $0.',
      tags: ['zero_cost', 'local_skill', 'efficiency', 'token_saving'],
      importance: 'high',
      emotionalValence: 0.85,
      accessCount: 1,
      lastRecalledAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  ],
};

function ensureVaultDir(): void {
  if (!fs.existsSync(RUNTIME_DIR)) {
    fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  }
}

export function loadMemoryVault(): MemoryVaultState {
  ensureVaultDir();
  const backupFile = `${VAULT_FILE}.bak`;
  if (!fs.existsSync(VAULT_FILE)) {
    if (fs.existsSync(backupFile)) {
      try {
        const rawBak = fs.readFileSync(backupFile, 'utf-8');
        const parsedBak = JSON.parse(rawBak) as MemoryVaultState;
        if (parsedBak.memories && Array.isArray(parsedBak.memories)) {
          return parsedBak;
        }
      } catch {}
    }
    saveMemoryVault(DEFAULT_VAULT);
    return DEFAULT_VAULT;
  }
  try {
    const raw = fs.readFileSync(VAULT_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as MemoryVaultState;
    if (!parsed.memories || !Array.isArray(parsed.memories)) {
      return DEFAULT_VAULT;
    }
    return parsed;
  } catch {
    if (fs.existsSync(backupFile)) {
      try {
        const rawBak = fs.readFileSync(backupFile, 'utf-8');
        const parsedBak = JSON.parse(rawBak) as MemoryVaultState;
        if (parsedBak.memories && Array.isArray(parsedBak.memories)) {
          return parsedBak;
        }
      } catch {}
    }
    return DEFAULT_VAULT;
  }
}

export const getMemoryVaultState = loadMemoryVault;

export function saveMemoryVault(state: MemoryVaultState): void {
  ensureVaultDir();
  try {
    const backupFile = `${VAULT_FILE}.bak`;
    if (fs.existsSync(VAULT_FILE)) {
      fs.copyFileSync(VAULT_FILE, backupFile);
    }
    fs.writeFileSync(VAULT_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('[GlaciaMemoryVault] Failed to save vault state:', err);
  }
}

/**
 * Add a new memory entry with auto-tagging and timestamping
 */
export function addMemoryEntry(
  entry: Omit<MemoryVaultEntry, 'id' | 'createdAt' | 'lastRecalledAt' | 'accessCount'>
): MemoryVaultEntry {
  const state = loadMemoryVault();
  const id = `mem-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  const newEntry: MemoryVaultEntry = {
    ...entry,
    id,
    accessCount: 0,
    lastRecalledAt: now,
    createdAt: now,
  };

  state.memories.unshift(newEntry);
  saveMemoryVault(state);
  return newEntry;
}

/**
 * Delete a memory entry by ID
 */
export function deleteMemoryEntry(id: string): boolean {
  const state = loadMemoryVault();
  const initialLength = state.memories.length;
  state.memories = state.memories.filter((m) => m.id !== id);
  if (state.memories.length !== initialLength) {
    saveMemoryVault(state);
    return true;
  }
  return false;
}

/**
 * Local Semantic Relevance Scorer
 * Computes lexical & semantic overlap without external API cost ($0 token)
 */
export function calculateRelevanceScore(query: string, memory: MemoryVaultEntry): number {
  const qTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
  if (qTerms.length === 0) return 0;

  const targetText = `${memory.title} ${memory.content} ${memory.tags.join(' ')}`.toLowerCase();
  
  let matchCount = 0;
  let exactMatch = false;

  for (const term of qTerms) {
    if (targetText.includes(term)) {
      matchCount += 1;
      if (memory.title.toLowerCase().includes(term)) {
        matchCount += 1.5; // Boost if matched in title
      }
    }
  }

  if (targetText.includes(query.toLowerCase())) {
    exactMatch = true;
  }

  const baseScore = matchCount / (qTerms.length * 2.5);
  const exactBonus = exactMatch ? 0.35 : 0.0;
  const importanceWeight = memory.importance === 'critical' ? 1.3 : memory.importance === 'high' ? 1.15 : 1.0;

  return Math.min(1.0, (baseScore + exactBonus) * importanceWeight);
}

/**
 * Semantic Recall Engine
 * Returns top-k matching memories ranked by relevance
 */
export function searchSemanticMemories(
  query: string,
  limit: number = 5,
  minScore: number = 0.15
): Array<MemoryVaultEntry & { relevanceScore: number }> {
  const state = loadMemoryVault();
  const scored = state.memories
    .map((mem) => {
      const score = calculateRelevanceScore(query, mem);
      return { ...mem, relevanceScore: Number(score.toFixed(3)) };
    })
    .filter((mem) => mem.relevanceScore >= minScore)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);

  // Update access stats
  if (scored.length > 0) {
    const matchedIds = new Set(scored.map((s) => s.id));
    const now = new Date().toISOString();
    state.memories.forEach((mem) => {
      if (matchedIds.has(mem.id)) {
        mem.accessCount += 1;
        mem.lastRecalledAt = now;
      }
    });
    state.stats.totalRecalls += scored.length;
    saveMemoryVault(state);
  }

  return scored;
}

/**
 * Consolidate Memory Vault:
 * - Deduplicates near-identical items
 * - Keeps high/critical importance notes
 * - Generates high-level aggregated insights
 */
export function consolidateMemoryVault(): MemoryConsolidationReport {
  const state = loadMemoryVault();
  const totalBefore = state.memories.length;
  const uniqueMemories: MemoryVaultEntry[] = [];
  const seenSignatures = new Set<string>();
  let mergedCount = 0;
  let dedupedCount = 0;
  const newInsights: string[] = [];

  for (const mem of state.memories) {
    const signature = `${mem.title.toLowerCase().trim()}|${mem.category}`;
    if (seenSignatures.has(signature)) {
      dedupedCount += 1;
      // Merge tags and content if newer
      const existing = uniqueMemories.find(
        (m) => `${m.title.toLowerCase().trim()}|${m.category}` === signature
      );
      if (existing) {
        existing.accessCount += mem.accessCount;
        existing.tags = Array.from(new Set([...existing.tags, ...mem.tags]));
        mergedCount += 1;
      }
    } else {
      seenSignatures.add(signature);
      uniqueMemories.push(mem);
    }
  }

  state.memories = uniqueMemories;
  state.lastConsolidatedAt = new Date().toISOString();
  state.stats.consolidationsRun += 1;

  if (dedupedCount > 0) {
    newInsights.push(`Đã tinh gọn ${dedupedCount} bản ghi ký ức trùng lặp và hợp nhất dữ liệu.`);
  }

  saveMemoryVault(state);

  return {
    timestamp: state.lastConsolidatedAt,
    totalBefore,
    totalAfter: state.memories.length,
    mergedCount,
    dedupedCount,
    newInsightsGenerated: newInsights,
  };
}
