import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  runShadowExecution,
  runWhatIfScenario,
  getDigitalTwinHistory,
} from './glaciaDigitalTwin.ts';

describe('glaciaDigitalTwin - Digital Twin Sandbox & What-If Simulator', () => {
  it('runs shadow execution and flags dangerous destructive actions', () => {
    const dangerous = runShadowExecution('database_drop_all_tables');
    assert.equal(dangerous.isSafe, false);
    assert.ok(dangerous.riskScore >= 75);
    assert.equal(dangerous.recommendation, 'block_and_require_ceo_approval');

    const safe = runShadowExecution('read_kpi_dashboard');
    assert.equal(safe.isSafe, true);
    assert.ok(safe.safetyScore >= 80);
    assert.equal(safe.recommendation, 'proceed');
  });

  it('runs what-if business strategy scenario with confidence intervals', () => {
    const scenario = runWhatIfScenario({
      name: 'Tăng giá gói Pro 15% và đẩy marketing 1.2x',
      priceDeltaPercent: 15,
      churnDeltaPercent: 1,
      marketingSpendMultiplier: 1.2,
    });

    assert.ok(scenario.id.startsWith('whatif_'));
    assert.ok(typeof scenario.projectedRevenueChangePercent === 'number');
    assert.ok(scenario.confidenceInterval.min < scenario.confidenceInterval.max);
    assert.ok(scenario.keyInsights.length > 0);
  });

  it('retrieves simulation logs and historical runs', () => {
    const history = getDigitalTwinHistory();
    assert.ok(history.shadowRuns.length > 0);
    assert.ok(history.scenarios.length > 0);
  });
});
