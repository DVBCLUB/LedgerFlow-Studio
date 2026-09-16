/**
 * glaciaOrchestrationApi.ts
 * ============================================================
 * Frontend SDK for Glacia Unified Orchestration Engine
 * ------------------------------------------------------------
 * Communicates with:
 *  - POST /api/glacia/orchestrate/execute
 *  - POST /api/glacia/orchestrate/parallel
 *  - POST /api/glacia/orchestrate/chain
 *  - GET  /api/glacia/orchestrate/metrics
 *  - GET  /api/glacia/orchestrate/tasks
 *  - POST /api/glacia/orchestrate/cancel
 * ============================================================
 */

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`Glacia Orchestration API error: HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export type TaskType =
  | 'skill_execute'
  | 'vision_analyze'
  | 'web_research'
  | 'self_heal'
  | 'swarm_shift'
  | 'telegram_command'
  | 'multi_model_reason'
  | 'auto_program'
  | 'blender_render'
  | 'video_generate'
  | 'banner_design';

export type TaskPriority = 'critical' | 'high' | 'normal' | 'low';
export type TaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface OrchestrationTask {
  id: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  payload: Record<string, unknown>;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface OrchestrationMetrics {
  totalTasksExecuted: number;
  successRate: number;
  avgLatencyMs: number;
  tasksByType: Record<TaskType, number>;
  activeTasks: number;
  queueDepth: number;
  lastRunAt: string;
  uptimeHours: number;
}

export interface OrchestrationExecuteResponse {
  success: boolean;
  task: OrchestrationTask;
}

export interface OrchestrationMetricsResponse {
  success: boolean;
  metrics: OrchestrationMetrics;
}

export interface OrchestrationTasksResponse {
  success: boolean;
  queued: OrchestrationTask[];
  completed: OrchestrationTask[];
}

export interface GlaciaAuditEntry {
  entryId: string;
  timestamp: string;
  actionType: string;
  targetResource: string;
  outputSummary: string;
  permissionCheckPassed: boolean;
  constitutionalRulePassed: boolean;
  latencyMs: number;
  integrityHash: string;
}

export interface GlaciaTrustReport {
  autonomy: { currentLevel: number; trustScore: number; emergencyLockout: boolean; totalApprovedMissions: number; totalRejectedMissions: number; lastUpdated: string };
  audit: { entries: GlaciaAuditEntry[]; total: number; isChainValid: boolean };
}

export async function orchestrateExecute(
  type: TaskType,
  payload: Record<string, unknown>,
  priority: TaskPriority = 'normal'
): Promise<OrchestrationTask> {
  const res = await apiRequest<OrchestrationExecuteResponse>('/api/glacia/orchestrate/execute', {
    method: 'POST',
    body: JSON.stringify({ type, payload, priority }),
  });
  return res.task;
}

export async function orchestrateParallel(
  tasks: Array<{ type: TaskType; payload: Record<string, unknown>; priority?: TaskPriority }>
): Promise<OrchestrationTask[]> {
  const res = await apiRequest<{ success: boolean; tasks: OrchestrationTask[] }>(
    '/api/glacia/orchestrate/parallel',
    {
      method: 'POST',
      body: JSON.stringify({ tasks }),
    }
  );
  return res.tasks;
}

export async function orchestrateChain(
  chain: Array<{ type: TaskType; payloadTransform?: string; priority?: TaskPriority }>
): Promise<OrchestrationTask[]> {
  const res = await apiRequest<{ success: boolean; tasks: OrchestrationTask[] }>(
    '/api/glacia/orchestrate/chain',
    {
      method: 'POST',
      body: JSON.stringify({ chain }),
    }
  );
  return res.tasks;
}

export async function fetchOrchestrationMetrics(): Promise<OrchestrationMetrics> {
  const res = await apiRequest<OrchestrationMetricsResponse>('/api/glacia/orchestrate/metrics');
  return res.metrics;
}

export async function fetchOrchestrationTasks(): Promise<{ queued: OrchestrationTask[]; completed: OrchestrationTask[] }> {
  const res = await apiRequest<OrchestrationTasksResponse>('/api/glacia/orchestrate/tasks');
  return { queued: res.queued, completed: res.completed };
}

export async function fetchGlaciaTrustReport(limit = 30): Promise<GlaciaTrustReport> {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const res = await apiRequest<{ success: boolean } & GlaciaTrustReport>(`/api/glacia/orchestrate/trust-report?limit=${safeLimit}`);
  return { autonomy: res.autonomy, audit: res.audit };
}

export interface DAGNode {
  id: string;
  type: TaskType;
  payload: Record<string, unknown>;
  priority?: TaskPriority;
  dependsOn?: string[];
}

export interface DAGWorkflowResult {
  workflowId: string;
  success: boolean;
  totalDurationMs: number;
  nodeResults: Record<string, OrchestrationTask>;
  error?: string;
}

export async function orchestrateDAG(
  nodes: DAGNode[],
  workflowId?: string
): Promise<DAGWorkflowResult> {
  const res = await apiRequest<{ success: boolean; result: DAGWorkflowResult }>(
    '/api/glacia/orchestrate/dag',
    {
      method: 'POST',
      body: JSON.stringify({ nodes, workflowId }),
    }
  );
  return res.result;
}

export async function cancelOrchestrationTask(taskId: string): Promise<boolean> {
  const res = await apiRequest<{ success: boolean }>('/api/glacia/orchestrate/cancel', {
    method: 'POST',
    body: JSON.stringify({ taskId }),
  });
  return res.success;
}

// --- Auto-Programmer API ---

export interface AutoProgramRequest {
  projectType: 'game' | 'software' | 'video';
  title?: string;
  description?: string;
  genre?: string;
  appType?: string;
  targetAudience?: string;
  aspectRatio?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AutoProgramResult {
  id: string;
  projectType: string;
  title: string;
  status: 'generating' | 'completed' | 'failed';
  content: string;
  modelUsed: string;
  capabilityUsed: string;
  latencyMs: number;
  estimatedCostUsd: number;
  createdAt: string;
  completedAt?: string;
}

export async function autoProgramGenerate(request: AutoProgramRequest): Promise<AutoProgramResult> {
  const res = await apiRequest<{ success: boolean; result: AutoProgramResult }>('/api/glacia/auto-program/generate', {
    method: 'POST',
    body: JSON.stringify(request),
  });
  return res.result;
}

export async function autoProgramGetResult(id: string): Promise<AutoProgramResult | null> {
  const res = await apiRequest<{ success: boolean; result: AutoProgramResult }>(`/api/glacia/auto-program/result/${id}`);
  return res.result;
}

export async function autoProgramListSessions(projectType?: string): Promise<any[]> {
  const params = projectType ? `?projectType=${projectType}` : '';
  const res = await apiRequest<{ success: boolean; sessions: any[] }>(`/api/glacia/auto-program/sessions${params}`);
  return res.sessions;
}

export async function autoProgramGetStats(): Promise<{ totalSessions: number; byType: Record<string, number> }> {
  const res = await apiRequest<{ success: boolean; stats: { totalSessions: number; byType: Record<string, number> } }>('/api/glacia/auto-program/stats');
  return res.stats;
}

export async function autoProgramDeleteSession(id: string): Promise<boolean> {
  const res = await apiRequest<{ success: boolean }>(`/api/glacia/auto-program/session/${id}`, {
    method: 'DELETE',
  });
  return res.success;
}

// --- Multi-Model Router API ---

export async function multiModelRoute(request: {
  messages: Array<{ role: string; content: string }>;
  taskType?: string;
  capability?: string;
  options?: Record<string, any>;
}): Promise<{
  content: string;
  modelUsed: string;
  capabilityUsed: string;
  latencyMs: number;
  estimatedCostUsd: number;
  isCached: boolean;
}> {
  const res = await apiRequest<{ success: boolean; response: any }>('/api/glacia/multi-model/route', {
    method: 'POST',
    body: JSON.stringify(request),
  });
  return res.response;
}

export async function multiModelDiagnostics(): Promise<Record<string, any>> {
  const res = await apiRequest<{ success: boolean; diagnostics: Record<string, any> }>('/api/glacia/multi-model/diagnostics');
  return res.diagnostics;
}

// --- WebSocket Task Stream ---

export function connectTaskStreamWebSocket(): WebSocket | null {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws/task-stream`;

  try {
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('[TaskStreamWS] Connected');
    };

    ws.onclose = () => {
      console.log('[TaskStreamWS] Disconnected');
    };

    ws.onerror = (err) => {
      console.error('[TaskStreamWS] Error:', err);
    };

    return ws;
  } catch (err) {
    console.error('[TaskStreamWS] Failed to connect:', err);
    return null;
  }
}

export type TaskStreamMessageType = 'task_progress' | 'task_completed' | 'task_failed' | 'task_log' | 'health';

export interface TaskStreamMessage {
  type: TaskStreamMessageType;
  taskId?: string;
  projectType?: string;
  status?: string;
  progress?: number;
  content?: string;
  log?: string;
  modelUsed?: string;
  latencyMs?: number;
  timestamp: string;
}

// --- Physics Engine API ---

export interface PhysicsBodyInput {
  id: string;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  w?: number;
  h?: number;
  mass?: number;
  isStatic?: boolean;
  restitution?: number;
  friction?: number;
}

export interface PhysicsSimulateResult {
  bodies: Array<{
    id: string; x: number; y: number;
    vx: number; vy: number;
    w: number; h: number;
  }>;
  collisions: Array<{ a: string; b: string }>;
}

export async function physicsSimulate(
  bodies: PhysicsBodyInput[],
  gravity?: number,
  dt?: number,
  iterations?: number
): Promise<PhysicsSimulateResult> {
  const res = await apiRequest<{ success: boolean; bodies: any; collisions: any }>(
    '/api/glacia/physics/simulate',
    {
      method: 'POST',
      body: JSON.stringify({ bodies, gravity, dt, iterations }),
    }
  );
  return { bodies: res.bodies, collisions: res.collisions };
}

// --- Game Engine API ---

export interface GameStepInput {
  bodies: PhysicsBodyInput[];
  gravity?: number;
  dt?: number;
}

export async function gameStep(input: GameStepInput): Promise<any> {
  const res = await apiRequest<{ success: boolean; bodies: any; collisions: any }>(
    '/api/glacia/game/step',
    {
      method: 'POST',
      body: JSON.stringify(input),
    }
  );
  return { bodies: res.bodies, collisions: res.collisions };
}

// ?????????????????????????????????????????????????????????????
// Plugin Hot Reloader & Marketplace API (Priority 1 & 2)
// ?????????????????????????????????????????????????????????????

export interface PluginHotReloadStatus {
  enabled: boolean;
  monitoredPlugins: number;
  config: {
    watchDir: string;
    enabled: boolean;
    pollIntervalMs: number;
    autoReload: boolean;
  };
}

export interface PluginCatalogItem {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  loaded: boolean;
}

/**
 * Get hot-reload status
 */
export async function getHotReloadStatus(): Promise<PluginHotReloadStatus> {
  const res = await fetch('/api/glacia/plugins/hot-reload/status');
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data as PluginHotReloadStatus;
}

/**
 * Start hot-reload
 */
export async function startHotReload(): Promise<void> {
  const res = await fetch('/api/glacia/plugins/hot-reload/start', { method: 'POST' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
}

/**
 * Stop hot-reload
 */
export async function stopHotReload(): Promise<void> {
  const res = await fetch('/api/glacia/plugins/hot-reload/stop', { method: 'POST' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
}

/**
 * Configure hot-reload
 */
export async function configureHotReload(config: { watchDir?: string; pollIntervalMs?: number; autoReload?: boolean }): Promise<void> {
  const res = await fetch('/api/glacia/plugins/hot-reload/configure', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
}

/**
 * Force reload a specific plugin
 */
export async function forceReloadPlugin(pluginId: string): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`/api/glacia/plugins/reload/${encodeURIComponent(pluginId)}`, { method: 'POST' });
  const data = await res.json();
  return data;
}

/**
 * Reload all plugins
 */
export async function reloadAllPlugins(): Promise<{ success: number; failed: number }> {
  const res = await fetch('/api/glacia/plugins/reload-all', { method: 'POST' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return { success: data.success, failed: data.failed };
}

/**
 * Get plugin marketplace catalog
 */
export async function getPluginCatalog(): Promise<PluginCatalogItem[]> {
  const res = await fetch('/api/glacia/plugins/marketplace/catalog');
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.catalog;
}

/**
 * Install a plugin
 */
export async function installPlugin(pluginId: string, name: string, description?: string, capabilities?: string[]): Promise<any> {
  const res = await fetch('/api/glacia/plugins/install', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pluginId, name, description, capabilities }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.plugin;
}

/**
 * Uninstall a plugin
 */
export async function uninstallPlugin(pluginId: string): Promise<boolean> {
  const res = await fetch('/api/glacia/plugins/uninstall', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pluginId }),
  });
  const data = await res.json();
  return data.success;
}
