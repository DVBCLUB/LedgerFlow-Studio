import test from 'node:test';
import assert from 'node:assert/strict';
import { simulateProfitGrowth } from './aiBusinessTwinSimulator.ts';

test('aiBusinessTwinSimulator - simulates profit growth with reinvestment ratio', async () => {
  const res = await simulateProfitGrowth('Kịch bản Trích 25% Tái đầu tư AI Ads', 25);

  assert.ok(res.reinvestAmountVnd > 0);
  assert.ok(res.projectedNetIncomeVnd > res.monthlyRevenueVnd);
  assert.ok(res.recommendation.includes('lợi nhuận ròng'));
});

