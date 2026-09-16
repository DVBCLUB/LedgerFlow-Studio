/**
 * src/utils/glaciaTranscendentOmniApi.ts
 * Frontend Client SDK cho Glacia Epoch 10 — The Transcendent General Omni-Agent & Autonomous Venture Studio.
 */

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`Glacia Transcendent Omni API error: HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

// ── 1. Venture Studio ──
export interface VentureOpportunity {
  opportunityId: string;
  title: string;
  sector: string;
  marketProblem: string;
  proposedSolution: string;
  tamSamSomEstimate: { tamUsd: string; samUsd: string; somYearOneUsd: string };
  competitiveMoat: string;
  recommendedPricingModel: string;
  confidenceScore: number;
}

export interface IncubatedVentureProject {
  ventureId: string;
  opportunity: VentureOpportunity;
  mvpSpecification: {
    coreFeatures: string[];
    techStack: string[];
    estimatedDevDays: number;
  };
  monetizationPlan: {
    tiers: Array<{ tierName: string; priceVnd: number; priceUsd: number; features: string[] }>;
    vietqrPaymentHookEnabled: boolean;
  };
  gtmStrategy: {
    channelPriorities: string[];
    firstMonthTargetUsers: number;
    viralHookDescription: string;
  };
  status: string;
  createdAt: string;
}

export async function discoverOpportunity(sector: string): Promise<VentureOpportunity> {
  const res = await apiRequest<{ success: boolean; opportunity: VentureOpportunity }>('/api/glacia/venture/discover', {
    method: 'POST',
    body: JSON.stringify({ sector }),
  });
  return res.opportunity;
}

export async function incubateVenture(sector: string, customTitle?: string): Promise<IncubatedVentureProject> {
  const res = await apiRequest<{ success: boolean; project: IncubatedVentureProject }>('/api/glacia/venture/incubate', {
    method: 'POST',
    body: JSON.stringify({ sector, customTitle }),
  });
  return res.project;
}

export async function fetchVentures(): Promise<IncubatedVentureProject[]> {
  const res = await apiRequest<{ success: boolean; ventures: IncubatedVentureProject[] }>('/api/glacia/venture/ventures');
  return res.ventures || [];
}

// ── 2. Swarm Role Synthesizer ──
export interface SynthesizedAgentRole {
  roleId: string;
  roleTitle: string;
  domain: string;
  avatarEmoji: string;
  systemPromptPersona: string;
  allowedToolMatrix: string[];
  cognitiveGuardrails: string[];
  memoryPartitionKey: string;
}

export interface MultiAgentDebateConsensus {
  debateId: string;
  topic: string;
  participatingRoles: Array<{ roleId: string; roleTitle: string; avatarEmoji: string }>;
  rounds: Array<{ speakerRoleId: string; speakerRoleTitle: string; argument: string; counterArgumentTarget?: string }>;
  consensusSynthesis: string;
  actionableDecisionForCEO: string;
  completedAt: string;
}

export async function synthesizeRole(roleTitle: string, domain: string): Promise<SynthesizedAgentRole> {
  const res = await apiRequest<{ success: boolean; role: SynthesizedAgentRole }>('/api/glacia/roles/synthesize', {
    method: 'POST',
    body: JSON.stringify({ roleTitle, domain }),
  });
  return res.role;
}

export async function runRoleDebate(topic: string, selectedRoleIds?: string[]): Promise<MultiAgentDebateConsensus> {
  const res = await apiRequest<{ success: boolean; debate: MultiAgentDebateConsensus }>('/api/glacia/roles/debate', {
    method: 'POST',
    body: JSON.stringify({ topic, selectedRoleIds }),
  });
  return res.debate;
}

export async function fetchSynthesizedRoles(): Promise<SynthesizedAgentRole[]> {
  const res = await apiRequest<{ success: boolean; roles: SynthesizedAgentRole[] }>('/api/glacia/roles/list');
  return res.roles || [];
}

// ── 3. Hyper-Dimensional Memory Graph ──
export interface MemoryGraphNode {
  id: string;
  label: string;
  layer: string;
  activationLevel: number;
  dataSummary: string;
}

export interface MemoryGraphEdge {
  sourceId: string;
  targetId: string;
  relation: string;
  weight: number;
}

export interface HyperMemoryGraphState {
  totalNodes: number;
  totalEdges: number;
  clusteringCoefficient: number;
  nodes: MemoryGraphNode[];
  edges: MemoryGraphEdge[];
  lastConsolidatedAt: string;
}

export interface AssociativeQueryResult {
  querySeed: string;
  activatedNodes: MemoryGraphNode[];
  discoveredSynapticPathways: Array<{ from: string; to: string; relation: string; relevance: number }>;
  synthesisInsight: string;
  queryLatencyMs: number;
}

export async function queryGraphMemory(seedConcept: string): Promise<AssociativeQueryResult> {
  const res = await apiRequest<{ success: boolean; result: AssociativeQueryResult }>('/api/glacia/graph/query', {
    method: 'POST',
    body: JSON.stringify({ seedConcept }),
  });
  return res.result;
}

export async function fetchGraphTopology(): Promise<HyperMemoryGraphState> {
  const res = await apiRequest<{ success: boolean; topology: HyperMemoryGraphState }>('/api/glacia/graph/topology');
  return res.topology;
}

// ── 4. Treasury & Growth ──
export interface TreasuryGrowthReport {
  reportId: string;
  totalSavedDollarsUsd: number;
  totalSavedVnd: number;
  monthlyRecurringRevenueVnd: number;
  monthlyBurnRateVnd: number;
  runwayMonths: number;
  financialHealthScore: number;
  roiMultiplier: string;
  budgetAllocations: Array<{ allocationId: string; channel: string; amountVnd: number; expectedReturnMultiplier: string }>;
  generatedAt: string;
}

export async function fetchTreasuryReport(): Promise<TreasuryGrowthReport> {
  const res = await apiRequest<{ success: boolean; report: TreasuryGrowthReport }>('/api/glacia/treasury/report');
  return res.report;
}

export async function allocateBudget(channel: string, amountVnd: number): Promise<TreasuryGrowthReport> {
  const res = await apiRequest<{ success: boolean; report: TreasuryGrowthReport }>('/api/glacia/treasury/allocate', {
    method: 'POST',
    body: JSON.stringify({ channel, amountVnd }),
  });
  return res.report;
}

// ── 5. Holographic Matrix ──
export interface HolographicStreamSession {
  sessionId: string;
  targetClient: string;
  streamStatus: string;
  targetFps: number;
  averageLatencyMs: number;
  frameDropRatePercent: number;
  activeEmotion: string;
  connectedAt: string;
}

export async function startHoloStream(targetClient?: string): Promise<HolographicStreamSession> {
  const res = await apiRequest<{ success: boolean; session: HolographicStreamSession }>('/api/glacia/holo/start', {
    method: 'POST',
    body: JSON.stringify({ targetClient }),
  });
  return res.session;
}

export async function fetchHoloSessions(): Promise<HolographicStreamSession[]> {
  const res = await apiRequest<{ success: boolean; sessions: HolographicStreamSession[] }>('/api/glacia/holo/sessions');
  return res.sessions || [];
}
