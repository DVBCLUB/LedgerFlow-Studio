/**
 * src/utils/glaciaSilentCronApi.ts
 * Frontend Client SDK for Glacia Silent Cron Scheduler & Event Bus.
 */

export interface SilentCronJob {
  id: string;
  name: string;
  category: 'maintenance' | 'tax_vas' | 'fx_hedging' | 'nightshift_swe' | 'executive_brief';
  intervalMinutes: number;
  lastRunAt: string | null;
  nextRunAt: string;
  totalExecutions: number;
  status: 'active_silent' | 'running' | 'idle';
  lastOutcome: string;
  isHeadless: boolean;
}

export interface CronSchedulerState {
  schedulerId: string;
  startedAt: string;
  isRunning: boolean;
  totalJobsExecuted: number;
  jobs: SilentCronJob[];
}

export interface SystemEventPayload {
  eventId: string;
  eventType: string;
  source: string;
  data: Record<string, any>;
  timestamp: string;
  processedSilently: boolean;
}

export async function fetchSilentCronJobs(): Promise<CronSchedulerState> {
  const res = await fetch('/api/glacia/cron/jobs');
  if (!res.ok) throw new Error('Không thể tải danh sách cron jobs');
  const data = await res.json();
  return data.scheduler;
}

export async function triggerCronTick(): Promise<CronSchedulerState> {
  const res = await fetch('/api/glacia/cron/tick', { method: 'POST' });
  if (!res.ok) throw new Error('Không thể kích hoạt cron tick');
  const data = await res.json();
  return data.scheduler;
}

export async function fetchRecentSystemEvents(limit: number = 30): Promise<SystemEventPayload[]> {
  const res = await fetch(`/api/glacia/events/recent?limit=${limit}`);
  if (!res.ok) throw new Error('Không thể tải lịch sử sự kiện hệ thống');
  const data = await res.json();
  return data.events || [];
}

export async function emitFrontendSystemEvent(
  eventType: string,
  data: Record<string, any> = {}
): Promise<SystemEventPayload> {
  const res = await fetch('/api/glacia/events/emit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventType, data, source: 'glacia_frontend_ui' }),
  });
  if (!res.ok) throw new Error('Không thể phát tín hiệu sự kiện');
  const d = await res.json();
  return d.event;
}
