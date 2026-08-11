import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runComplianceDoctorAudit } from './enterpriseSelfGovernance.ts';

describe('Pillar 1: Enterprise Compliance Doctor 24/7', () => {
  it('scans security policies and VAS accounting compliance rules successfully', () => {
    const report = runComplianceDoctorAudit({ scanSecurity: true, scanAccountingVAS: true });

    assert.equal(report.status, 'COMPLIANT');
    assert.ok(report.complianceScorePercent >= 90);
    assert.ok(report.checks.length >= 4);
    assert.ok(report.autoRemediationPlan.length > 0);
  });
});
