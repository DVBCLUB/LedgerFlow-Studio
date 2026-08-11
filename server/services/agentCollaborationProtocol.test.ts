import { describe, it, expect, beforeEach } from 'vitest';
import {
  sendA2AMessage,
  fetchAgentMailbox,
  markA2AMessageStatus,
  checkAndEscalateUnreadUrgentMessages,
  clearMailboxesForTest,
} from './agentCollaborationProtocol.ts';

describe('agentCollaborationProtocol', () => {
  beforeEach(() => {
    clearMailboxesForTest();
  });

  it('sends direct message to recipient agent role mailbox', () => {
    const msg = sendA2AMessage({
      senderRole: 'AI Auditor',
      recipientRole: 'AI Accountant',
      messageType: 'request_review',
      subject: 'Review Account 111 Discrepancy',
      body: 'Detected 50M VND discrepancy in cash voucher #402.',
    });

    expect(msg.id).toBeDefined();
    expect(msg.status).toBe('unread');

    const mailbox = fetchAgentMailbox('AI Accountant');
    expect(mailbox.length).toBe(1);
    expect(mailbox[0].subject).toBe('Review Account 111 Discrepancy');
  });

  it('prioritizes urgent messages to top of recipient queue', () => {
    sendA2AMessage({
      senderRole: 'AI Dev',
      recipientRole: 'AI DevOps',
      messageType: 'share_artifact',
      priority: 'normal',
      subject: 'Feature release draft',
      body: 'Draft spec ready.',
    });

    sendA2AMessage({
      senderRole: 'AI Auditor',
      recipientRole: 'AI DevOps',
      messageType: 'report_blocker',
      priority: 'urgent',
      subject: 'CRITICAL: Security Leak in API key',
      body: 'Immediate rotation required.',
    });

    const mailbox = fetchAgentMailbox('AI DevOps');
    expect(mailbox[0].priority).toBe('urgent');
    expect(mailbox[0].subject).toContain('CRITICAL');
  });

  it('marks message status and auto-escalates unread urgent messages after timeout', () => {
    const msg = sendA2AMessage({
      senderRole: 'AI CFO',
      recipientRole: 'AI Accountant',
      messageType: 'request_review',
      priority: 'urgent',
      subject: 'Bank reconciliation deadline',
      body: 'Urgent signoff needed.',
    });

    // Mark as read
    markA2AMessageStatus(msg.id, 'AI Accountant', 'read');
    const mailbox = fetchAgentMailbox('AI Accountant', { status: 'read' });
    expect(mailbox.length).toBe(1);

    // Unread test escalation
    sendA2AMessage({
      senderRole: 'AI CFO',
      recipientRole: 'AI Legal',
      messageType: 'report_blocker',
      priority: 'urgent',
      subject: 'Contract breach warning',
      body: 'Immediate legal review required.',
    });

    // Check with 0ms timeout -> should trigger escalation
    const escalated = checkAndEscalateUnreadUrgentMessages(0);
    expect(escalated.length).toBe(1);
    expect(escalated[0].status).toBe('escalated');
  });
});
