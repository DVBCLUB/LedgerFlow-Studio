import assert from 'node:assert/strict';
import test from 'node:test';
import {
  runSyntheticCustomerFeedbackLoop,
  getSyntheticFeedbackReport,
  listSyntheticFeedbackReports,
} from './syntheticCustomerFeedbackLoop.ts';

test('runSyntheticCustomerFeedbackLoop calculates synthetic NPS and generates backlog tasks', async () => {
  const report = await runSyntheticCustomerFeedbackLoop({
    productModule: 'AI Accounting Workbench',
    sampleSize: 500,
  });

  assert.ok(report.id.startsWith('feedback_'));
  assert.equal(report.productModule, 'AI Accounting Workbench');
  assert.equal(report.sampleSize, 500);
  assert.ok(report.syntheticNPS >= -100 && report.syntheticNPS <= 100);
  assert.ok(report.avgUsabilityScore >= 0 && report.avgUsabilityScore <= 10);
  assert.ok(report.personas.length >= 4);
  assert.ok(report.autoBacklogTasks.length >= 1);

  const retrieved = getSyntheticFeedbackReport(report.id);
  assert.equal(retrieved?.id, report.id);
});

test('listSyntheticFeedbackReports lists recent feedback reports', async () => {
  const list = listSyntheticFeedbackReports(5);
  assert.ok(list.length >= 1);
});
