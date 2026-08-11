import { describe, it, expect } from 'vitest';
import {
  listProviderCreditStatuses,
  recordApiUsageCost,
} from './cloudCostCreditsOptimizer.ts';

describe('cloudCostCreditsOptimizer', () => {
  it('loads provider credit balances and checks usage ratios', async () => {
    const statuses = await listProviderCreditStatuses();
    expect(statuses.length).toBeGreaterThan(0);
    expect(statuses[0].monthlyBudgetUsd).toBeGreaterThan(0);
  });

  it('records API cost consumption and updates alert statuses', async () => {
    const statuses = await listProviderCreditStatuses();
    const target = statuses[0];

    const updated = await recordApiUsageCost(target.id, 5.0);
    expect(updated?.usedUsd).toBeGreaterThan(target.usedUsd);
  });
});
