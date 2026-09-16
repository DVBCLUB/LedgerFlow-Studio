/**
 * costDashboardApi.ts
 * ============================================================
 * API client for Cost Dashboard, 2-Tier Metrics, and Cost Governor.
 */

const API_BASE = 'http://127.0.0.1:3000';

export interface CostSnapshot {
  totalCostUsd: number;
  byAgent: Record<string, { cost: number; calls: number; avgLatencyMs: number }>;
  byModel: Record<string, { cost: number; calls: number; tokens: number }>;
  byRoute: Record<string, { cost: number; calls: number }>;
  byDomain: Record<string, { cost: number; calls: number }>;
  recentRecords: Array<{
    id: string; agent: string; model: string; route: string;
    costUsd: number; latencyMs: number; success: boolean; taskSummary: string; recordedAt: string;
  }>;
  budgets: Array<{ agent: string; monthlyLimitUsd: number; currentUsd: number; resetDay: number; alerts: boolean }>;
  period: { from: string; to: string };
}

export interface DailyCost { date: string; cost: number; calls: number; }

export interface AiRoleUnitEconomics {
  roleId: string;
  roleName: string;
  department: string;
  calls: number;
  tokens: number;
  costUsd: number;
  costVnd: number;
  humanHoursSaved: number;
  valueGeneratedVnd: number;
  netSavingsVnd: number;
  roiMultiplier: number;
}

export interface AiUnitEconomicsSummary {
  periodDays: number;
  totalCalls: number;
  totalTokens: number;
  totalAiCostUsd: number;
  totalAiCostVnd: number;
  humanHoursSaved: number;
  avgHourlyRateVnd: number;
  estimatedHumanCostVnd: number;
  netSavingsVnd: number;
  roiMultiplier: number;
  tierSavingsUsd: number;
  tierSavingsVnd: number;
  byRole: AiRoleUnitEconomics[];
  highlights: Array<{ title: string; desc: string; type: 'success' | 'info' | 'warning' }>;
}

export interface TwoTierMetrics {
  totalRequests: number;
  tierCheapCount: number;
  tierBalancedCount: number;
  tierFlagshipCount: number;
  cacheHitCount: number;
  downgradeCount: number;
  estimatedCostSavedUsd: number;
  cheapTierRatioPct: number;
  cacheHitRatioPct: number;
}

export interface CostGovernorConfig {
  enabled: boolean;
  monthlyCapUsd: number;
  alertThresholdPct: number;
}

export interface BudgetGateResult {
  allowed: boolean;
  reason?: string;
  spentUsd: number;
  capUsd: number;
  agentBudget?: { agent: string; monthlyLimitUsd: number; currentUsd: number; resetDay: number; alerts: boolean };
}

export interface TierDowngradeResult {
  tier: string;
  downgraded: boolean;
  reason?: string;
  spentUsd: number;
  capUsd: number;
  usagePct: number;
  daysRemaining: number;
  dailyBurnRate: number;
  estimatedDaysToExhaustion: number;
}

async function apiGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`);
    const json = await res.json();
    return json?.success ? json.data ?? json.snapshot ?? json.daily ?? json.metrics ?? json.config ?? json.records ?? json.result : null;
  } catch {
    return null;
  }
}

async function apiPost<T>(path: string, body: any): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    return json?.success ? json.data ?? json.config ?? json.result : null;
  } catch {
    return null;
  }
}

async function apiPut<T>(path: string, body: any): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    return json?.success ? json.config : null;
  } catch {
    return null;
  }
}

export async function fetchCostSnapshot(): Promise<CostSnapshot | null> {
  try {
    const res = await fetch(`${API_BASE}/api/cost/snapshot`);
    const json = await res.json();
    return json?.success ? json.snapshot : null;
  } catch {
    return null;
  }
}

export async function fetchDailyCosts(days = 7): Promise<DailyCost[] | null> {
  try {
    const res = await fetch(`${API_BASE}/api/cost/daily?days=${days}`);
    const json = await res.json();
    return json?.success ? json.daily : null;
  } catch {
    return null;
  }
}

export async function fetchTwoTierMetrics(): Promise<TwoTierMetrics | null> {
  try {
    const res = await fetch(`${API_BASE}/api/cost/two-tier/metrics`);
    const json = await res.json();
    return json?.success ? json.metrics : null;
  } catch {
    return null;
  }
}

export async function fetchAiUnitEconomics(days = 30): Promise<AiUnitEconomicsSummary | null> {
  try {
    const res = await fetch(`${API_BASE}/api/cost/unit-economics?days=${days}`);
    const json = await res.json();
    return json?.success ? json.summary : null;
  } catch {
    return null;
  }
}

export async function fetchGovernorConfig(): Promise<CostGovernorConfig | null> {
  try {
    const res = await fetch(`${API_BASE}/api/cost/governor/config`);
    const json = await res.json();
    return json?.success ? json.config : null;
  } catch {
    return null;
  }
}

export async function updateGovernorConfig(config: Partial<CostGovernorConfig>): Promise<CostGovernorConfig | null> {
  return apiPut<CostGovernorConfig>('/api/cost/governor/config', config);
}

export async function checkBudgetGate(agent: string, domain?: string): Promise<BudgetGateResult | null> {
  return apiPost<BudgetGateResult>('/api/cost/governor/check', { agent, domain });
}

export async function evaluateTierDowngrade(requestedTier: string): Promise<TierDowngradeResult | null> {
  return apiPost<TierDowngradeResult>('/api/cost/governor/evaluate-tier', { requestedTier });
}

export async function classifyTask(task: string, userPrompt: string, context = '') {
  return apiPost<any>('/api/ai/two-tier/classify', { task, userPrompt, context });
}

export async function executeTwoTierTask(task: string, userPrompt: string, context = '', model?: string, systemPrompt?: string) {
  return apiPost<any>('/api/ai/two-tier/execute', { task, userPrompt, context, model, systemPrompt });
}
