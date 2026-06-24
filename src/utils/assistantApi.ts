/**
 * assistantApi.ts
 * Frontend API client for the local AI assistant daemon at http://127.0.0.1:3001.
 */

const DAEMON_URL = 'http://127.0.0.1:3001';

export interface AssistantHealth { ok: boolean; service: string; version: string; workspaceRoot: string; hint: string; timestamp: string }
export interface FileContext { relativePath: string; absolutePath: string; language: string; sizeBytes: number; lineCount: number; content: string }
export interface CodeBlock { language: string; code: string; targetFile?: string }
export interface EditResult { ok: boolean; file: string; instruction: string; taskDetected: string; modelUsed: string; explanation: string; codeBlocks: CodeBlock[]; primaryCode: CodeBlock | null; hasPendingSuggestion: boolean; rawResponse: string }
export interface ApplyResult { ok: boolean; file?: string; bytesWritten?: number; backup?: { id: string; strategy: string; commitHash?: string; backupCopyPath?: string; createdAt: string }; message: string; applied?: string[]; results?: Array<{ ok: boolean; bytesWritten: number; backup: { id: string; strategy: string; commitHash?: string; backupCopyPath?: string; createdAt: string } }>; repairStatus?: { ok: boolean; message: string; loops: number; steps?: Array<{ loop: number; errors: string; fixedFiles: string[] }> } }
export interface RollbackResult { ok: boolean; file: string; strategy: string; message: string }
export interface BackupEntry { id: string; strategy: string; commitHash?: string; backupCopyPath?: string; createdAt: string; filePath: string }
export interface AskResult { ok: boolean; answer: string; modelUsed: string }
export interface DaemonStatus { ok: boolean; diagnostics: { ok: boolean; totalEnabledKeys: number; providers: Record<string, { enabled: boolean; hasKey: boolean }> } }
export interface DiffResult { ok: boolean; diff: string; hasChanges: boolean }

function daemonUnavailableMessage() {
  return 'Không kết nối được assistant daemon tại 127.0.0.1:3001. Nếu đang chạy EXE, mở Help → Open startup log để xem daemon có start không. Nếu đang dev local, chạy npm run dev hoặc npm run dev:daemon.';
}

export async function daemonFetch<T>(path: string, options?: RequestInit, timeoutMs = 20000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${DAEMON_URL}${path}`, { ...options, signal: controller.signal });
    clearTimeout(timer);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errorObj = new Error(json.error ?? json.message ?? `HTTP ${res.status}`) as any;
      errorObj.isQuotaError = json.isQuotaError;
      errorObj.fallbackProfile = json.fallbackProfile;
      throw errorObj;
    }
    return json as T;
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new Error(`${daemonUnavailableMessage()} Timeout sau ${timeoutMs}ms.`);
    if (err.message?.includes('Failed to fetch') || err.message?.includes('ECONNREFUSED')) throw new Error(daemonUnavailableMessage());
    throw err;
  }
}

export async function checkDaemonHealth(): Promise<AssistantHealth> { return daemonFetch<AssistantHealth>('/health', undefined, 3000); }
export async function getDaemonStatus(): Promise<DaemonStatus> { return daemonFetch<DaemonStatus>('/api/status', undefined, 30000); }

export async function readFile(filePath: string): Promise<FileContext> {
  const res = await daemonFetch<{ ok: boolean; files: FileContext[] }>('/api/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file: filePath }) });
  if (!res.files?.[0]) throw new Error(`File không tìm thấy: ${filePath}`);
  return res.files[0];
}

export async function listDirectory(dir: string, recursive = false): Promise<FileContext[]> {
  const res = await daemonFetch<{ ok: boolean; files: FileContext[] }>('/api/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ directory: dir, recursive }) });
  return res.files ?? [];
}

export async function askAI(question: string, task?: string, model?: string): Promise<AskResult> {
  return daemonFetch<AskResult>('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, task, model }) }, 60000);
}

export function getLocalApprovedKnowledgeNotes(): Array<{ title: string; body: string; tags?: string; source?: string }> {
  try {
    const raw = localStorage.getItem('ledgerflow_company_knowledge_v1');
    if (!raw) return [];
    const notes = JSON.parse(raw);
    if (!Array.isArray(notes)) return [];
    return notes.filter((note: any) => note && note.trust === 'Approved' && note.title && note.body).map((note: any) => ({ title: note.title, body: note.body, tags: note.tags || '', source: note.source || 'Founder Note' }));
  } catch { return []; }
}

export async function editFile(file: string | string[], instruction: string, model?: string, agentRole?: string): Promise<EditResult> {
  const knowledgeNotes = getLocalApprovedKnowledgeNotes();
  return daemonFetch<EditResult>('/api/edit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file, instruction, model, agentRole, knowledgeNotes }) }, 120000);
}

export async function applyEdit(file: string | string[], backupStrategy: 'auto' | 'git-commit' | 'file-copy' = 'auto', autoRepair = false, originalPrompt?: string): Promise<ApplyResult> {
  return daemonFetch<ApplyResult>('/api/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file, backupStrategy, autoRepair, originalPrompt }) }, 180000);
}

export async function getApplyStatus(): Promise<{ success: boolean; progress: any }> { return daemonFetch<any>('/api/apply/status'); }
export async function rollbackFile(file: string): Promise<RollbackResult> { return daemonFetch<RollbackResult>('/api/rollback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file }) }, 30000); }
export async function createFile(file: string, instruction: string): Promise<{ ok: boolean; file: string; modelUsed: string; message: string }> { const knowledgeNotes = getLocalApprovedKnowledgeNotes(); return daemonFetch('/api/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file, instruction, knowledgeNotes }) }); }
export async function listBackups(file: string): Promise<BackupEntry[]> { const res = await daemonFetch<{ ok: boolean; backups: BackupEntry[] }>(`/api/backups?file=${encodeURIComponent(file)}`); return res.backups ?? []; }
export async function getDiff(file?: string, original?: string, suggested?: string): Promise<DiffResult> {
  if (file && original !== undefined && suggested !== undefined) {
    return daemonFetch<DiffResult>('/api/diff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file, original, suggested }) });
  }
  return daemonFetch<DiffResult>('/api/diff', undefined, 30000);
}

export interface SearchResultMatch { relativePath: string; score: number; snippet: string }
export interface AgentRoleSummary { id: string; emoji: string; group: string }
export interface AgentRoleDetail extends AgentRoleSummary { systemPrompt: string }
export async function searchCodebase(query: string, limit?: number): Promise<SearchResultMatch[]> { const res = await daemonFetch<{ ok: boolean; results: SearchResultMatch[] }>('/api/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, limit }) }); return res.results ?? []; }
export async function reindexCodebase(): Promise<{ ok: boolean; durationMs: number; totalFiles: number }> { return daemonFetch('/api/search/reindex', { method: 'POST' }); }
export async function fetchAgentRoles(): Promise<AgentRoleSummary[]> { const res = await daemonFetch<{ ok: boolean; roles: AgentRoleSummary[] }>('/api/roles'); return res.roles ?? []; }
export async function fetchAgentRoleById(roleId: string): Promise<AgentRoleDetail> { const res = await daemonFetch<{ ok: boolean; role: AgentRoleDetail }>(`/api/roles/${encodeURIComponent(roleId)}`); return res.role; }
export async function updateAgentRolePrompt(roleId: string, systemPrompt: string): Promise<{ ok: boolean; message: string }> { return daemonFetch<{ ok: boolean; message: string }>(`/api/roles/${encodeURIComponent(roleId)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ systemPrompt }) }); }
export async function applySelection(file: string, selectedText: string, startLine: number, endLine: number, instruction: string): Promise<any> { const knowledgeNotes = getLocalApprovedKnowledgeNotes(); return daemonFetch('/api/ide/selection', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file, selectedText, startLine, endLine, instruction, knowledgeNotes }) }); }

export interface WebAIProfile { id: string; name: string; platform: string; profileDir: string; createdAt: string; lastUsedAt?: string; enabled: boolean; status: 'untested' | 'ready' | 'quota' | 'login_required' | 'error'; quotaResetAt?: string; lastError?: string; consecutiveFailures: number }
export interface PlatformAccountLease { id: string; resourceId: string; resourceKind: 'web_profile' | 'api_key'; platform: string; leaseOwner: string; purpose: string; status: 'active' | 'released' | 'expired'; createdAt: string; expiresAt: string; releasedAt?: string; releasedBy?: string }
export interface PlatformAccountResource { id: string; kind: 'web_profile' | 'api_key'; platform: string; label: string; mode: 'web_automation' | 'api'; enabled: boolean; status: 'untested' | 'ready' | 'quota' | 'login_required' | 'error' | 'active' | 'disabled'; createdAt: string; lastUsedAt?: string; lastError?: string; quotaResetAt?: string; consecutiveFailures?: number; capacity: 'exclusive' | 'shared'; leaseable: boolean; source: 'web_ai_profile' | 'ai_key_vault'; detail: Record<string, unknown>; activeLease?: PlatformAccountLease | null }
export interface PlatformAccountSummary { totalResources: number; byKind: Record<'web_profile' | 'api_key', number>; byStatus: Record<string, number>; activeLeases: number }
export interface WebAIExecuteResult { ok: boolean; text: string; codeBlocks: CodeBlock[]; modelUsed: string; hasPendingSuggestion: boolean; profileUsed?: string; attempts?: Array<{ profileId?: string; status: string; error?: string }>; screenshotPath?: string }
export interface WebAIExecutionPreview { id: string; fingerprint: string; platform: string; profileId?: string; promptChars: number; redactedPreview: string; findings: Array<{ type: string; severity: 'sensitive' | 'secret'; count: number }>; risk: 'LOW' | 'HIGH' | 'BLOCKED'; blocked: boolean; requiresApproval: boolean; expiresAt: string }
export async function previewWebAIExecution(prompt: string, platform: string, profileId?: string): Promise<WebAIExecutionPreview> { const res = await daemonFetch<{ ok: boolean; preview: WebAIExecutionPreview }>('/api/web-ai/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, platform, profileId }) }); return res.preview; }
export async function approveWebAIExecution(previewId: string, fingerprint: string): Promise<{ approvalToken: string; expiresAt: string }> { return daemonFetch('/api/web-ai/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ previewId, fingerprint, confirmed: true }) }); }
export async function executeWebAI(prompt: string, platform: string, file?: string | string[], profileId?: string, headless?: boolean, allowProfileFallback?: boolean, previewId?: string, approvalToken?: string, captureScreenshot?: boolean, screenshotPath?: string, filesToUpload?: string[]): Promise<WebAIExecuteResult> { return daemonFetch<WebAIExecuteResult>('/api/web-ai/execute', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, platform, file, profileId, headless, allowProfileFallback, previewId, approvalToken, captureScreenshot, screenshotPath, filesToUpload }) }, 240000); }
export async function fetchWebAIProfiles(): Promise<WebAIProfile[]> { const res = await daemonFetch<{ ok: boolean; profiles: WebAIProfile[] }>('/api/web-ai/profiles'); return res.profiles ?? []; }
export async function createWebAIProfile(name: string, platform: string, customPath?: string): Promise<WebAIProfile> { const res = await daemonFetch<{ ok: boolean; profile: WebAIProfile }>('/api/web-ai/profiles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, platform, customPath }) }); return res.profile; }
export async function updateWebAIProfile(id: string, patch: Partial<Pick<WebAIProfile, 'name' | 'enabled' | 'status' | 'quotaResetAt' | 'lastError'>>): Promise<WebAIProfile> { const res = await daemonFetch<{ ok: boolean; profile: WebAIProfile }>(`/api/web-ai/profiles/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }); return res.profile; }
export async function deleteWebAIProfile(id: string): Promise<{ ok: boolean; message: string }> { return daemonFetch<{ ok: boolean; message: string }>(`/api/web-ai/profiles/${encodeURIComponent(id)}`, { method: 'DELETE' }); }
export async function checkWebAIProfileSession(id: string, platform: string): Promise<{ ok: boolean; status: string; error?: string }> { return daemonFetch<{ ok: boolean; status: string; error?: string }>(`/api/web-ai/profiles/${encodeURIComponent(id)}/check`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platform }) }, 40000); }
export async function openWebAIProfileLogin(id: string, platform: string): Promise<{ ok: boolean; status: string; error?: string }> { return daemonFetch<{ ok: boolean; status: string; error?: string }>(`/api/web-ai/profiles/${encodeURIComponent(id)}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platform }) }, 300000); }
export async function fetchPlatformAccountResources(platform?: string): Promise<{ resources: PlatformAccountResource[]; leases: PlatformAccountLease[]; summary: PlatformAccountSummary }> { const query = platform ? `?platform=${encodeURIComponent(platform)}` : ''; return daemonFetch(`/api/platform-accounts/resources${query}`); }
export async function fetchPlatformAccountLeases(): Promise<PlatformAccountLease[]> { const res = await daemonFetch<{ ok: boolean; leases: PlatformAccountLease[] }>('/api/platform-accounts/leases'); return res.leases ?? []; }
export async function claimPlatformAccountLease(input: { platform: string; resourceId?: string; leaseOwner: string; purpose: string; ttlMinutes?: number }): Promise<{ resource: PlatformAccountResource; lease: PlatformAccountLease }> { return daemonFetch('/api/platform-accounts/leases/claim', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }); }
export async function releasePlatformAccountLease(id: string, releasedBy?: string): Promise<PlatformAccountLease> { const res = await daemonFetch<{ ok: boolean; lease: PlatformAccountLease }>(`/api/platform-accounts/leases/${encodeURIComponent(id)}/release`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ releasedBy }) }); return res.lease; }

export interface ExecResult { ok: boolean; exitCode: number; output: string }
export async function executeSafeCommand(command: string): Promise<ExecResult> { return daemonFetch<ExecResult>('/api/exec', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ command }) }, 60000); }
export interface AuditLogEntry { id: string; createdAt: string; actor: 'founder' | 'ai-agent' | 'system' | 'connector'; workspace: string; action: string; target: string; risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKED'; status: 'planned' | 'sandbox' | 'pending_approval' | 'approved' | 'rejected' | 'executed' | 'failed'; summary: string; evidence?: Record<string, any>; approvalId?: string; connectorId?: string; previousSignature?: string; signature?: string }
export interface AuditChainVerificationResult { ok: boolean; valid: boolean; checked: number; failures: string[] }
export async function fetchAuditLogs(limit = 100): Promise<AuditLogEntry[]> { const res = await daemonFetch<{ ok: boolean; logs: AuditLogEntry[] }>(`/api/audit/logs?limit=${limit}`); return res.logs ?? []; }
export async function verifyAuditChain(): Promise<AuditChainVerificationResult> { return daemonFetch<AuditChainVerificationResult>('/api/audit/verify', { method: 'POST' }); }

export interface AgentRunStep { id: string; index: number; toolId: string; title: string; successCriteria: string; status: 'queued' | 'running' | 'waiting_approval' | 'completed' | 'failed' | 'stopped'; risk: string; requiresApproval: boolean; toolInput?: Record<string, any>; approvalFingerprint?: string; approvalSignature?: string; observation?: string; evidence?: Record<string, any>; startedAt?: string; completedAt?: string }
export interface AgentRun { id: string; goal: string; status: 'planned' | 'running' | 'waiting_approval' | 'completed' | 'failed' | 'stopped'; requestedBy: string; sourceType: 'direct' | 'workboard' | 'pipeline'; sourceId?: string; maxSteps: number; maxRuntimeMs: number; planner: string; plannerSummary: string; plannerFallbackReason?: string; replanCount: number; createdAt: string; updatedAt: string; steps: AgentRunStep[]; observations: string[]; artifacts: Array<{ id: string; type: string; summary: string; evidence: Record<string, any>; createdAt: string }> }
export interface AgentRuntimeMetrics { emergencyStop: boolean; totalRuns: number; activeRuns: number; waitingApproval: number; completedRuns: number; failedRuns: number; artifactCount: number; averageStepLatencyMs: number; aiPlannedRuns: number; fallbackPlannedRuns: number }
export interface AgentMemoryRecord { id: string; kind: 'company' | 'session' | 'procedure' | 'observation' | 'feedback'; status: 'draft' | 'reviewed' | 'rejected' | 'expired'; title: string; content: string; source: string; sourceRef?: string; tags: string[]; confidence: number; createdAt: string; updatedAt: string; expiresAt?: string; version: number; supersedesId?: string; conflictIds: string[]; sourceQuality: number; score?: number; citation?: string; scoreBreakdown?: { lexical: number; semantic: number; sourceQuality: number } }
export interface RobotSimulationState { emergencyStop: boolean; connected: boolean; mode: 'simulation'; position: { x: number; y: number; z: number; roll?: number; pitch?: number; yaw?: number }; velocity: number; lastHeartbeatAt: string; lastCommandId?: string }
export interface RobotCommandResult { commandId: string; accepted: boolean; mode: 'simulation'; limits: { maxDistanceMm: number; maxVelocityMmS: number }; evidence: { observedAt: string; state: RobotSimulationState } }
export async function fetchAgentRuns(limit = 50): Promise<{ emergencyStop: boolean; stopReason?: string; runs: AgentRun[] }> { return daemonFetch<{ emergencyStop: boolean; stopReason?: string; runs: AgentRun[] }>(`/api/agent-runtime/runs?limit=${limit}`); }
export async function fetchAgentRuntimeMetrics(): Promise<AgentRuntimeMetrics> { const res = await daemonFetch<{ success: boolean; metrics: AgentRuntimeMetrics }>('/api/agent-runtime/metrics'); return res.metrics; }
export async function createAgentRun(goal: string, options?: { maxSteps?: number; plannerMode?: 'auto' | 'ai' | 'deterministic'; requestedTools?: string[] }): Promise<AgentRun> { const res = await daemonFetch<{ success: boolean; run: AgentRun }>('/api/agent-runtime/runs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ goal, ...options }) }); return res.run; }
export async function advanceAgentRun(id: string): Promise<AgentRun> { const res = await daemonFetch<{ success: boolean; run: AgentRun }>(`/api/agent-runtime/runs/${encodeURIComponent(id)}/advance`, { method: 'POST' }); return res.run; }
export async function approveAgentRunStep(runId: string, stepId: string, fingerprint: string, phrase = 'APPROVE AGENT STEP'): Promise<AgentRun> { const res = await daemonFetch<{ success: boolean; run: AgentRun }>(`/api/agent-runtime/runs/${encodeURIComponent(runId)}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stepId, fingerprint, phrase }) }); return res.run; }
export async function stopAgentRun(id: string, reason: string): Promise<AgentRun> { const res = await daemonFetch<{ success: boolean; run: AgentRun }>(`/api/agent-runtime/runs/${encodeURIComponent(id)}/stop`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }) }); return res.run; }
export async function setAgentRuntimeEmergencyStop(active: boolean, reason?: string): Promise<{ emergencyStop: boolean; reason?: string }> { const res = await daemonFetch<{ success: boolean; control: { emergencyStop: boolean; reason?: string } }>('/api/agent-runtime/emergency-stop', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active, reason }) }); return res.control; }
export async function searchAgentMemory(q: string, limit = 8, includeDrafts = true): Promise<AgentMemoryRecord[]> { const res = await daemonFetch<{ success: boolean; results: any[] }>(`/api/agent-memory/search?q=${encodeURIComponent(q)}&limit=${limit}&includeDrafts=${includeDrafts}`); return res.results ?? []; }
export async function createAgentMemory(memory: Partial<AgentMemoryRecord> & { reviewed?: boolean }): Promise<AgentMemoryRecord> { const res = await daemonFetch<{ success: boolean; memory: AgentMemoryRecord }>('/api/agent-memory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(memory) }); return res.memory; }
export async function reviewAgentMemory(id: string, status: 'reviewed' | 'rejected'): Promise<AgentMemoryRecord> { const res = await daemonFetch<{ success: boolean; memory: AgentMemoryRecord }>(`/api/agent-memory/${encodeURIComponent(id)}/review`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); return res.memory; }
export async function fetchRobotStatus(): Promise<RobotSimulationState> { const res = await daemonFetch<{ success: boolean; state: RobotSimulationState }>('/api/robot-simulation/status'); return res.state; }
export async function executeRobotCommand(command: 'inspect' | 'move' | 'stop' | 'home', options?: { position?: { x: number; y: number; z: number }; velocity?: number; approvalPhrase?: string }): Promise<RobotCommandResult> { const res = await daemonFetch<{ success: boolean; result: RobotCommandResult }>('/api/robot-simulation/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ command, ...options }) }); return res.result; }
export async function setRobotEmergencyStop(active: boolean): Promise<RobotSimulationState> { const res = await daemonFetch<{ success: boolean; state: RobotSimulationState }>('/api/robot-simulation/emergency-stop', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active }) }); return res.state; }

export interface FabricStep { route: string; provider?: string; profileId?: string; profileName?: string; status: 'success' | 'failed' | 'skipped'; error?: string; latencyMs: number; contentPreview?: string; evidence?: Record<string, unknown> }
export interface FabricRun { id: string; task: string; domain: string; status: string; startedAt: string; completedAt: string; steps: FabricStep[]; winner?: FabricStep; modelUsed?: string; totalLatencyMs: number }
export type FabricDispatchInput = { text: string; systemInstruction?: string; domain?: string; webPlatform?: string; profileId?: string; localFallback?: boolean; filePath?: string; task?: string; agentRole?: string };
export async function dispatchAIFabric(input: FabricDispatchInput): Promise<FabricRun> { const res = await daemonFetch<{ ok: boolean; run: FabricRun }>('/api/ai-fabric/dispatch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }, 180000); return res.run; }
export async function checkAIFabricHealth(): Promise<{ ok: boolean; apiKeys: number; webProfiles: number; localAvailable: boolean; message: string }> { const res = await daemonFetch<{ ok: boolean; health: any }>('/api/ai-fabric/health'); return res.health; }
export interface ControlPlaneRun { id: string; goal: string; status: string; phases: string[]; steps: Array<{ phase: string; status: string; startedAt?: string; completedAt?: string; result?: FabricRun; handoffPrompt?: any; evidence?: Record<string, unknown>; error?: string }>; createdAt: string; updatedAt: string; completedAt?: string; summary?: string }
export interface ControlPlaneMetrics { totalRuns: number; completed: number; failed: number; waitingHandoff: number; averageSteps: number }
export async function executeControlPlane(input: { goal: string; domain?: string; systemInstruction?: string; webPlatform?: string; profileId?: string; autoHandoff?: boolean; handoffTarget?: string; filePaths?: string[] }): Promise<ControlPlaneRun> { const res = await daemonFetch<{ ok: boolean; run: ControlPlaneRun }>('/api/control-plane/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }, 300000); return res.run; }
export async function fetchControlPlaneRuns(): Promise<{ runs: ControlPlaneRun[]; metrics: ControlPlaneMetrics }> { return daemonFetch('/api/control-plane/runs'); }
export async function fetchControlPlaneRun(id: string): Promise<ControlPlaneRun> { const res = await daemonFetch<{ ok: boolean; run: ControlPlaneRun }>(`/api/control-plane/runs/${encodeURIComponent(id)}`); return res.run; }
