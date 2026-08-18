import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateAiRoiSummary } from './aiRoiAnalytics.ts';

describe('aiRoiAnalytics - Capital Efficiency Metrics', () => {
  it('calculates daily AI ROI and unit economics accurately', () => {
    const summary = calculateAiRoiSummary('day');

    assert.equal(summary.period, 'day');
    assert.ok(summary.totalAiCostUsd >= 0);
    assert.ok(summary.totalRevenueVnd > 0);
    assert.ok(summary.roiMultiple > 1);
    assert.ok(summary.revenuePerDollarSpentVnd > 0);
    assert.ok(summary.topCostDriver.roleName);
  });

  it('scales revenue properly across time periods', () => {
    const day = calculateAiRoiSummary('day');
    const week = calculateAiRoiSummary('week');
    const month = calculateAiRoiSummary('month');

    assert.ok(week.totalRevenueVnd > day.totalRevenueVnd);
    assert.ok(month.totalRevenueVnd > week.totalRevenueVnd);
  });
});
