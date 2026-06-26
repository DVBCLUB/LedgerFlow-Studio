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
  listAIRunMetrics,
  recordAIRunMetric,
  summarizeAIObservability,
} from './aiBenchmarkObservability.ts';
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

function toMCPToolRunSignals(): MCPToolRunSignal[] {
  return listAIRunMetrics()
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
  recordAIRunMetric({
    lane: 'knowledge-spine',
    agentRole: 'Memory Agent',
    toolId: 'read_knowledge',
    status: guard.ok ? 'success' : 'blocked',
    latencyMs: Date.now() - startedAt,
    qualityScore: pack.confidence,
    safetyBlocks: guard.ok ? 0 : 1,
  });

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
  recordAIRunMetric({
    lane: 'execution-layer',
    agentRole: 'Automation Safety Agent',
    toolId: plan.surface === 'robot' ? 'robot_move' : plan.surface === 'browser' ? 'browser_check' : 'terminal_check',
    status: decision.approved ? (decision.humanCheckpointRequired ? 'needs_review' : 'success') : 'blocked',
    latencyMs: Date.now() - startedAt,
    qualityScore: decision.approved ? 0.95 : 0.35,
    safetyBlocks: decision.approved ? 0 : decision.issues.length,
  });

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
  recordAIRunMetric({
    lane: 'mission-control',
    agentRole: 'Software Factory Agent',
    toolId: 'draft_patch',
    status: report.verdict === 'ready' ? 'success' : report.verdict === 'needs_review' ? 'needs_review' : 'blocked',
    latencyMs: Date.now() - startedAt,
    qualityScore: report.score / 100,
    safetyBlocks: report.blockers.length,
  });

  return report;
}

export function getAIWorkforceToolManifestCatalog() {
  return exportMCPToolManifestCatalog(toMCPToolRunSignals());
}

export async function getAIWorkforceRuntimeDashboard() {
  const readiness = assessAIWorkforceReadiness();
  const observability = summarizeAIObservability(listAIRunMetrics());
  const tooling = getAIWorkforceToolManifestCatalog();
  const storeStats = await getAIWorkforceRuntimeStoreStats();
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
    metadata: { runs: observability.runs, blockedRate: observability.blockedRate, toolingSummary: tooling.summary },
  });
  const ledger = await getAIWorkforceOperationalLedgerDashboard();
  const dashboard = {
    generatedAt: new Date().toISOString(),
    readiness,
    observability,
    tooling,
    ledger,
    storeStats,
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
      storeStats,
    },
  });
  return dashboard;
}
