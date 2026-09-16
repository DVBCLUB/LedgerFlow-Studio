import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  conductEnterpriseDueDiligence,
  listDueDiligenceAudits,
} from './glaciaEnterpriseDueDiligenceEngine.ts';

describe('Glacia Autonomous Enterprise Due Diligence & M&A Engine (Epoch 12)', () => {
  it('conducts comprehensive M&A due diligence, DCF valuation and produces term sheet summary', () => {
    const report = conductEnterpriseDueDiligence('MicroVAS Vietnam', 2000000000);

    assert.ok(report.auditId.startsWith('mna-'));
    assert.equal(report.targetCompanyName, 'MicroVAS Vietnam');
    assert.ok(report.verifiedArrVnd > 0);
    assert.ok(report.valuationDcfVnd > report.recommendedAcquisitionPriceVnd);
    assert.ok(report.strategicFitScore >= 90);
    assert.ok(report.termSheetSummary.includes('MicroVAS Vietnam'));
  });

  it('retrieves persistent M&A due diligence reports cleanly', () => {
    const list = listDueDiligenceAudits();
    assert.ok(list.length >= 1);
  });
});
