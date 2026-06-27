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
    type: 'pr_readiness',
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
    type: 'pr_readiness',
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
    metadata: { runs: observability.runs, blockedRate: observability.blockedRate, toolingSummary: tooling.summary, metricStoreStats },
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
      storeStats,
    },
  });
  return dashboard;
}
