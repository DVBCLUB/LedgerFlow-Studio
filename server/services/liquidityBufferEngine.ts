/**
 * server/services/liquidityBufferEngine.ts
 * ─────────────────────────────────────────────────────────────
 * Trụ Cột 97 — Liquidity Buffer & Overnight Yield Sweep (REAL engine)
 *
 * Thay thế stub overnightYieldSweepEngine.ts bằng waterfall sweep thật:
 *   buffer = CVaR99(net outflow) + minOperatingCash
 *   A_sweep = max(0, idleCash - buffer)
 *   Y_daily = A_sweep * rate / 365
 */

export type SweepMechanism = 'MMF' | 'reverse_repo' | 'smart_escrow_yield';

export interface SweepInstrument {
  id: string;
  name: string;
  annualRatePercent: number;
  minAmountVnd: number;
  tPlusDays: number; // 0 = thanh khoản tức thì, 1 = qua đêm
  mechanism: SweepMechanism;
}

export type SweepReason = 'excess' | 'insufficient_buffer' | 'no_idle_cash';

export interface SweepDecision {
  sweepAmountVnd: number;
  bufferHeldVnd: number;
  dailyYieldVnd: number;
  instrument: SweepInstrument | null;
  reason: SweepReason;
}

export const DEFAULT_SWEEP_INSTRUMENTS: SweepInstrument[] = [
  { id: 'mmf_vcb', name: 'Vietcombank Overnight MMF', annualRatePercent: 5.5, minAmountVnd: 100_000_000, tPlusDays: 1, mechanism: 'MMF' },
  { id: 'repo_tcb', name: 'Techcombank Reverse Repo', annualRatePercent: 5.2, minAmountVnd: 200_000_000, tPlusDays: 1, mechanism: 'reverse_repo' },
];

export function dailyYieldFor(amountVnd: number, annualRatePercent: number): number {
  return (amountVnd * annualRatePercent) / 100 / 365;
}

/**
 * Quyết định quét lợi suất qua đêm theo quy tắc waterfall:
 *   A_sweep = max(0, idleCash - (cvar99Buffer + minOperatingCash))
 */
export function decideOvernightSweep(
  idleCashVnd: number,
  cvar99BufferVnd: number,
  minOperatingCashVnd: number,
  instruments: SweepInstrument[] = DEFAULT_SWEEP_INSTRUMENTS,
): SweepDecision {
  const bufferHeldVnd = cvar99BufferVnd + minOperatingCashVnd;

  if (idleCashVnd <= 0) {
    return { sweepAmountVnd: 0, bufferHeldVnd, dailyYieldVnd: 0, instrument: null, reason: 'no_idle_cash' };
  }

  const excess = idleCashVnd - bufferHeldVnd;
  if (excess <= 0) {
    return { sweepAmountVnd: 0, bufferHeldVnd, dailyYieldVnd: 0, instrument: null, reason: 'insufficient_buffer' };
  }

  // Chọn instrument lợi suất cao nhất mà mức tối thiểu <= excess.
  const eligible = instruments.filter((i) => i.minAmountVnd <= excess);
  if (eligible.length === 0) {
    return { sweepAmountVnd: 0, bufferHeldVnd, dailyYieldVnd: 0, instrument: null, reason: 'insufficient_buffer' };
  }
  const best = eligible.reduce((a, b) => (b.annualRatePercent > a.annualRatePercent ? b : a), eligible[0]);

  return {
    sweepAmountVnd: Math.floor(excess),
    bufferHeldVnd,
    dailyYieldVnd: dailyYieldFor(excess, best.annualRatePercent),
    instrument: best,
    reason: 'excess',
  };
}
