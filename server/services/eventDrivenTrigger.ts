/**
 * eventDrivenTrigger.ts
 * ============================================================
 * Event-Driven Trigger Engine — nối CI fail, file change,
 * cron schedule và webhook vào agentic loop.
 *
 * Khi CI đỏ → tự agent phân tích + sửa
 * Khi file thay đổi → tự agent review
 * Khi cron đến giờ → tự agent chạy báo cáo
 * Khi webhook gọi → tự agent xử lý task
 */
import { randomUUID } from 'node:crypto';
import fs from 'fs';
import { appendAuditEvent } from './auditLog';
import { runAgenticLoop, type AgenticLoopOptions } from './agenticLoopEngine';
import { ensureRuntimeRootSync, resolveRuntimePathFromEnv, resolveRuntimeReadPathFromEnv } from './runtimePaths.ts';

// ─── Types ──────────────────────────────────────────────────────────
export type TriggerType = 'ci_failure' | 'file_change' | 'cron' | 'webhook' | 'manual';

export interface TriggerRule {
  id: string;
  name: string;
  type: TriggerType;
  enabled: boolean;
  // Match conditions
  matchPattern?: string;         // VD: "*.ts" cho file change, "ci:fail" cho CI
  matchRepo?: string;            // GitHub repo
  matchBranch?: string;          // Git branch
  matchCron?: string;            // Cron expression
  // Action
  agentGoal: string;             // Goal gửi cho agentic loop
  agentDomain?: string;          // Domain (coding/finance/general)
  autoRepair?: boolean;          // Tự động sửa
  maxLoops?: number;             // Số vòng loop
  notifyOnComplete?: boolean;    // Thông báo khi xong
  // State
  createdAt: string;
  lastTriggeredAt?: string;
  triggerCount: number;
  lastResult?: 'success' | 'failed';
}

export interface TriggerEvent {
  id: string;
  ruleId: string;
  type: TriggerType;
  payload: Record<string, unknown>;
  triggeredAt: string;
  loopRunId?: string;
  status: 'triggered' | 'running' | 'completed' | 'failed';
  completedAt?: string;
  summary?: string;
}

// ─── Store ──────────────────────────────────────────────────────────
const TRIGGER_FILE = resolveRuntimePathFromEnv('TRIGGER_RULES_FILE', 'trigger_rules.json');
const EVENTS_FILE = resolveRuntimePathFromEnv('TRIGGER_EVENTS_FILE', 'trigger_events.json');

let rules: TriggerRule[] = [];
let events: TriggerEvent[] = [];

// ─── Default rules ──────────────────────────────────────────────────

const DEFAULT_RULES: TriggerRule[] = [
  {
    id: 'rule-ci-fail',
    name: 'CI Failure Auto-Fix',
    type: 'ci_failure',
    enabled: false,
    matchPattern: 'ci:fail',
    agentGoal: 'Phân tích lỗi CI trong GitHub Actions và đề xuất sửa. Đọc log lỗi, xác định file lỗi, sửa code và chạy npm run lint.',
    agentDomain: 'coding',
    autoRepair: true,
    maxLoops: 5,
    notifyOnComplete: true,
    createdAt: new Date().toISOString(),
    triggerCount: 0,
  },
  {
    id: 'rule-file-review',
    name: 'Auto Code Review on File Change',
    type: 'file_change',
    enabled: false,
    matchPattern: 'src/**/*.tsx',
    agentGoal: 'Review code trong file vừa thay đổi. Kiểm tra type safety, best practices, và đề xuất cải tiến.',
    agentDomain: 'coding',
    autoRepair: false,
    maxLoops: 1,
    notifyOnComplete: true,
    createdAt: new Date().toISOString(),
    triggerCount: 0,
  },
  {
    id: 'rule-daily-report',
    name: 'Daily AI Report',
    type: 'cron',
    enabled: false,
    matchCron: '0 8 * * *', // 8AM daily
    agentGoal: 'Tổng hợp báo cáo ngày: các task đã hoàn thành, CI status, memory đã học, chi phí AI đã dùng.',
    agentDomain: 'general',
    autoRepair: false,
    maxLoops: 1,
    notifyOnComplete: true,
    createdAt: new Date().toISOString(),
    triggerCount: 0,
  },
];

// ─── Init ───────────────────────────────────────────────────────────

async function loadRules(): Promise<void> {
  try {
    const triggerFile = resolveRuntimeReadPathFromEnv('TRIGGER_RULES_FILE', 'trigger_rules.json');
    if (fs.existsSync(triggerFile)) {
      const raw = await fs.promises.readFile(triggerFile, 'utf8');
      rules = JSON.parse(raw);
    } else {
      rules = [...DEFAULT_RULES];
      await saveRules();
    }
  } catch {
    rules = [...DEFAULT_RULES];
  }
}

async function saveRules(): Promise<void> {
  ensureRuntimeRootSync();
  await fs.promises.writeFile(TRIGGER_FILE, JSON.stringify(rules, null, 2), 'utf8');
}

async function loadEvents(): Promise<void> {
  try {
    const eventsFile = resolveRuntimeReadPathFromEnv('TRIGGER_EVENTS_FILE', 'trigger_events.json');
    if (fs.existsSync(eventsFile)) {
      events = JSON.parse(await fs.promises.readFile(eventsFile, 'utf8'));
    }
  } catch { events = []; }
}

async function saveEvents(): Promise<void> {
  ensureRuntimeRootSync();
  // Keep last 200 events
  const trimmed = events.slice(-200);
  await fs.promises.writeFile(EVENTS_FILE, JSON.stringify(trimmed, null, 2), 'utf8');
}

// Initialize
loadRules().catch(() => undefined);
loadEvents().catch(() => undefined);

// ─── Public API ─────────────────────────────────────────────────────

export function listTriggerRules(): TriggerRule[] {
  return rules;
}

export function getTriggerRule(id: string): TriggerRule | undefined {
  return rules.find(r => r.id === id);
}

export async function createTriggerRule(input: Omit<TriggerRule, 'id' | 'createdAt' | 'triggerCount'>): Promise<TriggerRule> {
  const rule: TriggerRule = {
    ...input,
    id: `rule_${Date.now()}_${randomUUID().slice(0, 6)}`,
    createdAt: new Date().toISOString(),
    triggerCount: 0,
  };
  rules.push(rule);
  await saveRules();
  return rule;
}

export async function updateTriggerRule(id: string, patch: Partial<TriggerRule>): Promise<TriggerRule | undefined> {
  const idx = rules.findIndex(r => r.id === id);
  if (idx < 0) return undefined;
  rules[idx] = { ...rules[idx], ...patch };
  await saveRules();
  return rules[idx];
}

export async function deleteTriggerRule(id: string): Promise<boolean> {
  const idx = rules.findIndex(r => r.id === id);
  if (idx < 0) return false;
  rules.splice(idx, 1);
  await saveRules();
  return true;
}

export async function fireTrigger(
  type: TriggerType,
  payload: Record<string, unknown>
): Promise<TriggerEvent | null> {
  // Find matching rules
  const matchingRules = rules.filter(r => r.enabled && r.type === type);
  if (matchingRules.length === 0) return null;

  // Use the first matching rule (or match by pattern if applicable)
  let rule = matchingRules[0];
  if (type === 'file_change' && payload.file) {
    const filePath = String(payload.file);
    const fileRule = matchingRules.find(r => {
      if (!r.matchPattern) return false;
      const pattern = r.matchPattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
      return new RegExp(pattern).test(filePath);
    });
    if (fileRule) rule = fileRule;
  }

  const event: TriggerEvent = {
    id: `evt_${Date.now()}_${randomUUID().slice(0, 6)}`,
    ruleId: rule.id,
    type,
    payload,
    triggeredAt: new Date().toISOString(),
    status: 'triggered',
  };

  events.push(event);
  rule.triggerCount++;
  rule.lastTriggeredAt = event.triggeredAt;
  await Promise.all([saveEvents(), saveRules()]);

  await appendAuditEvent({
    actor: 'system',
    workspace: 'Event Trigger',
    action: `trigger.${type}`,
    target: rule.name,
    risk: 'MEDIUM',
    status: 'executed',
    summary: `Trigger "${rule.name}" fired (${type})`,
    connectorId: 'event-trigger',
    evidence: { ruleId: rule.id, eventId: event.id },
  }).catch(() => undefined);

  // Fire agentic loop
  try {
    event.status = 'running';

    const loopOptions: AgenticLoopOptions = {
      goal: `${rule.agentGoal}\n\nCONTEXT:\n${JSON.stringify(payload, null, 2)}`,
      domain: rule.agentDomain as any,
      autoRepair: rule.autoRepair,
      maxLoops: rule.maxLoops || 3,
    };

    const loopRun = await runAgenticLoop(loopOptions);
    event.loopRunId = loopRun.id;
    event.status = loopRun.status === 'completed' ? 'completed' : 'failed';
    event.completedAt = new Date().toISOString();
    event.summary = loopRun.summary;

    rule.lastResult = event.status === 'completed' ? 'success' : 'failed';
    await Promise.all([saveEvents(), saveRules()]);

    return event;
  } catch (err: any) {
    event.status = 'failed';
    event.completedAt = new Date().toISOString();
    event.summary = `Trigger failed: ${err.message}`;
    rule.lastResult = 'failed';
    await Promise.all([saveEvents(), saveRules()]);
    return event;
  }
}

export function listTriggerEvents(limit = 50): TriggerEvent[] {
  return events.slice(-limit).reverse();
}

export function getTriggerEvent(id: string): TriggerEvent | undefined {
  return events.find(e => e.id === id);
}

export function getTriggerStats(): {
  totalRules: number;
  enabledRules: number;
  totalEvents: number;
  byType: Record<string, { rules: number; events: number; lastFired?: string }>;
  recentFailures: number;
} {
  const byType: Record<string, any> = {};
  for (const rule of rules) {
    const entry = byType[rule.type] || { rules: 0, events: 0 };
    entry.rules++;
    byType[rule.type] = entry;
  }
  for (const event of events) {
    const entry = byType[event.type] || { rules: 0, events: 0 };
    entry.events++;
    entry.lastFired = event.triggeredAt;
    byType[event.type] = entry;
  }

  const recentFailures = events.filter(e => e.status === 'failed').length;

  return {
    totalRules: rules.length,
    enabledRules: rules.filter(r => r.enabled).length,
    totalEvents: events.length,
    byType,
    recentFailures,
  };
}

// ─── Simulate triggers (for testing) ────────────────────────────────

export async function simulateCiFailure(repo?: string, errorLog?: string): Promise<TriggerEvent | null> {
  return fireTrigger('ci_failure', {
    repo: repo || 'DVBCLUB/LedgerFlow-Studio',
    errorLog: errorLog || 'Build failed: TypeScript compilation error',
    timestamp: new Date().toISOString(),
  });
}

export async function simulateFileChange(file: string): Promise<TriggerEvent | null> {
  return fireTrigger('file_change', {
    file,
    timestamp: new Date().toISOString(),
    action: 'modified',
  });
}
