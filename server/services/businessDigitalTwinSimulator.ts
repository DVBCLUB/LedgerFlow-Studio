/**
 * businessDigitalTwinSimulator.ts
 * ============================================================
 * Business Digital Twin & Monte Carlo Simulator for LedgerFlow OS.
 *
 * Runs 1,000–10,000 Monte Carlo iterations simulating:
 *  - Cashflow & Runway (Days until cash depletion)
 *  - AI Token Budget & Cloud Costs
 *  - Customer Churn vs MRR Growth
 *  - Operational Bottlenecks 30–60 days in advance
 *
 * Provides actionable Proactive Interventions for AI CFO & Marketer.
 */

import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { ensureRuntimeRootSync, resolveRuntimePathFromEnv } from './runtimePaths.ts';
import { appendAuditEvent } from './auditLog.ts';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DigitalTwinSimulationParams {
  iterations?: number;           // Default: 1000 (max 10000)
  timeframeDays?: number;        // Default: 60 (30 to 180)
  currentCashUSD?: number;       // Default: $50,000
  monthlyRevenueUSD?: number;    // Default: $12,000
  monthlyBurnUSD?: number;       // Default: $15,000
  apiTokenBudgetUSD?: number;    // Default: $1,500
  churnRateMonthly?: number;     // Default: 0.05 (5%)
  userGrowthMonthly?: number;    // Default: 0.08 (8%)
}

export interface OperationalBottleneck {
  day: number;
  type: 'cashflow' | 'api_token_budget' | 'customer_churn' | 'cloud_infrastructure';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  probability: number;
  description: string;
  recommendedIntervention: string;
}

export interface DigitalTwinSimulationResult {
  id: string;
  iterations: number;
  timeframeDays: number;
  medianRunwayDays: number;
  probOutOfCash60Days: number;
  probTokenBudgetExceeded30Days: number;
  projectedMRR60Days: number;
  bottlenecks: OperationalBottleneck[];
  simulatedAt: string;
}

interface SimulationStore {
  simulations: Record<string, DigitalTwinSimulationResult>;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

let store: SimulationStore = { simulations: {} };
let writeQueue = Promise.resolve();

function storagePath(): string {
  return resolveRuntimePathFromEnv('DIGITAL_TWIN_SIM_FILE', 'digital_twin_simulations.json');
}

async function loadStore(): Promise<void> {
  try {
    const filePath = storagePath();
    if (fs.existsSync(filePath)) {
      const parsed = JSON.parse(await fs.promises.readFile(filePath, 'utf8'));
      store = { simulations: parsed.simulations || {} };
    }
  } catch {
    store = { simulations: {} };
  }
}

async function saveStore(): Promise<void> {
  ensureRuntimeRootSync();
  const target = storagePath();
  await fs.promises.writeFile(target, JSON.stringify(store, null, 2), 'utf8');
}

function queueSave(): void {
  const task = () => saveStore().catch(() => undefined);
  writeQueue = writeQueue.then(task, task);
}

loadStore().catch(() => undefined);

// ─── Random Number Generators ─────────────────────────────────────────────────

/** Gaussian normal distribution sample using Box-Muller transform */
function randomGaussian(mean: number, stdDev: number): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + num * stdDev;
}

// ─── Core Monte Carlo Engine ──────────────────────────────────────────────────

/**
 * Runs a Monte Carlo Business Digital Twin simulation.
 */
export async function runBusinessDigitalTwinSimulation(
  params: DigitalTwinSimulationParams = {}
): Promise<DigitalTwinSimulationResult> {
  const simId = `sim_${Date.now()}_${randomUUID().slice(0, 6)}`;
  const iterations = Math.min(10_000, Math.max(100, params.iterations ?? 1000));
  const timeframeDays = Math.min(180, Math.max(30, params.timeframeDays ?? 60));

  const currentCash = params.currentCashUSD ?? 50_000;
  const baseRevenue = params.monthlyRevenueUSD ?? 12_000;
  const baseBurn = params.monthlyBurnUSD ?? 15_000;
  const tokenBudget = params.apiTokenBudgetUSD ?? 1_500;
  const baseChurn = params.churnRateMonthly ?? 0.05;
  const baseGrowth = params.userGrowthMonthly ?? 0.08;

  let outOfCash60Count = 0;
  let tokenBudgetExceededCount = 0;
  const runwayResults: number[] = [];
  const finalMRRResults: number[] = [];

  for (let i = 0; i < iterations; i++) {
    let cash = currentCash;
    let mrr = baseRevenue;
    let totalTokenCost = 0;
    let ranOutOfCashDay = timeframeDays + 365;

    for (let day = 1; day <= timeframeDays; day++) {
      // Monthly parameter variations (scaled daily)
      const dailyGrowthRate = randomGaussian(baseGrowth / 30, 0.002);
      const dailyChurnRate = Math.max(0, randomGaussian(baseChurn / 30, 0.001));
      const dailyTokenCost = Math.max(0, randomGaussian((tokenBudget / 30), (tokenBudget / 30) * 0.25));

      mrr = Math.max(0, mrr * (1 + dailyGrowthRate - dailyChurnRate));
      const dailyBurn = (baseBurn / 30) + dailyTokenCost;
      const dailyNetIncome = (mrr / 30) - dailyBurn;

      cash += dailyNetIncome;
      totalTokenCost += dailyTokenCost;

      if (cash <= 0 && ranOutOfCashDay > timeframeDays + 365) {
        ranOutOfCashDay = day;
      }
    }

    if (cash <= 0 || ranOutOfCashDay <= 60) {
      outOfCash60Count++;
    }

    if (totalTokenCost > tokenBudget * (timeframeDays / 30)) {
      tokenBudgetExceededCount++;
    }

    runwayResults.push(ranOutOfCashDay);
    finalMRRResults.push(mrr);
  }

  // Calculate metrics
  runwayResults.sort((a, b) => a - b);
  finalMRRResults.sort((a, b) => a - b);

  const medianRunwayDays = runwayResults[Math.floor(iterations / 2)] || 180;
  const probOutOfCash60Days = Math.round((outOfCash60Count / iterations) * 100) / 100;
  const probTokenBudgetExceeded30Days = Math.round((tokenBudgetExceededCount / iterations) * 100) / 100;
  const projectedMRR60Days = Math.round(finalMRRResults[Math.floor(iterations / 2)] || baseRevenue);

  // Identify Operational Bottlenecks
  const bottlenecks: OperationalBottleneck[] = [];

  if (probOutOfCash60Days > 0.20) {
    bottlenecks.push({
      day: Math.min(medianRunwayDays, 60),
      type: 'cashflow',
      severity: probOutOfCash60Days > 0.50 ? 'CRITICAL' : 'HIGH',
      probability: probOutOfCash60Days,
      description: `Runway warning: ${(probOutOfCash60Days * 100).toFixed(0)}% chance of cash depletion within 60 days.`,
      recommendedIntervention: 'AI CFO: Cut non-essential server costs and accelerate annual subscription billing.',
    });
  }

  if (probTokenBudgetExceeded30Days > 0.25) {
    bottlenecks.push({
      day: 30,
      type: 'api_token_budget',
      severity: probTokenBudgetExceeded30Days > 0.50 ? 'HIGH' : 'MEDIUM',
      probability: probTokenBudgetExceeded30Days,
      description: `Token budget warning: ${(probTokenBudgetExceeded30Days * 100).toFixed(0)}% probability of exceeding AI API token budget ($${tokenBudget}).`,
      recommendedIntervention: 'AI Dev: Enable Ollama local fallback for non-critical agent background loops.',
    });
  }

  if (baseChurn > baseGrowth) {
    bottlenecks.push({
      day: 45,
      type: 'customer_churn',
      severity: 'HIGH',
      probability: 0.85,
      description: `Negative net growth: Monthly churn (${(baseChurn * 100).toFixed(1)}%) exceeds new user acquisition (${(baseGrowth * 100).toFixed(1)}%).`,
      recommendedIntervention: 'AI Marketer: Launch automated win-back campaign and offer onboarding support.',
    });
  }

  const result: DigitalTwinSimulationResult = {
    id: simId,
    iterations,
    timeframeDays,
    medianRunwayDays,
    probOutOfCash60Days,
    probTokenBudgetExceeded30Days,
    projectedMRR60Days,
    bottlenecks,
    simulatedAt: new Date().toISOString(),
  };

  store.simulations[simId] = result;
  queueSave();

  await appendAuditEvent({
    actor: 'digital-twin-simulator',
    workspace: 'AI-Ops',
    action: 'digital_twin.simulated',
    target: simId,
    risk: bottlenecks.some((b) => b.severity === 'CRITICAL') ? 'HIGH' : 'LOW',
    status: 'executed',
    summary: `Monte Carlo simulation ${simId} (${iterations} runs): ${bottlenecks.length} bottlenecks detected.`,
    evidence: { simId, medianRunwayDays, probOutOfCash60Days, bottlenecksCount: bottlenecks.length },
  }).catch(() => undefined);

  return result;
}

/**
 * Gets simulation result by ID.
 */
export function getDigitalTwinSimulation(id: string): DigitalTwinSimulationResult | null {
  return store.simulations[id] || null;
}

/**
 * Lists recent simulation runs.
 */
export function listDigitalTwinSimulations(limit = 10): DigitalTwinSimulationResult[] {
  return Object.values(store.simulations)
    .sort((a, b) => b.simulatedAt.localeCompare(a.simulatedAt))
    .slice(0, limit);
}
