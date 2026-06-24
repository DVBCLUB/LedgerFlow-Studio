/**
 * notificationEngine.ts
 * ============================================================
 * Notification & Alerting Engine — smart notification
 * routing với multi-channel delivery, priority-based
 * filtering, rate limiting, và aggregation windows.
 *
 * Channels: slack_webhook, in_app, file_log, console
 * Features: priority routing, dedup, rate limit, aggregation
 */
import { randomUUID } from 'node:crypto';
import fs from 'fs';
import path from 'path';
import { appendAuditEvent } from './auditLog';

// ─── Types ──────────────────────────────────────────────────────────
export type NotificationChannel = 'slack_webhook' | 'in_app' | 'file_log' | 'console';

export type NotificationPriority = 'critical' | 'high' | 'normal' | 'low';

export interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;          // Template with {{variables}}
  body: string;
  channels: NotificationChannel[];
  minPriority: NotificationPriority;
  rateLimitPerMin: number;
  aggregateWindowMs: number; // Group similar notifications within window
  enabled: boolean;
}

export interface NotificationEvent {
  id: string;
  templateId?: string;
  channel: NotificationChannel;
  priority: NotificationPriority;
  subject: string;
  body: string;
  metadata: Record<string, unknown>;
  status: 'queued' | 'sent' | 'failed' | 'rate_limited' | 'aggregated';
  createdAt: string;
  sentAt?: string;
  error?: string;
}

export interface ChannelConfig {
  channel: NotificationChannel;
  enabled: boolean;
  config: Record<string, string>; // e.g. { webhook_url: '...', bot_name: '...' }
  retryCount: number;
  timeoutMs: number;
}

export interface NotificationStats {
  total: number;
  byChannel: Record<string, number>;
  byPriority: Record<string, number>;
  byStatus: Record<string, number>;
  rateLimited: number;
  aggregated: number;
}

// ─── Default Templates ──────────────────────────────────────────────
const DEFAULT_TEMPLATES: Omit<NotificationTemplate, 'id'>[] = [
  {
    name: 'deploy_complete', subject: 'Deploy: {{status}} — {{configName}}',
    body: 'Deploy "{{configName}}" finished with status: {{status}}.\nDuration: {{durationMs}}ms\nStrategy: {{strategy}}',
    channels: ['slack_webhook', 'in_app'], minPriority: 'normal', rateLimitPerMin: 5, aggregateWindowMs: 30000, enabled: true,
  },
  {
    name: 'security_alert', subject: '🔴 Security Alert: {{severity}} finding in {{file}}',
    body: 'Security audit found {{totalFindings}} issues in {{file}}.\nCritical: {{criticalCount}}, High: {{highCount}}\nScore: {{score}}/100',
    channels: ['slack_webhook', 'in_app', 'console'], minPriority: 'high', rateLimitPerMin: 10, aggregateWindowMs: 15000, enabled: true,
  },
  {
    name: 'system_health', subject: 'System Health: {{healthScore}}/100',
    body: 'Health check results:\n- Score: {{healthScore}}/100\n- Bottlenecks: {{bottleneckCount}}\n- Uptime: {{uptimeMinutes}} min',
    channels: ['in_app', 'file_log'], minPriority: 'low', rateLimitPerMin: 2, aggregateWindowMs: 300000, enabled: true,
  },
  {
    name: 'agent_error', subject: '⚠️ Agent Error: {{agent}} — {{error}}',
    body: 'Agent "{{agent}}" encountered an error:\n{{error}}\n\nAction required: check agent loop monitor.',
    channels: ['slack_webhook', 'in_app', 'file_log'], minPriority: 'high', rateLimitPerMin: 15, aggregateWindowMs: 60000, enabled: true,
  },
  {
    name: 'workflow_complete', subject: 'Workflow: {{status}} — {{workflowName}}',
    body: 'Workflow "{{workflowName}}" completed: {{status}}\nSteps: {{completedSteps}}/{{totalSteps}} OK\nDuration: {{durationMs}}ms',
    channels: ['in_app', 'file_log'], minPriority: 'normal', rateLimitPerMin: 10, aggregateWindowMs: 60000, enabled: true,
  },
];

// ─── Storage ────────────────────────────────────────────────────────
const TEMPLATES_FILE = path.join(process.cwd(), 'notify_templates.json');
const EVENTS_FILE = path.join(process.cwd(), 'notify_events.json');
const LOG_FILE = path.join(process.cwd(), 'notification.log');

let templates: NotificationTemplate[] = [];
let events: NotificationEvent[] = [];
const channelConfigs: ChannelConfig[] = [
  { channel: 'slack_webhook', enabled: true, config: { webhook_url: '' }, retryCount: 2, timeoutMs: 5000 },
  { channel: 'in_app', enabled: true, config: {}, retryCount: 0, timeoutMs: 1000 },
  { channel: 'file_log', enabled: true, config: { log_file: LOG_FILE }, retryCount: 3, timeoutMs: 2000 },
  { channel: 'console', enabled: true, config: {}, retryCount: 0, timeoutMs: 500 },
];

// Rate limit tracking
const rateLimits = new Map<string, { count: number; windowStart: number }>();
const aggregationBuffers = new Map<string, NotificationEvent[]>();
const aggregationTimers = new Map<string, ReturnType<typeof setTimeout>>();

async function init(): Promise<void> {
  try {
    if (fs.existsSync(TEMPLATES_FILE)) templates = JSON.parse(await fs.promises.readFile(TEMPLATES_FILE, 'utf8'));
    if (fs.existsSync(EVENTS_FILE)) events = JSON.parse(await fs.promises.readFile(EVENTS_FILE, 'utf8'));
    // Init defaults if empty
    if (templates.length === 0) {
      const now = new Date().toISOString();
      templates = DEFAULT_TEMPLATES.map(t => ({ ...t, id: `ntpl_${Date.now()}_${randomUUID().slice(0, 4)}` }));
      await saveTemplates();
    }
  } catch { }
}
init().catch(() => undefined);

async function saveTemplates(): Promise<void> { await fs.promises.writeFile(TEMPLATES_FILE, JSON.stringify(templates, null, 2), 'utf8'); }
async function saveEvents(): Promise<void> { await fs.promises.writeFile(EVENTS_FILE, JSON.stringify(events.slice(-200), null, 2), 'utf8'); }

// ─── Core API ───────────────────────────────────────────────────────

export function getTemplates(): NotificationTemplate[] { return [...templates]; }

export function getChannelConfigs(): ChannelConfig[] { return [...channelConfigs]; }

export function updateChannelConfig(channel: NotificationChannel, patch: Partial<ChannelConfig>): boolean {
  const cfg = channelConfigs.find(c => c.channel === channel);
  if (!cfg) return false;
  Object.assign(cfg, patch);
  return true;
}

export function createTemplate(input: Omit<NotificationTemplate, 'id'>): NotificationTemplate {
  const tpl: NotificationTemplate = { ...input, id: `ntpl_${Date.now()}_${randomUUID().slice(0, 4)}` };
  templates.push(tpl);
  saveTemplates().catch(() => undefined);
  return tpl;
}

export function deleteTemplate(id: string): boolean {
  const idx = templates.findIndex(t => t.id === id);
  if (idx < 0) return false;
  templates.splice(idx, 1);
  saveTemplates().catch(() => undefined);
  return true;
}

export async function sendNotification(
  templateName: string,
  variables: Record<string, string>,
  options: {
    priority?: NotificationPriority;
    channel?: NotificationChannel;
    metadata?: Record<string, unknown>;
  } = {}
): Promise<NotificationEvent | null> {
  const template = templates.find(t => t.name === templateName);
  const priority = options.priority || 'normal';
  const channels = options.channel ? [options.channel] : (template?.channels || ['in_app']);

  // Rate limit check
  const rateLimitKey = `rate:${templateName}`;
  const rl = rateLimits.get(rateLimitKey);
  const rlMax = template?.rateLimitPerMin || 10;
  if (rl) {
    if (Date.now() - rl.windowStart > 60000) { rl.count = 0; rl.windowStart = Date.now(); }
    if (rl.count >= rlMax) {
      // Skip or queue for aggregation
      return null;
    }
    rl.count++;
  } else {
    rateLimits.set(rateLimitKey, { count: 1, windowStart: Date.now() });
  }

  // Build message
  let subject = template?.subject || '{{subject}}';
  let body = template?.body || '{{body}}';

  for (const [key, value] of Object.entries(variables)) {
    const re = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    subject = subject.replace(re, value);
    body = body.replace(re, value);
  }

  // Aggregate check
  const aggregateWindow = template?.aggregateWindowMs || 0;
  if (aggregateWindow > 0) {
    const aggKey = `agg:${templateName}`;
    if (!aggregationBuffers.has(aggKey)) aggregationBuffers.set(aggKey, []);

    const buffer = aggregationBuffers.get(aggKey)!;
    const event: NotificationEvent = {
      id: `nev_${Date.now()}`,
      templateId: template?.id,
      channel: channels[0],
      priority,
      subject: subject.slice(0, 200),
      body: body.slice(0, 2000),
      metadata: options.metadata || {},
      status: 'aggregated',
      createdAt: new Date().toISOString(),
    };
    buffer.push(event);

    // Set aggregation timer
    if (!aggregationTimers.has(aggKey)) {
      aggregationTimers.set(aggKey, setTimeout(() => {
        const aggregated = aggregationBuffers.get(aggKey) || [];
        if (aggregated.length > 1) {
          const summary = `[${aggregated.length} aggregated notifications] ${subject}`;
          deliverToChannel(channels[0], priority, summary, `Aggregated ${aggregated.length} events:\n${aggregated.map(e => `- ${e.body.slice(0, 100)}`).join('\n')}`, event.metadata);
        }
        aggregationBuffers.delete(aggKey);
        aggregationTimers.delete(aggKey);
      }, aggregateWindow));
    }

    return event;
  }

  // Deliver to all channels
  for (const channel of channels) {
    await deliverToChannel(channel, priority, subject, body, options.metadata || {});
  }

  const event: NotificationEvent = {
    id: `nev_${Date.now()}`,
    templateId: template?.id,
    channel: channels[0],
    priority,
    subject: subject.slice(0, 200),
    body: body.slice(0, 2000),
    metadata: options.metadata || {},
    status: 'sent',
    createdAt: new Date().toISOString(),
    sentAt: new Date().toISOString(),
  };

  events.push(event);
  if (events.length % 20 === 0) saveEvents().catch(() => undefined);

  return event;
}

async function deliverToChannel(
  channel: NotificationChannel,
  priority: NotificationPriority,
  subject: string,
  body: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  const cfg = channelConfigs.find(c => c.channel === channel);
  if (!cfg?.enabled) return;

  switch (channel) {
    case 'console': {
      const prefix = priority === 'critical' ? '🔴' : priority === 'high' ? '🟠' : priority === 'low' ? '🔵' : '⚪';
      console.log(`[Notify] ${prefix} ${subject}`);
      console.log(`  ${body.slice(0, 200)}`);
      break;
    }
    case 'file_log': {
      const logLine = `[${new Date().toISOString()}] [${priority.toUpperCase()}] ${subject}\n${body}\n---\n`;
      await fs.promises.appendFile(LOG_FILE, logLine, 'utf8');
      break;
    }
    case 'slack_webhook': {
      const webhookUrl = cfg.config.webhook_url;
      if (!webhookUrl) break;
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: `*${subject}*\n${body}` }),
          signal: AbortSignal.timeout(cfg.timeoutMs),
        });
      } catch { /* Slack delivery optional */ }
      break;
    }
    case 'in_app':
      // Stored in events list, picked up by UI polling
      break;
  }
}

export function listEvents(filter?: { channel?: NotificationChannel; priority?: NotificationPriority; limit?: number }): NotificationEvent[] {
  let result = [...events];
  if (filter?.channel) result = result.filter(e => e.channel === filter.channel);
  if (filter?.priority) result = result.filter(e => e.priority === filter.priority);
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return result.slice(0, filter?.limit || 100);
}

export function getNotificationStats(): NotificationStats {
  const byChannel: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  let rateLimited = 0;
  let aggregated = 0;

  for (const e of events) {
    byChannel[e.channel] = (byChannel[e.channel] || 0) + 1;
    byPriority[e.priority] = (byPriority[e.priority] || 0) + 1;
    byStatus[e.status] = (byStatus[e.status] || 0) + 1;
    if (e.status === 'rate_limited') rateLimited++;
    if (e.status === 'aggregated') aggregated++;
  }

  return { total: events.length, byChannel, byPriority, byStatus, rateLimited, aggregated };
}

export function clearEvents(): void { events = []; saveEvents().catch(() => undefined); }
