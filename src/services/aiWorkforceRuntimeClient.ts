export type AIWorkforceRuntimeHealth = 'online' | 'offline' | 'unknown';

const DEFAULT_DAEMON_URL = 'http://127.0.0.1:3001';

function getDaemonBaseUrl() {
  const envUrl = (import.meta as any)?.env?.VITE_ASSISTANT_DAEMON_URL;
  return String(envUrl || DEFAULT_DAEMON_URL).replace(/\/$/, '');
}

async function requestAIWorkforce<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getDaemonBaseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || `AI Workforce request failed: ${response.status}`);
  }
  return payload as T;
}

export async function fetchAIWorkforceRuntimeDashboard() {
  return requestAIWorkforce<{ ok: true; dashboard: any }>('/api/ai-workforce/runtime');
}

export async function createSampleGroundedContextPack() {
  return requestAIWorkforce<{ ok: true; pack: any; guard: any }>('/api/ai-workforce/context-pack', {
    method: 'POST',
    body: JSON.stringify({
      question: 'Validate AI Workforce runtime grounding for founder dashboard',
      highImpact: true,
      requiredTags: ['ai-workforce'],
      sources: [
        {
          kind: 'decision',
          title: 'AI Workforce Runtime Decision',
          content: 'Runtime outputs must include source map, confidence, contradiction review, observability metrics, and safe handoff.',
          tags: ['ai-workforce', 'runtime'],
          facts: { grounding_mode: 'source_mapped' },
          confidence: 0.92,
        },
      ],
    }),
  });
}

export async function previewSampleAutomationSafety() {
  return requestAIWorkforce<{ ok: true; decision: any }>('/api/ai-workforce/safety-preview', {
    method: 'POST',
    body: JSON.stringify({
      id: 'ui-robot-safety-smoke',
      surface: 'robot',
      title: 'UI robot safety smoke',
      allowedTargets: ['robot://simulator/arm-a'],
      labOnly: true,
      humanCheckpoint: true,
      emergencyStop: { command: 'STOP_ALL_AUTOMATION', contact: 'Founder' },
      actions: [
        { id: 'inspect-1', type: 'inspect', target: 'robot://simulator/arm-a' },
        { id: 'move-1', type: 'move', target: 'robot://simulator/arm-a/joint-1' },
      ],
    }),
  });
}

export async function scoreSamplePRReadiness() {
  return requestAIWorkforce<{ ok: true; report: any }>('/api/ai-workforce/pr-readiness', {
    method: 'POST',
    body: JSON.stringify({
      title: 'AI Workforce runtime UI smoke',
      changedFiles: [
        { filename: 'src/modules/ai-hr/AIWorkforceCommandCenter.tsx', additions: 48, deletions: 2 },
        { filename: 'server/services/aiWorkforceRuntimeHub.ts', additions: 24, deletions: 1 },
      ],
      checks: [
        { name: 'npm test', status: 'success' },
        { name: 'contract check', status: 'success' },
      ],
      ciLogSummary: 'Runtime UI smoke checks passed.',
      hasRollbackPlan: true,
      hasHumanApproval: true,
    }),
  });
}

export async function buildSamplePRControlReport() {
  return requestAIWorkforce<{ ok: true; report: any }>('/api/ai-workforce/pr-control', {
    method: 'POST',
    body: JSON.stringify({
      id: 'ui-pr-control-smoke',
      title: 'AI Workforce PR Control smoke',
      url: 'https://github.com/DVBCLUB/LedgerFlow-Studio/pull/42',
      author: 'DVBCLUB',
      baseBranch: 'main',
      headBranch: 'ai-workforce-implementation',
      changedFiles: [
        { filename: 'src/modules/ai-hr/AIWorkforceRuntimePanel.tsx', additions: 80, deletions: 2 },
        { filename: 'server/services/softwareFactoryPrControl.ts', additions: 140, deletions: 0 },
      ],
      checks: [
        { name: 'npm test', status: 'success' },
        { name: 'contract check', status: 'success' },
      ],
      ciLogSummary: 'PR Control smoke checks passed.',
      hasRollbackPlan: true,
      hasHumanApproval: true,
      requestedReviewers: ['founder'],
      labels: ['runtime', 'software-factory'],
    }),
  });
}

export async function checkAIWorkforceRuntimeHealth(): Promise<AIWorkforceRuntimeHealth> {
  try {
    await fetchAIWorkforceRuntimeDashboard();
    return 'online';
  } catch {
    return 'offline';
  }
}
