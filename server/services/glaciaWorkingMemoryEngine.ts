/**
 * glaciaWorkingMemoryEngine.ts
 * ============================================================
 * GLACIA WORKING & EPISODIC MEMORY ENGINE
 * ------------------------------------------------------------
 * Manages multi-tier human-like memory:
 *  1. Working Memory Buffer (7±2 items of active focus)
 *  2. Episodic Memory Graph (past interactions, milestones, preferences)
 *  3. CEO Persona & Operating Habits Profile
 *  4. Contextual Recall Engine
 * ============================================================
 */

import fs from 'fs';
import path from 'path';

export interface WorkingMemoryItem {
  id: string;
  topic: string;
  summary: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  category: 'active_goal' | 'blocker' | 'insight' | 'pending_decision';
  associatedFiles?: string[];
  updatedAt: string;
}

export interface EpisodicMemoryNode {
  id: string;
  timestamp: string;
  event: string;
  outcome: 'success' | 'failure' | 'lesson_learned';
  tags: string[];
  lesson: string;
}

export interface CEOPersonaProfile {
  email: string;
  role: string;
  preferences: {
    decisionStyle: 'fast_iterative' | 'deep_analytical' | 'delegative';
    preferredVoiceTone: 'professional_warm' | 'concise_executive' | 'energetic';
    alertThreshold: 'critical_only' | 'all_notable';
    favoriteModules: string[];
  };
  stats: {
    totalSessions: number;
    tasksApproved: number;
    goalsAchieved: number;
  };
}

export interface MemoryStoreData {
  workingMemory: WorkingMemoryItem[];
  episodicMemories: EpisodicMemoryNode[];
  ceoProfile: CEOPersonaProfile;
  lastSync: string;
}

const RUNTIME_DIR = path.join(process.cwd(), 'runtime');
const MEMORY_FILE = path.join(RUNTIME_DIR, 'glacia_working_memory.json');

const DEFAULT_CEO_PROFILE: CEOPersonaProfile = {
  email: 'davidbao1704@gmail.com',
  role: 'Founder & CEO',
  preferences: {
    decisionStyle: 'fast_iterative',
    preferredVoiceTone: 'professional_warm',
    alertThreshold: 'all_notable',
    favoriteModules: ['Product Studio', 'AI Workforce', 'Accounting Vietnam', 'Sandbox'],
  },
  stats: {
    totalSessions: 42,
    tasksApproved: 128,
    goalsAchieved: 35,
  },
};

const DEFAULT_WORKING_MEMORY: WorkingMemoryItem[] = [
  {
    id: 'wm-1',
    topic: 'Tối ưu hóa Hệ điều hành Glacia Robot OS',
    summary: 'Nâng cấp bộ não AI nhận thức, hỗ trợ quy trình DAG và tự trị $0 token.',
    importance: 'critical',
    category: 'active_goal',
    associatedFiles: ['server/services/glaciaCognitiveEngine.ts', 'src/components/glacia/GlaciaContext.tsx'],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'wm-2',
    topic: 'Kiểm toán & Ký số Hóa đơn Điện tử NĐ 123',
    summary: 'Đã sẵn sàng skill phát hành XML và đối soát tự động VietQR.',
    importance: 'high',
    category: 'insight',
    associatedFiles: ['server/services/glaciaSkillCompiler.ts'],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'wm-3',
    topic: 'Đóng gói Windows Desktop Binary 100% Sạch',
    summary: 'Duy trì file chạy win-unpacked LedgerFlow Hub.exe cập nhật liên tục.',
    importance: 'critical',
    category: 'pending_decision',
    associatedFiles: ['release/win-unpacked/LedgerFlow Hub.exe'],
    updatedAt: new Date().toISOString(),
  },
];

function ensureStorage(): MemoryStoreData {
  if (!fs.existsSync(RUNTIME_DIR)) {
    fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  }

  if (!fs.existsSync(MEMORY_FILE)) {
    const initialData: MemoryStoreData = {
      workingMemory: DEFAULT_WORKING_MEMORY,
      episodicMemories: [
        {
          id: 'epi-1',
          timestamp: new Date().toISOString(),
          event: 'Triển khai thành công 4 Kỷ nguyên tiến hóa của Glacia',
          outcome: 'success',
          tags: ['architecture', 'glacia', 'epoch4'],
          lesson: 'Biên dịch kỹ năng cục bộ giúp giảm 100% chi phí API và tăng tốc độ xử lý tức thì.',
        },
      ],
      ceoProfile: DEFAULT_CEO_PROFILE,
      lastSync: new Date().toISOString(),
    };
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  try {
    const raw = fs.readFileSync(MEMORY_FILE, 'utf-8');
    return JSON.parse(raw) as MemoryStoreData;
  } catch {
    return {
      workingMemory: DEFAULT_WORKING_MEMORY,
      episodicMemories: [],
      ceoProfile: DEFAULT_CEO_PROFILE,
      lastSync: new Date().toISOString(),
    };
  }
}

function saveStorage(data: MemoryStoreData): void {
  data.lastSync = new Date().toISOString();
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Get current Working Memory state
 */
export function getWorkingMemoryState(): MemoryStoreData {
  return ensureStorage();
}

/**
 * Push an active thought/item into working memory (capped at 7 items - Miller's Law)
 */
export function pushWorkingMemoryItem(item: Omit<WorkingMemoryItem, 'id' | 'updatedAt'>): WorkingMemoryItem {
  const store = ensureStorage();
  const newItem: WorkingMemoryItem = {
    ...item,
    id: `wm-${Date.now().toString(36)}`,
    updatedAt: new Date().toISOString(),
  };

  store.workingMemory.unshift(newItem);
  if (store.workingMemory.length > 7) {
    store.workingMemory = store.workingMemory.slice(0, 7);
  }

  saveStorage(store);
  return newItem;
}

/**
 * Record an episodic learning event
 */
export function recordEpisodicMemory(event: Omit<EpisodicMemoryNode, 'id' | 'timestamp'>): EpisodicMemoryNode {
  const store = ensureStorage();
  const node: EpisodicMemoryNode = {
    ...event,
    id: `epi-${Date.now().toString(36)}`,
    timestamp: new Date().toISOString(),
  };

  store.episodicMemories.unshift(node);
  if (store.episodicMemories.length > 50) {
    store.episodicMemories = store.episodicMemories.slice(0, 50);
  }

  saveStorage(store);
  return node;
}

/**
 * Search relevant memories based on topic query
 */
export function recallRelevantContext(query: string): {
  workingItems: WorkingMemoryItem[];
  episodicItems: EpisodicMemoryNode[];
} {
  const store = ensureStorage();
  const q = query.toLowerCase();

  const workingItems = store.workingMemory.filter(
    (w) => (w.topic?.toLowerCase() || '').includes(q) || (w.summary?.toLowerCase() || '').includes(q)
  );

  const episodicItems = store.episodicMemories.filter(
    (e) =>
      (e.event?.toLowerCase() || '').includes(q) ||
      (e.lesson?.toLowerCase() || '').includes(q) ||
      (e.tags || []).some((t) => (t?.toLowerCase() || '').includes(q))
  );

  return { workingItems, episodicItems };
}
