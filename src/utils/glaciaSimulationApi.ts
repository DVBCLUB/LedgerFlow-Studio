/**
 * glaciaSimulationApi.ts
 * ============================================================
 * GLACIA MONTE CARLO STRATEGY SIMULATION CLIENT SDK
 * ------------------------------------------------------------
 * Connects frontend UI to the Monte Carlo strategy simulation engine:
 *  - fetchSimulationPresets: Load business model archetypes
 *  - runStrategySimulation: Execute 1,000-run stochastic simulation
 * ============================================================
 */

export interface SimulationParams {
  monthlyRevenueBase: number;
  monthlyGrowthRatePct: number;
  monthlyOperatingExpense: number;
  cacUsd: number;
  arpuMonthlyUsd: number;
  monthlyChurnRatePct: number;
  currentCashReserveUsd: number;
  aiStaffEfficiencyMultiplier: number;
  simulationHorizonMonths: number;
  iterationCount?: number;
}

export interface SimulationMonthSnapshot {
  month: number;
  revenueMedian: number;
  revenueP10: number;
  revenueP90: number;
  cashReserveMedian: number;
  cashReserveP10: number;
  cashReserveP90: number;
  activeCustomersMedian: number;
}

export interface SimulationResult {
  id: string;
  runAt: string;
  params: SimulationParams;
  summary: {
    runwayMonthsMedian: number;
    survivalProbability24M: number;
    projectedArr24M: number;
    ltvCacRatio: number;
    cashBreakevenMonth: number | null;
    riskScore: number;
    riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  };
  monthlyProjection: SimulationMonthSnapshot[];
  glaciaStrategicAdvice: {
    verdict: string;
    strengths: string[];
    vulnerabilities: string[];
    top3Actions: string[];
    spokenSummary: string;
  };
  executionDurationMs: number;
}

export interface SimulationPreset {
  id: string;
  name: string;
  description: string;
  params: SimulationParams;
}

async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(endpoint, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => 'Unknown error');
    throw new Error(`API ${endpoint} failed (${res.status}): ${errorBody}`);
  }
  return res.json();
}

export async function fetchSimulationPresets(): Promise<SimulationPreset[]> {
  const res = await apiRequest<{ success: boolean; presets: SimulationPreset[] }>('/api/glacia/simulation/presets');
  return res.presets;
}

export async function runStrategySimulation(params: SimulationParams): Promise<SimulationResult> {
  const res = await apiRequest<{ success: boolean; result: SimulationResult }>('/api/glacia/simulation/run', {
    method: 'POST',
    body: JSON.stringify({ params }),
  });
  return res.result;
}
