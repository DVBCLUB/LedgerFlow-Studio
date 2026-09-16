/**
 * glaciaDigitalTwinApi.ts
 * ============================================================
 * Frontend API client for Glacia Digital Twin & Strategy Sandbox Simulator
 * ============================================================
 */

export interface ShadowSimulationResult {
  id: string;
  actionType: string;
  isSafe: boolean;
  riskScore: number;
  safetyScore: number;
  estimatedDurationMs: number;
  estimatedCostUsd: number;
  sideEffects: string[];
  recommendation: 'proceed' | 'proceed_with_caution' | 'block_and_require_ceo_approval';
  simulatedAt: string;
}

export interface BusinessScenarioResult {
  id: string;
  scenarioName: string;
  projectedRevenueChangePercent: number;
  projectedProfitDeltaPercent: number;
  riskLevel: 'low' | 'medium' | 'high';
  confidenceInterval: { min: number; max: number };
  keyInsights: string[];
  simulatedAt: string;
}

export async function simulateShadowAction(
  actionType: string,
  params: Record<string, any> = {}
): Promise<ShadowSimulationResult> {
  const res = await fetch('/api/glacia/digital-twin/shadow-simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actionType, params }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to simulate shadow action');
  }
  return data.result;
}

export async function simulateWhatIfScenario(scenario: {
  name: string;
  priceDeltaPercent?: number;
  churnDeltaPercent?: number;
  marketingSpendMultiplier?: number;
}): Promise<BusinessScenarioResult> {
  const res = await fetch('/api/glacia/digital-twin/what-if', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scenario),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to simulate What-If scenario');
  }
  return data.result;
}

export async function fetchDigitalTwinHistory(): Promise<{
  shadowRuns: ShadowSimulationResult[];
  scenarios: BusinessScenarioResult[];
}> {
  const res = await fetch('/api/glacia/digital-twin/history');
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch Digital Twin history');
  }
  return data.history;
}
