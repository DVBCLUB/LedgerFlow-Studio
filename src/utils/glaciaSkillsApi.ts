/**
 * src/utils/glaciaSkillsApi.ts
 * Frontend Client SDK cho Glacia Skill Compiler & Local Runtime ($0 Token).
 */

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`Glacia Skills API error: HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export interface GlaciaSkill {
  id: string;
  name: string;
  category: 'media' | 'finance' | 'coding' | 'marketing' | 'system';
  description: string;
  runtime: 'node' | 'python' | 'shell';
  scriptCode: string;
  executionCount: number;
  tokensSavedTotal: number;
  lastExecutedAt?: string;
  avgDurationMs: number;
  isBuiltIn: boolean;
  status: 'ready' | 'compiling' | 'error';
}

export interface SkillExecutionResult {
  success: boolean;
  skillId: string;
  output: string;
  durationMs: number;
  tokensSaved: number;
  message: string;
  executedAt: string;
}

export interface SkillMetrics {
  totalSkills: number;
  totalExecutions: number;
  totalTokensSaved: number;
  moneySavedVnd: number;
  autonomyLevelPct: number;
}

export async function fetchGlaciaSkills(): Promise<GlaciaSkill[]> {
  const res = await apiRequest<{ success: boolean; skills: GlaciaSkill[] }>('/api/glacia/skills/list');
  return res.skills;
}

export async function compileNewSkill(payload: {
  name: string;
  category: GlaciaSkill['category'];
  description: string;
  runtime?: 'node' | 'python' | 'shell';
  scriptCode: string;
}): Promise<GlaciaSkill> {
  const res = await apiRequest<{ success: boolean; skill: GlaciaSkill }>('/api/glacia/skills/compile', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.skill;
}

export async function executeGlaciaSkill(skillId: string): Promise<SkillExecutionResult> {
  const res = await apiRequest<{ success: boolean; result: SkillExecutionResult }>('/api/glacia/skills/execute', {
    method: 'POST',
    body: JSON.stringify({ skillId }),
  });
  return res.result;
}

export async function fetchSkillMetrics(): Promise<SkillMetrics> {
  const res = await apiRequest<{ success: boolean; metrics: SkillMetrics }>('/api/glacia/skills/metrics');
  return res.metrics;
}
