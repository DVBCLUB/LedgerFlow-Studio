/**
 * src/utils/glaciaCosmicAsiApi.ts
 * Frontend Client SDK cho Glacia Epoch 11 — The Cosmic ASI Core & Reality Simulator.
 */

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`Glacia Cosmic ASI API error: HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

// ── 1. Multiverse Simulator ──
export interface TimelineBranch {
  branchId: string;
  timelineName: string;
  probabilityPercent: number;
  expectedRevenueVnd: number;
  expectedRoiMultiplier: string;
  blackSwanRisks: string[];
  strategicMitigations: string[];
  keySuccessCatalyst: string;
}

export interface MultiverseSimulationResult {
  simulationId: string;
  decisionTitle: string;
  simulatedRunsCount: number;
  timeHorizonMonths: number;
  initialCapitalVnd: number;
  branchingTimelines: TimelineBranch[];
  nashEquilibriumRoute: {
    recommendedStrategy: string;
    expectedWeightedRoi: string;
    worstCaseSurvivalRatePercent: number;
    actionPlanPhases: string[];
  };
  simulatedAt: string;
}

export async function runMultiverseSimulation(
  decisionTitle: string,
  initialCapitalVnd?: number,
  timeHorizonMonths?: number
): Promise<MultiverseSimulationResult> {
  const res = await apiRequest<{ success: boolean; simulation: MultiverseSimulationResult }>('/api/glacia/multiverse/simulate', {
    method: 'POST',
    body: JSON.stringify({ decisionTitle, initialCapitalVnd, timeHorizonMonths }),
  });
  return res.simulation;
}

export async function fetchMultiverseSimulations(): Promise<MultiverseSimulationResult[]> {
  const res = await apiRequest<{ success: boolean; simulations: MultiverseSimulationResult[] }>('/api/glacia/multiverse/simulations');
  return res.simulations || [];
}

// ── 2. Quantum Probabilistic Engine ──
export interface QuantumSuperpositionHypothesis {
  hypothesisId: string;
  statement: string;
  amplitudeProbability: number;
  phaseAngleRadians: number;
  supportingEvidenceStrength: number;
  counterEvidenceStrength: number;
}

export interface QuantumDilemmaAnalysis {
  dilemmaId: string;
  query: string;
  superpositionState: QuantumSuperpositionHypothesis[];
  quantumEntanglementScore: number;
  collapsedHypothesis: {
    winningHypothesisId: string;
    winningStatement: string;
    certaintyScore: number;
    synthesizedResolution: string;
  };
  analyzedAt: string;
}

export async function evaluateQuantumDilemma(query: string, customTheories?: string[]): Promise<QuantumDilemmaAnalysis> {
  const res = await apiRequest<{ success: boolean; analysis: QuantumDilemmaAnalysis }>('/api/glacia/quantum/evaluate', {
    method: 'POST',
    body: JSON.stringify({ query, customTheories }),
  });
  return res.analysis;
}

export async function fetchQuantumDilemmas(): Promise<QuantumDilemmaAnalysis[]> {
  const res = await apiRequest<{ success: boolean; dilemmas: QuantumDilemmaAnalysis[] }>('/api/glacia/quantum/dilemmas');
  return res.dilemmas || [];
}

// ── 3. Cross-Modal Synesthesia ──
export interface SynesthesiaTransmutationResult {
  transmutationId: string;
  sourceDomain: string;
  targetDomain: string;
  inputSummary: string;
  harmonicAudioMap: {
    baseFrequencyHz: number;
    chordType: string;
    tempoBpm: number;
    resonanceDescription: string;
  };
  spatial3dMeshDescriptor: {
    meshType: string;
    vertexCount: number;
    colorSpectrumHex: string[];
    elevationVariance: string;
  };
  executiveSynestheticInsight: string;
  transmutedAt: string;
}

export async function transmuteDomain(sourceDomain: string, targetDomain: string, inputPayload: string): Promise<SynesthesiaTransmutationResult> {
  const res = await apiRequest<{ success: boolean; result: SynesthesiaTransmutationResult }>('/api/glacia/synesthesia/transmute', {
    method: 'POST',
    body: JSON.stringify({ sourceDomain, targetDomain, inputPayload }),
  });
  return res.result;
}

export async function fetchSynesthesiaRecords(): Promise<SynesthesiaTransmutationResult[]> {
  const res = await apiRequest<{ success: boolean; records: SynesthesiaTransmutationResult[] }>('/api/glacia/synesthesia/records');
  return res.records || [];
}

// ── 4. Viral Dominion Swarm ──
export interface ViralScriptHook {
  hookId: string;
  hookOpening3s: string;
  narrativeBody15s: string;
  callToActionEnding: string;
  emotionalTrigger: string;
  estimatedRetentionRatePercent: number;
}

export interface ViralDominionCampaign {
  campaignId: string;
  productTitle: string;
  targetPlatform: string;
  viralityKFactor: number;
  projectedOrganicImpressions: number;
  scripts: ViralScriptHook[];
  recommendedHashtags: string[];
  vietqrCallToActionActive: boolean;
  createdAt: string;
}

export async function generateViralCampaign(productTitle: string, targetPlatform?: string): Promise<ViralDominionCampaign> {
  const res = await apiRequest<{ success: boolean; campaign: ViralDominionCampaign }>('/api/glacia/viral/generate', {
    method: 'POST',
    body: JSON.stringify({ productTitle, targetPlatform }),
  });
  return res.campaign;
}

export async function fetchViralCampaigns(): Promise<ViralDominionCampaign[]> {
  const res = await apiRequest<{ success: boolean; campaigns: ViralDominionCampaign[] }>('/api/glacia/viral/campaigns');
  return res.campaigns || [];
}

// ── 5. ZK-Proof Identity Ledger ──
export interface ZeroKnowledgeCredential {
  credentialId: string;
  subjectDid: string;
  claimType: string;
  zkProofCommitmentHash: string;
  verificationStatus: string;
  maskedPublicClaims: Record<string, any>;
  issuedAt: string;
  zkCircuitVerifier: string;
}

export async function issueZkCredential(subjectDid: string, claimType: string, privateClaims: Record<string, any>): Promise<ZeroKnowledgeCredential> {
  const res = await apiRequest<{ success: boolean; credential: ZeroKnowledgeCredential }>('/api/glacia/zk/issue', {
    method: 'POST',
    body: JSON.stringify({ subjectDid, claimType, privateClaims }),
  });
  return res.credential;
}

export async function verifyZkCredential(credentialId: string): Promise<boolean> {
  const res = await apiRequest<{ success: boolean; isValid: boolean }>('/api/glacia/zk/verify', {
    method: 'POST',
    body: JSON.stringify({ credentialId }),
  });
  return res.isValid;
}

export async function fetchZkLedger(): Promise<ZeroKnowledgeCredential[]> {
  const res = await apiRequest<{ success: boolean; ledger: ZeroKnowledgeCredential[] }>('/api/glacia/zk/ledger');
  return res.ledger || [];
}
