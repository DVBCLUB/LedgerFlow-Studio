import { describe, it, expect } from 'vitest';
import {
  classifyFeedback,
  ingestPlayerReview,
  listPlayerReviews,
} from './gameFeedbackClassifier.ts';

describe('gameFeedbackClassifier', () => {
  it('classifies player feedback into categories and severity', () => {
    const res1 = classifyFeedback('Game bị văng ra ngoài khi đánh boss', 1);
    expect(res1.category).toBe('bug_report');
    expect(res1.severity).toBe('critical');

    const res2 = classifyFeedback('Nên thêm chế độ Multiplayer PvP', 5);
    expect(res2.category).toBe('feature_request');

    const res3 = classifyFeedback('Game đồ họa 3D rất đẹp và mượt', 5);
    expect(res3.category).toBe('positive_praise');
  });

  it('ingests player review and auto-triages critical bugs into AI Dev tasks', async () => {
    const review = await ingestPlayerReview({
      gameTitle: 'Dragon Odyssey PC',
      platform: 'steam_pc',
      author: 'Gamer_99',
      rating: 1,
      reviewText: 'Lỗi crash game mất save ở màn 3',
    });

    expect(review.id).toBeDefined();
    expect(review.category).toBe('bug_report');
    expect(review.autoTriaged).toBe(true);
    expect(review.assignedAiDevTaskId).toBeDefined();

    const list = await listPlayerReviews('Dragon Odyssey');
    expect(list.length).toBeGreaterThan(0);
  });
});
