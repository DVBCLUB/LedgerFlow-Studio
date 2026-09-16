/**
 * src/utils/glaciaSweStudioApi.ts
 * Frontend Client SDK cho Glacia Autonomous SWE-Bench, Live Sandbox & Neural Skill Compiler.
 */

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`Glacia SWE Studio API error: HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export interface SweFilePatch {
  filePath: string;
  action: 'modify' | 'create' | 'delete';
  originalContentSnippet?: string;
  patchedContentSnippet: string;
  diffUnified: string;
}

export interface SweBenchmarkResult {
  taskId: string;
  issueTitle: string;
  status: 'diagnosed' | 'patched' | 'verified' | 'failed';
  rootCauseAnalysis: string;
  reproductionTestCode: string;
  patches: SweFilePatch[];
  rollbackSnapshotId: string;
  reliabilityScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  testOutcome: {
    passed: boolean;
    testsRun: number;
    durationMs: number;
  };
  summary: string;
  timestamp: string;
}

export interface SandboxExecutionResult {
  executionId: string;
  environment: string;
  success: boolean;
  returnValue: any;
  logs: Array<{ level: string; message: string; timestamp: string }>;
  durationMs: number;
  memoryUsageKb: number;
  renderedHtml?: string;
  error?: string;
  executedAt: string;
}

export interface CompiledLocalSkill {
  id: string;
  name: string;
  description: string;
  branch: string;
  runtime: string;
  codeTemplate: string;
  parameterSchema: Record<string, any>;
  version: string;
  invocationsCount: number;
  totalTokensSaved: number;
  estimatedDollarSaved: number;
  createdAt: string;
  lastExecutedAt?: string;
  isVerified: boolean;
}

export interface NeuralSkillTreeStats {
  totalSkillsCount: number;
  totalInvocations: number;
  totalTokensSaved: number;
  totalDollarSaved: number;
  branchDistribution: Record<string, number>;
}

// ─── Autonomous SWE-Bench ─────────────────────────────────────

export async function diagnoseAndFixSoftwareIssue(payload: {
  issueTitle: string;
  issueDescription: string;
  affectedFiles?: string[];
  errorTrace?: string;
  applyPatchImmediately?: boolean;
}): Promise<SweBenchmarkResult> {
  const res = await apiRequest<{ success: boolean; result: SweBenchmarkResult }>('/api/glacia/swe/diagnose-and-fix', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.result;
}

export async function fetchSweBenchHistory(): Promise<SweBenchmarkResult[]> {
  const res = await apiRequest<{ success: boolean; history: SweBenchmarkResult[] }>('/api/glacia/swe/bench-history');
  return res.history || [];
}

export async function rollbackSweSnapshot(snapshotId: string): Promise<{ success: boolean; message: string }> {
  const res = await apiRequest<{ success: boolean; message: string }>('/api/glacia/swe/rollback', {
    method: 'POST',
    body: JSON.stringify({ snapshotId }),
  });
  return res;
}

// ─── Live Code Sandbox ────────────────────────────────────────

export async function executeLiveSandbox(payload: {
  code: string;
  environment?: string;
  timeoutMs?: number;
  inputPayload?: Record<string, any>;
}): Promise<SandboxExecutionResult> {
  const res = await apiRequest<{ success: boolean; result: SandboxExecutionResult }>('/api/glacia/sandbox/execute', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.result;
}

// ─── Neural Skill Compiler ────────────────────────────────────

export async function fetchCompiledSkills(branch?: string): Promise<CompiledLocalSkill[]> {
  const query = branch ? `?branch=${encodeURIComponent(branch)}` : '';
  const res = await apiRequest<{ success: boolean; skills: CompiledLocalSkill[] }>(`/api/glacia/skills/compiled${query}`);
  return res.skills || [];
}

export async function executeSkill(skillId: string, params: Record<string, any> = {}): Promise<any> {
  const res = await apiRequest<{ success: boolean; result: any }>('/api/glacia/skills/execute', {
    method: 'POST',
    body: JSON.stringify({ skillId, params }),
  });
  return res.result;
}

export async function fetchNeuralSkillTreeStats(): Promise<NeuralSkillTreeStats> {
  const res = await apiRequest<{ success: boolean; stats: NeuralSkillTreeStats }>('/api/glacia/skills/tree-stats');
  return res.stats;
}
