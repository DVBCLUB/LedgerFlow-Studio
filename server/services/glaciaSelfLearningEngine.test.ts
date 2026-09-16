import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  loadLearningProfile,
  recordInteractionFeedback,
  getAdaptivePromptAdditive,
  getLearningInsights,
} from './glaciaSelfLearningEngine.ts';

describe('glaciaSelfLearningEngine - CEO Feedback & Continuous Learning', () => {
  test('loads learning profile properly', () => {
    const profile = loadLearningProfile();
    assert.ok(profile.totalInteractions > 0);
    assert.ok(profile.approvalRatio >= 0 && profile.approvalRatio <= 1.0);
    assert.ok(Array.isArray(profile.detectedRecurringThemes));
  });

  test('records interaction feedback and updates approval metrics', () => {
    const res = recordInteractionFeedback({
      rating: 'thumbs_up',
      queryPrompt: 'Tạo kế hoạch render 3D Blender cho sản phẩm mới',
      responseSnippet: 'Dạ em đã hoàn thành thiết lập scene Blender...',
      category: 'creative',
    });

    assert.strictEqual(res.success, true);
    assert.ok(res.feedbackId.startsWith('fb-'));
    assert.ok(res.updatedProfile.thumbsUpCount > 0);
  });

  test('generates adaptive prompt guideline for AI context', () => {
    const guideline = getAdaptivePromptAdditive();
    assert.ok(guideline.includes('GLACIA ADAPTIVE LEARNING GUIDELINE'));
    assert.ok(guideline.includes('davidbao1704@gmail.com'));
  });

  test('retrieves learning insights report', () => {
    const insights = getLearningInsights();
    assert.ok(insights.summary.length > 0);
    assert.ok(insights.profile);
    assert.ok(Array.isArray(insights.recentFeedback));
  });
});
