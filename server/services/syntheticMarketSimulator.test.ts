import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  runSyntheticCustomerFeedbackLoop,
  getSyntheticFeedbackReport,
  listSyntheticFeedbackReports,
} from './syntheticCustomerFeedbackLoop.ts';

describe('Synthetic Customer & Market Simulator', () => {
  it('runs synthetic market simulation over ICP personas', async () => {
    const report = await runSyntheticCustomerFeedbackLoop({
      productModule: 'MCP Gateway & AI Company OS Suite',
      sampleSize: 300,
    });

    assert.ok(report.id.startsWith('feedback_'));
    assert.equal(report.sampleSize, 300);
    assert.ok(typeof report.syntheticNPS === 'number');
    assert.ok(report.personas.length > 0);
    assert.ok(report.autoBacklogTasks.length > 0);

    const fetched = getSyntheticFeedbackReport(report.id);
    assert.ok(fetched);
    assert.equal(fetched?.id, report.id);

    const list = listSyntheticFeedbackReports();
    assert.ok(list.length >= 1);
  });
});
