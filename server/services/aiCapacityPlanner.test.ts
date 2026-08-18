import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateCapacityForecast } from './aiCapacityPlanner.ts';

describe('aiCapacityPlanner - Budget & Capacity Forecaster', () => {
  it('generates a complete forecast with burn rate and days until cap', () => {
    const forecast = generateCapacityForecast();

    assert.ok(forecast.forecastId.startsWith('cap_'));
    assert.ok(typeof forecast.currentSpentUsd === 'number');
    assert.ok(typeof forecast.monthlyCapUsd === 'number');
    assert.ok(typeof forecast.dailyBurnRateUsd === 'number');
    assert.ok(typeof forecast.estimatedDaysUntilCap === 'number');
    assert.ok(['SAFE', 'WARNING', 'CRITICAL'].includes(forecast.riskLevel));
    assert.ok(forecast.recommendations.length >= 1);
  });

  it('includes actionable optimization tips', () => {
    const forecast = generateCapacityForecast();
    const freeTierTip = forecast.recommendations.find((r) => r.tipId === 'opt_free_tier_first');
    assert.ok(freeTierTip);
    assert.equal(freeTierTip.isActionableNow, true);
  });
});
