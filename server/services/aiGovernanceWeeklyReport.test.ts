import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateWeeklyGovernanceReport, listWeeklyGovernanceReports } from './aiGovernanceWeeklyReport.ts';

describe('aiGovernanceWeeklyReport - Executive Digest', () => {
  it('generates a full weekly governance report with audit and health metrics', () => {
    const report = generateWeeklyGovernanceReport();

    assert.ok(report.reportId.startsWith('rep_gov_'));
    assert.ok(report.workforceHealthScores.length >= 4);
    assert.ok(report.financialMetrics.roiMultiplier > 0);
    assert.equal(typeof report.governanceAudits.boundaryViolationsCount, 'number');
    assert.equal(report.governanceAudits.isCryptographicChainValid, true);
    assert.ok(report.recommendations.length >= 2);

    const past = listWeeklyGovernanceReports();
    assert.ok(past.length >= 1);
  });
});
