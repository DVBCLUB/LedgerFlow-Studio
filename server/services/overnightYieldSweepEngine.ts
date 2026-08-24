/**
 * server/services/overnightYieldSweepEngine.ts
 * ─────────────────────────────────────────────────────────────
 * Trụ Cột 97 — High-Frequency Cashflow Overnight Yield Sweep
 *
 * Adapter tương thích ngược cho liquidityBufferEngine.ts (engine thật).
 * Giữ nguyên tên export + interface cũ để không phá dormantServicesRouter
 * và sentientEnterprisePhase7.test.ts.
 */

import { runMonteCarloDsge } from './monteCarloDsgeEngine.ts';
import { decideOvernightSweep, dailyYieldFor, DEFAULT_SWEEP_INSTRUMENTS } from './liquidityBufferEngine.ts';

export interface YieldSweepAccount {
  bankName: string;
  accountNumber: string;
  idleBalanceVnd: number;
  sweptYieldEarnedTodayVnd: number;
  annualYieldRatePercent: number;
  sweepMechanism: 'Overnight Money Market Fund (MMF)' | 'Automated Reverse Repo';
  status: 'swept_active' | 'liquid';
}

export interface OvernightYieldData {
  totalIdleCashPoolVnd: number;
  totalAnnualizedYieldVnd: number;
  dailyYieldEarnedVnd: number;
  accounts: YieldSweepAccount[];
  lastSweepProcessedAt: string;
}

const IDLE_CASH_POOL_VND = 28_400_000_000;
const MIN_OPERATING_CASH_VND = 3_000_000_000;

function computeCvarBuffer(): number {
  try {
    return runMonteCarloDsge(undefined, { paths: 300, years: 10, seed: 20260824 }).stats.cvar99;
  } catch {
    return 5_000_000_000;
  }
}

let cachedDecision: ReturnType<typeof decideOvernightSweep> | null = null;

function getDecision() {
  if (!cachedDecision) {
    cachedDecision = decideOvernightSweep(IDLE_CASH_POOL_VND, computeCvarBuffer(), MIN_OPERATING_CASH_VND, DEFAULT_SWEEP_INSTRUMENTS);
  }
  return cachedDecision;
}

export function getOvernightYieldData(): OvernightYieldData {
  const decision = getDecision();
  const half = Math.floor(decision.sweepAmountVnd / 2);

  const accounts: YieldSweepAccount[] = [
    {
      bankName: 'Vietcombank Treasury Hub',
      accountNumber: '...8892',
      idleBalanceVnd: half,
      sweptYieldEarnedTodayVnd: Math.floor(dailyYieldFor(half, DEFAULT_SWEEP_INSTRUMENTS[0].annualRatePercent)),
      annualYieldRatePercent: DEFAULT_SWEEP_INSTRUMENTS[0].annualRatePercent,
      sweepMechanism: 'Overnight Money Market Fund (MMF)',
      status: decision.reason === 'excess' ? 'swept_active' : 'liquid',
    },
    {
      bankName: 'Techcombank Corporate Vault',
      accountNumber: '...4102',
      idleBalanceVnd: decision.sweepAmountVnd - half,
      sweptYieldEarnedTodayVnd: Math.floor(dailyYieldFor(decision.sweepAmountVnd - half, DEFAULT_SWEEP_INSTRUMENTS[1].annualRatePercent)),
      annualYieldRatePercent: DEFAULT_SWEEP_INSTRUMENTS[1].annualRatePercent,
      sweepMechanism: 'Automated Reverse Repo',
      status: decision.reason === 'excess' ? 'swept_active' : 'liquid',
    },
  ];

  return {
    totalIdleCashPoolVnd: IDLE_CASH_POOL_VND,
    totalAnnualizedYieldVnd: Math.floor(decision.dailyYieldVnd * 365),
    dailyYieldEarnedVnd: Math.floor(decision.dailyYieldVnd),
    accounts,
    lastSweepProcessedAt: new Date().toISOString(),
  };
}

export function executeCashflowYieldSweep() {
  const decision = getDecision();
  return {
    success: true,
    sweepBatchId: 'SWEEP-BATCH-' + Date.now().toString(36).toUpperCase(),
    totalSweptVnd: decision.sweepAmountVnd,
    estimatedDailyInterestVnd: Math.floor(decision.dailyYieldVnd),
    autoReturnTime: '08:00:00 GMT+7 (Next Business Day)',
    executedAt: new Date().toISOString(),
  };
}
