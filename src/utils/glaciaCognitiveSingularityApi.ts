/**
 * src/utils/glaciaCognitiveSingularityApi.ts
 * Frontend Client SDK cho Glacia Epoch 8 — Cognitive Singularity (Tâm Trí Tự Giác).
 */

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`Glacia Cognitive Singularity API error: HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

// ── 1. Metacognition ──
export interface MetacognitiveAuditResult {
  auditId: string;
  query: string;
  rawConfidence: number;
  calibratedConfidence: number;
  biasesDetected: Array<{ biasType: string; severity: string; affectedStep: number; explanation: string; remedySuggestion: string }>;
  knowledgeGaps: string[];
  cognitiveLoadPercent: number;
  isReasoningSound: boolean;
  selfCritiqueNarrative: string;
  auditedAt: string;
}

export async function auditMetacognition(query: string, steps: any[]): Promise<MetacognitiveAuditResult> {
  const res = await apiRequest<{ success: boolean; audit: MetacognitiveAuditResult }>('/api/glacia/metacog/audit', {
    method: 'POST',
    body: JSON.stringify({ query, steps }),
  });
  return res.audit;
}

export async function fetchMetacognitionAudits(): Promise<MetacognitiveAuditResult[]> {
  const res = await apiRequest<{ success: boolean; audits: MetacognitiveAuditResult[] }>('/api/glacia/metacog/audits');
  return res.audits || [];
}

// ── 2. Theory of Mind ──
export interface StakeholderMentalModel {
  stakeholderId: string;
  name: string;
  role: string;
  emotionalState: { primaryEmotion: string; probableRootCause: string; intensity: number };
  inferredBeliefs: Array<{ topic: string; belief: string; confidence: number }>;
  activeDesires: string[];
  predictedIntentions: Array<{ intention: string; probability: number; supportingEvidence: string }>;
  communicationAdvice: { recommendedDetailLevel: string; suggestedTone: string };
  lastUpdated: string;
}

export async function predictIntention(stakeholderId: string, query: string): Promise<any> {
  const res = await apiRequest<{ success: boolean; prediction: any }>('/api/glacia/tom/predict', {
    method: 'POST',
    body: JSON.stringify({ stakeholderId, query }),
  });
  return res.prediction;
}

export async function fetchStakeholderModels(): Promise<StakeholderMentalModel[]> {
  const res = await apiRequest<{ success: boolean; models: StakeholderMentalModel[] }>('/api/glacia/tom/models');
  return res.models || [];
}

// ── 3. Causal & Counterfactual Reasoning ──
export interface CounterfactualResult {
  analysisId: string;
  observedReality: { metric: string; actualValue: number | string; description: string };
  counterfactualHypothesis: string;
  estimatedAlternativeOutcome: { metric: string; projectedValue: number | string; deltaVsActual: string };
  confidenceInterval: [number, number];
  causalMechanismSummary: string;
  actionableStrategicRule: string;
  analyzedAt: string;
}

export async function run5WhysAnalysis(issue: string): Promise<any> {
  const res = await apiRequest<{ success: boolean; analysis: any }>('/api/glacia/causal/5whys', {
    method: 'POST',
    body: JSON.stringify({ issue }),
  });
  return res.analysis;
}

export async function runCounterfactual(metric: string, actualValue: number, whatIfHypothesis: string): Promise<CounterfactualResult> {
  const res = await apiRequest<{ success: boolean; simulation: CounterfactualResult }>('/api/glacia/causal/counterfactual', {
    method: 'POST',
    body: JSON.stringify({ metric, actualValue, whatIfHypothesis }),
  });
  return res.simulation;
}

export async function fetchCausalAnalyses(): Promise<CounterfactualResult[]> {
  const res = await apiRequest<{ success: boolean; analyses: CounterfactualResult[] }>('/api/glacia/causal/analyses');
  return res.analyses || [];
}

// ── 4. Creative Imagination & Blending ──
export interface ConceptualBlendResult {
  blendId: string;
  conceptA: { name: string; coreTrait: string };
  conceptB: { name: string; coreTrait: string };
  emergentProperties: string[];
  productInnovationConcept: string;
  mvpImplementationPath: string[];
  fitnessScore: number;
  generatedAt: string;
}

export async function generateAnalogy(problem: string, domainHint?: string): Promise<any> {
  const res = await apiRequest<{ success: boolean; analogy: any }>('/api/glacia/creative/analogy', {
    method: 'POST',
    body: JSON.stringify({ problem, domainHint }),
  });
  return res.analogy;
}

export async function blendConcepts(conceptA: any, conceptB: any): Promise<ConceptualBlendResult> {
  const res = await apiRequest<{ success: boolean; blend: ConceptualBlendResult }>('/api/glacia/creative/blend', {
    method: 'POST',
    body: JSON.stringify({ conceptA, conceptB }),
  });
  return res.blend;
}

export async function fetchCreativeBlends(): Promise<ConceptualBlendResult[]> {
  const res = await apiRequest<{ success: boolean; blends: ConceptualBlendResult[] }>('/api/glacia/creative/blends');
  return res.blends || [];
}

// ── 5. Curiosity Explorer ──
export interface CuriosityAgendaReport {
  reportId: string;
  generatedAt: string;
  activeKnowledgeGaps: Array<{ id: string; topicName: string; informationGapDescription: string; status: string }>;
  top3StrategicQuestionsForCEO: Array<{ question: string; whyItMatters: string; suggestedGlaciaAction: string }>;
  serendipitousFindings: Array<{ unexpectedFinding: string; sourceContext: string; potentialValue: string }>;
}

export async function investigateAnomaly(anomaly: string): Promise<any> {
  const res = await apiRequest<{ success: boolean; investigation: any }>('/api/glacia/curiosity/investigate', {
    method: 'POST',
    body: JSON.stringify({ anomaly }),
  });
  return res.investigation;
}

export async function fetchCuriosityReports(): Promise<CuriosityAgendaReport[]> {
  const res = await apiRequest<{ success: boolean; reports: CuriosityAgendaReport[] }>('/api/glacia/curiosity/reports');
  return res.reports || [];
}

// ── 6. Narrative Intelligence ──
export interface NarrativeStory {
  storyId: string;
  title: string;
  audience: string;
  coreMoralOrAction: string;
  fullNarrativeText: string;
  persuasivePowerScore: number;
  generatedAt: string;
}

export async function frameNarrative(dataSummary: string, audience: string, framework?: string): Promise<NarrativeStory> {
  const res = await apiRequest<{ success: boolean; story: NarrativeStory }>('/api/glacia/narrative/frame', {
    method: 'POST',
    body: JSON.stringify({ dataSummary, audience, framework }),
  });
  return res.story;
}

export async function fetchNarratives(): Promise<NarrativeStory[]> {
  const res = await apiRequest<{ success: boolean; stories: NarrativeStory[] }>('/api/glacia/narrative/stories');
  return res.stories || [];
}

// ── 7. Dream Consolidation ──
export interface MorningDreamReport {
  dreamSessionId: string;
  dreamedAt: string;
  totalMemoriesCompacted: number;
  newCrossDomainSynapsesFormed: number;
  replayedEpisodes: Array<{ episodeId: string; sourceEvent: string; replayedAtStage: string; discoveredHiddenConnection: string }>;
  executiveDreamInsightForCEO: string;
  recommendedFocusForToday: string[];
}

export async function triggerDreamConsolidation(trigger?: string): Promise<MorningDreamReport> {
  const res = await apiRequest<{ success: boolean; report: MorningDreamReport }>('/api/glacia/dream/consolidate', {
    method: 'POST',
    body: JSON.stringify({ trigger }),
  });
  return res.report;
}

export async function fetchDreamReports(): Promise<MorningDreamReport[]> {
  const res = await apiRequest<{ success: boolean; reports: MorningDreamReport[] }>('/api/glacia/dream/reports');
  return res.reports || [];
}
