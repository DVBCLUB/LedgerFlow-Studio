import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sendA2AMessage,
  fetchAgentMailbox,
  markA2AMessageStatus,
  checkAndEscalateUnreadUrgentMessages,
  clearMailboxesForTest,
} from './agentCollaborationProtocol.ts';

test('agentCollaborationProtocol - sends direct message to recipient agent role mailbox', () => {
  clearMailboxesForTest();
  const msg = sendA2AMessage({
    senderRole: 'AI Auditor',
    recipientRole: 'AI Accountant',
    messageType: 'request_review',
    subject: 'Review Account 111 Discrepancy',
    body: 'Detected 50M VND discrepancy in cash voucher #402.',
  });

  assert.ok(msg.id);
  assert.equal(msg.status, 'unread');

  const mailbox = fetchAgentMailbox('AI Accountant');
  assert.equal(mailbox.length, 1);
  assert.equal(mailbox[0].subject, 'Review Account 111 Discrepancy');
});

test('agentCollaborationProtocol - prioritizes urgent messages to top of recipient queue', () => {
  clearMailboxesForTest();
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
  assert.equal(mailbox[0].priority, 'urgent');
  assert.ok(mailbox[0].subject.includes('CRITICAL'));
});

test('agentCollaborationProtocol - marks message status and auto-escalates unread urgent messages after timeout', () => {
  clearMailboxesForTest();
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
  assert.equal(mailbox.length, 1);

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
  assert.equal(escalated.length, 1);
  assert.equal(escalated[0].status, 'escalated');
});

