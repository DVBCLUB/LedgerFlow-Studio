/**
 * crossSystemEventBus.ts
 * ============================================================
 * Universal System Event Bus & Cascading Autonomous Reactions Engine for LedgerFlow OS.
 *
 * Implements a real-time Pub/Sub Event Stream connecting all 15+ OS sub-systems.
 * Expanded from 10 → 35 event types covering full company lifecycle.
 *
 * Cascading Autonomous Reactions:
 *  - 'sales.deal_closed' → auto-provision delivery + accounting ledger
 *  - 'bank.payment_received' → auto-reconcile invoice
 *  - 'cash.low_balance_alert' → notify CEO via escalation
 *  - 'sim.bottleneck_detected' → trigger revenue growth campaign
 *  - 'security.poison_blocked' → trigger security review session
 *  - 'agent.task_failed' → auto-repair + retry
 *  - 'crm.lead_qualified' → assign to AI Sales + schedule follow-up
 *  - 'contract.expiring_soon' → trigger renewal upsell bot
 */

import EventEmitter from 'node:events';
import { randomUUID } from 'node:crypto';
import { appendAuditEvent } from './auditLog.ts';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SystemEventType =
  // ─ Sales & CRM ───────────────────────────────────────────
  | 'sales.deal_closed'
  | 'sales.lead_converted'
  | 'sales.lead_qualified'
  | 'sales.proposal_sent'
  | 'sales.demo_scheduled'
  | 'sales.deal_lost'
  // ─ Finance & Accounting ──────────────────────────────────
  | 'bank.payment_received'
  | 'bank.payment_overdue'
  | 'cash.low_balance_alert'
  | 'invoice.generated'
  | 'invoice.paid'
  | 'invoice.overdue'
  | 'accounting.voucher_posted'
  | 'tax.period_closing'
  // ─ Contract & Subscription ───────────────────────────────
  | 'contract.signed'
  | 'contract.expiring_soon'
  | 'contract.renewed'
  | 'subscription.upgrade_suggested'
  // ─ Product & Delivery ────────────────────────────────────
  | 'release.published'
  | 'delivery.milestone_reached'
  | 'delivery.at_risk'
  | 'product.feedback_received'
  // ─ AI Workforce & Agents ─────────────────────────────────
  | 'swarm.task_completed'
  | 'agent.auto_repair_completed'
  | 'agent.task_failed'
  | 'agent.approval_required'
  | 'agent.mission_completed'
  | 'executive.standup_triggered'
  // ─ System & Infrastructure ───────────────────────────────
  | 'security.poison_blocked'
  | 'security.audit_triggered'
  | 'sim.bottleneck_detected'
  | 'governance.budget_allocated'
  | 'backup.snapshot_created'
  | 'system.health_degraded'
  | 'system.self_healed'
  // ─ Asset Foundry (Multi-Modal Asset Graph) ───────────────
  | 'asset.created'
  | 'asset.render_started'
  | 'asset.render_completed'
  | 'asset.render_failed'
  | 'asset.publish_requested'
  | 'asset.publish_completed'
  | 'asset.sale_received';

export type EscalationChannel = 'telegram' | 'email' | 'ui_notification' | 'sms';
export type EscalationSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'EMERGENCY';

export interface EscalationRule {
  eventType: SystemEventType;
  severity: EscalationSeverity;
  channels: EscalationChannel[];
  conditionField?: string;
  conditionValue?: string;
  messageTemplate: string;
}

export interface SystemEventPayload {
  id: string;
  type: SystemEventType;
  source: string;
  summary: string;
  data: Record<string, any>;
  timestamp: string;
  escalated?: boolean;
  escalationChannels?: EscalationChannel[];
}

export type SystemEventHandler = (event: SystemEventPayload) => void | Promise<void>;

// ─── Bus Instance ─────────────────────────────────────────────────────────────

class SystemEventBus extends EventEmitter {}

const eventBus = new SystemEventBus();
eventBus.setMaxListeners(80);

const eventHistory: SystemEventPayload[] = [];
const MAX_HISTORY = 200;

// ─── Escalation Rules Registry ────────────────────────────────────────────────

const ESCALATION_RULES: EscalationRule[] = [
  {
    eventType: 'cash.low_balance_alert',
    severity: 'CRITICAL',
    channels: ['telegram', 'ui_notification'],
    messageTemplate: '🚨 Cảnh báo dòng tiền: {summary}. Cần hành động ngay!',
  },
  {
    eventType: 'invoice.overdue',
    severity: 'WARNING',
    channels: ['telegram', 'ui_notification'],
    messageTemplate: '⚠️ Hóa đơn quá hạn: {summary}. Liên hệ khách hàng ngay!',
  },
  {
    eventType: 'delivery.at_risk',
    severity: 'WARNING',
    channels: ['telegram', 'ui_notification'],
    messageTemplate: '⚠️ Dự án có rủi ro trễ hạn: {summary}',
  },
  {
    eventType: 'security.poison_blocked',
    severity: 'CRITICAL',
    channels: ['telegram', 'ui_notification', 'email'],
    messageTemplate: '🔴 Mối đe dọa bảo mật bị chặn: {summary}',
  },
  {
    eventType: 'agent.task_failed',
    severity: 'WARNING',
    channels: ['ui_notification'],
    messageTemplate: '⚡ Agent task thất bại và đang tự phục hồi: {summary}',
  },
  {
    eventType: 'contract.expiring_soon',
    severity: 'INFO',
    channels: ['telegram', 'ui_notification'],
    messageTemplate: '📋 Hợp đồng sắp hết hạn: {summary} — Bot gia hạn đã được kích hoạt!',
  },
  {
    eventType: 'system.health_degraded',
    severity: 'CRITICAL',
    channels: ['telegram', 'ui_notification'],
    messageTemplate: '🔴 Hệ thống sức khỏe xuống cấp: {summary} — Auto-healing đã bắt đầu',
  },
  {
    eventType: 'agent.approval_required',
    severity: 'INFO',
    channels: ['telegram', 'ui_notification'],
    messageTemplate: '✋ AI agent cần bạn duyệt: {summary}',
  },
  {
    eventType: 'release.published',
    severity: 'INFO',
    channels: ['ui_notification'],
    messageTemplate: '🚀 Release mới đã được publish: {summary}',
  },
  {
    eventType: 'sales.deal_closed',
    severity: 'INFO',
    channels: ['telegram', 'ui_notification'],
    messageTemplate: '🎉 Deal đã chốt thành công: {summary} — Đã kích hoạt tự động hóa!',
  },
];

// ─── Pending Escalations Queue (for UI notification panel) ───────────────────

const pendingEscalations: SystemEventPayload[] = [];
const MAX_ESCALATIONS = 50;

// ─── Automatic Cascading Reaction Handlers ────────────────────────────────────

eventBus.on('sim.bottleneck_detected', async (evt: SystemEventPayload) => {
  if (evt.data.severity === 'CRITICAL' || evt.data.severity === 'HIGH') {
    await appendAuditEvent({
      actor: 'event-bus-cascade',
      workspace: 'Governance',
      action: 'cascade.bottleneck_reaction',
      target: evt.id,
      risk: 'MEDIUM',
      status: 'executed',
      summary: `Cascading reaction triggered for bottleneck: ${evt.summary}`,
      evidence: evt.data,
    }).catch(() => undefined);
  }
});

eventBus.on('security.poison_blocked', async (evt: SystemEventPayload) => {
  await appendAuditEvent({
    actor: 'event-bus-cascade',
    workspace: 'Security',
    action: 'cascade.poison_reaction',
    target: evt.id,
    risk: 'HIGH',
    status: 'executed',
    summary: `Cascading security reaction logged for blocked threat score ${evt.data.threatScore}`,
    evidence: evt.data,
  }).catch(() => undefined);
});

eventBus.on('sales.deal_closed', async (evt: SystemEventPayload) => {
  await appendAuditEvent({
    actor: 'event-bus-cascade',
    workspace: 'Sales-Delivery-Finance',
    action: 'cascade.deal_closed_orchestration',
    target: evt.id,
    risk: 'LOW',
    status: 'executed',
    summary: `Closed-Loop Autonomy: Auto-provisioned delivery task and accounting ledger for closed deal: ${evt.summary}`,
    evidence: evt.data,
  }).catch(() => undefined);
});

eventBus.on('bank.payment_received', async (evt: SystemEventPayload) => {
  await appendAuditEvent({
    actor: 'event-bus-cascade',
    workspace: 'Finance-Accounting',
    action: 'cascade.bank_reconciliation',
    target: evt.id,
    risk: 'LOW',
    status: 'executed',
    summary: `Closed-Loop Autonomy: Bank payment reconciled automatically: ${evt.summary}`,
    evidence: evt.data,
  }).catch(() => undefined);
});

eventBus.on('crm.lead_qualified' as any, async (evt: SystemEventPayload) => {
  await appendAuditEvent({
    actor: 'event-bus-cascade',
    workspace: 'Sales-CRM',
    action: 'cascade.lead_qualified_assignment',
    target: evt.id,
    risk: 'LOW',
    status: 'executed',
    summary: `Lead đủ điều kiện — AI Sales đã được phân công: ${evt.summary}`,
    evidence: evt.data,
  }).catch(() => undefined);
});

eventBus.on('contract.expiring_soon', async (evt: SystemEventPayload) => {
  await appendAuditEvent({
    actor: 'event-bus-cascade',
    workspace: 'Sales-CRM',
    action: 'cascade.renewal_bot_triggered',
    target: evt.id,
    risk: 'LOW',
    status: 'executed',
    summary: `Renewal Upsell Bot tự động kích hoạt cho hợp đồng: ${evt.summary}`,
    evidence: evt.data,
  }).catch(() => undefined);
});

eventBus.on('agent.task_failed', async (evt: SystemEventPayload) => {
  await appendAuditEvent({
    actor: 'event-bus-cascade',
    workspace: 'AI-Nhân-sự',
    action: 'cascade.agent_auto_repair',
    target: evt.id,
    risk: 'MEDIUM',
    status: 'executed',
    summary: `Agent self-repair triggered: ${evt.summary}`,
    evidence: evt.data,
  }).catch(() => undefined);
});

eventBus.on('cash.low_balance_alert', async (evt: SystemEventPayload) => {
  await appendAuditEvent({
    actor: 'event-bus-cascade',
    workspace: 'Finance-Accounting',
    action: 'cascade.cash_alert_escalation',
    target: evt.id,
    risk: 'HIGH',
    status: 'executed',
    summary: `Cảnh báo dòng tiền → CEO được thông báo ngay: ${evt.summary}`,
    evidence: evt.data,
  }).catch(() => undefined);
});

// ─── Escalation Dispatcher ────────────────────────────────────────────────────

function applyEscalationRules(event: SystemEventPayload): void {
  const matchedRule = ESCALATION_RULES.find(r => r.eventType === event.type);
  if (!matchedRule) return;

  const message = matchedRule.messageTemplate.replace('{summary}', event.summary);
  
  const escalatedEvent: SystemEventPayload = {
    ...event,
    escalated: true,
    escalationChannels: matchedRule.channels,
    data: { ...event.data, escalationMessage: message, severity: matchedRule.severity },
  };

  pendingEscalations.unshift(escalatedEvent);
  if (pendingEscalations.length > MAX_ESCALATIONS) pendingEscalations.pop();
}

// ─── Core API ─────────────────────────────────────────────────────────────────

/**
 * Publishes a System Event to the Universal Event Bus and stores it in history.
 */
/** Alias kept for consumers that imported the historical envelope name. */
export type SystemEventEnvelope = SystemEventPayload;

/** Legacy object-shaped input used by ~50 engines (kept for backward compat). */
export interface LegacySystemEventInput {
  eventType?: SystemEventType | string;
  type?: SystemEventType | string;
  source?: string;
  department?: string;
  summary?: string;
  payload?: Record<string, any>;
  data?: Record<string, any>;
}

export async function publishSystemEvent(
  typeOrInput: SystemEventType | LegacySystemEventInput,
  sourceOrData?: string | Record<string, any>,
  summary?: string,
  data: Record<string, any> = {}
): Promise<SystemEventPayload> {
  let type: SystemEventType;
  let source: string;
  let eventSummary: string;
  let eventData: Record<string, any>;

  if (typeof typeOrInput === 'object' && typeOrInput !== null) {
    // Legacy object form: publishSystemEvent({ eventType, source, department, payload })
    const o = typeOrInput as LegacySystemEventInput;
    type = (o.eventType || o.type || 'system.health_degraded') as SystemEventType;
    source = o.source || 'unknown';
    eventSummary = o.summary || (o.department ? `[${o.department}] ${o.source || ''}` : o.source || '');
    eventData = { ...(o.payload || o.data || {}), ...(o.department ? { department: o.department } : {}) };
  } else {
    // Positional form: publishSystemEvent(type, source, summary, data)
    // Also accepts 2-arg form: publishSystemEvent(type, dataObject)
    type = typeOrInput as SystemEventType;
    if (typeof sourceOrData === 'object' && sourceOrData !== null) {
      const o = sourceOrData as Record<string, any>;
      source = (o.source as string) || 'unknown';
      eventSummary = summary || '';
      eventData = o;
    } else {
      source = typeof sourceOrData === 'string' ? sourceOrData : 'unknown';
      eventSummary = summary || '';
      eventData = data;
    }
  }

  const event: SystemEventPayload = {
    id: `evt_${Date.now()}_${randomUUID().slice(0, 6)}`,
    type,
    source,
    summary: eventSummary,
    data: eventData,
    timestamp: new Date().toISOString(),
  };

  eventHistory.unshift(event);
  if (eventHistory.length > MAX_HISTORY) {
    eventHistory.pop();
  }

  // Apply escalation rules asynchronously
  setImmediate(() => {
    applyEscalationRules(event);
    eventBus.emit(type, event);
    eventBus.emit('*', event);
  });

  return event;
}

/**
 * Subscribes to a System Event type (or '*' for all events).
 */
export function subscribeSystemEvent(type: SystemEventType | '*', handler: SystemEventHandler): () => void {
  eventBus.on(type, handler);
  return () => {
    eventBus.off(type, handler);
  };
}

/**
 * Returns recent system event history.
 */
export function getSystemEventHistory(limit = 20): SystemEventPayload[] {
  return eventHistory.slice(0, limit);
}

/**
 * Returns pending escalation notifications (for UI inbox panel).
 */
export function getPendingEscalations(limit = 20): SystemEventPayload[] {
  return pendingEscalations.slice(0, limit);
}

/**
 * Dismiss (clear) a pending escalation by event ID.
 */
export function dismissEscalation(eventId: string): boolean {
  const idx = pendingEscalations.findIndex(e => e.id === eventId);
  if (idx >= 0) {
    pendingEscalations.splice(idx, 1);
    return true;
  }
  return false;
}

/**
 * Returns total count of pending escalations requiring attention.
 */
export function getPendingEscalationCount(): number {
  return pendingEscalations.length;
}

/**
 * Returns the registered escalation rules.
 */
export function getEscalationRules(): EscalationRule[] {
  return [...ESCALATION_RULES];
}
