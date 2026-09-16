import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeTreasuryRunwayAndSavings,
  allocateMicroBudget,
  listTreasuryReport,
} from './glaciaTreasuryGrowthEngine.ts';

describe('Glacia Autonomous Financial Treasury & Growth Engine (Epoch 10)', () => {
  it('computes $0 token cost savings, healthy runway and financial health score', () => {
    const report = computeTreasuryRunwayAndSavings();

    assert.ok(report.reportId.startsWith('treasury-'));
    assert.ok(report.totalSavedDollarsUsd >= 10000);
    assert.ok(report.totalSavedVnd > 0);
    assert.ok(report.runwayMonths >= 12);
    assert.ok(report.financialHealthScore >= 90);
    assert.ok(report.budgetAllocations.length >= 1);
  });

  it('allocates micro-budgets autonomously and updates financial allocation ledger', () => {
    const report = allocateMicroBudget('Chiến dịch B2B Email Harvester', 300000);

    assert.ok(report.budgetAllocations.some(a => a.channel.includes('B2B Email')));
  });

  it('retrieves persistent treasury report cleanly', () => {
    const report = listTreasuryReport();
    assert.ok(report.totalSavedDollarsUsd > 0);
  });
});
