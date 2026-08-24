/**
 * server/services/treasuryController.ts
 * ============================================================
 * Treasury Controller — điểm điều phối duy nhất cho vốn lưu động tự trị.
 *
 * Chu trình:
 *   1. runMonteCarloDsge   → CVaR99 (buffer thanh khoản).
 *   2. optimizeWorkingCapital → giải phóng tiền (CCC).
 *   3. decideOvernightSweep   → quét phần dư sinh lời qua đêm.
 *
 * Thuần (pure), không I/O — route phụ trách lưu vào business store.
 */

import { runMonteCarloDsge, DEFAULT_DSGE_PARAMS } from './monteCarloDsgeEngine.ts';
import type { DsgeParams, MonteCarloConfig, CashflowPathStats } from './monteCarloDsgeEngine.ts';
import { optimizeWorkingCapital, DEFAULT_BOUNDS } from './workingCapitalOptimizer.ts';
import type { WorkingCapitalState, WorkingCapitalBounds, WorkingCapitalPlan } from './workingCapitalOptimizer.ts';
import { decideOvernightSweep, DEFAULT_SWEEP_INSTRUMENTS } from './liquidityBufferEngine.ts';
import type { SweepDecision, SweepInstrument } from './liquidityBufferEngine.ts';

export interface TreasuryInput {
  dsge?: Partial<DsgeParams>;
  monteCarlo?: Partial<MonteCarloConfig>;
  workingCapital: WorkingCapitalState;
  wcBounds?: WorkingCapitalBounds;
  idleCashVnd: number;
  minOperatingCashVnd: number;
  instruments?: SweepInstrument[];
}

export interface TreasurySnapshot {
  stress: CashflowPathStats;
  workingCapital: WorkingCapitalPlan;
  sweep: SweepDecision;
  idleCashVnd: number;
  projected10yVnd: number;
  generatedAt: string;
}

export function runTreasuryCycle(input: TreasuryInput): TreasurySnapshot {
  const dsgeParams: DsgeParams = { ...DEFAULT_DSGE_PARAMS, ...(input.dsge ?? {}) };
  const mc = runMonteCarloDsge(dsgeParams, input.monteCarlo ?? {});
  const wc = optimizeWorkingCapital(input.workingCapital, input.wcBounds ?? DEFAULT_BOUNDS);
  const sweep = decideOvernightSweep(
    input.idleCashVnd,
    mc.stats.cvar99,
    input.minOperatingCashVnd,
    input.instruments ?? DEFAULT_SWEEP_INSTRUMENTS,
  );

  // Ước lượng dòng tiền 10 năm: lấy tổng dòng tiền trung bình của các path.
  const paths = mc.paths;
  const meanPathSum = paths.length
    ? paths.reduce((s, cf) => s + cf.reduce((a, b) => a + b, 0), 0) / paths.length
    : 0;
  const projected10yVnd = meanPathSum + input.idleCashVnd;

  return {
    stress: mc.stats,
    workingCapital: wc,
    sweep,
    idleCashVnd: input.idleCashVnd,
    projected10yVnd,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Ghi snapshot treasury vào business store (best-effort, lazy import).
 * Dùng type 'knowledge' + kind 'treasury_snapshot' để tránh mở rộng union
 * BusinessEntityType; Finance dashboard lọc theo `kind`.
 */
export async function persistTreasurySnapshot(snapshot: TreasurySnapshot): Promise<boolean> {
  try {
    const { persistAgentResult } = await import('./aiBusinessBridge.ts');
    persistAgentResult({
      type: 'knowledge',
      data: { kind: 'treasury_snapshot', ...snapshot },
      source: 'workflow',
    });
    return true;
  } catch {
    return false;
  }
}
