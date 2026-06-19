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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
  file: string;
  bytesWritten: number;
  backup: {
    id: string;
    strategy: string;
    commitHash?: string;
    backupCopyPath?: string;
    createdAt: string;
  };
  message: string;
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

// ---------------------------------------------------------------------------
// Connection helper
// ---------------------------------------------------------------------------

async function daemonFetch<T>(
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
      throw new Error(json.error ?? `HTTP ${res.status}`);
    }
    return json as T;
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error('Daemon không phản hồi (timeout). Hãy chạy: npm run assistant:start');
    }
    if (err.message?.includes('Failed to fetch') || err.message?.includes('ECONNREFUSED')) {
      throw new Error('Không kết nối được daemon. Hãy chạy: npm run assistant:start');
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Ping the daemon — fast, no AI call */
export async function checkDaemonHealth(): Promise<AssistantHealth> {
  return daemonFetch<AssistantHealth>('/health', undefined, 3000);
}

/** Get detailed AI provider status */
export async function getDaemonStatus(): Promise<DaemonStatus> {
  return daemonFetch<DaemonStatus>('/api/status', undefined, 30000);
}

/** Read a file and return its content */
export async function readFile(filePath: string): Promise<FileContext> {
  const res = await daemonFetch<{ ok: boolean; files: FileContext[] }>('/api/read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file: filePath }),
  });
  if (!res.files?.[0]) throw new Error(`File không tìm thấy: ${filePath}`);
  return res.files[0];
}

/** List files in a directory */
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

/** Ask AI a question (no file context) */
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

/** Get AI edit suggestion for a file or multiple files */
export async function editFile(
  file: string | string[],
  instruction: string,
  model?: string,
  agentRole?: string
): Promise<EditResult> {
  return daemonFetch<EditResult>('/api/edit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file, instruction, model, agentRole }),
  }, 120000);
}

/** Apply the pending AI suggestion or explicit content to one or more files */
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
  }, 180000); // Higher timeout for repair loop
}

/** Rollback file to its last backup */
export async function rollbackFile(file: string): Promise<RollbackResult> {
  return daemonFetch<RollbackResult>('/api/rollback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file }),
  });
}

/** Create a new file with AI-generated content */
export async function createFile(
  file: string,
  instruction: string
): Promise<{ ok: boolean; file: string; modelUsed: string; message: string }> {
  return daemonFetch('/api/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file, instruction }),
  });
}

/** List backups for a file */
export async function listBackups(
  file: string
): Promise<BackupEntry[]> {
  const res = await daemonFetch<{ ok: boolean; backups: BackupEntry[] }>(
    `/api/backups?file=${encodeURIComponent(file)}`
  );
  return res.backups ?? [];
}

/** Get unified diff between original and suggested content */
export async function getDiff(
  file: string,
  original: string,
  suggested: string
): Promise<DiffResult> {
  return daemonFetch<DiffResult>('/api/diff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file, original, suggested }),
  });
}

export interface SearchResultMatch {
  relativePath: string;
  score: number;
  snippet: string;
}

export interface AgentRoleSummary {
  id: string;
  emoji: string;
  group: string;
}

export interface AgentRoleDetail extends AgentRoleSummary {
  systemPrompt: string;
}

/** Search codebase using TF-IDF */
export async function searchCodebase(query: string, limit?: number): Promise<SearchResultMatch[]> {
  const res = await daemonFetch<{ ok: boolean; results: SearchResultMatch[] }>('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, limit }),
  });
  return res.results ?? [];
}

/** Rebuild search index */
export async function reindexCodebase(): Promise<{ ok: boolean; durationMs: number; totalFiles: number }> {
  return daemonFetch('/api/search/reindex', {
    method: 'POST',
  });
}

/** List available agent roles */
export async function fetchAgentRoles(): Promise<AgentRoleSummary[]> {
  const res = await daemonFetch<{ ok: boolean; roles: AgentRoleSummary[] }>('/api/roles');
  return res.roles ?? [];
}

/** Fetch one role detail (includes dynamic system prompt from server) */
export async function fetchAgentRoleById(roleId: string): Promise<AgentRoleDetail> {
  const res = await daemonFetch<{ ok: boolean; role: AgentRoleDetail }>(`/api/roles/${encodeURIComponent(roleId)}`);
  return res.role;
}

/** Apply edit on selection */
export async function applySelection(
  file: string,
  selectedText: string,
  startLine: number,
  endLine: number,
  instruction: string
): Promise<any> {
  return daemonFetch('/api/ide/selection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file, selectedText, startLine, endLine, instruction }),
  });
}

export interface WebAIProfile {
  id: string;
  name: string;
  platform: string;
  profileDir: string;
  createdAt: string;
  lastUsedAt?: string;
}

export interface WebAIExecuteResult {
  ok: boolean;
  text: string;
  codeBlocks: CodeBlock[];
  modelUsed: string;
  hasPendingSuggestion: boolean;
}

/** Execute a prompt on a Web AI platform via Puppeteer browser automation */
export async function executeWebAI(
  prompt: string,
  platform: string,
  file?: string | string[],
  profileId?: string,
  headless?: boolean
): Promise<WebAIExecuteResult> {
  return daemonFetch<WebAIExecuteResult>('/api/web-ai/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, platform, file, profileId, headless }),
  }, 240000); // 4 minute timeout for browser automation
}

/** Retrieve list of registered browser profiles */
export async function fetchWebAIProfiles(): Promise<WebAIProfile[]> {
  const res = await daemonFetch<{ ok: boolean; profiles: WebAIProfile[] }>('/api/web-ai/profiles');
  return res.profiles ?? [];
}

/** Register a new browser profile */
export async function createWebAIProfile(name: string, platform: string): Promise<WebAIProfile> {
  const res = await daemonFetch<{ ok: boolean; profile: WebAIProfile }>('/api/web-ai/profiles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, platform }),
  });
  return res.profile;
}

/** Delete a browser profile context */
export async function deleteWebAIProfile(id: string): Promise<{ ok: boolean; message: string }> {
  return daemonFetch<{ ok: boolean; message: string }>(`/api/web-ai/profiles/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
