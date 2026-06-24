/**
 * assistantApi.ts
 * ============================================================
 * Frontend API client for the AI Coding Assistant daemon
 * running at http://127.0.0.1:3001
 *
 * All calls go through the local daemon — never directly to AI providers.
 * ============================================================
 */

const DAEMON_URL = 'http://127.0.0.1:3001';

export interface AssistantHealth {
  ok: boolean;
  service: string;
  version: string;
  workspaceRoot: string;
  hint: string;
  timestamp: string;
}

export interface FileContext {
  relativePath: string;
  absolutePath: string;
  language: string;
  sizeBytes: number;
  lineCount: number;
  content: string;
}

export interface CodeBlock {
  language: string;
  code: string;
  targetFile?: string;
}

export interface EditResult {
  ok: boolean;
  file: string;
  instruction: string;
  taskDetected: string;
  modelUsed: string;
  explanation: string;
  codeBlocks: CodeBlock[];
  primaryCode: CodeBlock | null;
  hasPendingSuggestion: boolean;
  rawResponse: string;
}

export interface ApplyResult {
  ok: boolean;
  file?: string;
  bytesWritten?: number;
  backup?: {
    id: string;
    strategy: string;
    commitHash?: string;
    backupCopyPath?: string;
    createdAt: string;
  };
  message: string;
  applied?: string[];
  results?: Array<{
    ok: boolean;
    bytesWritten: number;
    backup: {
      id: string;
      strategy: string;
      commitHash?: string;
      backupCopyPath?: string;
      createdAt: string;
    };
  }>;
  repairStatus?: {
    ok: boolean;
    message: string;
    loops: number;
    steps?: Array<{
      loop: number;
      errors: string;
      fixedFiles: string[];
    }>;
  };
}

export interface RollbackResult {
  ok: boolean;
  file: string;
  strategy: string;
  message: string;
}

export interface BackupEntry {
  id: string;
  strategy: string;
  commitHash?: string;
  backupCopyPath?: string;
  createdAt: string;
  filePath: string;
}

export interface AskResult {
  ok: boolean;
  answer: string;
  modelUsed: string;
}

export interface DaemonStatus {
  ok: boolean;
  diagnostics: {
    ok: boolean;
    totalEnabledKeys: number;
    providers: Record<string, { enabled: boolean; hasKey: boolean }>;
  };
}

export interface DiffResult {
  ok: boolean;
  diff: string;
  hasChanges: boolean;
}

function daemonUnavailableMessage() {
  return 'Không kết nối được assistant daemon tại 127.0.0.1:3001. Nếu đang chạy EXE, mở Help → Open startup log để xem daemon có start không. Nếu đang dev local, chạy npm run dev hoặc npm run dev:daemon.';
}

export async function daemonFetch<T>(
  path: string,
  options?: RequestInit,
  timeoutMs = 20000
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${DAEMON_URL}${path}`, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timer);

    const json = await res.json();
    if (!res.ok) {
      const errorObj = new Error(json.error ?? `HTTP ${res.status}`) as any;
      errorObj.isQuotaError = json.isQuotaError;
      errorObj.fallbackProfile = json.fallbackProfile;
      throw errorObj;
    }
    return json as T;
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error(`${daemonUnavailableMessage()} Timeout sau ${timeoutMs}ms.`);
    }
    if (err.message?.includes('Failed to fetch') || err.message?.includes('ECONNREFUSED')) {
      throw new Error(daemonUnavailableMessage());
    }
    throw err;
  }
}

export async function checkDaemonHealth(): Promise<AssistantHealth> {
  return daemonFetch<AssistantHealth>('/health', undefined, 3000);
}

export async function getDaemonStatus(): Promise<DaemonStatus> {
  return daemonFetch<DaemonStatus>('/api/status', undefined, 30000);
}

export async function readFile(filePath: string): Promise<FileContext> {
  const res = await daemonFetch<{ ok: boolean; files: FileContext[] }>('/api/read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file: filePath }),
  });
  if (!res.files?.[0]) throw new Error(`File không tìm thấy: ${filePath}`);
  return res.files[0];
}

export async function listDirectory(
  dir: string,
  recursive = false
): Promise<FileContext[]> {
  const res = await daemonFetch<{ ok: boolean; files: FileContext[] }>('/api/read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ directory: dir, recursive }),
  });
  return res.files ?? [];
}

export async function askAI(
  question: string,
  task?: string,
  model?: string
): Promise<AskResult> {
  return daemonFetch<AskResult>('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, task, model }),
  }, 60000);
}

export function getLocalApprovedKnowledgeNotes(): Array<{ title: string; body: string; tags?: string; source?: string }> {
  try {
    const raw = localStorage.getItem('ledgerflow_company_knowledge_v1');
    if (!raw) return [];
    const notes = JSON.parse(raw);
    if (!Array.isArray(notes)) return [];
    return notes
      .filter((note: any) => note && note.trust === 'Approved' && note.title && note.body)
      .map((note: any) => ({
        title: note.title,
        body: note.body,
        tags: note.tags || '',
        source: note.source || 'Founder Note',
      }));
  } catch (e) {
    console.error('Failed to parse local approved knowledge notes:', e);
    return [];
  }
}

export async function editFile(
  file: string | string[],
  instruction: string,
  model?: string,
  agentRole?: string
): Promise<EditResult> {
  const knowledgeNotes = getLocalApprovedKnowledgeNotes();
  return daemonFetch<EditResult>('/api/edit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file, instruction, model, agentRole, knowledgeNotes }),
  }, 120000);
}

export async function applyEdit(
  file: string | string[],
  backupStrategy: 'auto' | 'git-commit' | 'file-copy' = 'auto',
  autoRepair = false,
  originalPrompt?: string
): Promise<ApplyResult> {
  return daemonFetch<ApplyResult>('/api/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file, backupStrategy, autoRepair, originalPrompt }),
  }, 180000);
}

export async function rollbackFile(file: string): Promise<RollbackResult> {
  return daemonFetch<RollbackResult>('/api/rollback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file }),
  }, 30000);
}

export async function listBackups(file: string): Promise<BackupEntry[]> {
  const res = await daemonFetch<{ ok: boolean; backups: BackupEntry[] }>(`/api/backups?file=${encodeURIComponent(file)}`);
  return res.backups ?? [];
}

export async function getDiff(): Promise<DiffResult> {
  return daemonFetch<DiffResult>('/api/diff', undefined, 30000);
}
