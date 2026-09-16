import test from 'node:test';
import assert from 'node:assert/strict';
import {
  runMonteCarloStrategySimulation,
  PRESET_SCENARIOS,
} from './glaciaStrategySimulationEngine.ts';

test('glaciaStrategySimulationEngine - PRESET_SCENARIOS contains 4 distinct business models', () => {
  assert.equal(PRESET_SCENARIOS.length, 4);
  const ids = PRESET_SCENARIOS.map((p) => p.id);
  assert.ok(ids.includes('bootstrap_frugal'));
  assert.ok(ids.includes('ai_swarm_dominance'));
});

test('glaciaStrategySimulationEngine - runMonteCarloStrategySimulation produces valid 24-month projection', async () => {
  const result = await runMonteCarloStrategySimulation({
    monthlyRevenueBase: 15000,
    monthlyGrowthRatePct: 10,
    monthlyOperatingExpense: 5000,
    cacUsd: 200,
    arpuMonthlyUsd: 99,
    monthlyChurnRatePct: 2.0,
    currentCashReserveUsd: 100000,
    aiStaffEfficiencyMultiplier: 3.0,
    simulationHorizonMonths: 24,
    iterationCount: 200,
  });

  assert.ok(result.id.startsWith('sim-'));
  assert.equal(result.monthlyProjection.length, 24);
  assert.ok(result.summary.survivalProbability24M >= 50);
  assert.ok(result.summary.projectedArr24M > 0);
  assert.ok(result.summary.ltvCacRatio > 0);
  assert.ok(result.glaciaStrategicAdvice.verdict.length > 10);
  assert.ok(result.glaciaStrategicAdvice.top3Actions.length === 3);
});
