import {
  buildGroundedContextPack,
  requireGroundedContextForHighImpact,
  type GroundedContextRequest,
} from './groundedContextPack.ts';
import {
  validateAutomationSafetyEnvelope,
  type AutomationSafetyPlan,
} from './automationSafetyEnvelope.ts';
import {
  scoreSoftwareFactoryReadiness,
  type SoftwareFactoryReadinessInput,
} from './softwareFactoryReadiness.ts';
import {
  buildSoftwareFactoryPRControlReport,
  type SoftwareFactoryPullRequestInput,
} from './softwareFactoryPrControl.ts';
import {
  buildGitHubSoftwareFactoryPRControlReport,
  type GitHubPRControlAdapterOptions,
} from './softwareFactoryGithubPrAdapter.ts';
import {
  planAIWorkforceMission,
  type AIWorkforceMissionPlannerInput,
} from './aiWorkforceMissionPlanner.ts';
import type { MissionExecutionQueue } from './aiWorkforceMissionExecutionQueue.ts';
import {
  approveStoredMissionExecutionStep,
  cancelStoredMissionExecutionQueue,
  completeStoredMissionExecutionStep,
  createAndSaveMissionExecutionQueue,
  getMissionExecutionQueueStoreStats,
  listMissionExecutionQueues,
  requireMissionExecutionQueue,
  startStoredMissionExecutionStep,
} from './aiWorkforceMissionExecutionQueueStore.ts';
import {
  executeMissionStepToolSimulation,
  previewMissionStepToolExecution,
  type MissionToolExecutionAdapterResult,
} from './aiWorkforceMissionToolExecutor.ts';
import {
  listAIRunMetrics,
  recordAIRunMetric,
  summarizeAIObservability,
  type AIRunMetric,
} from './aiBenchmarkObservability.ts';
import {
  appendAIWorkforceRunMetric,
  getAIWorkforceRunMetricStoreStats,
  listAIWorkforceRunMetrics,
} from './aiWorkforceRunMetricStore.ts';
import { assessAIWorkforceReadiness } from './aiWorkforceGapAssessment.ts';
import { exportMCPToolManifestCatalog, type MCPToolRunSignal } from './mcpToolManifestRegistry.ts';
import {
  appendAIWorkforceAuditEvent,
  appendAIWorkforceTrendSnapshot,
  getAIWorkforceOperationalLedgerDashboard,
  persistKnowledgeGraphFromContextPack,
} from './aiWorkforceOperationalLedger.ts';
import {
  appendAIWorkforceRuntimeRecord,
  getAIWorkforceRuntimeStoreStats,
  listAIWorkforceRuntimeRecords,
} from './aiWorkforceRuntimeStore.ts';

export interface RuntimeGroundedContextOptions extends GroundedContextRequest {
  highImpact?: boolean;
}

function dedupeMetrics(metrics: AIRunMetric[]) {
  const byId = new Map<string, AIRunMetric>();
  for (const metric of metrics) byId.set(metric.id, metric);
  return Array.from(byId.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function listRuntimeObservabilityMetrics() {
  const persisted = await listAIWorkforceRunMetrics({ limit: 1000 });
  return dedupeMetrics([...persisted, ...listAIRunMetrics()]);
}

function toMCPToolRunSignals(metrics: AIRunMetric[]): MCPToolRunSignal[] {
  return metrics
    .filter((metric) => metric.toolId)
    .map((metric) => ({
      toolId: metric.toolId!,
      ok: metric.status === 'success' || metric.status === 'needs_review',
      latencyMs: metric.latencyMs,
      createdAt: metric.createdAt,
      error: metric.status === 'failed' || metric.status === 'blocked' ? metric.status : undefined,
    }));
}

async function recordMissionQueueTransition(options: {
  queue: MissionExecutionQueue;
  action: 'mission_execution_resumed' | 'mission_step_approved' | 'mission_step_started' | 'mission_step_completed' | 'mission_execution_cancelled';
  actor: string;
  summary: string;
  startedAt: number;
  status: AIRunMetric['status'];
  safetyBlocks?: number;
  metadata?: Record<string, unknown>;
}) {
  await appendAIWorkforceRuntimeRecord({
    id: `${options.queue.id}_${options.action}_${Date.now()}`,
    type: 'mission_execution_queue',
    payload: { queue: options.queue, transition: options.action, metadata: options.metadata || {} },
  });
  await appendAIWorkforceAuditEvent({
    action: options.action,
    severity: options.status === 'blocked' ? 'warning' : 'info',
    actor: options.actor,
    summary: options.summary,
    entityId: options.queue.id,
    metadata: { queueStatus: options.queue.status, summary: options.queue.summary, ...(options.metadata || {}) },
  });
  const metric = recordAIRunMetric({
    lane: 'mission-control',
    agentRole: options.actor,
    toolId: 'read_knowledge',
    status: options.status,
    latencyMs: Date.now() - options.startedAt,
    qualityScore: 0.9,
    safetyBlocks: options.safetyBlocks || 0,
  });
  await appendAIWorkforceRunMetric(metric);
}

async function recordMissionToolExecution(options: {
  result: MissionToolExecutionAdapterResult;
  queue?: MissionExecutionQueue;
  action: 'mission_tool_previewed' | 'mission_tool_executed';
  actor: string;
  summary: string;
  startedAt: number;
  status: AIRunMetric['status'];
}) {
  await appendAIWorkforceRuntimeRecord({
    id: options.result.id,
    type: 'mission_tool_execution',
    payload: { result: options.result, queue: options.queue || null },
  });
  await appendAIWorkforceAuditEvent({
    action: options.action,
    severity: options.status === 'blocked' ? 'warning' : 'info',
    actor: options.actor,
    summary: options.summary,
    entityId: options.result.queueId,
    metadata: {
      stepId: options.result.stepId,
      requestedToolId: options.result.requestedToolId,
      adapterToolId: options.result.adapterToolId,
      mode: options.result.mode,
      status: options.result.status,
      safetyMode: options.result.safetyDecision.mode,
      safetyApproved: options.result.safetyDecision.approved,
    },
  });
  const metric = recordAIRunMetric({
    lane: 'mission-control',
    agentRole: 'Mission Tool Executor',
    toolId: options.result.adapterToolId,
    status: options.status,
    latencyMs: Date.now() - options.startedAt,
    qualityScore: options.result.safetyDecision.approved ? 0.92 : 0.25,
    safetyBlocks: options.result.safetyDecision.approved ? 0 : options.result.safetyDecision.issues.length,
  });
  await appendAIWorkforceRunMetric(metric);
}

export async function buildRuntimeGroundedContext(options: RuntimeGroundedContextOptions) {
  const startedAt = Date.now();
  const pack = buildGroundedContextPack(options);
  let guard: { ok: true } | { ok: false; error: string } = { ok: true };

  if (options.highImpact) {
    try {
      requireGroundedContextForHighImpact(pack);
    } catch (error: any) {
      guard = { ok: false, error: error?.message || String(error) };
    }
  }

  await appendAIWorkforceRuntimeRecord({
    id: pack.id,
    type: 'context_pack',
    payload: { pack, highImpact: Boolean(options.highImpact), guard },
  });
  await persistKnowledgeGraphFromContextPack(pack);
  await appendAIWorkforceAuditEvent({
    action: guard.ok ? 'context_pack_created' : 'context_pack_blocked',
    severity: guard.ok ? 'info' : 'warning',
    actor: 'Memory Agent',
    summary: guard.ok ? 'Grounded context pack created and graph persisted.' : `Grounded context pack blocked: ${guard.error}`,
    entityId: pack.id,
    metadata: { highImpact: Boolean(options.highImpact), confidence: pack.confidence, contradictions: pack.contradictions.length },
  });
  const metric = recordAIRunMetric({
    lane: 'knowledge-spine',
    agentRole: 'Memory Agent',
    toolId: 'read_knowledge',
    status: guard.ok ? 'success' : 'blocked',
    latencyMs: Date.now() - startedAt,
    qualityScore: pack.confidence,
    safetyBlocks: guard.ok ? 0 : 1,
  });
  await appendAIWorkforceRunMetric(metric);

  return { pack, guard };
}

export async function buildRuntimeMissionPlan(input: AIWorkforceMissionPlannerInput) {
  const startedAt = Date.now();
  const plan = planAIWorkforceMission(input);
  await appendAIWorkforceRuntimeRecord({
    id: plan.id,
    type: 'mission_plan',
    payload: plan,
  });
  await persistKnowledgeGraphFromContextPack(plan.contextPack);
  await appendAIWorkforceAuditEvent({
    action: 'mission_planned',
    severity: plan.summary.blockedSteps > 0 || !plan.contextGuard.ok ? 'critical' : plan.riskTier === 'critical' || plan.riskTier === 'high' ? 'warning' : 'info',
    actor: 'Mission Planner',
    summary: `Mission plan created with ${plan.summary.totalSteps} steps, ${plan.summary.humanApprovals} approval checkpoints, and ${plan.riskTier} risk.`,
    entityId: plan.id,
    metadata: { goal: plan.goal, summary: plan.summary, toolRoute: plan.toolRoute, approvalCheckpoints: plan.approvalCheckpoints },
  });
  const metric = recordAIRunMetric({
    lane: 'mission-control',
    agentRole: 'Mission Planner',
    toolId: 'read_knowledge',
    status: plan.summary.blockedSteps > 0 || !plan.contextGuard.ok ? 'blocked' : plan.approvalRequired ? 'needs_review' : 'success',
    latencyMs: Date.now() - startedAt,
    qualityScore: plan.contextPack.confidence,
    safetyBlocks: plan.summary.blockedSteps + (plan.contextGuard.ok ? 0 : 1),
  });
  await appendAIWorkforceRunMetric(metric);
  return plan;
}

export async function buildRuntimeMissionExecutionQueue(input: AIWorkforceMissionPlannerInput) {
  const startedAt = Date.now();
  const plan = planAIWorkforceMission(input);
  const queue = await createAndSaveMissionExecutionQueue(plan);
  await appendAIWorkforceRuntimeRecord({
    id: queue.id,
    type: 'mission_execution_queue',
    payload: { plan, queue },
  });
  await persistKnowledgeGraphFromContextPack(plan.contextPack);
  await appendAIWorkforceAuditEvent({
    action: 'mission_execution_queued',
    severity: queue.status === 'blocked' ? 'critical' : queue.status === 'needs_approval' ? 'warning' : 'info',
    actor: 'Mission Execution Queue',
    summary: `Mission execution queue created with ${queue.summary.totalSteps} steps, ${queue.summary.waitingApprovalSteps} approval gates, and ${queue.status} status.`,
    entityId: queue.id,
    metadata: { missionId: plan.id, queueStatus: queue.status, summary: queue.summary, riskTier: queue.riskTier },
  });
  const metric = recordAIRunMetric({
    lane: 'mission-control',
    agentRole: 'Mission Execution Queue',
    toolId: 'read_knowledge',
    status: queue.status === 'blocked' ? 'blocked' : queue.status === 'needs_approval' ? 'needs_review' : 'success',
    latencyMs: Date.now() - startedAt,
    qualityScore: plan.contextPack.confidence,
    safetyBlocks: queue.summary.blockedSteps,
  });
  await appendAIWorkforceRunMetric(metric);
  return { plan, queue };
}

export async function listRuntimeMissionExecutionQueues(options: { limit?: number; status?: any } = {}) {
  const queues = await listMissionExecutionQueues(options);
  const stats = await getMissionExecutionQueueStoreStats();
  return { queues, stats };
}

export async function resumeRuntimeMissionExecutionQueue(options: { queueId: string; actor?: string }) {
  const startedAt = Date.now();
  const queue = await requireMissionExecutionQueue(options.queueId);
  await recordMissionQueueTransition({
    queue,
    action: 'mission_execution_resumed',
    actor: options.actor || 'Mission Operator',
    summary: `Mission execution queue resumed with ${queue.summary.completedSteps}/${queue.summary.totalSteps} completed steps.`,
    startedAt,
    status: queue.status === 'blocked' || queue.status === 'cancelled' ? 'blocked' : queue.status === 'needs_approval' ? 'needs_review' : 'success',
    safetyBlocks: queue.summary.blockedSteps + queue.summary.cancelledSteps,
  });
  return queue;
}

export async function approveRuntimeMissionExecutionStep(options: { queueId: string; stepId: string; phrase: string; approver?: string }) {
  const startedAt = Date.now();
  const queue = await approveStoredMissionExecutionStep(options);
  await recordMissionQueueTransition({
    queue,
    action: 'mission_step_approved',
    actor: options.approver || 'Founder',
    summary: `Approval captured for mission queue step ${options.stepId}.`,
    startedAt,
    status: 'needs_review',
    metadata: { stepId: options.stepId },
  });
  return queue;
}

export async function startRuntimeMissionExecutionStep(options: { queueId: string; stepId: string; actor?: string }) {
  const startedAt = Date.now();
  const queue = await startStoredMissionExecutionStep(options);
  await recordMissionQueueTransition({
    queue,
    action: 'mission_step_started',
    actor: options.actor || 'Mission Operator',
    summary: `Mission queue step ${options.stepId} started.`,
    startedAt,
    status: 'success',
    metadata: { stepId: options.stepId },
  });
  return queue;
}

export async function completeRuntimeMissionExecutionStep(options: { queueId: string; stepId: string; evidence: any[]; actor?: string }) {
  const startedAt = Date.now();
  const queue = await completeStoredMissionExecutionStep(options);
  await recordMissionQueueTransition({
    queue,
    action: 'mission_step_completed',
    actor: options.actor || 'Mission Operator',
    summary: `Mission queue step ${options.stepId} completed with ${options.evidence?.length || 0} evidence item(s).`,
    startedAt,
    status: queue.status === 'completed' ? 'success' : 'needs_review',
    metadata: { stepId: options.stepId, evidenceCount: options.evidence?.length || 0 },
  });
  return queue;
}

export async function cancelRuntimeMissionExecutionQueue(options: { queueId: string; reason: string; actor?: string }) {
  const startedAt = Date.now();
  const queue = await cancelStoredMissionExecutionQueue(options);
  await recordMissionQueueTransition({
    queue,
    action: 'mission_execution_cancelled',
    actor: options.actor || 'Founder',
    summary: `Mission execution queue cancelled: ${options.reason}`,
    startedAt,
    status: 'blocked',
    safetyBlocks: queue.summary.cancelledSteps,
    metadata: { reason: options.reason },
  });
  return queue;
}

export async function previewRuntimeMissionStepToolExecution(options: { queueId: string; stepId: string; actor?: string }) {
  const startedAt = Date.now();
  const queue = await requireMissionExecutionQueue(options.queueId);
  const result = previewMissionStepToolExecution(queue, options.stepId);
  await recordMissionToolExecution({
    result,
    queue,
    action: 'mission_tool_previewed',
    actor: options.actor || 'Mission Tool Executor',
    summary: `Mission tool dry-run preview for ${result.requestedToolId} via ${result.adapterToolId}: ${result.status}.`,
    startedAt,
    status: result.status === 'approval_required' ? 'needs_review' : 'success',
  });
  return result;
}

export async function executeRuntimeMissionStepToolSimulation(options: { queueId: string; stepId: string; actor?: string }) {
  const startedAt = Date.now();
  let queue = await requireMissionExecutionQueue(options.queueId);
  const step = queue.steps.find((item) => item.id === options.stepId || item.missionStepId === options.stepId);
  if (!step) throw new Error(`Mission execution step not found: ${options.stepId}`);
  if (step.status === 'ready') {
    queue = await startStoredMissionExecutionStep({ queueId: options.queueId, stepId: options.stepId, actor: options.actor || 'Mission Tool Executor' });
  }
  const result = executeMissionStepToolSimulation(queue, options.stepId);
  const completedQueue = await completeStoredMissionExecutionStep({
    queueId: options.queueId,
    stepId: options.stepId,
    actor: options.actor || 'Mission Tool Executor',
    evidence: result.evidence.map((item) => ({ kind: 'artifact' as const, title: item.title, value: item.value })),
  });
  await recordMissionToolExecution({
    result,
    queue: completedQueue,
    action: 'mission_tool_executed',
    actor: options.actor || 'Mission Tool Executor',
    summary: `Mission tool simulation executed for ${result.requestedToolId} via ${result.adapterToolId}.`,
    startedAt,
    status: 'success',
  });
  return { result, queue: completedQueue };
}

export async function previewRuntimeAutomation(plan: AutomationSafetyPlan) {
  const startedAt = Date.now();
  const decision = validateAutomationSafetyEnvelope(plan);
  await appendAIWorkforceRuntimeRecord({
    id: `safety_${plan.id}`,
    type: 'safety_decision',
    payload: { plan, decision },
  });
  await appendAIWorkforceAuditEvent({
    action: 'safety_previewed',
    severity: decision.approved ? 'info' : 'critical',
    actor: 'Automation Safety Agent',
    summary: decision.approved ? `Automation safety preview approved in ${decision.mode} mode.` : `Automation safety preview blocked: ${decision.issues.join('; ')}`,
    entityId: plan.id,
    metadata: { surface: plan.surface, mode: decision.mode, issues: decision.issues, replaySteps: decision.replay.length },
  });
  const metric = recordAIRunMetric({
    lane: 'execution-layer',
    agentRole: 'Automation Safety Agent',
    toolId: plan.surface === 'robot' ? 'robot_move' : plan.surface === 'browser' ? 'browser_check' : 'terminal_check',
    status: decision.approved ? (decision.humanCheckpointRequired ? 'needs_review' : 'success') : 'blocked',
    latencyMs: Date.now() - startedAt,
    qualityScore: decision.approved ? 0.95 : 0.35,
    safetyBlocks: decision.approved ? 0 : decision.issues.length,
  });
  await appendAIWorkforceRunMetric(metric);

  return decision;
}

export async function scoreRuntimePRReadiness(input: SoftwareFactoryReadinessInput) {
  const startedAt = Date.now();
  const report = scoreSoftwareFactoryReadiness(input);
  await appendAIWorkforceRuntimeRecord({
    id: `pr_ready_${Date.now()}`,
    type: 'pr_readiness',
    payload: report,
  });
  await appendAIWorkforceAuditEvent({
    action: 'pr_readiness_scored',
    severity: report.verdict === 'blocked' ? 'critical' : report.verdict === 'needs_review' ? 'warning' : 'info',
    actor: 'Software Factory Agent',
    summary: `PR readiness verdict: ${report.verdict} (${report.score}/100).`,
    entityId: input.title,
    metadata: { score: report.score, blockers: report.blockers, warnings: report.warnings, requiredApprovals: report.requiredApprovals },
  });
  const metric = recordAIRunMetric({
    lane: 'mission-control',
    agentRole: 'Software Factory Agent',
    toolId: 'draft_patch',
    status: report.verdict === 'ready' ? 'success' : report.verdict === 'needs_review' ? 'needs_review' : 'blocked',
    latencyMs: Date.now() - startedAt,
    qualityScore: report.score / 100,
    safetyBlocks: report.blockers.length,
  });
  await appendAIWorkforceRunMetric(metric);

  return report;
}

export async function buildRuntimePRControlReport(input: SoftwareFactoryPullRequestInput) {
  const startedAt = Date.now();
  const report = buildSoftwareFactoryPRControlReport(input);
  await appendAIWorkforceRuntimeRecord({
    id: report.id,
    type: 'pr_control',
    payload: report,
  });
  await appendAIWorkforceAuditEvent({
    action: 'pr_readiness_scored',
    severity: report.mergeGate.mode === 'blocked' ? 'critical' : report.mergeGate.mode === 'human_review_required' ? 'warning' : 'info',
    actor: 'Software Factory PR Control',
    summary: `PR control merge gate: ${report.mergeGate.mode} (${report.readiness.score}/100).`,
    entityId: input.id,
    metadata: { mergeGate: report.mergeGate, evidence: report.evidence, auditFingerprint: report.auditFingerprint },
  });
  const metric = recordAIRunMetric({
    lane: 'mission-control',
    agentRole: 'Software Factory PR Control',
    toolId: 'draft_patch',
    status: report.mergeGate.allowed ? 'success' : report.mergeGate.mode === 'blocked' ? 'blocked' : 'needs_review',
    latencyMs: Date.now() - startedAt,
    qualityScore: report.readiness.score / 100,
    safetyBlocks: report.mergeGate.mode === 'blocked' ? report.mergeGate.reasons.length : 0,
  });
  await appendAIWorkforceRunMetric(metric);
  return report;
}

export async function buildRuntimeGitHubPRControlReport(options: GitHubPRControlAdapterOptions) {
  const startedAt = Date.now();
  const result = await buildGitHubSoftwareFactoryPRControlReport({
    ...options,
    token: options.token || process.env.GITHUB_TOKEN,
  });
  await appendAIWorkforceRuntimeRecord({
    id: result.report.id,
    type: 'pr_control',
    payload: { report: result.report, adapter: result.adapter },
  });
  await appendAIWorkforceAuditEvent({
    action: 'github_pr_control_scored',
    severity: result.report.mergeGate.mode === 'blocked' ? 'critical' : result.report.mergeGate.mode === 'human_review_required' ? 'warning' : 'info',
    actor: 'GitHub PR Control Adapter',
    summary: `GitHub PR ${result.adapter.repoFullName}#${result.adapter.prNumber} merge gate: ${result.report.mergeGate.mode}.`,
    entityId: result.input.id,
    metadata: { mergeGate: result.report.mergeGate, adapter: result.adapter, auditFingerprint: result.report.auditFingerprint },
  });
  const metric = recordAIRunMetric({
    lane: 'mission-control',
    agentRole: 'GitHub PR Control Adapter',
    toolId: 'github_pr_control',
    status: result.report.mergeGate.allowed ? 'success' : result.report.mergeGate.mode === 'blocked' ? 'blocked' : 'needs_review',
    latencyMs: Date.now() - startedAt,
    qualityScore: result.report.readiness.score / 100,
    safetyBlocks: result.report.mergeGate.mode === 'blocked' ? result.report.mergeGate.reasons.length : 0,
  });
  await appendAIWorkforceRunMetric(metric);
  return result;
}

export async function getAIWorkforceToolManifestCatalog() {
  return exportMCPToolManifestCatalog(toMCPToolRunSignals(await listRuntimeObservabilityMetrics()));
}

export async function getAIWorkforceRuntimeDashboard() {
  const readiness = assessAIWorkforceReadiness();
  const observabilityMetrics = await listRuntimeObservabilityMetrics();
  const observability = summarizeAIObservability(observabilityMetrics);
  const tooling = await getAIWorkforceToolManifestCatalog();
  const storeStats = await getAIWorkforceRuntimeStoreStats();
  const metricStoreStats = await getAIWorkforceRunMetricStoreStats();
  const missionQueueStats = await getMissionExecutionQueueStoreStats();
  const recentRecords = await listAIWorkforceRuntimeRecords({ limit: 10 });
  await appendAIWorkforceTrendSnapshot({
    readinessGrade: readiness.grade,
    readinessScore: readiness.overallScore,
    observability,
    toolingSummary: tooling.summary,
  });
  await appendAIWorkforceAuditEvent({
    action: 'runtime_snapshot_created',
    severity: tooling.summary.blocked > 0 || observability.blockedRate > 0.2 ? 'warning' : 'info',
    actor: 'Runtime Hub',
    summary: `Runtime snapshot created with readiness ${readiness.grade} (${readiness.overallScore}/5).`,
    metadata: { runs: observability.runs, blockedRate: observability.blockedRate, toolingSummary: tooling.summary, metricStoreStats, missionQueueStats },
  });
  const ledger = await getAIWorkforceOperationalLedgerDashboard();
  const dashboard = {
    generatedAt: new Date().toISOString(),
    readiness,
    observability,
    tooling,
    ledger,
    storeStats,
    metricStoreStats,
    missionQueueStats,
    recentRecords,
  };
  await appendAIWorkforceRuntimeRecord({
    id: `runtime_snapshot_${Date.now()}`,
    type: 'runtime_snapshot',
    payload: {
      generatedAt: dashboard.generatedAt,
      readinessGrade: readiness.grade,
      readinessScore: readiness.overallScore,
      observability,
      toolingSummary: tooling.summary,
      ledgerStats: {
        graphs: ledger.graphStats.totalGraphs,
        auditEvents: ledger.auditStats.totalEvents,
        trendSnapshots: ledger.trendStats.totalSnapshots,
      },
      metricStoreStats,
      missionQueueStats,
      storeStats,
    },
  });
  return dashboard;
}
