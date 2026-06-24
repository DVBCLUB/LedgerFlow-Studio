/**
 * webhookIntegrationHub.ts
 * ============================================================
 * Webhook Integration Hub — nhận webhook từ GitHub, Slack,
 * và các external services, tự động kích hoạt agent pipeline.
 *
 * Support: GitHub push/PR, Slack slash commands, generic JSON webhooks
 */
import { randomUUID } from 'node:crypto';
import { dispatchTextThroughFabric } from './aiFabric';
import { runAgenticLoop } from './agenticLoopEngine';
import { appendAuditEvent } from './auditLog';
import { searchCodebase } from './localSearchService';
import fs from 'fs';
import path from 'path';

// ─── Types ──────────────────────────────────────────────────────────
export type WebhookSource = 'github' | 'slack' | 'generic' | 'file_watcher';

export interface WebhookEvent {
  id: string;
  source: WebhookSource;
  event: string;
  payload: Record<string, unknown>;
  receivedAt: string;
  status: 'received' | 'processing' | 'completed' | 'failed';
  agentResult?: string;
  error?: string;
  latencyMs: number;
}

export interface WebhookRule {
  id: string;
  name: string;
  source: WebhookSource;
  eventFilter: string;        // Event name to match (e.g., "push", "pull_request")
  conditions: Record<string, string>; // Key-value conditions in payload
  action: 'run_agent_loop' | 'dispatch_fabric' | 'audit_file' | 'notify';
  goalTemplate: string;        // Template with {{variables}} from payload
  enabled: boolean;
  createdAt: string;
}

export interface WebhookStats {
  totalEvents: number;
  bySource: Record<string, number>;
  byStatus: Record<string, number>;
  rulesActive: number;
}

// ─── Storage ────────────────────────────────────────────────────────
const EVENTS_FILE = path.join(process.cwd(), 'webhook_events.json');
const RULES_FILE = path.join(process.cwd(), 'webhook_rules.json');

let events: WebhookEvent[] = [];
let rules: WebhookRule[] = [];

async function loadAll(): Promise<void> {
  try {
    if (fs.existsSync(EVENTS_FILE)) events = JSON.parse(await fs.promises.readFile(EVENTS_FILE, 'utf8'));
    if (fs.existsSync(RULES_FILE)) rules = JSON.parse(await fs.promises.readFile(RULES_FILE, 'utf8'));
  } catch { }
}
loadAll().catch(() => undefined);

async function saveEvents(): Promise<void> {
  await fs.promises.writeFile(EVENTS_FILE, JSON.stringify(events.slice(-200), null, 2), 'utf8');
}
async function saveRules(): Promise<void> {
  await fs.promises.writeFile(RULES_FILE, JSON.stringify(rules, null, 2), 'utf8');
}

// ─── Default Rules ──────────────────────────────────────────────────
function ensureDefaults(): void {
  if (rules.length > 0) return;
  const now = new Date().toISOString();
  rules.push(
    {
      id: `rule_${Date.now()}_01`, name: 'GitHub PR Review', source: 'github',
      eventFilter: 'pull_request',
      conditions: { action: 'opened' },
      action: 'run_agent_loop',
      goalTemplate: 'Review pull request #{{number}}: {{pull_request.title}}. Repository: {{repository.full_name}}',
      enabled: true, createdAt: now,
    },
    {
      id: `rule_${Date.now()}_02`, name: 'GitHub Push - Security Audit', source: 'github',
      eventFilter: 'push',
      conditions: {},
      action: 'dispatch_fabric',
      goalTemplate: 'Security audit the latest changes pushed to {{repository.full_name}} on branch {{ref}}',
      enabled: false, createdAt: now,
    },
    {
      id: `rule_${Date.now()}_03`, name: 'Slack AI Query', source: 'slack',
      eventFilter: 'slash_command',
      conditions: { command: '/ai' },
      action: 'dispatch_fabric',
      goalTemplate: '{{text}}',
      enabled: true, createdAt: now,
    },
  );
  saveRules().catch(() => undefined);
}
ensureDefaults();

// ─── Core API ───────────────────────────────────────────────────────

export async function receiveWebhook(
  source: WebhookSource,
  event: string,
  payload: Record<string, unknown>,
): Promise<WebhookEvent> {
  const eventId = `wh_${Date.now()}_${randomUUID().slice(0, 6)}`;
  const started = Date.now();
  const webhookEvent: WebhookEvent = {
    id: eventId, source, event, payload,
    receivedAt: new Date().toISOString(),
    status: 'received', latencyMs: 0,
  };

  events.push(webhookEvent);

  // Find matching rules
  const matchingRules = rules.filter(r =>
    r.enabled &&
    r.source === source &&
    r.eventFilter === event &&
    Object.entries(r.conditions).every(([k, v]) => {
      const pv = getNestedValue(payload, k);
      return pv === v || v === '' || pv === String(v);
    })
  );

  if (matchingRules.length === 0) {
    webhookEvent.status = 'completed';
    webhookEvent.agentResult = 'No matching rules.';
    webhookEvent.latencyMs = Date.now() - started;
    await appendAuditEvent({
      actor: source, workspace: 'Webhook Hub', action: 'webhook.received',
      target: event, risk: 'LOW', status: 'executed',
      summary: `Webhook ${source}/${event} received, no rules matched.`,
      connectorId: 'webhook-hub', evidence: { eventId, source, event },
    }).catch(() => undefined);
    saveEvents().catch(() => undefined);
    return webhookEvent;
  }

  webhookEvent.status = 'processing';

  // Execute matching rules sequentially
  const results: string[] = [];
  for (const rule of matchingRules) {
    try {
      const goal = interpolateTemplate(rule.goalTemplate, payload);
      let agentResult = '';

      switch (rule.action) {
        case 'run_agent_loop': {
          const loop = await runAgenticLoop({ goal, domain: 'coding', maxLoops: 3, autoRepair: true });
          agentResult = `Agent loop: ${loop.status}. ${loop.summary || ''}`;
          break;
        }
        case 'dispatch_fabric': {
          const result = await dispatchTextThroughFabric(
            goal, undefined,
            { domain: 'general', localFallback: true }
          );
          agentResult = result.winner?.contentPreview?.slice(0, 300) || 'No response.';
          break;
        }
        case 'audit_file': {
          const { auditWithSummary } = require('./aiSecurityAuditor');
          const auditResult = await auditWithSummary(payload.file as string || '');
          agentResult = `Security score: ${auditResult.audit.score}/100. ${auditResult.audit.summary}`;
          break;
        }
        case 'notify':
          agentResult = `Notification: ${goal}`;
          break;
        default:
          agentResult = `Unknown action: ${rule.action}`;
      }

      results.push(`[${rule.name}] ${agentResult}`);
    } catch (err: any) {
      results.push(`[${rule.name}] Error: ${err.message}`);
    }
  }

  webhookEvent.status = 'completed';
  webhookEvent.agentResult = results.join('\n');
  webhookEvent.latencyMs = Date.now() - started;

  await appendAuditEvent({
    actor: source, workspace: 'Webhook Hub', action: 'webhook.processed',
    target: event, risk: 'MEDIUM', status: 'executed',
    summary: `Webhook ${source}/${event}: ${matchingRules.length} rules matched.`,
    connectorId: 'webhook-hub',
    evidence: { eventId, source, event, rulesMatched: matchingRules.length },
  }).catch(() => undefined);

  saveEvents().catch(() => undefined);
  return webhookEvent;
}

// ─── Rule CRUD ──────────────────────────────────────────────────────

export function createRule(input: Omit<WebhookRule, 'id' | 'createdAt'>): WebhookRule {
  const rule: WebhookRule = { ...input, id: `rule_${Date.now()}_${randomUUID().slice(0, 4)}`, createdAt: new Date().toISOString() };
  rules.push(rule);
  saveRules().catch(() => undefined);
  return rule;
}

export function updateRule(id: string, patch: Partial<WebhookRule>): WebhookRule | undefined {
  const rule = rules.find(r => r.id === id);
  if (!rule) return undefined;
  Object.assign(rule, patch);
  saveRules().catch(() => undefined);
  return rule;
}

export function deleteRule(id: string): boolean {
  const idx = rules.findIndex(r => r.id === id);
  if (idx < 0) return false;
  rules.splice(idx, 1);
  saveRules().catch(() => undefined);
  return true;
}

export function listRules(): WebhookRule[] { return [...rules]; }
export function listEvents(limit = 50): WebhookEvent[] { return events.slice(-limit).reverse(); }
export function getEvent(id: string): WebhookEvent | undefined { return events.find(e => e.id === id); }

export function getWebhookStats(): WebhookStats {
  const bySource: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  for (const e of events) {
    bySource[e.source] = (bySource[e.source] || 0) + 1;
    byStatus[e.status] = (byStatus[e.status] || 0) + 1;
  }
  return {
    totalEvents: events.length,
    bySource, byStatus,
    rulesActive: rules.filter(r => r.enabled).length,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const parts = path.split('.');
  let current: any = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return '';
    current = current[part];
  }
  return String(current ?? '');
}

function interpolateTemplate(template: string, payload: Record<string, unknown>): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
    return getNestedValue(payload, path.trim()) || `{{${path}}}`;
  });
}

export function simulateGitHubPR(repoName: string, prNumber: number, title: string): Promise<WebhookEvent> {
  return receiveWebhook('github', 'pull_request', {
    action: 'opened', number: prNumber,
    pull_request: { title, body: 'Please review this PR.' },
    repository: { full_name: repoName },
  });
}

export function simulateSlackCommand(command: string, text: string): Promise<WebhookEvent> {
  return receiveWebhook('slack', 'slash_command', { command, text });
}
