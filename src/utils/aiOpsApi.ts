/**
 * src/utils/aiOpsApi.ts
 * Frontend client cho 3 engine AI Ops (route /api/dormant/*):
 *  - aiCeoAutopilotEngine (CEO autopilot + OKR)
 *  - voiceCeoCommandEngine (voice command)
 *  - pwaOfflineSyncEngine (PWA offline sync)
 */

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

// ── AI CEO Autopilot ─────────────────────────────────────────────
export interface CEODecisionCycleState {
  cycleId: string;
  timestamp: string;
  status: 'active' | 'completed' | 'paused';
  currentPhase: string;
  metrics: {
    decisionsMadeToday: number;
    activeBlockersDetected: number;
    resolvedBlockers: number;
    delegatedTasksCount: number;
    autopilotConfidenceScore: number;
  };
  activePriorities: Array<{
    id: string;
    title: string;
    department: string;
    urgency: string;
    ownerAgent: string;
    status: string;
    impactMetric: string;
  }>;
  executiveInsights: string[];
}
export interface StrategicOKR {
  id: string;
  quarter: string;
  objective: string;
  keyResults: Array<{ krId: string; description: string; targetValue: number; currentValue: number; unit: string }>;
  decomposedSprints?: Array<{ sprintId: string; weekNumber: number; targetDepartment: string; assignedAgents: string[]; actionItems: string[]; estimatedRoiVnd: number }>;
}

export function getCeoAutopilotState(): Promise<CEODecisionCycleState> {
  return request<{ success: boolean; state: CEODecisionCycleState }>('/api/dormant/autopilot/state').then((r) => r.state);
}
export function triggerCeoAutopilotCycle(triggerSource?: string): Promise<Record<string, unknown>> {
  return request<{ success: boolean }>('/api/dormant/autopilot/cycle', {
    method: 'POST',
    body: JSON.stringify({ triggerSource }),
  });
}
export function listStrategicOKRs(): Promise<StrategicOKR[]> {
  return request<{ success: boolean; okrs: StrategicOKR[] }>('/api/dormant/autopilot/okrs').then((r) => r.okrs ?? []);
}
export function decomposeStrategicOKR(okrId: string, customObjective?: string): Promise<StrategicOKR> {
  return request<{ success: boolean; okr: StrategicOKR }>('/api/dormant/autopilot/okrs/decompose', {
    method: 'POST',
    body: JSON.stringify({ okrId, customObjective }),
  }).then((r) => r.okr);
}

// ── Voice CEO Command ────────────────────────────────────────────
export interface VoiceCommand {
  id: string;
  transcript: string;
  intent: string;
  confidence: number;
  action: string;
  status: 'executed' | 'pending_confirm' | 'rejected';
  executedAt: string | null;
  delegatedTo: string | null;
}
export interface VoiceCommandResult {
  success: boolean;
  commandId: string;
  transcript: string;
  intent: string;
  confidence: number;
  actionTaken: string;
  delegatedTo: string;
  responseText: string;
  completedAt: string;
}

export function getVoiceCommandHistory(): Promise<VoiceCommand[]> {
  return request<{ success: boolean; commands: VoiceCommand[]; accuracyPercent: number; totalCommandsToday: number; topIntents: { intent: string; count: number }[] }>(
    '/api/dormant/voice-cmd/history'
  ).then((r) => r.commands ?? []);
}
export function processVoiceCommand(transcript: string, lang = 'vi'): Promise<VoiceCommandResult> {
  return request<{ success: boolean } & VoiceCommandResult>('/api/dormant/voice-cmd/execute', {
    method: 'POST',
    body: JSON.stringify({ transcript, lang }),
  });
}

// ── PWA Offline Sync ─────────────────────────────────────────────
export interface PwaSyncStatus {
  queueDepth: number;
  lastSyncAt: string | null;
  conflictCount: number;
  pendingBytes: number;
  connectedClients: number;
  serviceWorkerVersion: string;
  isOnline: boolean;
}
export interface PwaSyncResult {
  success: boolean;
  syncBatchId: string;
  itemsSynced: number;
  conflictsResolved: number;
  itemsFailed: number;
  completedAt: string;
}

export function getPwaSyncStatus(): Promise<PwaSyncStatus> {
  return request<{ success: boolean } & PwaSyncStatus>('/api/dormant/pwa-sync/status');
}
export function forcePwaSync(payload: Record<string, unknown> = {}): Promise<PwaSyncResult> {
  return request<{ success: boolean } & PwaSyncResult>('/api/dormant/pwa-sync/force', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
