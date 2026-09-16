import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  handleIncomingOmniMessage,
  listSalesConversations,
  getOmniChannelSalesMetrics,
} from './glaciaOmniChannelSalesAgent.ts';

describe('Glacia Omni-Channel Sales & Support Agent (Epoch 7)', () => {
  it('handles customer pricing inquiries and generates dynamic VietQR payment payload', () => {
    const res = handleIncomingOmniMessage({
      id: 'msg-test-01',
      channel: 'zalo_oa',
      senderId: 'zalo-client-88',
      senderName: 'Anh Hoàng - Xây Dựng Đại Việt',
      text: 'Gói phần mềm kế toán bao nhiêu tiền và thanh toán thế nào?',
      receivedAt: new Date().toISOString(),
    });

    assert.ok(res.replyText.includes('VND'));
    assert.ok(res.vietQrPayload);
    assert.equal(res.vietQrPayload.bankCode, 'MBBANK');
    assert.equal(res.vietQrPayload.amount, 12000000);
    assert.equal(res.conversation.status, 'proposal_sent');
  });

  it('answers specialized industry questions (VAS construction) intelligently', () => {
    const res = handleIncomingOmniMessage({
      id: 'msg-test-02',
      channel: 'telegram',
      senderId: 'tele-user-77',
      senderName: 'Chị Hà Kế Toán',
      text: 'Phần mềm có hỗ trợ render Game 3D và xuất bản phim AI 4K không?',
      receivedAt: new Date().toISOString(),
    });

    assert.ok(res.replyText.includes('154'));
    assert.equal(res.conversation.interestProduct, 'Gói Kế Toán Xây Dựng Chuyên Sâu');
  });

  it('lists filtered sales conversations by channel accurately', () => {
    const zaloList = listSalesConversations('zalo_oa');
    assert.ok(Array.isArray(zaloList));
    assert.ok(zaloList.every((c) => c.channel === 'zalo_oa'));
  });

  it('computes sales pipeline metrics, closed revenue and channel distribution', () => {
    const metrics = getOmniChannelSalesMetrics();
    assert.ok(metrics.totalLeads >= 2);
    assert.ok(metrics.totalPipelineValueVnd > 0);
    assert.ok(metrics.channelDistribution.zalo_oa >= 1);
  });
});
