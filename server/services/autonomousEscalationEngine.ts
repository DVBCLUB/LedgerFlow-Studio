/**
 * autonomousEscalationEngine.ts
 * ============================================================
 * Autonomous Multi-Channel Escalation Engine for LedgerFlow OS.
 *
 * Monitors thresholds và tự động leo thang qua:
 *  - Telegram Bot (CEO mobile notifications)
 *  - UI Notification Panel (in-app inbox)
 *  - Email (SMTP stub, extensible)
 *
 * Integrates with crossSystemEventBus.ts để publish escalation events.
 */

import { randomUUID } from 'node:crypto';
import { appendAuditEvent } from './auditLog.ts';
import {
  publishSystemEvent,
  getPendingEscalations,
  dismissEscalation,
  getPendingEscalationCount,
  type SystemEventPayload,
  type EscalationChannel,
} from './crossSystemEventBus.ts';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ThresholdType =
  | 'cash_balance_vnd'
  | 'invoice_overdue_days'
  | 'agent_failure_rate_percent'
  | 'delivery_delay_days'
  | 'mrr_drop_percent'
  | 'churn_rate_percent';

export interface EscalationThreshold {
  id: string;
  type: ThresholdType;
  label: string;
  criticalValue: number;
  warningValue: number;
  currentValue: number;
  unit: string;
  lastCheckedAt: string;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
}

export interface EscalationNotification {
  id: string;
  eventId: string;
  type: string;
  summary: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'EMERGENCY';
  channels: EscalationChannel[];
  message: string;
  createdAt: string;
  isRead: boolean;
  actionRequired: boolean;
  actionUrl?: string;
}

export interface EscalationConfig {
  telegramEnabled: boolean;
  telegramChatId?: string;
  emailEnabled: boolean;
  emailRecipient?: string;
  uiNotificationsEnabled: boolean;
  autoResolveAfterMinutes: number;
}

// ─── In-Memory Stores ─────────────────────────────────────────────────────────

const notifications: EscalationNotification[] = [];
const MAX_NOTIFICATIONS = 100;

const config: EscalationConfig = {
  telegramEnabled: false,
  uiNotificationsEnabled: true,
  emailEnabled: false,
  autoResolveAfterMinutes: 1440, // 24 hours
};

// ─── Default Threshold Monitors ───────────────────────────────────────────────

const thresholds: EscalationThreshold[] = [
  {
    id: 'th_cash_balance',
    type: 'cash_balance_vnd',
    label: 'Số dư tiền mặt & ngân hàng',
    criticalValue: 50_000_000,  // 50 triệu VND
    warningValue: 100_000_000, // 100 triệu VND
    currentValue: 250_000_000,
    unit: 'VND',
    lastCheckedAt: new Date().toISOString(),
    status: 'NORMAL',
  },
  {
    id: 'th_invoice_overdue',
    type: 'invoice_overdue_days',
    label: 'Hóa đơn quá hạn thanh toán',
    criticalValue: 60,
    warningValue: 30,
    currentValue: 0,
    unit: 'ngày',
    lastCheckedAt: new Date().toISOString(),
    status: 'NORMAL',
  },
  {
    id: 'th_agent_failure',
    type: 'agent_failure_rate_percent',
    label: 'Tỷ lệ thất bại của AI Agent',
    criticalValue: 30,
    warningValue: 15,
    currentValue: 4.2,
    unit: '%',
    lastCheckedAt: new Date().toISOString(),
    status: 'NORMAL',
  },
  {
    id: 'th_mrr_drop',
    type: 'mrr_drop_percent',
    label: 'Giảm MRR tháng',
    criticalValue: 20,
    warningValue: 10,
    currentValue: 0,
    unit: '%',
    lastCheckedAt: new Date().toISOString(),
    status: 'NORMAL',
  },
  {
    id: 'th_churn_rate',
    type: 'churn_rate_percent',
    label: 'Tỷ lệ churn khách hàng',
    criticalValue: 10,
    warningValue: 5,
    currentValue: 2.3,
    unit: '%',
    lastCheckedAt: new Date().toISOString(),
    status: 'NORMAL',
  },
];

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Creates a new escalation notification from a system event.
 */
export function createEscalationNotification(
  event: SystemEventPayload,
  severity: EscalationNotification['severity'],
  channels: EscalationChannel[],
  message: string,
  actionRequired = false,
  actionUrl?: string
): EscalationNotification {
  const notification: EscalationNotification = {
    id: `notif_${randomUUID().slice(0, 8)}`,
    eventId: event.id,
    type: event.type,
    summary: event.summary,
    severity,
    channels,
    message,
    createdAt: new Date().toISOString(),
    isRead: false,
    actionRequired,
    actionUrl,
  };

  notifications.unshift(notification);
  if (notifications.length > MAX_NOTIFICATIONS) notifications.pop();

  return notification;
}

/**
 * Returns all escalation notifications.
 */
export function listEscalationNotifications(onlyUnread = false): EscalationNotification[] {
  if (onlyUnread) return notifications.filter(n => !n.isRead);
  return [...notifications];
}

/**
 * Marks a notification as read.
 */
export function markNotificationRead(id: string): boolean {
  const n = notifications.find(n => n.id === id);
  if (!n) return false;
  n.isRead = true;
  return true;
}

/**
 * Marks all notifications as read.
 */
export function markAllNotificationsRead(): number {
  const unread = notifications.filter(n => !n.isRead);
  unread.forEach(n => { n.isRead = true; });
  return unread.length;
}

/**
 * Returns count of unread notifications.
 */
export function getUnreadNotificationCount(): number {
  return notifications.filter(n => !n.isRead).length;
}

/**
 * Runs threshold monitoring scan — checks all thresholds and fires events if breached.
 */
export async function runThresholdScan(currentMetrics?: Partial<Record<ThresholdType, number>>): Promise<{
  scannedAt: string;
  thresholds: EscalationThreshold[];
  alertsFired: number;
}> {
  const now = new Date().toISOString();
  let alertsFired = 0;

  for (const threshold of thresholds) {
    // Update current value if provided
    if (currentMetrics?.[threshold.type] !== undefined) {
      threshold.currentValue = currentMetrics[threshold.type]!;
    }
    threshold.lastCheckedAt = now;

    const previous = threshold.status;

    if (threshold.currentValue <= threshold.criticalValue) {
      threshold.status = 'CRITICAL';
    } else if (threshold.currentValue <= threshold.warningValue) {
      threshold.status = 'WARNING';
    } else {
      threshold.status = 'NORMAL';
    }

    // Fire event only when status worsens
    if (threshold.status !== 'NORMAL' && threshold.status !== previous) {
      const eventType = threshold.type === 'cash_balance_vnd'
        ? 'cash.low_balance_alert' as const
        : threshold.type === 'invoice_overdue_days'
        ? 'invoice.overdue' as const
        : 'system.health_degraded' as const;

      await publishSystemEvent(
        eventType,
        'threshold-monitor',
        `${threshold.label}: ${threshold.currentValue.toLocaleString()} ${threshold.unit} (ngưỡng ${threshold.status === 'CRITICAL' ? 'nguy hiểm' : 'cảnh báo'}: ${threshold.criticalValue.toLocaleString()})`,
        { threshold, status: threshold.status }
      ).catch(() => undefined);

      alertsFired++;
    }
  }

  await appendAuditEvent({
    actor: 'autonomous-escalation-engine',
    workspace: 'System',
    action: 'threshold.scan_completed',
    target: 'all_thresholds',
    risk: 'LOW',
    status: 'executed',
    summary: `Threshold scan completed: ${alertsFired} alerts fired across ${thresholds.length} monitors.`,
    evidence: { alertsFired, thresholdCount: thresholds.length },
  }).catch(() => undefined);

  return { scannedAt: now, thresholds: [...thresholds], alertsFired };
}

/**
 * Sends a manual escalation notification.
 */
export async function sendManualEscalation(
  title: string,
  message: string,
  severity: EscalationNotification['severity'],
  channels: EscalationChannel[] = ['ui_notification']
): Promise<EscalationNotification> {
  const fakeEvent: SystemEventPayload = {
    id: `evt_manual_${Date.now()}`,
    type: 'executive.standup_triggered',
    source: 'manual-escalation',
    summary: title,
    data: { message },
    timestamp: new Date().toISOString(),
  };

  return createEscalationNotification(fakeEvent, severity, channels, message, false);
}

/**
 * Returns escalation config.
 */
export function getEscalationConfig(): EscalationConfig {
  return { ...config };
}

/**
 * Updates escalation config.
 */
export function updateEscalationConfig(updates: Partial<EscalationConfig>): EscalationConfig {
  Object.assign(config, updates);
  return { ...config };
}

/**
 * Returns current threshold statuses.
 */
export function listThresholds(): EscalationThreshold[] {
  return [...thresholds];
}

/**
 * Updates a threshold value for monitoring.
 */
export function updateThresholdValue(thresholdId: string, newValue: number): boolean {
  const t = thresholds.find(t => t.id === thresholdId);
  if (!t) return false;
  t.currentValue = newValue;
  t.lastCheckedAt = new Date().toISOString();
  return true;
}

/**
 * Returns summary dashboard for escalation system.
 */
export function getEscalationDashboard(): {
  unreadCount: number;
  pendingEscalationCount: number;
  criticalThresholds: number;
  warningThresholds: number;
  lastScan: string;
  recentNotifications: EscalationNotification[];
} {
  const criticalThresholds = thresholds.filter(t => t.status === 'CRITICAL').length;
  const warningThresholds = thresholds.filter(t => t.status === 'WARNING').length;
  const lastScan = thresholds.map(t => t.lastCheckedAt).sort().reverse()[0] || 'Chưa có';

  return {
    unreadCount: getUnreadNotificationCount(),
    pendingEscalationCount: getPendingEscalationCount(),
    criticalThresholds,
    warningThresholds,
    lastScan,
    recentNotifications: notifications.slice(0, 5),
  };
}
