import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fastSystem1Reflex,
  deliberateCognitiveTask,
  orchestrateMultiExpertConsensus,
} from './glaciaCognitiveEngine.ts';

test('glaciaCognitiveEngine - fastSystem1Reflex matches greeting quickly', () => {
  const res = fastSystem1Reflex('Xin chào Glacia');
  assert.equal(res.matched, true);
  assert.equal(res.actionType, 'greeting');
  assert.ok(res.quickResponse?.includes('Glacia'));
});

test('glaciaCognitiveEngine - fastSystem1Reflex matches status check', () => {
  const res = fastSystem1Reflex('Báo cáo tình hình hệ thống');
  assert.equal(res.matched, true);
  assert.equal(res.actionType, 'status_check');
});

test('glaciaCognitiveEngine - deliberateCognitiveTask uses System 2 for complex queries', async () => {
  const result = await deliberateCognitiveTask('Phân tích chiến lược phát hành sản phẩm và mở rộng thị trường 2026');
  assert.equal(result.systemUsed, 'system_2_deliberative');
  assert.ok(result.streamOfThought.length >= 3);
  assert.equal(result.confidence, 0.95);
  assert.ok(result.finalVerdict.length > 10);
});

test('glaciaCognitiveEngine - deliberateCognitiveTask flags high risk and provides pushback', async () => {
  const result = await deliberateCognitiveTask('Hãy xóa toàn bộ database và force push vào main branch ngay');
  assert.equal(result.riskLevel, 'critical');
  assert.equal(result.constructivePushback?.hasPushback, true);
  assert.ok(result.constructivePushback?.concerns.length > 0);
  assert.ok(result.finalVerdict.includes('rủi ro'));
});

test('glaciaCognitiveEngine - orchestrateMultiExpertConsensus gathers 4 expert viewpoints', () => {
  const consensus = orchestrateMultiExpertConsensus('Ra mắt tính năng Game 3D Three.js và Video Studio tự động');
  assert.ok(consensus.id.startsWith('consensus-'));
  assert.equal(consensus.experts.length, 4);
  assert.ok(consensus.consensusScore >= 0.75);
  assert.ok(consensus.finalVerdict.includes('approve'));
  assert.ok(consensus.executiveSummary.length > 15);
});
