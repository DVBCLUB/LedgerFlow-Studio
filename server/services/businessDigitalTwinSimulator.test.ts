import assert from 'node:assert/strict';
import test from 'node:test';
import {
  runBusinessDigitalTwinSimulation,
  getDigitalTwinSimulation,
  listDigitalTwinSimulations,
} from './businessDigitalTwinSimulator.ts';

test('runBusinessDigitalTwinSimulation produces Monte Carlo simulation metrics', async () => {
  const result = await runBusinessDigitalTwinSimulation({
    iterations: 500,
    timeframeDays: 60,
    currentCashUSD: 50_000,
    monthlyRevenueUSD: 15_000,
    monthlyBurnUSD: 10_000,
  });

  assert.ok(result.id.startsWith('sim_'));
  assert.equal(result.iterations, 500);
  assert.equal(result.timeframeDays, 60);
  assert.ok(result.medianRunwayDays >= 60);
  assert.equal(result.probOutOfCash60Days, 0);

  const retrieved = getDigitalTwinSimulation(result.id);
  assert.equal(retrieved?.id, result.id);
});

test('runBusinessDigitalTwinSimulation detects cashflow bottleneck when burn exceeds revenue', async () => {
  const result = await runBusinessDigitalTwinSimulation({
    iterations: 500,
    timeframeDays: 60,
    currentCashUSD: 2_000,
    monthlyRevenueUSD: 5_000,
    monthlyBurnUSD: 20_000,
  });

  assert.ok(result.probOutOfCash60Days > 0.5);
  assert.ok(result.bottlenecks.some((b) => b.type === 'cashflow'));
});

test('listDigitalTwinSimulations lists recent simulation runs', async () => {
  await runBusinessDigitalTwinSimulation({ iterations: 100 });
  const list = listDigitalTwinSimulations(5);
  assert.ok(list.length >= 1);
});
