/**
 * softwareFactoryPipelineApi.ts
 * ============================================================
 * Frontend SDK for Glacia Software Factory Autonomous Pipeline
 * ============================================================
 */

export interface SoftwareFactoryPipelineRequest {
  goal: string;
  projectType?: 'cli_tool' | 'web_app' | 'api_service' | 'game_module';
  targetLanguage?: 'typescript' | 'javascript' | 'python';
  requesterEmail?: string;
  autoSandboxTest?: boolean;
  packageRelease?: boolean;
}

export interface SoftwareFactoryPipelineResult {
  ok: boolean;
  runId: string;
  executionId: string;
  goalPlan: {
    id: string;
    rawGoal: string;
    title: string;
    description: string;
    tasks: Array<{
      id: string;
      title: string;
      domain: string;
      description: string;
      status: string;
    }>;
    progressPercentage: number;
  };
  generatedFiles: Array<{ path: string; content: string; language: string }>;
  sandboxResult?: {
    passed: boolean;
    stdout: string;
    stderr: string;
    exitCode: number;
    durationMs: number;
  };
  evalScore: {
    score: number;
    maxScore: number;
    passed: boolean;
    checks: string[];
  };
  releaseItem?: {
    id: string;
    title: string;
    channel: string;
    status: string;
    deliverable: string;
    notes: string;
  };
  summary: string;
  durationMs: number;
}

export async function triggerSoftwareFactoryPipeline(
  req: SoftwareFactoryPipelineRequest
): Promise<SoftwareFactoryPipelineResult> {
  const res = await fetch('/api/software-factory/pipeline/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error || `HTTP ${res.status}: Failed to execute Software Factory pipeline`);
  }

  const json = await res.json();
  if (!json.ok) {
    throw new Error(json.error || 'Software Factory execution failed');
  }

  return json.result as SoftwareFactoryPipelineResult;
}
