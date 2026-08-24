import test from 'node:test';
import assert from 'node:assert/strict';
import {
  solveDsgePath,
  cashflowFromPath,
  rollingWindowMin,
  percentile,
  runMonteCarloDsge,
  DEFAULT_DSGE_PARAMS,
} from './monteCarloDsgeEngine.ts';
import { cashConversionCycle, optimizeWorkingCapital } from './workingCapitalOptimizer.ts';
import { dailyYieldFor, decideOvernightSweep } from './liquidityBufferEngine.ts';
import { runTreasuryCycle } from './treasuryController.ts';

test('solveDsgePath - deterministic and finite', () => {
  const shocks = {
    d: [0.01, -0.02, 0.005, 0],
    s: [0.005, 0.01, -0.01, 0],
    m: [0, 0.001, 0, -0.001],
  };
  const a = solveDsgePath(DEFAULT_DSGE_PARAMS, shocks);
  const b = solveDsgePath(DEFAULT_DSGE_PARAMS, shocks);
  assert.deepEqual(a.y, b.y);
  assert.ok(a.y.every((v) => Number.isFinite(v)));
  assert.ok(a.pi.every((v) => Number.isFinite(v)));
  assert.ok(a.i.every((v) => Number.isFinite(v)));
});

test('cashflowFromPath - length matches macro path', () => {
  const shocks = { d: [0, 0, 0], s: [0, 0, 0], m: [0, 0, 0] };
  const macro = solveDsgePath(DEFAULT_DSGE_PARAMS, shocks);
  const cf = cashflowFromPath(DEFAULT_DSGE_PARAMS, macro);
  assert.equal(cf.length, 3);
  assert.ok(cf.every((v) => Number.isFinite(v)));
});

test('rollingWindowMin - returns min of each window', () => {
  assert.deepEqual(rollingWindowMin([3, 1, 4, 1, 5, 9], 3), [1, 1, 1, 1]);
});

test('percentile - nearest-rank', () => {
  assert.equal(percentile([1, 2, 3, 4, 5], 0.5), 3);
  assert.equal(percentile([1, 2, 3, 4, 5], 1.0), 5);
  assert.equal(percentile([], 0.5), 0);
});

test('runMonteCarloDsge - stats are coherent', () => {
  const run = runMonteCarloDsge(undefined, { paths: 500, years: 5, seed: 42 });
  const s = run.stats;
  assert.ok(s.p50 >= s.p10);
  assert.ok(s.p90 >= s.p50);
  assert.ok(s.var99 >= 0);
  assert.ok(s.cvar99 >= s.var99 - 1e-9);
  assert.ok(s.survivalProbability >= 0 && s.survivalProbability <= 1);
  assert.ok(s.runwayMonthsMedian >= 0);
  assert.equal(run.paths.length, 500);
});

test('cashConversionCycle - formula', () => {
  assert.equal(cashConversionCycle(45, 30, 25), 50);
});

test('optimizeWorkingCapital - improves or keeps CCC within bounds', () => {
  const state = { dioDays: 45, dsoDays: 30, dpoDays: 25, inventoryVnd: 2e9, receivablesVnd: 3e9, payablesVnd: 1.5e9, dailyBurnVnd: 5e7 };
  const plan = optimizeWorkingCapital(state);
  assert.ok(plan.optimizedCccDays <= plan.cccDays + 1e-9);
  assert.ok(plan.recommended.dioDays >= 5);
  assert.ok(plan.recommended.dpoDays <= 60);
  assert.ok(plan.freedCashVnd >= 0);
});

test('dailyYieldFor - amount * rate / 365', () => {
  assert.ok(Math.abs(dailyYieldFor(36_500_000_000, 3.65) - 3_650_000) < 1);
});

test('decideOvernightSweep - no idle cash', () => {
  const d = decideOvernightSweep(0, 1e9, 1e9);
  assert.equal(d.reason, 'no_idle_cash');
  assert.equal(d.sweepAmountVnd, 0);
});

test('decideOvernightSweep - insufficient buffer', () => {
  const d = decideOvernightSweep(1e9, 2e9, 1e9);
  assert.equal(d.reason, 'insufficient_buffer');
  assert.equal(d.sweepAmountVnd, 0);
});

test('decideOvernightSweep - sweeps excess into highest-yield instrument', () => {
  const instruments = [
    { id: 'low', name: 'Low', annualRatePercent: 4, minAmountVnd: 0, tPlusDays: 1, mechanism: 'MMF' as const },
    { id: 'high', name: 'High', annualRatePercent: 6, minAmountVnd: 0, tPlusDays: 1, mechanism: 'reverse_repo' as const },
  ];
  const d = decideOvernightSweep(10e9, 1e9, 1e9, instruments);
  assert.equal(d.reason, 'excess');
  assert.equal(d.instrument?.id, 'high');
  assert.ok(d.sweepAmountVnd > 0);
  assert.ok(d.dailyYieldVnd > 0);
});

test('runTreasuryCycle - returns full snapshot', () => {
  const input = {
    workingCapital: { dioDays: 45, dsoDays: 30, dpoDays: 25, inventoryVnd: 2e9, receivablesVnd: 3e9, payablesVnd: 1.5e9, dailyBurnVnd: 5e7 },
    idleCashVnd: 28_400_000_000,
    minOperatingCashVnd: 3_000_000_000,
    monteCarlo: { paths: 200, years: 5, seed: 7 },
  };
  const snap = runTreasuryCycle(input);
  assert.equal(typeof snap.stress.cvar99, 'number');
  assert.equal(typeof snap.workingCapital.freedCashVnd, 'number');
  assert.equal(typeof snap.sweep.sweepAmountVnd, 'number');
  assert.equal(typeof snap.projected10yVnd, 'number');
});
