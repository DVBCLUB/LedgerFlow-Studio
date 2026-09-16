/**
 * src/utils/glaciaSingularityApi.ts
 * Frontend Client SDK cho Glacia Epoch 6 Singularity OS (7 Frontiers).
 */

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`Glacia Singularity API error: HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

// ── 1. Financial Anomaly Detector ──
export interface FinancialAnomalyAlert {
  id: string;
  transactionId: string;
  voucherNumber?: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  detectedAt: string;
  confidenceScore: number;
  suggestedAction: string;
  feedbackStatus: 'pending' | 'confirmed_fraud' | 'false_positive' | 'approved_exception';
  metadata: Record<string, any>;
}

export interface FinancialRadarStats {
  totalAlertsCount: number;
  criticalCount: number;
  highCount: number;
  pendingCount: number;
  resolvedCount: number;
  anomaliesByType: Record<string, number>;
}

export async function fetchFinancialAlerts(): Promise<FinancialAnomalyAlert[]> {
  const res = await apiRequest<{ success: boolean; alerts: FinancialAnomalyAlert[] }>('/api/glacia/financial/alerts');
  return res.alerts || [];
}

export async function fetchFinancialStats(): Promise<FinancialRadarStats> {
  const res = await apiRequest<{ success: boolean; stats: FinancialRadarStats }>('/api/glacia/financial/stats');
  return res.stats;
}

export async function submitAnomalyFeedback(alertId: string, feedback: string, notes?: string): Promise<any> {
  return apiRequest('/api/glacia/financial/feedback', {
    method: 'POST',
    body: JSON.stringify({ alertId, feedback, notes }),
  });
}

// ── 2. Natural Language Business Workflows ──
export interface BusinessWorkflowRule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  trigger: string;
  cronExpression?: string;
  actions: Array<{ actionId: string; type: string; description: string }>;
  executionCount: number;
  lastRunAt?: string;
  createdAt: string;
}

export async function createWorkflowFromNaturalLanguage(prompt: string): Promise<any> {
  const res = await apiRequest<{ success: boolean; result: any }>('/api/glacia/workflow/from-natural-language', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  });
  return res.result;
}

export async function fetchRegisteredWorkflows(): Promise<BusinessWorkflowRule[]> {
  const res = await apiRequest<{ success: boolean; workflows: BusinessWorkflowRule[] }>('/api/glacia/workflow/list');
  return res.workflows || [];
}

export async function toggleWorkflow(ruleId: string, active?: boolean): Promise<any> {
  return apiRequest('/api/glacia/workflow/toggle', {
    method: 'POST',
    body: JSON.stringify({ ruleId, active }),
  });
}

export async function executeWorkflow(ruleId: string): Promise<any> {
  return apiRequest('/api/glacia/workflow/execute', {
    method: 'POST',
    body: JSON.stringify({ ruleId }),
  });
}

// ── 3. Competitor Intelligence Radar ──
export interface CompetitorProfile {
  id: string;
  name: string;
  category: string;
  domain: string;
  estimatedMarketShare: number;
  swotAnalysis: {
    strengths: string[];
    weaknesses: string[];
    threatToLedgerFlow: string;
    recommendedCounterStrategy: string;
  };
}

export interface CompetitorWeeklyDigest {
  id: string;
  weekNumber: number;
  year: number;
  generatedAt: string;
  competitorsScanned: number;
  pricingChangesDetected: Array<{ competitor: string; tier: string; oldPrice: number; newPrice: number; deltaPercent: number }>;
  notableFeatureReleases: Array<{ competitor: string; feature: string; threatScore: number }>;
  strategicTakeaways: string[];
  recommendedExecutiveActions: string[];
}

export async function fetchCompetitors(): Promise<CompetitorProfile[]> {
  const res = await apiRequest<{ success: boolean; competitors: CompetitorProfile[] }>('/api/glacia/competitor/list');
  return res.competitors || [];
}

export async function fetchCompetitorDigest(): Promise<CompetitorWeeklyDigest> {
  const res = await apiRequest<{ success: boolean; digest: CompetitorWeeklyDigest }>('/api/glacia/competitor/digest');
  return res.digest;
}

// ── 4. Self-Rewriting Code Engine ──
export interface CodeAuditReport {
  id: string;
  auditedAt: string;
  totalFilesScanned: number;
  totalLinesOfCode: number;
  architectureHealthScore: number;
  issuesSummary: {
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
  topRefactorOpportunities: Array<{ targetFile: string; impact: string; effort: string; estimatedPerformanceGain: string }>;
}

export async function fetchCodeAuditReport(): Promise<CodeAuditReport> {
  const res = await apiRequest<{ success: boolean; report: CodeAuditReport }>('/api/glacia/self-audit/report');
  return res.report;
}

export async function triggerCodebaseAudit(): Promise<CodeAuditReport> {
  const res = await apiRequest<{ success: boolean; report: CodeAuditReport }>('/api/glacia/self-audit/run', { method: 'POST' });
  return res.report;
}

export async function generateRefactorPR(payload: { title: string; category: string; targetFiles: string[]; rationale: string }): Promise<any> {
  const res = await apiRequest<{ success: boolean; pr: any }>('/api/glacia/self-audit/create-pr', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.pr;
}

// ── 5. Legal Document AI ──
export async function draftLegalContract(payload: { type: string; partyAName: string; partyBName: string }): Promise<any> {
  const res = await apiRequest<{ success: boolean; contract: any }>('/api/glacia/legal/draft', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.contract;
}

export async function reviewLegalContract(contractText: string): Promise<any> {
  const res = await apiRequest<{ success: boolean; review: any }>('/api/glacia/legal/review', {
    method: 'POST',
    body: JSON.stringify({ contractText }),
  });
  return res.review;
}

// ── 6. Emotion-Aware CEO Companion ──
export interface CEOMoodState {
  stressLevel: number;
  energyLevel: number;
  focusScore: number;
  detectedEmotion: string;
  recommendedResponseStyle: string;
  suggestedWellnessAction?: string;
  evaluatedAt: string;
}

export async function fetchCEOMoodState(): Promise<CEOMoodState> {
  const res = await apiRequest<{ success: boolean; mood: CEOMoodState }>('/api/glacia/mood/state');
  return res.mood;
}

// ── 7. Federated Multi-Brain Sync ──
export interface BrainPeerNode {
  nodeId: string;
  name: string;
  role: string;
  ipAddress: string;
  port: number;
  status: 'online' | 'syncing' | 'offline';
  pingMs: number;
  syncedMemoryCount: number;
  syncedSkillsCount: number;
}

export async function fetchBrainPeers(): Promise<BrainPeerNode[]> {
  const res = await apiRequest<{ success: boolean; peers: BrainPeerNode[] }>('/api/glacia/federation/peers');
  return res.peers || [];
}

export async function triggerFederatedSync(): Promise<any> {
  const res = await apiRequest<{ success: boolean; report: any }>('/api/glacia/federation/sync', { method: 'POST' });
  return res.report;
}
