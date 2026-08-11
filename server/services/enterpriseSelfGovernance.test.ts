import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getEnterpriseGovernanceOverview,
  allocateResourceBudget,
} from './enterpriseSelfGovernance.ts';

test('getEnterpriseGovernanceOverview calculates AI ROI ratio and role OKRs', () => {
  const overview = getEnterpriseGovernanceOverview();

  assert.ok(overview.aiROI.estimatedTimeSavedHours > 0);
  assert.ok(overview.aiROI.roiRatio > 1.0);
  assert.ok(overview.roleKPIs.length >= 7);
  assert.ok(['OPTIMAL', 'STRONG', 'ATTENTION_REQUIRED'].includes(overview.strategicHealthRating));
  assert.ok(overview.budgetProposals.length === 4);
});

test('allocateResourceBudget adjusts allocations based on priority domain', () => {
  const result = allocateResourceBudget({
    totalMonthlyBudgetUSD: 2000,
    priorityDomain: 'growth_marketing',
  });

  assert.equal(result.totalMonthlyBudgetUSD, 2000);
  assert.equal(result.allocations.length, 4);

  const mktg = result.allocations.find((a) => a.productLine.includes('Marketing'));
  assert.equal(mktg?.sharePercent, 35);
  assert.equal(mktg?.allocatedUSD, 700);
});
