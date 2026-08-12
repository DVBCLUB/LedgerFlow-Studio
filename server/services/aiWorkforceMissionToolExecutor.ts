import { createHash } from 'node:crypto';
import {
  approveAgentToolExecution,
  consumeAgentToolExecution,
  createAgentToolExecutionPreview,
  type AgentToolExecutionInput,
  type AgentToolExecutionPreview,
} from './agentToolExecutionGate.ts';
import { getAgentToolContract, type AgentToolContract } from './agentToolRegistry.ts';
import type { MissionExecutionQueue, MissionExecutionQueueStep } from './aiWorkforceMissionExecutionQueue.ts';
import { buildMissionEvidenceReplayArtifact, type MissionEvidenceReplayArtifact } from './aiWorkforceMissionEvidenceReplay.ts';
import { createApprovedGitHubChangeRequest, createGitHubIssue, gitPullLocal } from './githubConnector.ts';

export type MissionToolExecutionMode = 'dry_run' | 'simulation' | 'connector';
export type MissionToolExecutionStatus = 'preview_ready' | 'approval_required' | 'executed' | 'blocked';

export interface MissionToolExecutionAdapterResult {
  id: string;
  queueId: string;
  stepId: string;
  missionStepId: string;
  requestedToolId: string;
  adapterToolId: string;
  mode: MissionToolExecutionMode;
  status: MissionToolExecutionStatus;
  contract: AgentToolContract;
  preview: AgentToolExecutionPreview;
  approval?: { approvalToken: string; expiresAt: string };
  safetyDecision: AgentToolExecutionPreview['safetyDecision'];
  evidence: Array<{ title: string; value: string }>;
  replayArtifact: MissionEvidenceReplayArtifact;
  createdAt: string;
}

const toolAliases: Record<string, { adapterToolId: string; target: string; reason: string }> = {
  github_pr_control: {
    adapterToolId: 'draft_patch',
    target: 'agent-tool://github-pr-control/simulated-report',
    reason: 'GitHub PR Control mission steps are routed through the safe Software Factory draft/simulation adapter in this release.',
  },
};

function stableId(prefix: string, value: unknown) {
  return `${prefix}_${createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16)}`;
}

function stepLookup(queue: MissionExecutionQueue, stepId: string) {
  return queue.steps.find((step) => step.id === stepId || step.missionStepId === stepId) || null;
}

function resolveTool(step: MissionExecutionQueueStep) {
  const alias = toolAliases[step.toolId];
  const adapterToolId = alias?.adapterToolId || step.toolId;
  const contract = getAgentToolContract(adapterToolId);
  if (!contract) throw new Error(`No executable tool contract found for mission step tool: ${step.toolId}`);
  return { alias, adapterToolId, contract };
}

function defaultTarget(step: MissionExecutionQueueStep, adapterToolId: string, alias?: { target: string }) {
  if (alias?.target) return alias.target;
  if (adapterToolId === 'robot_move') return 'robot://simulator/arm-a/joint-1';
  if (adapterToolId === 'robot_inspect') return 'robot://simulator/arm-a';
  if (adapterToolId === 'browser_check' || adapterToolId === 'search_web_context') return 'browser://sandbox/mission';
  if (adapterToolId === 'terminal_check') return 'computer://sandbox/mission/diagnostics';
  return `agent-tool://${adapterToolId}/${step.missionStepId}`;
}

function allowedTarget(target: string, adapterToolId: string) {
  if (adapterToolId === 'robot_move') return 'robot://simulator/arm-a';
  if (target.startsWith('agent-tool://github-pr-control')) return 'agent-tool://github-pr-control';
  const parts = target.split('/');
  return parts.length > 3 ? parts.slice(0, 3).join('/') : target;
}

function buildInput(queue: MissionExecutionQueue, step: MissionExecutionQueueStep, adapterToolId: string, target: string, aliasReason?: string): AgentToolExecutionInput {
  return {
    toolId: adapterToolId,
    title: step.title,
    target,
    executionMode: 'simulation',
    payload: {
      queueId: queue.id,
      missionId: queue.missionId,
      missionGoal: queue.goal,
      stepId: step.id,
      missionStepId: step.missionStepId,
      requestedToolId: step.toolId,
      adapterToolId,
      lane: step.lane,
      agentRole: step.agentRole,
      riskTier: step.riskTier,
      highImpact: step.highImpact,
      expectedEvidence: step.expectedEvidence,
      approvalFingerprint: step.approval?.fingerprint,
      aliasReason,
      allowedTargets: [allowedTarget(target, adapterToolId)],
      humanCheckpoint: step.approvalRequired || step.highImpact,
      labOnly: adapterToolId.startsWith('robot_'),
    },
  };
}

function buildEvidence(result: Omit<MissionToolExecutionAdapterResult, 'evidence' | 'replayArtifact'>) {
  return [
    { title: 'Tool execution adapter', value: `${result.requestedToolId} routed to ${result.adapterToolId} in ${result.mode} mode.` },
    { title: 'Safety decision', value: `${result.safetyDecision.approved ? 'approved' : 'blocked'} · ${result.safetyDecision.mode}` },
    { title: 'Execution fingerprint', value: result.preview.fingerprint },
  ];
}

function withReplayArtifact(queue: MissionExecutionQueue, step: MissionExecutionQueueStep, partial: Omit<MissionToolExecutionAdapterResult, 'evidence' | 'replayArtifact'>): MissionToolExecutionAdapterResult {
  const evidence = buildEvidence(partial);
  const replayArtifact = buildMissionEvidenceReplayArtifact({
    queue,
    step,
    requestedToolId: partial.requestedToolId,
    adapterToolId: partial.adapterToolId,
    mode: partial.mode as any,
    fingerprint: partial.preview.fingerprint,
    safetyDecision: partial.safetyDecision,
    generatedEvidence: evidence,
    createdAt: partial.createdAt,
  });
  return { ...partial, evidence, replayArtifact };
}

export function previewMissionStepToolExecution(queue: MissionExecutionQueue, stepId: string): MissionToolExecutionAdapterResult {
  const step = stepLookup(queue, stepId);
  if (!step) throw new Error(`Mission execution step not found: ${stepId}`);
  if (step.status === 'blocked' || step.status === 'cancelled') throw new Error(`Mission step cannot be previewed from status ${step.status}.`);
  const { alias, adapterToolId, contract } = resolveTool(step);
  const target = defaultTarget(step, adapterToolId, alias);
  const preview = createAgentToolExecutionPreview(buildInput(queue, step, adapterToolId, target, alias?.reason));
  const createdAt = new Date().toISOString();
  const partial = {
    id: stableId('mission_tool_preview', { queueId: queue.id, stepId: step.id, previewId: preview.id, createdAt }),
    queueId: queue.id,
    stepId: step.id,
    missionStepId: step.missionStepId,
    requestedToolId: step.toolId,
    adapterToolId,
    mode: 'dry_run' as MissionToolExecutionMode,
    status: preview.requiresApproval ? 'approval_required' as MissionToolExecutionStatus : 'preview_ready' as MissionToolExecutionStatus,
    contract,
    preview,
    safetyDecision: preview.safetyDecision,
    createdAt,
  };
  return withReplayArtifact(queue, step, partial);
}

export function executeMissionStepToolSimulation(queue: MissionExecutionQueue, stepId: string): MissionToolExecutionAdapterResult {
  const step = stepLookup(queue, stepId);
  if (!step) throw new Error(`Mission execution step not found: ${stepId}`);
  if (step.status !== 'ready' && step.status !== 'running') throw new Error(`Mission step must be ready or running before tool execution. Current status: ${step.status}`);
  if (step.approvalRequired && !step.approval) throw new Error('Mission step approval is required before simulated tool execution.');
  const { alias, adapterToolId, contract } = resolveTool(step);
  const target = defaultTarget(step, adapterToolId, alias);
  const input = buildInput(queue, step, adapterToolId, target, alias?.reason);
  const preview = createAgentToolExecutionPreview(input);
  const approval = preview.requiresApproval ? approveAgentToolExecution(preview.id, preview.fingerprint) : undefined;
  consumeAgentToolExecution({ ...input, previewId: preview.id, approvalToken: approval?.approvalToken });
  const createdAt = new Date().toISOString();
  const partial = {
    id: stableId('mission_tool_execution', { queueId: queue.id, stepId: step.id, previewId: preview.id, createdAt }),
    queueId: queue.id,
    stepId: step.id,
    missionStepId: step.missionStepId,
    requestedToolId: step.toolId,
    adapterToolId,
    mode: 'simulation' as MissionToolExecutionMode,
    status: 'executed' as MissionToolExecutionStatus,
    contract,
    preview,
    approval,
    safetyDecision: preview.safetyDecision,
    createdAt,
  };
  return withReplayArtifact(queue, step, partial);
}

export async function executeMissionStepToolConnector(queue: MissionExecutionQueue, stepId: string): Promise<MissionToolExecutionAdapterResult> {
  const step = stepLookup(queue, stepId);
  if (!step) throw new Error(`Mission execution step not found: ${stepId}`);
  if (step.status !== 'ready' && step.status !== 'running') throw new Error(`Mission step must be ready or running before tool execution. Current status: ${step.status}`);
  if (step.approvalRequired && !step.approval) throw new Error('Mission step approval is required before connector execution.');
  
  const { alias, adapterToolId, contract } = resolveTool(step);
  const target = defaultTarget(step, adapterToolId, alias);
  const input = buildInput(queue, step, adapterToolId, target, alias?.reason);
  input.executionMode = 'connector';
  
  const preview = createAgentToolExecutionPreview(input);
  const approval = preview.requiresApproval ? approveAgentToolExecution(preview.id, preview.fingerprint) : undefined;
  consumeAgentToolExecution({ ...input, previewId: preview.id, approvalToken: approval?.approvalToken });
  
  let evidenceStr = '';
  try {
    if (adapterToolId === 'github_create_draft_pr') {
      const payload = ((step as any).payload || {}) as Record<string, unknown>;
      const res = await createApprovedGitHubChangeRequest({
        title: (payload.title as string) || `AI Change: ${step.title}`,
        summary: "Draft PR created by AI Workforce",
        files: (payload.files as any) || [],
        approvalPhrase: 'APPROVE AI GITHUB PUSH',
        baseBranch: (payload.baseBranch as string) || 'main'
      });
      evidenceStr = `Created draft PR #${res.pullRequest?.number} on branch ${res.branch}`;
    } else if (adapterToolId === 'github_pull_local') {
      const payload = ((step as any).payload || {}) as Record<string, unknown>;
      const res = await gitPullLocal();
      evidenceStr = `Pulled successfully. Log: ${res.log.slice(0, 100)}`;
    } else if (adapterToolId === 'github_create_issue') {
      const payload = ((step as any).payload || {}) as Record<string, unknown>;
      const issue = await (async () => {
        const title = (payload.title as string) || `AI Issue: ${step.title}`;
        const body = (payload.body as string) || `Created by AI Workforce step ${step.id}`;
        const labels = Array.isArray(payload.labels) ? (payload.labels as string[]) : undefined;
        return await createGitHubIssue({ title, body, labels });
      })();
      evidenceStr = `Created issue #${issue.number}: ${issue.title}`;
    } else if (adapterToolId === 'github_get_summary') {
      const payload = ((step as any).payload || {}) as Record<string, unknown>;
      const repo = (payload.repo as string) || undefined;
      const summary = await (async () => {
        return await (await import('./githubConnector')).getGitHubSummary(repo);
      })();
      evidenceStr = `Read repo summary: ${summary.repository?.fullName || summary.repo}`;
    } else if (adapterToolId === 'github_get_run_jobs') {
      const payload = ((step as any).payload || {}) as Record<string, unknown>;
      const runId = Number(payload.runId || payload.run || 0);
      const repo = (payload.repo as string) || undefined;
      const jobs = await (async () => {
        return await (await import('./githubConnector')).getGitHubWorkflowRunJobs(repo, runId);
      })();
      evidenceStr = `Loaded jobs for run ${jobs.runId}, failures: ${jobs.failedJobs.length}`;
    } else if (adapterToolId === 'github_get_pr_digest') {
      const payload = ((step as any).payload || {}) as Record<string, unknown>;
      const prNumber = Number(payload.prNumber || payload.pullNumber || 0);
      const repo = (payload.repo as string) || undefined;
      const digest = await (async () => {
        return await (await import('./githubConnector')).getGitHubPullRequestDigest(repo, prNumber);
      })();
      evidenceStr = `PR #${digest.pullRequest.number} digest: ${digest.safety.reviewNotes.slice(0, 3).join('; ')}`;
    } else if (adapterToolId === 'github_get_artifacts') {
      const payload = ((step as any).payload || {}) as Record<string, unknown>;
      const runId = Number(payload.runId || payload.run || 0);
      const repo = (payload.repo as string) || undefined;
      const artifacts = await (async () => {
        return await (await import('./githubArtifacts')).getGitHubWorkflowRunArtifacts(repo, runId);
      })();
      evidenceStr = `Found ${artifacts.artifacts.length} artifacts for run ${artifacts.runId}`;
    } else if (adapterToolId === 'github_close_pr') {
      const payload = ((step as any).payload || {}) as Record<string, unknown>;
      const prNumber = Number(payload.pullNumber || payload.prNumber || 0);
      const repo = (payload.repo as string) || undefined;
      const reason = (payload.reason as string) || 'Closed by AI Workforce';
      const rollbackNote = (payload.rollbackNote as string) || 'Rollback note not provided';
      const res = await (async () => {
        return await (await import('./githubConnector')).requestCloseGitHubPullRequest({ repo, pullNumber: prNumber, reason, rollbackNote, approvalPhrase: 'APPROVE AI GITHUB CLOSE' });
      })();
      evidenceStr = `Closed PR #${res.pullRequest.number}`;
    } else {
      throw new Error(`Connector for tool ${adapterToolId} is not implemented.`);
    }
  } catch (err: any) {
    throw new Error(`Connector execution failed: ${err.message}`);
  }

  const createdAt = new Date().toISOString();
  const partial = {
    id: stableId('mission_tool_execution', { queueId: queue.id, stepId: step.id, previewId: preview.id, createdAt }),
    queueId: queue.id,
    stepId: step.id,
    missionStepId: step.missionStepId,
    requestedToolId: step.toolId,
    adapterToolId,
    mode: 'connector' as MissionToolExecutionMode,
    status: 'executed' as MissionToolExecutionStatus,
    contract,
    preview,
    approval,
    safetyDecision: preview.safetyDecision,
    createdAt,
  };
  
  const result = withReplayArtifact(queue, step, partial);
  result.evidence.push({ title: 'Connector Result', value: evidenceStr });
  return result;
}
