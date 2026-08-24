import test from 'node:test';
import assert from 'node:assert/strict';
import {
  recordIncomeEntry,
  calculateTotalRevenue,
  calculateAIReinvestmentRecommendation,
  listIncomeEntries,
} from './digitalMonetizationLedger.ts';

test('digitalMonetizationLedger - loads presets and records new digital income entry', async () => {
  const entries = await listIncomeEntries();
  assert.ok(entries.length > 0);

  const entry = await recordIncomeEntry({
    sourceName: 'TikTok Shop Affiliate Campaign',
    streamType: 'affiliate',
    amountVnd: 5000000,
    platformName: 'TikTok Shop',
  });

  assert.ok(entry.id);
  assert.equal(entry.amountVnd, 5000000);
});

test('digitalMonetizationLedger - calculates total revenue by stream and generates AI reinvestment splits', async () => {
  const { totalVnd, byStream } = await calculateTotalRevenue();
  assert.ok(totalVnd > 0);
  assert.ok(byStream.game_app_sales > 0);

  const rec = await calculateAIReinvestmentRecommendation(0.20);
  assert.equal(rec.recommendedReinvestmentVnd, totalVnd * 0.20);
  assert.equal(rec.allocations.length, 3);
});

