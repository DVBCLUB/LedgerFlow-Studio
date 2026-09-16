import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeGlobalFxHedgingStrategy,
  listFxHedgingReports,
} from './glaciaFxHedgingEngine.ts';

describe('Glacia Global Economic & FX Currency Hedging Synthesizer (Epoch 12)', () => {
  it('computes FX rates, hedging allocations and localized multi-currency pricing', () => {
    const report = computeGlobalFxHedgingStrategy('VND', 50000);

    assert.ok(report.reportId.startsWith('fx-'));
    assert.equal(report.currencyPairs.length, 4);
    assert.ok(report.portfolioHedgingPlan.recommendedLocalizedPricingUsd > 0);
    assert.ok(report.portfolioHedgingPlan.recommendedLocalizedPricingEur > 0);
    assert.equal(report.portfolioHedgingPlan.vietqrCrossBorderSettlementEnabled, true);
    assert.ok(report.executiveHedgingInsight.includes('USD/VND'));
  });

  it('retrieves persistent FX hedging reports cleanly', () => {
    const list = listFxHedgingReports();
    assert.ok(list.length >= 1);
  });
});
