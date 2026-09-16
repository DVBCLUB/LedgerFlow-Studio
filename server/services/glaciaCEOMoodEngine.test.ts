import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateCEOMoodFromSignals,
  getLatestCEOMoodState,
} from './glaciaCEOMoodEngine.ts';

describe('Glacia Emotion-Aware CEO Companion OS (Frontier 4)', () => {
  it('detects high stress and shifts response style to concise bullet points on urgent prompts', () => {
    const state = evaluateCEOMoodFromSignals({
      recentPrompt: 'Hệ thống bị lỗi gấp quá cứu tôi với cháy deadline rồi',
      sessionDurationMinutes: 60,
      currentHour: 14,
    });

    assert.ok(state.stressLevel >= 60);
    assert.equal(state.detectedEmotion, 'stressed');
    assert.equal(state.recommendedResponseStyle, 'concise_bullet_points');
  });

  it('detects late night work hours (02:00 AM) and triggers wellness break suggestion', () => {
    const state = evaluateCEOMoodFromSignals({
      recentPrompt: 'Kiểm tra nốt báo cáo kế toán',
      sessionDurationMinutes: 120,
      currentHour: 2,
    });

    assert.ok(state.energyLevel <= 50);
    assert.equal(state.detectedEmotion, 'fatigued');
    assert.equal(state.recommendedResponseStyle, 'wellness_break_suggestion');
    assert.ok(state.suggestedWellnessAction?.includes('sau 23h'));
  });

  it('detects high motivation and energy on celebratory prompts', () => {
    const state = evaluateCEOMoodFromSignals({
      recentPrompt: 'Tuyệt vời, tất cả các bài test đều xanh hoàn hảo, tiếp tục nào!',
      sessionDurationMinutes: 45,
      currentHour: 10,
    });

    assert.ok(state.energyLevel >= 80);
    assert.equal(state.detectedEmotion, 'excited');
    assert.equal(state.recommendedResponseStyle, 'direct_executive');
  });
});
