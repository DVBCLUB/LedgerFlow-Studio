import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getSystemSOPRunbooks,
  calculateSOPComplianceScore,
  runAutomatedIncidentDrill,
} from './systemStandardOperatingRunbook.ts';

test('systemStandardOperatingRunbook - returns all 5 SOP categories with detailed steps', () => {
  const categories = getSystemSOPRunbooks();
  assert.equal(categories.length, 5);

  const daily = categories.find((c) => c.categoryId === 'sop_daily_cadence');
  assert.ok(daily);
  assert.ok(daily.steps.length >= 3);

  const incident = categories.find((c) => c.categoryId === 'sop_incident_response');
  assert.ok(incident);
  assert.equal(incident.priority, 'CRITICAL');
});

test('systemStandardOperatingRunbook - calculates overall compliance score', () => {
  const compliance = calculateSOPComplianceScore();
  assert.ok(compliance.overallScore >= 90);
  assert.equal(compliance.status, 'EXCELLENT');
  assert.ok(compliance.totalSteps >= 10);
});

test('systemStandardOperatingRunbook - runs automated incident recovery drill successfully', () => {
  const aiDrill = runAutomatedIncidentDrill('ai_provider_outage');
  assert.ok(aiDrill.drillId);
  assert.equal(aiDrill.status, 'SUCCESS');
  assert.ok(aiDrill.recoveryLog.length >= 3);

  const dbDrill = runAutomatedIncidentDrill('database_corruption');
  assert.ok(dbDrill.drillId);
  assert.equal(dbDrill.status, 'SUCCESS');
});
