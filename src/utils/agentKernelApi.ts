/**
 * src/utils/agentKernelApi.ts
 * Frontend client cho Agentic Kernel (mesh metrics, genetic evolution, BFT consensus).
 * Mọi request qua backend API — không gọi provider trực tiếp.
 */

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

export interface MeshMetrics {
  published: number;
  delivered: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  dropRate: number;
}

export interface MeshStatus {
  success: boolean;
  metrics: MeshMetrics;
  subscribers: number;
  logSize: number;
}

export function getMeshMetrics(): Promise<MeshStatus> {
  return request<MeshStatus>('/api/agent/mesh/metrics');
}

export function flushMeshLog(): Promise<{ success: boolean }> {
  return request<{ success: boolean }>('/api/agent/mesh/flush', { method: 'POST' });
}

export interface GeneticGenome {
  id: string;
  agentRole: string;
  tokens: string[];
  fitness: number;
  generation: number;
  metrics: { quality: number; cost: number; latency: number; safety: number; novelty: number };
}

export interface GeneticData {
  success: boolean;
  data: {
    totalGenerationsEvolved: number;
    averageFitnessImprovementPercent: number;
    activeAgentsOptimizedCount: number;
    generations: Array<{ agentName: string; generationNumber: number; fitnessScorePercent: number }>;
    lastEvolutionAt: string;
  };
  summary: { totalGenerationsEvolved: number; rolesOptimized: number; bestFitnessByRole: Record<string, number>; lastEvolutionAt: string };
}

export function getGeneticData(): Promise<GeneticData> {
  return request<GeneticData>('/api/agent/genetic/data');
}

export interface GeneticEvolveResult {
  success: boolean;
  result: {
    role: string;
    champion: GeneticGenome;
    generationsRun: number;
    initialAvgFitness: number;
    finalAvgFitness: number;
    improvementPercent: number;
  };
}

export function evolvePrompts(role: string, maxGenerations?: number): Promise<GeneticEvolveResult> {
  return request<GeneticEvolveResult>('/api/agent/genetic/evolve', {
    method: 'POST',
    body: JSON.stringify({ role, maxGenerations }),
  });
}

export interface BftDecision {
  proposalId: string;
  decided: boolean;
  value: 'approve' | 'reject' | 'no_quorum';
  faultsTolerated: number;
  replicaCount: number;
  quorum: number;
  approveCount: number;
  rejectCount: number;
  approveWeight: number;
  rejectWeight: number;
  totalWeight: number;
  commitLatencyMs: number;
  viewChanges: number;
}

export function runBftConsensus(payload: {
  topic?: string;
  roles?: string[];
  votes?: Array<{ replicaId: string; value: 'approve' | 'reject'; confidence: number }>;
}): Promise<{ success: boolean; decision: BftDecision }> {
  return request<{ success: boolean; decision: BftDecision }>('/api/agent/consensus/bft', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
