/**
 * src/utils/financeAccountingApi.ts
 * Frontend client cho các engine Finance & Accounting (route /api/dormant/*).
 */

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

// ── Credit Scoring & Capital ─────────────────────────────────────
export interface CreditProfile {
  businessName: string;
  creditScore: number;
  ratingTier: string;
  approvedWorkingCapitalLimitVnd: number;
  dscrRatio: number;
  liquidityRunwayMonths: number;
}
export interface CreditScoringData {
  averagePortfolioCreditScore: number;
  totalApprovedCapitalPoolVnd: number;
  defaultRatePercent: number;
  profiles: CreditProfile[];
  lastAssessedAt: string;
}
export function getCreditProfiles(): Promise<{ success: boolean } & CreditScoringData> {
  return request('/api/dormant/credit-scoring/profiles');
}
export function calculateCreditScore(payload: { businessName?: string; monthlyRevenueVnd?: number }): Promise<{ success: boolean; businessName: string; creditScore: number; ratingTier: string; approvedLimitVnd: number; suggestedInterestRatePercentAnnual: number; calculatedAt: string }> {
  return request('/api/dormant/credit-scoring/calculate', { method: 'POST', body: JSON.stringify(payload) });
}

// ── Revenue Recognition ──────────────────────────────────────────
export interface RevenueScheduleItem {
  scheduleId: string;
  contractId: string;
  customerName: string;
  totalContractValueVnd: number;
  recognizedRevenueVnd: number;
  deferredRevenueVnd: number;
  recognitionMethod: string;
  startDate: string;
  endDate: string;
  auditTrailHash: string;
}
export interface RevenueRecognitionData {
  schedules: RevenueScheduleItem[];
  totalRecognizedRevenueYtdVnd: number;
  totalDeferredRevenueVnd: number;
  complianceStandard: string;
  monthlyWaterfall: { month: string; recognizedVnd: number; deferredVnd: number }[];
  lastReconciliationAt: string;
}
export function getRevenueSchedules(): Promise<{ success: boolean } & RevenueRecognitionData> {
  return request('/api/dormant/revenue-recognition/schedules');
}
export function calculateRevenueRecognition(contractTotalVnd: number, durationMonths?: number): Promise<{ success: boolean; contractId: string; allocatedSubscriptionMrrVnd: number; allocatedOnboardingRevenueVnd: number; deferredLiabilityVnd: number; ifrsStepAuditNote: string; calculatedAt: string }> {
  return request('/api/dormant/revenue-recognition/calculate', { method: 'POST', body: JSON.stringify({ contractTotalVnd, durationMonths }) });
}

// ── Bi-Directional ERP Sync ──────────────────────────────────────
export interface ErpSyncConnector {
  erpSystem: string;
  syncMode: string;
  recordsSynced24h: number;
  syncHealthPercent: number;
  lastSyncAt: string;
  status: string;
}
export interface ErpSyncData {
  connectors: ErpSyncConnector[];
  totalSyncedTransactionsToday: number;
  averageLatencyMs: number;
  lastHealthCheckAt: string;
}
export function getErpSyncConnectors(): Promise<{ success: boolean } & ErpSyncData> {
  return request('/api/dormant/erp-sync/connectors');
}
export function triggerErpSync(erpSystem?: string): Promise<{ success: boolean; erpSystem: string; syncBatchId: string; recordsProcessed: number; conflictsResolved: number; syncedAt: string }> {
  return request('/api/dormant/erp-sync/trigger-now', { method: 'POST', body: JSON.stringify({ erpSystem }) });
}
