/**
 * src/utils/glaciaGoalsApi.ts
 * Frontend API client for Glacia Goal Decomposition & DAG Task Engine
 */

export type TaskDomain =
  | 'research'
  | 'code'
  | 'marketing'
  | 'accounting'
  | 'design'
  | 'testing'
  | 'deployment'
  | 'review';

export type DAGTaskStatus =
  | 'pending'
  | 'ready'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'skipped';

export interface DAGTaskNode {
  id: string;
  title: string;
  domain: TaskDomain;
  description: string;
  dependencies: string[];
  status: DAGTaskStatus;
  estimatedMinutes: number;
  estimatedTokens: number;
  fallbackPlan?: string;
  assignedRobotOrTool?: string;
  result?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface GoalPlan {
  id: string;
  rawGoal: string;
  title: string;
  description: string;
  tasks: DAGTaskNode[];
  totalEstimatedMinutes: number;
  totalEstimatedTokens: number;
  status: 'planned' | 'in_progress' | 'completed' | 'failed' | 'paused';
  progressPercentage: number;
  createdAt: string;
  updatedAt: string;
  executionLogs: Array<{ timestamp: string; message: string; taskId?: string }>;
}

export async function decomposeNaturalGoal(rawGoal: string): Promise<GoalPlan> {
  const res = await fetch('/api/glacia/goals/decompose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawGoal }),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to decompose goal');
  }
  return data.plan;
}

export async function advanceGoalStep(goalId: string, taskId?: string): Promise<GoalPlan> {
  const res = await fetch('/api/glacia/goals/advance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goalId, taskId }),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to advance goal step');
  }
  return data.plan;
}

export async function fetchGoalPlans(): Promise<GoalPlan[]> {
  const res = await fetch('/api/glacia/goals/list');
  const data = await res.json();
  return data.goals || [];
}
