/**
 * server/services/geneticPromptMutationEngine.ts
 * ─────────────────────────────────────────────────────────────
 * Trụ Cột 91 — Autonomous Genetic Prompt Mutation Engine
 *
 * Adapter tương thích ngược cho geneticPromptEvolution.ts (engine thật).
 * Giữ nguyên tên export + hình dạng interface cũ để không phá các nơi
 * import hiện hữu (dormantServicesRouter, sentientEnterprisePhase7.test).
 */

import { evolvePromptsForRole, getPromptEvolutionSummary, getRunHistory } from './geneticPromptEvolution.ts';
import type { PromptGenome } from './geneticPromptEvolution.ts';

export interface PromptGenerationRecord {
  agentName: string;
  generationNumber: number;
  fitnessScorePercent: number;
  mutationType: 'crossover' | 'adversarial_refinement' | 'few_shot_distillation';
  testedPromptSnippet: string;
  status: 'active_champion' | 'candidate';
}

export interface GeneticPromptData {
  totalGenerationsEvolved: number;
  averageFitnessImprovementPercent: number;
  activeAgentsOptimizedCount: number;
  generations: PromptGenerationRecord[];
  lastEvolutionAt: string;
}

const MUTATION_TYPES = ['crossover', 'adversarial_refinement', 'few_shot_distillation'] as const;

function agentNameToRole(agentName: string): string {
  const n = agentName.toLowerCase();
  if (/(cfo|tax|finance|ke toan|accountant)/.test(n)) return 'finance';
  if (/(sales|proposal|sale)/.test(n)) return 'sales';
  if (/(market|ads|campaign)/.test(n)) return 'marketing';
  if (/(code|dev|engineer|architect)/.test(n)) return 'coding';
  if (/(video|media|content)/.test(n)) return 'media';
  if (/(support|service|care)/.test(n)) return 'support';
  return 'general';
}

function toRecord(g: PromptGenome, role: string, index: number): PromptGenerationRecord {
  return {
    agentName: role,
    generationNumber: g.generation,
    fitnessScorePercent: Math.round(g.fitness * 1000) / 10,
    mutationType: MUTATION_TYPES[index % MUTATION_TYPES.length],
    testedPromptSnippet: g.tokens.join(' ').slice(0, 120),
    status: 'active_champion',
  };
}

export function getGeneticPromptData(): GeneticPromptData {
  const summary = getPromptEvolutionSummary();
  const runs = getRunHistory();
  const generations: PromptGenerationRecord[] = runs.map((r, i) => toRecord(r.champion, r.role, i));
  const averageFitnessImprovementPercent = runs.length
    ? runs.reduce((s, r) => s + Math.max(0, r.improvementPercent), 0) / runs.length
    : 0;

  return {
    totalGenerationsEvolved: summary.totalGenerationsEvolved,
    averageFitnessImprovementPercent: Math.round(averageFitnessImprovementPercent * 10) / 10,
    activeAgentsOptimizedCount: summary.rolesOptimized,
    generations,
    lastEvolutionAt: summary.lastEvolutionAt,
  };
}

export function evolveAgentPromptGeneration(agentName: string) {
  const role = agentNameToRole(agentName);
  const result = evolvePromptsForRole(role);

  return {
    success: true,
    agentName,
    newGeneration: result.champion.generation,
    achievedFitnessPercent: Math.round(result.champion.fitness * 1000) / 10,
    mutationDiff: `Tối ưu prompt vai "${role}" qua ${result.generationsRun} thế hệ. Fitness trung bình: ${result.initialAvgFitness.toFixed(3)} → ${result.finalAvgFitness.toFixed(3)} (+${result.improvementPercent.toFixed(1)}%).`,
    evolvedAt: new Date().toISOString(),
  };
}
