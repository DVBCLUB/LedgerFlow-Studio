import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyFeedback,
  ingestPlayerReview,
  listPlayerReviews,
} from './gameFeedbackClassifier.ts';

test('gameFeedbackClassifier - classifies player feedback into categories and severity', () => {
  const res1 = classifyFeedback('Game bị văng ra ngoài khi đánh boss', 1);
  assert.equal(res1.category, 'bug_report');
  assert.equal(res1.severity, 'critical');

  const res2 = classifyFeedback('Nên thêm chế độ Multiplayer PvP', 5);
  assert.equal(res2.category, 'feature_request');

  const res3 = classifyFeedback('Game đồ họa 3D rất đẹp và mượt', 5);
  assert.equal(res3.category, 'positive_praise');
});

test('gameFeedbackClassifier - ingests player review and auto-triages critical bugs into AI Dev tasks', async () => {
  const review = await ingestPlayerReview({
    gameTitle: 'Dragon Odyssey PC',
    platform: 'steam_pc',
    author: 'Gamer_99',
    rating: 1,
    reviewText: 'Lỗi crash game mất save ở màn 3',
  });

  assert.ok(review.id);
  assert.equal(review.category, 'bug_report');
  assert.equal(review.autoTriaged, true);
  assert.ok(review.assignedAiDevTaskId);

  const list = await listPlayerReviews('Dragon Odyssey');
  assert.ok(list.length > 0);
});

