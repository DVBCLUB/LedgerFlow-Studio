/**
 * src/utils/enterpriseApi.ts
 * Frontend client cho các engine Enterprise Autonomy (route /api/dormant/*).
 */

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

// ── Agent Red Teaming ────────────────────────────────────────────
export interface RedTeamAttackScenario {
  id: string;
  category: string;
  name: string;
  vectorDescription: string;
  severity: string;
  targetAgent: string;
  defenseStatus: string;
  testPrompt: string;
  guardrailTriggered: string;
}
export interface RedTeamBenchmarkData {
  scenarios: RedTeamAttackScenario[];
  overallRobustnessScorePercent: number;
  totalSimulatedAttacks: number;
  blockedAttacksCount: number;
  safetyTier: string;
  lastSimulationRunAt: string;
}
export function getRedTeamScenarios(): Promise<{ success: boolean } & RedTeamBenchmarkData> {
  return request('/api/dormant/red-team/scenarios');
}
export function runRedTeamSimulation(targetAgentName?: string): Promise<{ success: boolean; simulationId: string; scenariosRunCount: number; passRatePercent: number; vulnerabilitiesFound: number; executiveSummary: string; safetyCertificateId: string; completedAt: string }> {
  return request('/api/dormant/red-team/run-simulation', { method: 'POST', body: JSON.stringify({ targetAgentName }) });
}

// ── AI Board Deck ────────────────────────────────────────────────
export interface BoardDeckSection {
  title: string;
  category: string;
  keyHighlights: string[];
  chartsIncluded: string[];
  slideContentMarkdown: string;
}
export interface BoardDeckData {
  deckTitle: string;
  reportingPeriod: string;
  generatedDate: string;
  mrrVnd: number;
  arrVnd: number;
  netRetentionRatePercent: number;
  burnMultiple: number;
  runwayMonths: number;
  sections: BoardDeckSection[];
  investorSentimentRating: string;
  lastDeckExportedAt: string;
}
export function getBoardDeckSummary(): Promise<{ success: boolean } & BoardDeckData> {
  return request('/api/dormant/board-deck/summary');
}
export function generateBoardDeck(deckType?: string, targetQuarter?: string): Promise<{ success: boolean; deckId: string; deckType: string; totalSlides: number; markdownExport: string; downloadUrl: string; generatedAt: string }> {
  return request('/api/dormant/board-deck/generate', { method: 'POST', body: JSON.stringify({ deckType, targetQuarter }) });
}

// ── Autonomous Escalation ────────────────────────────────────────
export interface EscalationNotification {
  id: string;
  eventId: string;
  type: string;
  summary: string;
  severity: string;
  channels: string[];
  message: string;
  createdAt: string;
  isRead: boolean;
  actionRequired: boolean;
  actionUrl?: string;
}
export interface EscalationThreshold {
  id: string;
  type: string;
  label: string;
  criticalValue: number;
  warningValue: number;
  currentValue: number;
  unit: string;
  lastCheckedAt: string;
  status: string;
}
export interface EscalationDashboard {
  unreadCount: number;
  pendingEscalationCount: number;
  criticalThresholds: number;
  warningThresholds: number;
  lastScan: string;
  recentNotifications: EscalationNotification[];
}
export function getEscalationDashboard(): Promise<{ success: boolean; dashboard: EscalationDashboard }> {
  return request('/api/dormant/escalation/dashboard');
}
export function getEscalationThresholds(): Promise<{ success: boolean; thresholds: EscalationThreshold[] }> {
  return request('/api/dormant/escalation/thresholds');
}
export function scanEscalationThresholds(metrics?: Record<string, number>): Promise<{ success: boolean; result: { scannedAt: string; thresholds: EscalationThreshold[]; alertsFired: number } }> {
  return request('/api/dormant/escalation/scan-thresholds', { method: 'POST', body: JSON.stringify({ metrics }) });
}

// ── Cloud Cost Credits Optimizer ─────────────────────────────────
export interface ProviderCreditStatus {
  id: string;
  providerName: string;
  monthlyBudgetUsd: number;
  usedUsd: number;
  remainingUsd: number;
  usageRatio: number;
  alertStatus: string;
}
export function getCloudCostOptimizer(): Promise<{ success: boolean; providers: ProviderCreditStatus[] }> {
  return request('/api/dormant/cloud-cost-optimizer');
}

// ── Founder Mobile Dashboard ─────────────────────────────────────
export interface MobileDashboardKpi {
  label: string;
  value: number | string;
  delta: number | string;
  trend: string;
  alert: boolean;
}
export interface CohortRow {
  cohort: string;
  d30: number;
  d60: number;
  d90: number;
  ltv: number;
}
export interface MobileDashboardData {
  mrrVnd: number;
  arrVnd: number;
  burnRateVnd: number;
  runwayMonths: number;
  churnRatePercent: number;
  nrr: number;
  activeAccounts: number;
  kpis: MobileDashboardKpi[];
  cohorts: CohortRow[];
  lastRefreshedAt: string;
}
export function getMobileDashboardKpis(): Promise<{ success: boolean } & MobileDashboardData> {
  return request('/api/dormant/mobile-dashboard/kpis');
}
export function triggerMobileAlert(metric: string, threshold?: number): Promise<{ success: boolean; alertId: string; channel: string; message: string; sentAt: string }> {
  return request('/api/dormant/mobile-dashboard/alert', { method: 'POST', body: JSON.stringify({ metric, threshold }) });
}

// ── Search Grounding ─────────────────────────────────────────────
export interface GroundingSource {
  title: string;
  url: string;
  snippet?: string;
}
export interface GroundedAIResponse {
  id: string;
  query: string;
  answer: string;
  answerWithCitations: string;
  sources: GroundingSource[];
  grounded: boolean;
  modelUsed: string;
  timestamp: string;
}
export function groundSearchQuery(query: string): Promise<{ success: boolean; grounding: GroundedAIResponse }> {
  return request('/api/dormant/search-grounding', { method: 'POST', body: JSON.stringify({ query }) });
}

// ── Web Robot Session Guard ──────────────────────────────────────
export interface WebRobotSession {
  id: string;
  robotName: string;
  targetWebUrl: string;
  sessionStatus: string;
  lastKeepAliveAt: string;
  cookieExpiryDays: number;
}
export function getRobotSessions(): Promise<{ success: boolean; sessions: WebRobotSession[] }> {
  return request('/api/dormant/robot-session-guard');
}

// ── AI Contract Intelligence ─────────────────────────────────────
export interface ContractReviewItem {
  contractId: string;
  contractName: string;
  counterparty: string;
  contractType: string;
  effectiveDate: string;
  expirationDate: string;
  contractValueVnd: number;
  riskScore: number;
  status: string;
  redFlags: string[];
  keyObligations: string[];
}
export interface ContractIntelligenceData {
  contracts: ContractReviewItem[];
  totalActiveContracts: number;
  totalContractValueVnd: number;
  averageRiskScore: number;
  contractsExpiringIn30dDays: number;
  lastAuditRunAt: string;
}
export function getContractAudit(): Promise<{ success: boolean } & ContractIntelligenceData> {
  return request('/api/dormant/contracts/audit');
}
export function analyzeContract(contractId: string): Promise<{ success: boolean; contractId: string; riskScore: number; isSafeToSign: boolean; legalSummaryVi: string; detectedClauses: { clause: string; status: string }[]; reviewedAt: string }> {
  return request('/api/dormant/contracts/analyze', { method: 'POST', body: JSON.stringify({ contractId }) });
}

// ── Market Localization ──────────────────────────────────────────
export interface LocalePackage {
  langCode: string;
  langName: string;
  translationCoveragePercent: number;
  taxEngineSupport: boolean;
  currencyCode: string;
  status: string;
}
export interface LocalizationData {
  locales: LocalePackage[];
  totalKeysTranslated: number;
  activeLocaleCount: number;
  lastUpdated: string;
}
export function getMarketLocales(): Promise<{ success: boolean } & LocalizationData> {
  return request('/api/dormant/market-localization/locales');
}
export function translateBatch(targetLang?: string, keys?: string[]): Promise<{ success: boolean; targetLang: string; translatedCount: number; qualityScorePercent: number; completedAt: string }> {
  return request('/api/dormant/market-localization/translate-batch', { method: 'POST', body: JSON.stringify({ targetLang, keys }) });
}

// ── Agent Revenue Sharing ────────────────────────────────────────
export interface SwarmAgentProduct {
  agentId: string;
  name: string;
  creatorName: string;
  monthlyRevenueVnd: number;
  creatorShareVnd: number;
  subscribersCount: number;
  status: string;
}
export interface RevenueSharingData {
  totalCreatorPayoutsYtdVnd: number;
  activePublishedAgentsCount: number;
  platformTakeRatePercent: number;
  agents: SwarmAgentProduct[];
  lastPayoutProcessedAt: string;
}
export function getRevenueSharingSummary(): Promise<{ success: boolean } & RevenueSharingData> {
  return request('/api/dormant/agent-revenue-sharing/summary');
}
export function processAgentPayout(agentId?: string): Promise<{ success: boolean; agentId: string; payoutBatchRef: string; payoutStatus: string; payoutDate: string }> {
  return request('/api/dormant/agent-revenue-sharing/payout', { method: 'POST', body: JSON.stringify({ agentId }) });
}

// ── Data Privacy / PDPA ──────────────────────────────────────────
export interface PiiScanResult {
  storeName: string;
  recordsScanned: number;
  piiItemsDetected: number;
  encryptionStatus: string;
  complianceLevel: string;
}
export interface PrivacyComplianceData {
  complianceStandard: string;
  totalPiiRecordsEncrypted: number;
  dsarRequestsHandled30d: number;
  activeRetentionPolicies: number;
  scanResults: PiiScanResult[];
  lastAuditTimestamp: string;
}
export function getPrivacyAudit(): Promise<{ success: boolean } & PrivacyComplianceData> {
  return request('/api/dormant/privacy-pdpa/audit');
}
export function executeDsar(payload: { requestType?: string; subjectEmail?: string }): Promise<{ success: boolean; requestId: string; subjectEmail: string; requestType: string; status: string; recordsAffected: number; auditLogRef: string; executedAt: string }> {
  return request('/api/dormant/privacy-pdpa/dsar-execute', { method: 'POST', body: JSON.stringify(payload) });
}

// ── Feature Flags & Entitlement ──────────────────────────────────
export interface FeatureFlag {
  flagKey: string;
  name: string;
  enabledTiers: string[];
  rolloutPercent: number;
  status: string;
}
export interface EntitlementData {
  flags: FeatureFlag[];
  totalActiveFlags: number;
  meteredUsageEvents24h: number;
  lastUpdated: string;
}
export function getFeatureFlags(): Promise<{ success: boolean } & EntitlementData> {
  return request('/api/dormant/entitlements/flags');
}
export function checkEntitlement(payload: { userId?: string; flagKey?: string; tier?: string }): Promise<{ success: boolean; userId: string; flagKey: string; hasAccess: boolean; tier: string; checkedAt: string }> {
  return request('/api/dormant/entitlements/check', { method: 'POST', body: JSON.stringify(payload) });
}

// ── No-Code BPA ──────────────────────────────────────────────────
export interface BpaWorkflow {
  workflowId: string;
  name: string;
  triggerEvent: string;
  stepsCount: number;
  assignedAgent: string;
  status: string;
  totalExecutionsCount: number;
  successRatePercent: number;
}
export interface BpaEngineData {
  workflows: BpaWorkflow[];
  totalAutomatedActions24h: number;
  timeSavedHoursMonth: number;
  lastExecutionAt: string;
}
export function getBpaWorkflows(): Promise<{ success: boolean } & BpaEngineData> {
  return request('/api/dormant/no-code-bpa/workflows');
}
export function triggerBpaWorkflow(workflowId?: string, payload?: unknown): Promise<{ success: boolean; workflowId: string; executionId: string; stepsExecuted: number; executionLatencyMs: number; status: string; executedAt: string }> {
  return request('/api/dormant/no-code-bpa/trigger', { method: 'POST', body: JSON.stringify({ workflowId, payload }) });
}
