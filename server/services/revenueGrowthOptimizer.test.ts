import assert from 'node:assert/strict';
import test from 'node:test';
import {
  optimizeSaaSPricingTiers,
  getRevenueOptimizationRecommendations,
} from './revenueGrowthOptimizer.ts';

test('optimizeSaaSPricingTiers returns 3 structured pricing tiers', () => {
  const tiers = optimizeSaaSPricingTiers();
  assert.equal(tiers.length, 3);
  assert.equal(tiers[0].tierName, 'Starter Studio');
  assert.equal(tiers[1].tierName, 'Growth OS (Most Popular)');
  assert.equal(tiers[2].tierName, 'Enterprise Autonomy Suite');
  assert.ok(tiers[2].monthlyPriceUSD > tiers[1].monthlyPriceUSD);
});

test('getRevenueOptimizationRecommendations returns ARR growth recommendations', () => {
  const overview = getRevenueOptimizationRecommendations();

  assert.ok(overview.recommendedPricingTiers.length === 3);
  assert.ok(overview.growthRecommendations.length >= 3);
  assert.ok(overview.estimatedMonthlyRecurrentRevenueUSD > 0);
  assert.equal(overview.projectedAnnualRecurrentRevenueUSD, overview.estimatedMonthlyRecurrentRevenueUSD * 12);
});
