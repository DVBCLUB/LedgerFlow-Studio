/**
 * src/utils/treasuryApi.ts
 * Frontend client cho Treasury & Zero-Touch Commerce Loop.
 * Mọi request qua backend API.
 */

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

export interface CashflowPathStats {
  p10: number;
  p50: number;
  p90: number;
  var99: number;
  cvar99: number;
  survivalProbability: number;
  runwayMonthsMedian: number;
}

export function runMonteCarlo(params?: unknown, config?: unknown): Promise<{ success: boolean; stats: CashflowPathStats }> {
  return request<{ success: boolean; stats: CashflowPathStats }>('/api/treasury/monte-carlo', {
    method: 'POST',
    body: JSON.stringify({ params, config }),
  });
}

export interface WorkingCapitalPlan {
  cccDays: number;
  optimizedCccDays: number;
  recommended: { dioDays: number; dsoDays: number; dpoDays: number };
  freedCashVnd: number;
  supplierRiskPenalty: number;
}

export function optimizeWorkingCapital(state: Record<string, unknown>): Promise<{ success: boolean; plan: WorkingCapitalPlan }> {
  return request<{ success: boolean; plan: WorkingCapitalPlan }>('/api/treasury/working-capital', {
    method: 'POST',
    body: JSON.stringify(state),
  });
}

export interface SweepDecision {
  sweepAmountVnd: number;
  bufferHeldVnd: number;
  dailyYieldVnd: number;
  instrument: { id: string; name: string; annualRatePercent: number } | null;
  reason: 'excess' | 'insufficient_buffer' | 'no_idle_cash';
}

export function decideSweep(payload: { idleCashVnd: number; cvar99BufferVnd: number; minOperatingCashVnd: number }): Promise<{ success: boolean; decision: SweepDecision }> {
  return request<{ success: boolean; decision: SweepDecision }>('/api/treasury/sweep', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface TreasurySnapshot {
  stress: CashflowPathStats;
  workingCapital: WorkingCapitalPlan;
  sweep: SweepDecision;
  idleCashVnd: number;
  projected10yVnd: number;
  generatedAt: string;
}

export function runTreasuryCycle(input?: Record<string, unknown>): Promise<{ success: boolean; snapshot: TreasurySnapshot }> {
  return request<{ success: boolean; snapshot: TreasurySnapshot }>('/api/treasury/cycle', {
    method: 'POST',
    body: JSON.stringify(input ?? {}),
  });
}

export type LoopStage = 'signal' | 'build' | 'market' | 'sell' | 'invoice' | 'reconcile' | 'tax' | 'done';

export interface LoopRun {
  id: string;
  productId: string;
  stage: LoopStage;
  status: 'running' | 'awaiting_approval' | 'completed' | 'failed';
  gates: Array<{ stage: LoopStage; approved: boolean }>;
  revenueVnd: number;
  costVnd: number;
  marginVnd: number;
  log: string[];
  createdAt: string;
  updatedAt: string;
}

export function startLoop(productId: string): Promise<{ success: boolean; run: LoopRun }> {
  return request<{ success: boolean; run: LoopRun }>('/api/commerce/loop/start', {
    method: 'POST',
    body: JSON.stringify({ productId }),
  });
}

export function advanceLoop(id: string, approve: boolean): Promise<{ success: boolean; run: LoopRun }> {
  return request<{ success: boolean; run: LoopRun }>(`/api/commerce/loop/${encodeURIComponent(id)}/advance`, {
    method: 'POST',
    body: JSON.stringify({ approve }),
  });
}

export function listLoops(): Promise<{ success: boolean; runs: LoopRun[] }> {
  return request<{ success: boolean; runs: LoopRun[] }>('/api/commerce/loop');
}
