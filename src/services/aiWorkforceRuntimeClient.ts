export type AIWorkforceRuntimeHealth = 'online' | 'offline' | 'unknown';
export type MissionReviewDecision = 'approved' | 'needs_changes' | 'blocked' | 'info';
export type MissionReleaseCiStatus = 'success' | 'pending' | 'failed' | 'unknown';

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

const sampleMissionInput = {
  goal: 'Plan an AI Workforce Runtime Hub upgrade with evidence, PR control, rollback notes, checkpoints, and audit trail.',
  owner: 'Founder',
  domains: ['software factory', 'runtime'],
  constraints: ['preserve audit trail', 'include rollback evidence'],
  repoFullName: 'DVBCLUB/LedgerFlow-Studio',
  prNumber: 42,
  allowAutomation: true,
  sources: [
    {
      kind: 'sop',
      title: 'Mission Planner Runtime SOP',
      content: 'Mission plans map goals to agent roles, tool route, risk tier, approval checkpoint, grounded source map, safety evidence, audit event, and metric trail.',
      tags: ['mission-planner', 'ai-workforce'],
      facts: { mission_policy: 'approval_checkpoint_required' },
      confidence: 0.94,
    },
  ],
};

export async function createSampleMissionPlan() {
  return requestAIWorkforce<{ ok: true; plan: any }>('/api/ai-workforce/mission-plan', {
    method: 'POST',
    body: JSON.stringify(sampleMissionInput),
  });
}

export async function createSampleMissionExecutionQueue() {
  return requestAIWorkforce<{ ok: true; plan: any; queue: any }>('/api/ai-workforce/mission-execution-queue', {
    method: 'POST',
    body: JSON.stringify(sampleMissionInput),
  });
}

export async function listMissionExecutionQueues(status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return requestAIWorkforce<{ ok: true; queues: any[]; stats: any }>(`/api/ai-workforce/mission-execution-queues${query}`);
}

export async function resumeMissionExecutionQueue(queueId: string) {
  return requestAIWorkforce<{ ok: true; queue: any }>('/api/ai-workforce/mission-execution-queue/resume', {
    method: 'POST',
    body: JSON.stringify({ queueId, actor: 'Founder' }),
  });
}

export async function approveMissionExecutionQueueStep(queueId: string, step: any) {
  return requestAIWorkforce<{ ok: true; queue: any }>('/api/ai-workforce/mission-execution-queue/approve', {
    method: 'POST',
    body: JSON.stringify({ queueId, stepId: step.id, phrase: step.approvalPhrase, approver: 'Founder' }),
  });
}

export async function startMissionExecutionQueueStep(queueId: string, step: any) {
  return requestAIWorkforce<{ ok: true; queue: any }>('/api/ai-workforce/mission-execution-queue/start', {
    method: 'POST',
    body: JSON.stringify({ queueId, stepId: step.id, actor: 'Founder' }),
  });
}

export async function completeMissionExecutionQueueStep(queueId: string, step: any) {
  return requestAIWorkforce<{ ok: true; queue: any }>('/api/ai-workforce/mission-execution-queue/complete', {
    method: 'POST',
    body: JSON.stringify({
      queueId,
      stepId: step.id,
      actor: 'Founder',
      evidence: [{ kind: 'operator_note', title: 'UI checkpoint evidence', value: `${step.title || step.id} reviewed from Live Runtime Hub.` }],
    }),
  });
}

export async function previewMissionExecutionQueueTool(queueId: string, step: any) {
  return requestAIWorkforce<{ ok: true; result: any }>('/api/ai-workforce/mission-execution-queue/tool-preview', {
    method: 'POST',
    body: JSON.stringify({ queueId, stepId: step.id, actor: 'Founder' }),
  });
}

export async function executeMissionExecutionQueueTool(queueId: string, step: any) {
  return requestAIWorkforce<{ ok: true; result: any; queue: any }>('/api/ai-workforce/mission-execution-queue/tool-execute', {
    method: 'POST',
    body: JSON.stringify({ queueId, stepId: step.id, actor: 'Founder' }),
  });
}

export async function cancelMissionExecutionQueue(queueId: string) {
  return requestAIWorkforce<{ ok: true; queue: any }>('/api/ai-workforce/mission-execution-queue/cancel', {
    method: 'POST',
    body: JSON.stringify({ queueId, reason: 'Cancelled from Live Runtime Hub UI.', actor: 'Founder' }),
  });
}

export async function saveMissionQueueReviewNote(input: { queueId: string; reviewer: string; decision: MissionReviewDecision; summary: string; requestedAction?: string }) {
  return requestAIWorkforce<{ ok: true; note: any; notes: any[]; dossier: any; stats: any }>('/api/ai-workforce/mission-review-note', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function listMissionQueueReviewNotes(queueId?: string) {
  return requestAIWorkforce<{ ok: true; queueId: string; notes: any[]; dossier: any; stats: any }>('/api/ai-workforce/mission-review-notes', {
    method: 'POST',
    body: JSON.stringify(queueId ? { queueId } : {}),
  });
}

export async function buildMissionQueueReleaseGate(input: {
  queueId: string;
  ciStatus?: MissionReleaseCiStatus;
  approvals?: number;
  requiredApprovals?: number;
  snapshotChecksum?: string;
  releaseLabel?: boolean;
  rollbackConfirmed?: boolean;
  operatorConfirmed?: boolean;
  notes?: string[];
}) {
  return requestAIWorkforce<{ ok: true; gate: any; dossier: any }>('/api/ai-workforce/mission-release-gate', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function exportMissionQueueSnapshot(input: {
  queueId?: string;
  format?: 'json' | 'markdown';
  includeRawQueue?: boolean;
  reviewNotes?: Array<{ reviewer: string; decision: MissionReviewDecision; summary: string; requestedAction?: string }>;
} = {}) {
  return requestAIWorkforce<{ ok: true; snapshot: any; persistedReviewNotes?: number }>('/api/ai-workforce/mission-snapshot-export', {
    method: 'POST',
    body: JSON.stringify({
      ...(input.queueId ? { queueId: input.queueId } : {}),
      format: input.format || 'json',
      includeRawQueue: Boolean(input.includeRawQueue),
      reviewNotes: input.reviewNotes || [],
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

export async function buildGitHubPRControlReport(input: { repoFullName: string; prNumber: number; apiBaseUrl?: string }) {
  return requestAIWorkforce<{ ok: true; input: any; report: any; adapter: any }>('/api/ai-workforce/github-pr-control', {
    method: 'POST',
    body: JSON.stringify({
      repoFullName: input.repoFullName,
      prNumber: input.prNumber,
      ...(input.apiBaseUrl?.trim() ? { apiBaseUrl: input.apiBaseUrl.trim() } : {}),
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
