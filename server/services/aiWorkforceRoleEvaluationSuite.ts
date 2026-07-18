import { randomUUID } from 'node:crypto';

export type EvalRole = 'Accountant' | 'Developer' | 'Marketer' | 'Auditor' | 'RobotPlanner';

export interface EvalScore {
  correctness: number;
  groundedness: number;
  refusal: number;
  toolAccuracy: number;
  costUsd: number;
  latencyMs: number;
}

export interface RoleEvaluation {
  evalId: string;
  role: EvalRole;
  runId?: string;
  timestamp: string;
  score: EvalScore;
  feedback?: string;
}

const EVALUATION_DB: RoleEvaluation[] = [];

export function evaluateRole(role: EvalRole, score: EvalScore, runId?: string, feedback?: string): RoleEvaluation {
  const evaluation: RoleEvaluation = {
    evalId: `eval_${randomUUID()}`,
    role,
    runId,
    timestamp: new Date().toISOString(),
    score,
    feedback
  };
  
  EVALUATION_DB.push(evaluation);
  // Keep last 1000 evaluations
  if (EVALUATION_DB.length > 1000) {
    EVALUATION_DB.shift();
  }
  
  return evaluation;
}

export function getEvaluationStats(role?: EvalRole) {
  const filtered = role ? EVALUATION_DB.filter(e => e.role === role) : EVALUATION_DB;
  if (filtered.length === 0) {
    return { count: 0, avgCorrectness: 0, avgGroundedness: 0, avgRefusal: 0, avgToolAccuracy: 0, totalCost: 0, avgLatency: 0 };
  }
  
  const sum = filtered.reduce((acc, curr) => {
    acc.correctness += curr.score.correctness;
    acc.groundedness += curr.score.groundedness;
    acc.refusal += curr.score.refusal;
    acc.toolAccuracy += curr.score.toolAccuracy;
    acc.costUsd += curr.score.costUsd;
    acc.latencyMs += curr.score.latencyMs;
    return acc;
  }, { correctness: 0, groundedness: 0, refusal: 0, toolAccuracy: 0, costUsd: 0, latencyMs: 0 });

  const count = filtered.length;
  return {
    count,
    avgCorrectness: sum.correctness / count,
    avgGroundedness: sum.groundedness / count,
    avgRefusal: sum.refusal / count,
    avgToolAccuracy: sum.toolAccuracy / count,
    totalCost: sum.costUsd,
    avgLatency: sum.latencyMs / count
  };
}

export function listEvaluations(limit = 50): RoleEvaluation[] {
  return [...EVALUATION_DB].reverse().slice(0, limit);
}
