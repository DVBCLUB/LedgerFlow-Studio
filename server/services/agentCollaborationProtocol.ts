/**
 * agentCollaborationProtocol.ts
 * ============================================================
 * Agent-to-Agent (A2A) Direct Collaboration & Mailbox Protocol for LedgerFlow OS.
 *
 * Enables specialized agents to directly exchange context, artifacts,
 * code reviews, and blocker alerts without routing everything through a central manager:
 *  - Mailbox Queue per Agent Role (code, review, finance, auditor, planner, devops).
 *  - Message Types: 'request_review' | 'share_artifact' | 'ask_clarification' | 'delegate_subtask' | 'report_blocker'
 *  - Threading & Priority (normal, high, urgent).
 *  - Unhandled Escalation (auto-escalate unread urgent messages after timeout).
 *  - Audit logging & telemetry stream integration.
 */

import { randomUUID } from 'node:crypto';
import { appendAuditEvent } from './auditLog.ts';
import { emitTelemetryEvent } from './agentTelemetryStream.ts';

// ─── Types ────────────────────────────────────────────────────────────────────

export type A2AMessageType =
  | 'request_review'
  | 'share_artifact'
  | 'ask_clarification'
  | 'delegate_subtask'
  | 'report_blocker';

export type A2APriority = 'normal' | 'high' | 'urgent';

export interface A2AMessage {
  id: string;
  threadId: string;
  senderRole: string;
  recipientRole: string;
  messageType: A2AMessageType;
  priority: A2APriority;
  subject: string;
  body: string;
  artifacts?: Array<{ id: string; name: string; type: string; payload: unknown }>;
  status: 'unread' | 'read' | 'completed' | 'escalated';
  sentAt: string;
  readAt?: string;
  completedAt?: string;
  escalatedAt?: string;
}

interface ThreadStore {
  threads: Record<string, A2AMessage[]>;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const mailboxes = new Map<string, A2AMessage[]>();

// ─── Core API ─────────────────────────────────────────────────────────────────

export function sendA2AMessage(input: {
  threadId?: string;
  senderRole: string;
  recipientRole: string;
  messageType: A2AMessageType;
  priority?: A2APriority;
  subject: string;
  body: string;
  artifacts?: Array<{ id: string; name: string; type: string; payload: unknown }>;
}): A2AMessage {
  const msgId = `a2a_${Date.now()}_${randomUUID().slice(0, 6)}`;
  const threadId = input.threadId || `thread_${Date.now()}_${randomUUID().slice(0, 4)}`;
  const priority = input.priority || 'normal';

  const msg: A2AMessage = {
    id: msgId,
    threadId,
    senderRole: input.senderRole,
    recipientRole: input.recipientRole,
    messageType: input.messageType,
    priority,
    subject: input.subject.slice(0, 150),
    body: input.body,
    artifacts: input.artifacts || [],
    status: 'unread',
    sentAt: new Date().toISOString(),
  };

  if (!mailboxes.has(input.recipientRole)) {
    mailboxes.set(input.recipientRole, []);
  }

  const recipientQueue = mailboxes.get(input.recipientRole)!;
  if (priority === 'urgent') {
    recipientQueue.unshift(msg); // Urgent messages go to front of queue
  } else {
    recipientQueue.push(msg);
  }

  emitTelemetryEvent({
    category: 'agent_runtime',
    eventType: 'a2a_message_sent',
    severity: priority === 'urgent' ? 'warning' : 'info',
    source: `a2a:${input.senderRole}->${input.recipientRole}`,
    summary: `A2A Mail (${priority.toUpperCase()}): ${input.senderRole} -> ${input.recipientRole} [${input.messageType}]: "${input.subject}"`,
    payload: { messageId: msgId, threadId, messageType: input.messageType, priority },
  });

  appendAuditEvent({
    actor: input.senderRole,
    workspace: 'A2A Collaboration',
    action: 'a2a.message_sent',
    target: input.recipientRole,
    risk: priority === 'urgent' ? 'MEDIUM' : 'LOW',
    status: 'executed',
    summary: `A2A [${input.messageType}]: ${input.senderRole} -> ${input.recipientRole} (${input.subject})`,
    evidence: { messageId: msgId, threadId, priority },
  }).catch(() => undefined);

  return msg;
}

export function fetchAgentMailbox(
  recipientRole: string,
  filter?: { status?: A2AMessage['status']; minPriority?: A2APriority }
): A2AMessage[] {
  const queue = mailboxes.get(recipientRole) || [];
  return queue.filter((m) => {
    if (filter?.status && m.status !== filter.status) return false;
    if (filter?.minPriority === 'urgent' && m.priority !== 'urgent') return false;
    if (filter?.minPriority === 'high' && m.priority === 'normal') return false;
    return true;
  });
}

export function markA2AMessageStatus(
  messageId: string,
  recipientRole: string,
  newStatus: 'read' | 'completed' | 'escalated'
): A2AMessage | null {
  const queue = mailboxes.get(recipientRole) || [];
  const msg = queue.find((m) => m.id === messageId);
  if (!msg) return null;

  const now = new Date().toISOString();
  msg.status = newStatus;

  if (newStatus === 'read') msg.readAt = now;
  else if (newStatus === 'completed') msg.completedAt = now;
  else if (newStatus === 'escalated') msg.escalatedAt = now;

  emitTelemetryEvent({
    category: 'agent_runtime',
    eventType: `a2a_message_${newStatus}`,
    source: `a2a:${recipientRole}`,
    summary: `A2A Mail ${messageId} status updated to ${newStatus} by ${recipientRole}`,
  });

  return msg;
}

export function checkAndEscalateUnreadUrgentMessages(timeoutMs = 300000): A2AMessage[] {
  const now = Date.now();
  const escalated: A2AMessage[] = [];

  for (const [role, queue] of mailboxes) {
    for (const msg of queue) {
      if (msg.priority === 'urgent' && msg.status === 'unread') {
        const age = now - Date.parse(msg.sentAt);
        if (age >= timeoutMs) {
          msg.status = 'escalated';
          msg.escalatedAt = new Date().toISOString();
          escalated.push(msg);

          // Escalate to orchestrator/founder
          appendAuditEvent({
            actor: 'a2a-protocol',
            workspace: 'A2A Collaboration',
            action: 'a2a.urgent_escalated',
            target: role,
            risk: 'HIGH',
            status: 'pending_approval',
            summary: `Urgent A2A message from ${msg.senderRole} to ${role} unread after ${(timeoutMs / 60000).toFixed(0)}m! Escalating to Founder.`,
            evidence: { messageId: msg.id, subject: msg.subject, ageMs: age },
          }).catch(() => undefined);

          emitTelemetryEvent({
            category: 'agent_runtime',
            eventType: 'a2a_urgent_escalation',
            severity: 'error',
            source: 'a2a_protocol',
            summary: `Urgent A2A message unhandled by ${role}: "${msg.subject}". Escalated!`,
          });
        }
      }
    }
  }

  return escalated;
}

export function clearMailboxesForTest() {
  mailboxes.clear();
}
