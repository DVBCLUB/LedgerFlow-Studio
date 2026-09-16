import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  startDuplexVoiceSession,
  handleUserBargeIn,
  synthesizeDuplexAudioPacket,
  listDuplexSessions,
} from './glaciaDuplexVoiceEngine.ts';

describe('Glacia Real-Time Duplex Voice & Barge-In Engine (Epoch 9)', () => {
  it('initializes a full duplex voice stream with ultra-low latency (<200ms)', () => {
    const session = startDuplexVoiceSession('vi-VN', 'warm_professional');

    assert.ok(session.sessionId.startsWith('duplex-'));
    assert.equal(session.state, 'listening');
    assert.ok(session.averageLatencyMs < 200);
    assert.equal(session.language, 'vi-VN');
  });

  it('handles barge-in interruptions smoothly cutting off audio within 50ms', () => {
    const session = startDuplexVoiceSession();
    const interruption = handleUserBargeIn(session.sessionId, 'Dừng lại, cho tôi xem báo cáo VAT tháng 7');

    assert.equal(interruption.interrupted, true);
    assert.ok(interruption.cutOffLatencyMs <= 50);
    assert.ok(interruption.nextGlaciaResponse.includes('báo cáo VAT'));
  });

  it('synthesizes duplex audio packets with pitch tone modulations', () => {
    const session = startDuplexVoiceSession('vi-VN', 'energetic');
    const pkt = synthesizeDuplexAudioPacket(session.sessionId, 'Xin chào Giám đốc!');

    assert.ok(pkt.packetId.startsWith('pkt-'));
    assert.equal(pkt.synthesizedPitch, 1.25);
    assert.ok(pkt.audioDurationMs > 0);
  });

  it('retrieves persistent duplex sessions cleanly', () => {
    const list = listDuplexSessions();
    assert.ok(list.length >= 1);
  });
});
