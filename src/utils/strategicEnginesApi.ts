/**
 * src/utils/strategicEnginesApi.ts
 * Frontend client cho các engine (route /api/dormant/*):
 *  - autonomousOkrEngine (OKR)
 *  - multiTenantOnboardingEngine (onboarding)
 *  - semanticRagSearchEngine (RAG search)
 *  - techDebtMigrationEngine (tech debt)
 */

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

// ── Autonomous OKR ───────────────────────────────────────────────
export interface KeyResult {
  krId: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  progressPercent: number;
  ownerAgent: string;
  status: 'on_track' | 'at_risk' | 'behind' | 'achieved';
  confidenceScorePercent: number;
}
export interface OkrSystemData {
  quarter: string;
  companyHealthScorePercent: number;
  totalObjectives: number;
  onTrackRatioPercent: number;
  objectives: Array<{
    id: string;
    title: string;
    level: string;
    overallProgressPercent: number;
    keyResults: KeyResult[];
    aiHealthAssessment: string;
    recoveryPlanSuggested?: string;
  }>;
  lastWeeklyCheckAt: string;
}
export interface OkrCheckResult {
  success: boolean;
  checkId: string;
  updatedHealthScore: number;
  atRiskCount: number;
  recommendations: string[];
  auditedAt: string;
}

export function getOkrSystemData(): Promise<OkrSystemData> {
  return request<{ success: boolean } & OkrSystemData>('/api/dormant/okr/objectives');
}
export function runOkrWeeklyCheck(): Promise<OkrCheckResult> {
  return request<{ success: boolean } & OkrCheckResult>('/api/dormant/okr/audit-weekly', { method: 'POST' });
}

// ── Multi-Tenant Onboarding ──────────────────────────────────────
export interface OnboardingPipelineData {
  pipeline: Array<{
    tenantId: string;
    tenantName: string;
    plan: string;
    progressPercent: number;
    steps: Array<{ id: string; label: string; status: 'done' | 'in_progress' | 'pending'; completedAt: string | null }>;
    assignedCsmAgent: string;
    startedAt: string;
    estimatedCompletionAt: string;
  }>;
  averageCompletionDays: number;
  completionRatePercent: number;
  activeTenants: number;
}
export interface OnboardingLaunchResult {
  success: boolean;
  tenantId: string;
  workspaceUrl: string;
  aiWelcomeCallScheduledAt: string;
  dataImportJobId: string;
  onboardingSequenceId: string;
}

export function getOnboardingPipeline(): Promise<OnboardingPipelineData> {
  return request<{ success: boolean } & OnboardingPipelineData>('/api/dormant/onboarding/pipeline');
}
export function launchOnboarding(tenantId: string): Promise<OnboardingLaunchResult> {
  return request<{ success: boolean } & OnboardingLaunchResult>('/api/dormant/onboarding/launch', {
    method: 'POST',
    body: JSON.stringify({ tenantId }),
  });
}

// ── Semantic RAG Search ──────────────────────────────────────────
export interface RagIndexStats {
  totalDocuments: number;
  totalChunks: number;
  lastReindexedAt: string;
  indexSizeKb: number;
  topCorpora: { corpus: string; docs: number }[];
  avgQueryLatencyMs: number;
}
export interface SemanticSearchResult {
  query: string;
  results: { docId: string; title: string; corpus: string; relevanceScore: number; snippet: string }[];
  hybridScoreUsed: boolean;
  totalFound: number;
  queryTimeMs: number;
}

export function getSemanticSearchData(): Promise<RagIndexStats> {
  return request<{ success: boolean } & RagIndexStats>('/api/dormant/rag-search/index');
}
export function semanticSearch(query: string, corpus?: string): Promise<SemanticSearchResult> {
  return request<{ success: boolean } & SemanticSearchResult>('/api/dormant/rag-search/query', {
    method: 'POST',
    body: JSON.stringify({ query, corpus }),
  });
}

// ── Tech Debt Migration ──────────────────────────────────────────
export interface TechDebtReportData {
  codebaseHealthScorePercent: number;
  totalDebtHoursEstimated: number;
  totalVulnerabilitiesCount: number;
  debtItems: Array<{
    id: string;
    category: string;
    name: string;
    urgency: 'high' | 'medium' | 'low';
    estimatedEffortHours: number;
    roiScore: number;
    autoFixAvailable: boolean;
  }>;
  lastScanTimestamp: string;
}

export function getTechDebtReport(): Promise<TechDebtReportData> {
  return request<{ success: boolean } & TechDebtReportData>('/api/dormant/tech-debt/report');
}
export function generateMigrationRoadmap(): Promise<Record<string, unknown>> {
  return request<{ success: boolean } & Record<string, unknown>>('/api/dormant/tech-debt/generate-roadmap', { method: 'POST' });
}
