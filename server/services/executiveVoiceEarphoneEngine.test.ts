import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseExecutiveVoiceCommand } from './executiveVoiceEarphoneEngine.ts';

describe('executiveVoiceEarphoneEngine - Hands-Free Voice Commands', () => {
  it('identifies revenue queries and returns spoken audio feedback in Vietnamese', () => {
    const result = parseExecutiveVoiceCommand('Báo cáo cho tôi tình hình doanh thu và tiền về sáng nay');
    assert.equal(result.recognizedIntent, 'query_revenue');
    assert.ok(result.spokenAudioFeedbackVi.includes('87 triệu'));
    assert.ok(result.confidence > 0.9);
  });

  it('identifies approval voice intents and provides execution payload', () => {
    const result = parseExecutiveVoiceCommand('Duyệt tất cả bản build và video đang chờ giúp tôi');
    assert.equal(result.recognizedIntent, 'approve_pending_build');
    assert.equal(result.executionPayload?.status, 'approved');
    assert.ok(result.spokenAudioFeedbackVi.includes('Đã hoàn tất phê duyệt'));
  });

  it('handles unknown utterances gracefully with guidance', () => {
    const result = parseExecutiveVoiceCommand('Hôm nay trời đẹp quá');
    assert.equal(result.recognizedIntent, 'unknown');
    assert.ok(result.spokenAudioFeedbackVi.includes('Bạn có thể nói:'));
  });
});
