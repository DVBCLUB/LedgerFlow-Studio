import { describe, it, expect } from 'vitest';
import {
  recordIncomeEntry,
  calculateTotalRevenue,
  calculateAIReinvestmentRecommendation,
  listIncomeEntries,
} from './digitalMonetizationLedger.ts';

describe('digitalMonetizationLedger', () => {
  it('loads presets and records new digital income entry', async () => {
    const entries = await listIncomeEntries();
    expect(entries.length).toBeGreaterThan(0);

    const entry = await recordIncomeEntry({
      sourceName: 'TikTok Shop Affiliate Campaign',
      streamType: 'affiliate',
      amountVnd: 5000000,
      platformName: 'TikTok Shop',
    });

    expect(entry.id).toBeDefined();
    expect(entry.amountVnd).toBe(5000000);
  });

  it('calculates total revenue by stream and generates AI reinvestment splits', async () => {
    const { totalVnd, byStream } = await calculateTotalRevenue();
    expect(totalVnd).toBeGreaterThan(0);
    expect(byStream.game_app_sales).toBeGreaterThan(0);

    const rec = await calculateAIReinvestmentRecommendation(0.20);
    expect(rec.recommendedReinvestmentVnd).toBe(totalVnd * 0.20);
    expect(rec.allocations.length).toBe(3);
  });
});
