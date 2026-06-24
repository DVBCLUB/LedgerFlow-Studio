import { fireAutomationEvent } from './automationRuleEngine.ts';
import { appendAuditEvent } from './auditLog.ts';

export interface AutomationSchedulerStatus {
  running: boolean;
  intervalMs: number;
  startedAt?: string;
  lastTickAt?: string;
  lastDailyKey?: string;
  lastWeeklyKey?: string;
  tickCount: number;
}

let timer: NodeJS.Timeout | null = null;
const status: AutomationSchedulerStatus = {
  running: false,
  intervalMs: 60 * 60 * 1000,
  tickCount: 0,
};

function dateKey(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

function weekKey(now = new Date()) {
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export async function runAutomationSchedulerTick(now = new Date()) {
  status.tickCount += 1;
  status.lastTickAt = now.toISOString();
  const fired: string[] = [];
  const today = dateKey(now);
  const week = weekKey(now);

  if (status.lastDailyKey !== today) {
    status.lastDailyKey = today;
    await fireAutomationEvent('daily.trigger', { date: today, source: 'automationSchedulerLoop' });
    fired.push('daily.trigger');
  }

  if (status.lastWeeklyKey !== week) {
    status.lastWeeklyKey = week;
    await fireAutomationEvent('weekly.trigger', { week, source: 'automationSchedulerLoop' });
    fired.push('weekly.trigger');
  }

  if (fired.length) {
    await appendAuditEvent({
      actor: 'system',
      workspace: 'automation-scheduler',
      action: 'automation.scheduler.tick',
      target: fired.join(','),
      risk: 'LOW',
      status: 'executed',
      summary: `Automation scheduler fired: ${fired.join(', ')}.`,
      evidence: { fired, today, week, tickCount: status.tickCount },
    });
  }

  return { fired, status: getAutomationSchedulerStatus() };
}

export function startAutomationScheduler(input?: { intervalMs?: number }) {
  if (timer) return getAutomationSchedulerStatus();
  const intervalMs = Math.max(60_000, Math.min(input?.intervalMs || status.intervalMs, 24 * 60 * 60 * 1000));
  status.intervalMs = intervalMs;
  status.running = true;
  status.startedAt = new Date().toISOString();
  timer = setInterval(() => {
    runAutomationSchedulerTick().catch((error) => {
      appendAuditEvent({
        actor: 'system',
        workspace: 'automation-scheduler',
        action: 'automation.scheduler.error',
        target: 'scheduler-loop',
        risk: 'MEDIUM',
        status: 'failed',
        summary: error instanceof Error ? error.message : String(error),
      }).catch(() => undefined);
    });
  }, intervalMs);
  timer.unref?.();
  return getAutomationSchedulerStatus();
}

export function stopAutomationScheduler() {
  if (timer) clearInterval(timer);
  timer = null;
  status.running = false;
  return getAutomationSchedulerStatus();
}

export function getAutomationSchedulerStatus(): AutomationSchedulerStatus {
  return { ...status };
}
