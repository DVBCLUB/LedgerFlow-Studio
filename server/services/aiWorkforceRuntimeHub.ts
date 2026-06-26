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
import {
  appendAIWorkforceRuntimeRecord,
  getAIWorkforceRuntimeStoreStats,
  listAIWorkforceRuntimeRecords,
} from './aiWorkforceRuntimeStore.ts';

export interface RuntimeGroundedContextOptions extends GroundedContextRequest {
  highImpact?: boolean;
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
  recordAIRunMetric({
    lane: 'knowledge-spine',
    agentRole: 'Memory Agent',
    toolId: 'grounded_context_pack',
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
  recordAIRunMetric({
    lane: 'execution-layer',
    agentRole: 'Automation Safety Agent',
    toolId: `${plan.surface}_safety_envelope`,
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
  recordAIRunMetric({
    lane: 'mission-control',
    agentRole: 'Software Factory Agent',
    toolId: 'pr_readiness_scorer',
    status: report.verdict === 'ready' ? 'success' : report.verdict === 'needs_review' ? 'needs_review' : 'blocked',
    latencyMs: Date.now() - startedAt,
    qualityScore: report.score / 100,
    safetyBlocks: report.blockers.length,
  });

  return report;
}

export async function getAIWorkforceRuntimeDashboard() {
  const readiness = assessAIWorkforceReadiness();
  const observability = summarizeAIObservability(listAIRunMetrics());
  const storeStats = await getAIWorkforceRuntimeStoreStats();
  const recentRecords = await listAIWorkforceRuntimeRecords({ limit: 10 });
  const dashboard = {
    generatedAt: new Date().toISOString(),
    readiness,
    observability,
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
      storeStats,
    },
  });
  return dashboard;
}
