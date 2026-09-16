import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  simulateMultiverseDecision,
  listMultiverseSimulations,
} from './glaciaMultiverseSimulator.ts';

describe('Glacia Multiverse Strategy & Reality Simulator (Epoch 11)', () => {
  it('runs 10,000 Monte Carlo runs and branches into 4 distinct timelines', () => {
    const res = simulateMultiverseDecision('Mở rộng LedgerFlow sang dịch vụ kế toán F&B', 100000000, 12);

    assert.ok(res.simulationId.startsWith('sim-multi-'));
    assert.equal(res.simulatedRunsCount, 10000);
    assert.equal(res.branchingTimelines.length, 4);
    assert.ok(res.nashEquilibriumRoute.worstCaseSurvivalRatePercent >= 99);
    assert.ok(res.nashEquilibriumRoute.actionPlanPhases.length >= 3);
  });

  it('retrieves persistent multiverse simulations cleanly', () => {
    const list = listMultiverseSimulations();
    assert.ok(list.length >= 1);
  });
});
