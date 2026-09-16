/**
 * src/utils/glaciaOmniscientMatrixApi.ts
 * Frontend Client SDK cho Glacia Epoch 12 — The Omniscient Sovereign Matrix & DAVE.
 */

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`Glacia Omniscient Matrix API error: HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

// ── 1. M&A Due Diligence ──
export interface DueDiligenceReport {
  auditId: string;
  targetCompanyName: string;
  claimedArrVnd: number;
  verifiedArrVnd: number;
  techDebtScorePercent: number;
  codeQualityHealthScore: number;
  vasTaxComplianceScore: number;
  ltvToCacRatio: number;
  valuationDcfVnd: number;
  recommendedAcquisitionPriceVnd: number;
  recommendedPriceMultiple: string;
  strategicFitScore: number;
  riskFactors: string[];
  postMergerSynergies: string[];
  termSheetSummary: string;
  auditedAt: string;
}

export async function runDueDiligence(targetCompanyName: string, claimedArrVnd?: number, techStack?: string[]): Promise<DueDiligenceReport> {
  const res = await apiRequest<{ success: boolean; report: DueDiligenceReport }>('/api/glacia/mna/audit', {
    method: 'POST',
    body: JSON.stringify({ targetCompanyName, claimedArrVnd, techStack }),
  });
  return res.report;
}

export async function fetchDueDiligenceAudits(): Promise<DueDiligenceReport[]> {
  const res = await apiRequest<{ success: boolean; audits: DueDiligenceReport[] }>('/api/glacia/mna/audits');
  return res.audits || [];
}

// ── 2. FX Hedging ──
export interface CurrencyRatePair {
  pair: string;
  rate: number;
  dailyChangePercent: number;
  volatilityRisk: string;
}

export interface FxHedgingStrategyReport {
  reportId: string;
  baseCurrency: string;
  internationalExposureUsd: number;
  currencyPairs: CurrencyRatePair[];
  portfolioHedgingPlan: {
    spotAllocationPercent: number;
    forwardContractHedgingPercent: number;
    vietqrCrossBorderSettlementEnabled: boolean;
    recommendedLocalizedPricingUsd: number;
    recommendedLocalizedPricingEur: number;
    recommendedLocalizedPricingJpy: number;
  };
  executiveHedgingInsight: string;
  generatedAt: string;
}

export async function computeFxStrategy(baseCurrency?: string, internationalExposureUsd?: number): Promise<FxHedgingStrategyReport> {
  const res = await apiRequest<{ success: boolean; report: FxHedgingStrategyReport }>('/api/glacia/fx/strategy', {
    method: 'POST',
    body: JSON.stringify({ baseCurrency, internationalExposureUsd }),
  });
  return res.report;
}

export async function fetchFxReports(): Promise<FxHedgingStrategyReport[]> {
  const res = await apiRequest<{ success: boolean; reports: FxHedgingStrategyReport[] }>('/api/glacia/fx/reports');
  return res.reports || [];
}

// ── 3. Node Self-Replication ──
export interface AutonomousNodeDescriptor {
  nodeId: string;
  nodeName: string;
  targetEnvironment: string;
  bundleSizeBytes: number;
  compiledSkillsCount: number;
  cryptographicNodeSignature: string;
  status: string;
  ipAddress: string;
  latencyMs: number;
  deployedAt: string;
}

export interface NodeReplicationTopology {
  totalNodes: number;
  activeNodesCount: number;
  totalBundledSkillsCount: number;
  averageLatencyMs: number;
  nodes: AutonomousNodeDescriptor[];
  lastTopologyUpdateAt: string;
}

export async function replicateNode(targetEnvironment: string, customNodeName?: string): Promise<AutonomousNodeDescriptor> {
  const res = await apiRequest<{ success: boolean; node: AutonomousNodeDescriptor }>('/api/glacia/nodes/replicate', {
    method: 'POST',
    body: JSON.stringify({ targetEnvironment, customNodeName }),
  });
  return res.node;
}

export async function fetchNodeTopology(): Promise<NodeReplicationTopology> {
  const res = await apiRequest<{ success: boolean; topology: NodeReplicationTopology }>('/api/glacia/nodes/topology');
  return res.topology;
}

// ── 4. Customer Success Sentinel ──
export interface CustomerHealthProfile {
  profileId: string;
  customerId: string;
  accountName: string;
  monthlySpendVnd: number;
  daysInactive: number;
  sentimentScore: number;
  churnRiskPercent: number;
  healthCategory: string;
  automatedInterventionPlan: {
    interventionType: string;
    messagePayload: string;
    vietqrRetentionIncentiveVnd: number;
  };
  assessedAt: string;
}

export async function evaluateCustomerHealth(
  customerId: string,
  accountName: string,
  monthlySpendVnd?: number,
  daysInactive?: number,
  sentimentScore?: number
): Promise<CustomerHealthProfile> {
  const res = await apiRequest<{ success: boolean; profile: CustomerHealthProfile }>('/api/glacia/cs/evaluate', {
    method: 'POST',
    body: JSON.stringify({ customerId, accountName, monthlySpendVnd, daysInactive, sentimentScore }),
  });
  return res.profile;
}

export async function fetchCustomerSentinels(): Promise<CustomerHealthProfile[]> {
  const res = await apiRequest<{ success: boolean; sentinels: CustomerHealthProfile[] }>('/api/glacia/cs/sentinels');
  return res.sentinels || [];
}

// ── 5. Spatial Boardroom Matrix ──
export interface SpatialParticipantNode {
  participantId: string;
  name: string;
  role: string;
  avatarType: string;
  position3D: [number, number, number];
  spatialAudioPan: number;
  isSpeaking: boolean;
}

export interface SpatialBoardroomSession {
  sessionId: string;
  roomTopic: string;
  roomStatus: string;
  environmentTheme: string;
  participants: SpatialParticipantNode[];
  floatingHolographicWidgets: Array<{ widgetId: string; title: string; value: string; position3D: [number, number, number] }>;
  createdAt: string;
}

export async function initSpatialBoardroom(roomTopic: string, customParticipantNames?: string[]): Promise<SpatialBoardroomSession> {
  const res = await apiRequest<{ success: boolean; session: SpatialBoardroomSession }>('/api/glacia/boardroom/spatial/init', {
    method: 'POST',
    body: JSON.stringify({ roomTopic, customParticipantNames }),
  });
  return res.session;
}

export async function fetchSpatialBoardrooms(): Promise<SpatialBoardroomSession[]> {
  const res = await apiRequest<{ success: boolean; rooms: SpatialBoardroomSession[] }>('/api/glacia/boardroom/spatial/rooms');
  return res.rooms || [];
}
