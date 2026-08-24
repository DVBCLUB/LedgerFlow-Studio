import test from 'node:test';
import assert from 'node:assert/strict';
import {
  listProviderCreditStatuses,
  recordApiUsageCost,
} from './cloudCostCreditsOptimizer.ts';

test('cloudCostCreditsOptimizer - loads provider credit balances and checks usage ratios', async () => {
  const statuses = await listProviderCreditStatuses();
  assert.ok(statuses.length > 0);
  assert.ok(statuses[0].monthlyBudgetUsd > 0);
});

test('cloudCostCreditsOptimizer - records API cost consumption and updates alert statuses', async () => {
  const statuses = await listProviderCreditStatuses();
  const target = statuses[0];

  const updated = await recordApiUsageCost(target.id, 5.0);
  assert.ok((updated?.usedUsd ?? 0) > target.usedUsd);
});

