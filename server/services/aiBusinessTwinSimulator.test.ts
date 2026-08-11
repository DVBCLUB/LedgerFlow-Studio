import { describe, it, expect } from 'vitest';
import { simulateProfitGrowth } from './aiBusinessTwinSimulator.ts';

describe('aiBusinessTwinSimulator', () => {
  it('simulates profit growth with reinvestment ratio', async () => {
    const res = await simulateProfitGrowth('Kịch bản Trích 25% Tái đầu tư AI Ads', 25);

    expect(res.reinvestAmountVnd).toBeGreaterThan(0);
    expect(res.projectedNetIncomeVnd).toBeGreaterThan(res.monthlyRevenueVnd);
    expect(res.recommendation).toContain('lợi nhuận ròng');
  });
});
