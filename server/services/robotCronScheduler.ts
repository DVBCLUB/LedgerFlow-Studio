/**
 * robotCronScheduler.ts
 * ============================================================
 * LedgerFlow Studio — Autonomous Robot Cron & Task Scheduler
 * 
 * Schedules recurring multi-platform RPA jobs (Web + Desktop + Mobile)
 * executing in background daemon mode with safety envelope protection.
 */

import { randomUUID } from 'node:crypto';
import { dispatchMultiPlatformRobotMission, type MultiPlatformRobotMission } from './multiPlatformRobotSwarm.ts';

export interface RobotCronJobConfig {
  id: string;
  cronExpression: string; // e.g. '0 8 * * *' (Every day at 8:00 AM)
  title: string;
  webTarget?: string;
  desktopCommand?: string;
  telegramChatId?: string;
  enabled: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  runCount: number;
}

const scheduledJobs = new Map<string, RobotCronJobConfig>();

// Seed default cron job
const defaultJobId = 'cron_rpa_daily_invoice';
scheduledJobs.set(defaultJobId, {
  id: defaultJobId,
  cronExpression: '0 8 * * *',
  title: 'Tự động lấy hóa đơn portal MISA & Gửi tin nhắn Telegram hàng ngày',
  webTarget: 'https://sandbox.ledgerflow.io/invoices',
  desktopCommand: 'robot://windows/save-pdf-invoice',
  telegramChatId: 'telegram://channel/ops-alerts',
  enabled: true,
  lastRunAt: new Date().toISOString(),
  nextRunAt: new Date(Date.now() + 86400000).toISOString(),
  runCount: 12,
});

export function registerRobotCronJob(input: {
  cronExpression: string;
  title: string;
  webTarget?: string;
  desktopCommand?: string;
  telegramChatId?: string;
}): RobotCronJobConfig {
  const id = `cron_${Date.now()}_${randomUUID().slice(0, 6)}`;
  const config: RobotCronJobConfig = {
    id,
    cronExpression: input.cronExpression || '0 8 * * *',
    title: input.title,
    webTarget: input.webTarget,
    desktopCommand: input.desktopCommand,
    telegramChatId: input.telegramChatId,
    enabled: true,
    nextRunAt: new Date(Date.now() + 3600000).toISOString(),
    runCount: 0,
  };

  scheduledJobs.set(id, config);
  return config;
}

export function listRobotCronJobs(): RobotCronJobConfig[] {
  return Array.from(scheduledJobs.values());
}

export async function triggerRobotCronJobNow(id: string): Promise<MultiPlatformRobotMission> {
  const job = scheduledJobs.get(id);
  if (!job) {
    throw new Error(`Robot cron job "${id}" not found.`);
  }

  const mission = await dispatchMultiPlatformRobotMission({
    title: `[CRON EXECUTION] ${job.title}`,
    webTarget: job.webTarget,
    desktopCommand: job.desktopCommand,
    telegramChatId: job.telegramChatId,
  });

  job.lastRunAt = new Date().toISOString();
  job.runCount += 1;

  return mission;
}
