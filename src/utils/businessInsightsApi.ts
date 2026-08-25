/**
 * src/utils/businessInsightsApi.ts
 * Frontend client cho 3 engine nghiệp vụ (route /api/dormant/*):
 *  - subscriptionBillingEngine (billing SaaS)
 *  - predictiveRevenueEngine (dự báo doanh thu)
 *  - weeklyExecutiveReportEngine (báo cáo tuần)
 */

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

// ── Subscription Billing ──────────────────────────────────────────
export interface SubscriptionPlan {
  id: string;
  name: string;
  priceVnd: number;
  billingCycle: 'monthly' | 'quarterly' | 'annual';
  features: string[];
}
export interface Subscription {
  id: string;
  tenantName: string;
  plan: string;
  status: 'active' | 'past_due' | 'suspended' | 'cancelled';
  mrrVnd: number;
  nextBillingDate: string;
  failedAttempts: number;
}
export interface BillingData {
  subscriptions: Subscription[];
  plans: SubscriptionPlan[];
  totalMrrVnd: number;
  pastDueCount: number;
  mrrWaterfall: { label: string; vnd: number }[];
}
export interface ChargeResult {
  success: boolean;
  subscriptionId: string;
  invoiceRef: string;
  amountVnd: number;
  vietQrUrl: string;
  tt78InvoiceId: string;
  processedAt: string;
}
export interface DunningResult {
  success: boolean;
  subscriptionId: string;
  action: 'retried' | 'downgraded' | 'suspended';
  nextAttemptAt: string | null;
  notified: boolean;
}

export function getBillingData(): Promise<BillingData> {
  return request<{ success: boolean } & BillingData>('/api/dormant/billing/subscriptions');
}
export function processCharge(subscriptionId: string): Promise<ChargeResult> {
  return request<{ success: boolean } & ChargeResult>('/api/dormant/billing/charge', {
    method: 'POST',
    body: JSON.stringify({ subscriptionId }),
  });
}
export function processDunning(subscriptionId: string): Promise<DunningResult> {
  return request<{ success: boolean } & DunningResult>('/api/dormant/billing/dunning', {
    method: 'POST',
    body: JSON.stringify({ subscriptionId }),
  });
}

// ── Predictive Revenue ────────────────────────────────────────────
export interface RevenueForecastPoint {
  month: string;
  p10Vnd: number;
  p50Vnd: number;
  p90Vnd: number;
}
export interface PredictiveRevenueData {
  currentArrVnd: number;
  forecastedArrVnd90d: number;
  confidencePercent: number;
  churnRiskPercent: number;
  expansionArrVnd: number;
  forecastPoints: RevenueForecastPoint[];
  keyDrivers: { driver: string; impact: 'positive' | 'negative'; magnitude: string }[];
}
export interface ScenarioResult {
  success: boolean;
  scenarioId: string;
  scenarioName: string;
  inputAssumptions: Record<string, number>;
  impactOnArrVnd: number;
  impactPercent: number;
  recommendedActions: string[];
  simulatedAt: string;
}

export function getPredictiveRevenue(): Promise<PredictiveRevenueData> {
  return request<{ success: boolean } & PredictiveRevenueData>('/api/dormant/predict-revenue/forecast');
}
export function runRevenueScenario(scenario: Record<string, unknown>): Promise<ScenarioResult> {
  return request<{ success: boolean } & ScenarioResult>('/api/dormant/predict-revenue/scenario', {
    method: 'POST',
    body: JSON.stringify(scenario),
  });
}

// ── Weekly Executive Report ───────────────────────────────────────
export interface WeeklyExecutiveReport {
  reportId: string;
  generatedAt: string;
  reportingPeriod: string;
  executiveSummary: string;
  overallHealthScore: number;
  financialMetrics: {
    totalRevenueAttributedVnd: number;
    expansionArrVnd: number;
    nrrRatePercent: number;
    reconciledTransactionsCount: number;
    discrepanciesCount: number;
  };
  aiWorkforceROI: {
    totalAiCostVnd: number;
    totalValueGeneratedVnd: number;
    blendedROI: number;
    humanHoursSaved: number;
    fteEquivalence: number;
  };
  factoryPerformance: Array<{ factoryName: string; outputCount: number; attributedRevenueVnd: number; roi: number }>;
  departmentHealth: Array<{ name: string; score: number; status: string }>;
  upcomingCadence: Array<{ title: string; scheduledTime: string }>;
  markdownContent: string;
}

export function getWeeklyExecutiveReport(): Promise<WeeklyExecutiveReport> {
  return request<{ success: boolean; report: WeeklyExecutiveReport }>(
    '/api/dormant/reports/weekly-executive'
  ).then((r) => r.report);
}
