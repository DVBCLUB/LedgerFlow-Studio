/**
 * server/services/macroeconomicStressSimulatorEngine.ts
 * ─────────────────────────────────────────────────────────────
 * Trụ Cột 99 — 10-Year Macroeconomic Stress Test Simulator
 *
 * Adapter tương thích ngược cho monteCarloDsgeEngine.ts (engine thật).
 * Giữ nguyên tên export + interface cũ để không phá dormantServicesRouter
 * và sentientEnterprisePhase7.test.ts.
 */

import { runMonteCarloDsge } from './monteCarloDsgeEngine.ts';
import type { DsgeRegime } from './monteCarloDsgeEngine.ts';

export interface StressTestScenario {
  scenarioId: string;
  name: string;
  inflationShockPercent: number;
  interestRateHikeBasisPoints: number;
  fxVolatilityPercent: number;
  projectedRunwayMonths: number;
  balanceSheetSurvivalScore: number;
}

export interface MacroeconomicStressData {
  simulationModel: string;
  stressTestScore: number;
  recommendedHedgingStrategies: string[];
  scenarios: StressTestScenario[];
  lastSimulatedAt: string;
}

interface ScenarioCatalog {
  id: string;
  name: string;
  inflationShockPercent: number;
  interestRateHikeBasisPoints: number;
  fxVolatilityPercent: number;
  regimes: DsgeRegime[];
}

const SCENARIO_CATALOG: ScenarioCatalog[] = [
  {
    id: 'st_01_stagflation',
    name: 'Lạm phát đình đốn (Stagflation Shock)',
    inflationShockPercent: 12,
    interestRateHikeBasisPoints: 400,
    fxVolatilityPercent: 15,
    regimes: [
      { label: 'normal', probStay: 0.90, shockVar: 0.0009 },
      { label: 'recession', probStay: 0.85, shockVar: 0.0064 },
    ],
  },
  {
    id: 'st_02_liquidity_freeze',
    name: 'Đóng băng thanh khoản hệ thống ngân hàng',
    inflationShockPercent: 6,
    interestRateHikeBasisPoints: 200,
    fxVolatilityPercent: 8,
    regimes: [
      { label: 'normal', probStay: 0.94, shockVar: 0.0004 },
      { label: 'recession', probStay: 0.88, shockVar: 0.0025 },
    ],
  },
];

let cached: MacroeconomicStressData | null = null;

function compute(): MacroeconomicStressData {
  const scenarios: StressTestScenario[] = SCENARIO_CATALOG.map((sc) => {
    const run = runMonteCarloDsge(undefined, { paths: 400, years: 10, seed: 20260824 }, sc.regimes);
    return {
      scenarioId: sc.id,
      name: sc.name,
      inflationShockPercent: sc.inflationShockPercent,
      interestRateHikeBasisPoints: sc.interestRateHikeBasisPoints,
      fxVolatilityPercent: sc.fxVolatilityPercent,
      projectedRunwayMonths: Math.round(run.stats.runwayMonthsMedian),
      balanceSheetSurvivalScore: Math.round(run.stats.survivalProbability * 1000) / 10,
    };
  });

  const avgSurvival = scenarios.reduce((s, x) => s + x.balanceSheetSurvivalScore, 0) / scenarios.length;

  return {
    simulationModel: '10-Year DSGE (3-equation New Keynesian) + Markov regime-switching Monte Carlo',
    stressTestScore: Math.round(avgSurvival * 10) / 10,
    recommendedHedgingStrategies: [
      'Duy trì buffer thanh khoản >= CVaR99 dòng tiền 12 tháng (từ Monte Carlo DSGE)',
      'Định giá hợp đồng Enterprise dài hạn với điều khoản trượt giá lạm phát (CPI Indexing)',
    ],
    scenarios,
    lastSimulatedAt: new Date().toISOString(),
  };
}

export function getMacroeconomicStressData(): MacroeconomicStressData {
  if (!cached) cached = compute();
  return cached;
}

export function runMacroStressScenario(scenarioId: string) {
  const sc = SCENARIO_CATALOG.find((s) => s.id === scenarioId) ?? SCENARIO_CATALOG[0];
  const run = runMonteCarloDsge(undefined, { paths: 1000, years: 10, seed: 20260824 }, sc.regimes);
  const totalNet = run.paths.length
    ? run.paths.reduce((s, cf) => s + cf.reduce((a, b) => a + b, 0), 0) / run.paths.length
    : 0;

  return {
    success: true,
    scenarioId: sc.id,
    simulationRunId: 'STRESS-RUN-' + Date.now().toString(36).toUpperCase(),
    balanceSheetRobustnessPercent: Math.round(run.stats.survivalProbability * 1000) / 10,
    projectedCashflowVnd10y: Math.round(totalNet),
    simulatedAt: new Date().toISOString(),
  };
}
