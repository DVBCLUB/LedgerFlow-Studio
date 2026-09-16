import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateCrossDomainAnalogy,
  blendConcepts,
  listCreativeIdeations,
} from './glaciaCreativeImaginationEngine.ts';

describe('Glacia Creative Imagination & Analogical Transfer Engine (Epoch 8)', () => {
  it('generates cross-domain analogy mapping mechanisms to software challenges', () => {
    const analogy = generateCrossDomainAnalogy('Làm sao để bán template kế toán đột phá?');

    assert.ok(analogy.sourceDomain.length > 0);
    assert.ok(analogy.breakthroughIdea.length > 10);
    assert.ok(analogy.noveltyScore >= 0.85);
    assert.ok(analogy.feasibilityScore >= 0.8);
  });

  it('blends two disparate concepts to produce an innovative product hypothesis', () => {
    const blend = blendConcepts(
      { name: 'Studio Game 3D Lead', coreTrait: 'Quản lý shader, models 3D và pipeline render' },
      { name: '3D Metaverse Virtual World', coreTrait: 'Tương tác không gian 3 chiều sống động' }
    );

    assert.ok(blend.blendId.startsWith('blend-'));
    assert.ok(blend.emergentProperties.length >= 2);
    assert.ok(blend.fitnessScore > 80);
    assert.ok(blend.mvpImplementationPath.length >= 2);
  });

  it('retrieves persistent creative ideations history cleanly', () => {
    const list = listCreativeIdeations();
    assert.ok(list.length >= 1);
  });
});
