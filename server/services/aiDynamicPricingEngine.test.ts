import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateDynamicSaaSPricing } from './revenueGrowthOptimizer.ts';

describe('Pillar 2: AI Dynamic Pricing Engine', () => {
  it('evaluates SaaS pricing tiers and calculates MRR lift recommendations', () => {
    const result = evaluateDynamicSaaSPricing({
      currentMRR: 15000,
      activeUsers: 450,
      targetMarginPercent: 75,
    });

    assert.equal(result.currentMRR, 15000);
    assert.equal(result.activeUsers, 450);
    assert.ok(result.projectedMRRIncrease > 0);
    assert.equal(result.recommendedTiers.length, 3);
    assert.equal(result.affiliateCommissionRatePercent, 20);
  });
});
