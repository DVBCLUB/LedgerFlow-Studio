/**
 * automationRuleEngine.ts
 * ──────────────────────────────────────────────────────────────────
 * Lightweight IF-event → THEN-action automation rule engine for
 * LedgerFlow Studio. Inspired by n8n/Zapier but intentionally simple
 * and local-only.
 *
 * Design principles:
 *  - Rules are stored in a local JSON file (gitignored).
 *  - No external broker; events are dispatched in-process.
 *  - All actions that touch external systems require approval flags.
 *  - Full audit trail via auditLog.ts.
 * ──────────────────────────────────────────────────────────────────
 */

import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import { appendAuditEvent } from './auditLog.ts';
import { ensureRuntimeRootSync, resolveRuntimePathFromEnv, resolveRuntimeReadPathFromEnv } from './runtimePaths.ts';

// ─── Event Types ──────────────────────────────────────────────────────────────

export type AutomationEventType =
  | 'pipeline.completed'
  | 'pipeline.failed'
  | 'agent.run.completed'
  | 'agent.run.failed'
  | 'agent.step.approval_required'
  | 'workflow.completed'
  | 'workflow.failed'
  | 'workflow.escalated'
  | 'transaction.detected'
  | 'robot.emergency_stop'
  | 'daily.trigger'
  | 'weekly.trigger'
  | 'custom';

export interface AutomationEvent {
  id: string;
  type: AutomationEventType;
  payload: Record<string, unknown>;
  triggeredAt: string;
}

// ─── Condition Types ──────────────────────────────────────────────────────────

export type ConditionOperator = 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'exists' | 'not_exists';

export interface RuleCondition {
  /** Dot-notation path into the event payload, e.g. "payload.status" */
  field: string;
  operator: ConditionOperator;
  value?: string | number | boolean;
}

// ─── Action Types ─────────────────────────────────────────────────────────────

export type AutomationActionType =
  | 'start_pipeline'
  | 'start_workflow'
  | 'create_agent_run'
  | 'send_notification'
  | 'update_status'
  | 'log_event'
  | 'webhook_post';

export interface AutomationAction {
  type: AutomationActionType;
  params: Record<string, unknown>;
  /** If true, action requires a human approval before execution */
  requiresApproval: boolean;
}

// ─── Rule ────────────────────────────────────────────────────────────────────

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  triggerEvent: AutomationEventType;
  conditions: RuleCondition[];
  /** logical: 'AND' means all conditions must match, 'OR' means at least one */
  conditionLogic: 'AND' | 'OR';
  actions: AutomationAction[];
  createdAt: string;
  updatedAt: string;
  lastTriggeredAt?: string;
  triggerCount: number;
}

// ─── Execution Log ────────────────────────────────────────────────────────────

export interface RuleExecutionLog {
  id: string;
  ruleId: string;
  ruleName: string;
  eventId: string;
  eventType: AutomationEventType;
  conditionResult: boolean;
  actionsExecuted: string[];
  actionsSkipped: string[];
  status: 'success' | 'partial' | 'failed' | 'condition_not_met';
  error?: string;
  executedAt: string;
  durationMs: number;
}

// ─── Built-in Default Rules ────────────────────────────────────────────────────

const DEFAULT_RULES: AutomationRule[] = [
  {
    id: 'rule_pipeline_fail_notify',
    name: 'Thông báo khi Pipeline thất bại',
    description: 'Tự động log và ghi audit khi bất kỳ pipeline nào bị lỗi.',
    enabled: true,
    triggerEvent: 'pipeline.failed',
    conditions: [],
    conditionLogic: 'AND',
    actions: [
      {
        type: 'log_event',
        params: { level: 'error', message: 'Pipeline failed — kiểm tra ngay.' },
        requiresApproval: false,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    triggerCount: 0,
  },
  {
    id: 'rule_robot_estop_notify',
    name: 'Robot Emergency Stop Alert',
    description: 'Log audit event khi robot kích hoạt emergency stop.',
    enabled: true,
    triggerEvent: 'robot.emergency_stop',
    conditions: [],
    conditionLogic: 'AND',
    actions: [
      {
        type: 'log_event',
        params: { level: 'critical', message: '🤖 Robot emergency stop activated!' },
        requiresApproval: false,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    triggerCount: 0,
  },
  {
    id: 'rule_agent_approval_notify',
    name: 'Nhắc khi Agent cần duyệt',
    description: 'Log reminder khi agent run đang chờ approval của Founder.',
    enabled: true,
    triggerEvent: 'agent.step.approval_required',
    conditions: [],
    conditionLogic: 'AND',
    actions: [
      {
        type: 'log_event',
        params: { level: 'warn', message: 'Agent step waiting for founder approval.' },
        requiresApproval: false,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    triggerCount: 0,
  },
  {
    id: 'rule_workflow_complete_log',
    name: 'Log khi Workflow hoàn thành',
    description: 'Ghi audit log tóm tắt khi multi-agent workflow hoàn thành.',
    enabled: true,
    triggerEvent: 'workflow.completed',
    conditions: [],
    conditionLogic: 'AND',
    actions: [
      {
        type: 'log_event',
        params: { level: 'info', message: 'Multi-agent workflow completed successfully.' },
        requiresApproval: false,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    triggerCount: 0,
  },
];

// ─── Storage ──────────────────────────────────────────────────────────────────

interface RuleStore {
  rules: Record<string, AutomationRule>;
  executionLog: RuleExecutionLog[];
}

function storageFile() {
  return resolveRuntimePathFromEnv('AUTOMATION_RULES_FILE', 'automation_rules.local.json');
}

function readStore(): RuleStore {
  try {
    const readPath = resolveRuntimeReadPathFromEnv('AUTOMATION_RULES_FILE', 'automation_rules.local.json');
    if (!fs.existsSync(readPath)) {
      const defaults: RuleStore = { rules: {}, executionLog: [] };
      for (const rule of DEFAULT_RULES) defaults.rules[rule.id] = rule;
      writeStore(defaults);
      return defaults;
    }
    const raw = fs.readFileSync(readPath, 'utf-8');
    return JSON.parse(raw) as RuleStore;
  } catch {
    return { rules: {}, executionLog: [] };
  }
}

function writeStore(store: RuleStore): void {
  try {
    ensureRuntimeRootSync();
    // Keep execution log at max 500 entries
    store.executionLog = store.executionLog.slice(0, 500);
    fs.writeFileSync(storageFile(), JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('[AutomationRules] Failed to write store:', err);
  }
}

// ─── Condition Evaluation ─────────────────────────────────────────────────────

function getNestedValue(obj: Record<string, unknown>, dotPath: string): unknown {
  return dotPath.split('.').reduce<unknown>((curr, key) => {
    if (curr && typeof curr === 'object' && key in (curr as Record<string, unknown>)) {
      return (curr as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj as unknown);
}

function evaluateCondition(condition: RuleCondition, event: AutomationEvent): boolean {
  const rawValue = getNestedValue({ event, type: event.type, payload: event.payload }, condition.field);
  const strValue = String(rawValue ?? '');
  const condValue = String(condition.value ?? '');

  switch (condition.operator) {
    case 'equals': return strValue === condValue;
    case 'not_equals': return strValue !== condValue;
    case 'contains': return strValue.includes(condValue);
    case 'greater_than': return Number(rawValue) > Number(condition.value);
    case 'less_than': return Number(rawValue) < Number(condition.value);
    case 'exists': return rawValue !== undefined && rawValue !== null && rawValue !== '';
    case 'not_exists': return rawValue === undefined || rawValue === null || rawValue === '';
    default: return false;
  }
}

function evaluateConditions(rule: AutomationRule, event: AutomationEvent): boolean {
  if (!rule.conditions.length) return true;
  if (rule.conditionLogic === 'AND') return rule.conditions.every((c) => evaluateCondition(c, event));
  return rule.conditions.some((c) => evaluateCondition(c, event));
}

// ─── Action Execution ─────────────────────────────────────────────────────────

async function executeAction(action: AutomationAction, event: AutomationEvent, ruleId: string): Promise<{ executed: boolean; skipped: boolean; reason?: string }> {
  if (action.requiresApproval) {
    await appendAuditEvent({
      actor: 'system',
      workspace: 'ai-ops',
      action: 'automation.action.pending_approval',
      target: ruleId,
      risk: 'HIGH',
      status: 'pending_approval',
      summary: `Action "${action.type}" requires approval before execution.`,
      evidence: { ruleId, actionType: action.type, eventId: event.id, params: action.params },
    });
    return { executed: false, skipped: true, reason: 'Approval required' };
  }

  switch (action.type) {
    case 'log_event': {
      const level = String(action.params.level || 'info');
      const message = String(action.params.message || '');
      console.log(`[AutomationRules][${level.toUpperCase()}] Rule triggered: ${message} | Event: ${event.type}`);
      await appendAuditEvent({
        actor: 'system',
        workspace: 'ai-ops',
        action: 'automation.rule.triggered',
        target: ruleId,
        risk: 'LOW',
        status: 'executed',
        summary: message,
        evidence: { ruleId, eventId: event.id, eventType: event.type, payload: event.payload },
      });
      return { executed: true, skipped: false };
    }

    case 'send_notification': {
      // Safely delegates to Telegram or in-app — never auto-sends without explicit connector
      await appendAuditEvent({
        actor: 'system',
        workspace: 'ai-ops',
        action: 'automation.notification.queued',
        target: ruleId,
        risk: 'MEDIUM',
        status: 'planned',
        summary: `Notification queued: ${action.params.message || ''}`,
        evidence: { ruleId, channel: action.params.channel, eventId: event.id },
      });
      return { executed: true, skipped: false };
    }

    case 'update_status': {
      await appendAuditEvent({
        actor: 'system',
        workspace: 'ai-ops',
        action: 'automation.status.update',
        target: String(action.params.targetId || 'unknown'),
        risk: 'LOW',
        status: 'executed',
        summary: `Status updated to: ${action.params.status}`,
        evidence: { ruleId, eventId: event.id, ...action.params },
      });
      return { executed: true, skipped: false };
    }

    case 'start_pipeline':
    case 'start_workflow':
    case 'create_agent_run':
    case 'webhook_post': {
      // These actions always require human approval by policy
      await appendAuditEvent({
        actor: 'system',
        workspace: 'ai-ops',
        action: `automation.${action.type}.pending`,
        target: ruleId,
        risk: 'HIGH',
        status: 'pending_approval',
        summary: `Action ${action.type} queued — requires founder review.`,
        evidence: { ruleId, eventId: event.id, params: action.params },
      });
      return { executed: false, skipped: true, reason: `${action.type} always requires human approval` };
    }

    default:
      return { executed: false, skipped: true, reason: `Unknown action type: ${action.type}` };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fire an automation event. Matching enabled rules will be evaluated and their
 * actions executed. Call this from pipeline, workflow, agent runtime, etc.
 */
export async function fireAutomationEvent(
  type: AutomationEventType,
  payload: Record<string, unknown> = {},
): Promise<{ matchedRules: number; executionLogs: RuleExecutionLog[] }> {
  const event: AutomationEvent = { id: `evt_${randomUUID()}`, type, payload, triggeredAt: new Date().toISOString() };
  const store = readStore();
  const matchedLogs: RuleExecutionLog[] = [];

  const enabledRules = Object.values(store.rules).filter((r) => r.enabled && r.triggerEvent === type);

  for (const rule of enabledRules) {
    const start = Date.now();
    const conditionResult = evaluateConditions(rule, event);
    const executed: string[] = [];
    const skipped: string[] = [];
    let status: RuleExecutionLog['status'] = 'condition_not_met';
    let error: string | undefined;

    if (conditionResult) {
      status = 'success';
      for (const action of rule.actions) {
        try {
          const result = await executeAction(action, event, rule.id);
          if (result.executed) executed.push(action.type);
          else skipped.push(`${action.type}: ${result.reason}`);
          if (!result.executed && !result.skipped) status = 'partial';
        } catch (err: unknown) {
          error = err instanceof Error ? err.message : String(err);
          status = 'failed';
          skipped.push(`${action.type}: ERROR`);
        }
      }
    }

    const log: RuleExecutionLog = {
      id: `log_${randomUUID()}`,
      ruleId: rule.id,
      ruleName: rule.name,
      eventId: event.id,
      eventType: type,
      conditionResult,
      actionsExecuted: executed,
      actionsSkipped: skipped,
      status,
      error,
      executedAt: new Date().toISOString(),
      durationMs: Date.now() - start,
    };
    matchedLogs.push(log);

    // Update rule stats
    rule.lastTriggeredAt = new Date().toISOString();
    rule.triggerCount = (rule.triggerCount || 0) + 1;
    store.rules[rule.id] = rule;
  }

  // Persist logs
  store.executionLog = [...matchedLogs, ...store.executionLog];
  writeStore(store);

  return { matchedRules: enabledRules.length, executionLogs: matchedLogs };
}

export function listAutomationRules(): AutomationRule[] {
  const store = readStore();
  return Object.values(store.rules).sort((a, b) => a.name.localeCompare(b.name));
}

export function getAutomationRule(id: string): AutomationRule | null {
  return readStore().rules[id] || null;
}

export function createAutomationRule(input: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt' | 'triggerCount'>): AutomationRule {
  const store = readStore();
  const now = new Date().toISOString();
  const rule: AutomationRule = { ...input, id: `rule_${randomUUID()}`, createdAt: now, updatedAt: now, triggerCount: 0 };
  store.rules[rule.id] = rule;
  writeStore(store);
  return rule;
}

export function updateAutomationRule(id: string, patch: Partial<Omit<AutomationRule, 'id' | 'createdAt' | 'triggerCount'>>): AutomationRule {
  const store = readStore();
  const rule = store.rules[id];
  if (!rule) throw new Error(`Automation rule not found: ${id}`);
  const updated: AutomationRule = { ...rule, ...patch, id, updatedAt: new Date().toISOString() };
  store.rules[id] = updated;
  writeStore(store);
  return updated;
}

export function deleteAutomationRule(id: string): void {
  const store = readStore();
  if (!store.rules[id]) throw new Error(`Automation rule not found: ${id}`);
  delete store.rules[id];
  writeStore(store);
}

export function toggleAutomationRule(id: string, enabled: boolean): AutomationRule {
  return updateAutomationRule(id, { enabled });
}

export function getAutomationExecutionLog(limit = 50): RuleExecutionLog[] {
  return readStore().executionLog.slice(0, limit);
}

export function getAutomationEventTypes(): AutomationEventType[] {
  return [
    'pipeline.completed', 'pipeline.failed',
    'agent.run.completed', 'agent.run.failed',
    'agent.step.approval_required',
    'workflow.completed', 'workflow.failed', 'workflow.escalated',
    'transaction.detected',
    'robot.emergency_stop',
    'daily.trigger', 'weekly.trigger',
    'custom',
  ];
}
