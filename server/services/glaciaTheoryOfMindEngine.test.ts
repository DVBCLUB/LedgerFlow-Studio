import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildStakeholderMentalModel,
  predictStakeholderIntention,
  calibrateEmpathicResponse,
  listStakeholderModels,
} from './glaciaTheoryOfMindEngine.ts';

describe('Glacia Theory of Mind Engine (Epoch 8)', () => {
  it('builds a rich mental model inferring emotion and causes from behavioral signals', () => {
    const model = buildStakeholderMentalModel('ceo-david', 'David Bao', 'CEO', [
      { timestamp: new Date().toISOString(), source: 'night_activity', hourOfDay: 23, sentimentScore: 0.2 },
    ]);

    assert.equal(model.name, 'David Bao');
    assert.equal(model.emotionalState.primaryEmotion, 'fatigued');
    assert.ok(model.emotionalState.probableRootCause.includes('khuya'));
    assert.equal(model.communicationAdvice.recommendedDetailLevel, 'executive_bullet');
  });

  it('predicts underlying user intentions and motives accurately', () => {
    const prediction = predictStakeholderIntention('stakeholder-ceo', 'Làm sao để Glacia thông minh hơn nữa, tư duy tốt nhất thế giới?');

    assert.ok(prediction.inferredIntention.includes('đột phá'));
    assert.ok(prediction.recommendedResponseStrategy.includes('kiến trúc'));
  });

  it('calibrates response style and brevity when stakeholder is fatigued', () => {
    const res = calibrateEmpathicResponse('ceo-david', 'Báo cáo toàn diện hệ thống gồm 15 hạng mục...');
    assert.ok(res.adjustmentsApplied.length >= 1);
  });

  it('lists persistent stakeholder models cleanly', () => {
    const list = listStakeholderModels();
    assert.ok(list.length >= 1);
    assert.ok(list.some(m => m.name.includes('David')));
  });
});
