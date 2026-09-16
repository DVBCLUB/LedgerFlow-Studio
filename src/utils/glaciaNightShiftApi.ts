/**
 * glaciaNightShiftApi.ts
 * ============================================================
 * Frontend API client for Glacia Night Shift Autopilot & Morning Briefing
 * ============================================================
 */

export interface NightTask {
  id: string;
  name: string;
  category: 'code_patrol' | 'memory_consolidation' | 'market_spider' | 'content_draft' | 'system_hygiene';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  resultSummary?: string;
  durationMs?: number;
  completedAt?: string;
}

export interface NightShiftSession {
  id: string;
  startedAt: string;
  endedAt?: string;
  status: 'active' | 'completed' | 'paused';
  tasks: NightTask[];
  tasksCompleted: number;
  tasksFailed: number;
  systemHealthScore: number;
  morningHandoffBriefing?: string;
  logs: Array<{ timestamp: string; message: string; level: 'info' | 'warn' | 'success' | 'error' }>;
}

export async function triggerNightShiftAutopilot(): Promise<NightShiftSession> {
  const res = await fetch('/api/glacia/night-shift/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to trigger Night Shift Autopilot');
  }
  return data.session;
}

export async function fetchNightShiftHistory(): Promise<NightShiftSession[]> {
  const res = await fetch('/api/glacia/night-shift/history');
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch Night Shift history');
  }
  return data.history;
}

export async function fetchLatestMorningBriefing(): Promise<string> {
  const res = await fetch('/api/glacia/night-shift/briefing');
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch Morning Briefing');
  }
  return data.briefing;
}
