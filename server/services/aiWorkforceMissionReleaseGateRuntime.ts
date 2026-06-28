import type { MissionOperatorReleaseEvidence } from './aiWorkforceMissionReleaseGate.ts';
import { buildMissionOperatorReleaseGate } from './aiWorkforceMissionReleaseGate.ts';
import { requireMissionExecutionQueue } from './aiWorkforceMissionExecutionQueueStore.ts';
import { buildStoredMissionOperatorReviewDossier } from './aiWorkforceMissionReviewNoteStore.ts';
import { appendAIWorkforceRuntimeRecord } from './aiWorkforceRuntimeStore.ts';
import { appendAIWorkforceAuditEvent } from './aiWorkforceOperationalLedger.ts';
import { recordAIRunMetric } from './aiBenchmarkObservability.ts';
import { appendAIWorkforceRunMetric } from './aiWorkforceRunMetricStore.ts';

export interface BuildRuntimeMissionReleaseGateOptions {
  queueId: string;
  evidence?: MissionOperatorReleaseEvidence;
  actor?: string;
  createdAt?: string;
}

export async function buildRuntimeMissionReleaseGate(options: BuildRuntimeMissionReleaseGateOptions) {
  const startedAt = Date.now();
  const createdAt = options.createdAt || new Date().toISOString();
  const actor = options.actor || 'Mission Operator';
  const queue = await requireMissionExecutionQueue(options.queueId);
  const dossier = await buildStoredMissionOperatorReviewDossier(queue, [], createdAt);
  const gate = buildMissionOperatorReleaseGate(queue, dossier, options.evidence || {}, createdAt);

  const runtimeRecord = await appendAIWorkforceRuntimeRecord({
    id: gate.id,
    type: 'mission_release_gate',
    createdAt,
    payload: {
      queueId: queue.id,
      missionId: queue.missionId,
      decision: gate.decision,
      releaseReady: gate.releaseReady,
      score: gate.score,
      checksum: gate.checksum,
      missingEvidence: gate.missingEvidence,
      warnings: gate.warnings,
      finalAction: gate.finalAction,
      evidence: gate.evidence,
      reviewStatus: dossier.status,
      reviewNotes: dossier.summary.totalNotes,
    },
  });

  const auditEvent = await appendAIWorkforceAuditEvent({
    action: 'mission_release_gate_recorded',
    severity: gate.releaseReady ? 'info' : gate.decision === 'not_ready' ? 'critical' : 'warning',
    actor,
    summary: `Mission release gate ${gate.decision} with score ${gate.score}.`,
    entityId: queue.id,
    createdAt,
    metadata: {
      gateId: gate.id,
      missionId: queue.missionId,
      checksum: gate.checksum,
      decision: gate.decision,
      releaseReady: gate.releaseReady,
      score: gate.score,
      missingEvidence: gate.missingEvidence,
      warnings: gate.warnings,
      finalAction: gate.finalAction,
      reviewStatus: dossier.status,
      reviewNotes: dossier.summary.totalNotes,
    },
  });

  const metric = recordAIRunMetric({
    lane: 'mission-control',
    agentRole: 'Mission Release Gate',
    toolId: 'mission_release_gate',
    status: gate.releaseReady ? 'success' : gate.decision === 'not_ready' ? 'blocked' : 'needs_review',
    latencyMs: Math.max(0, Date.now() - startedAt),
    qualityScore: gate.releaseReady ? 0.96 : 0.72,
    safetyBlocks: gate.missingEvidence.length,
    createdAt,
  });
  await appendAIWorkforceRunMetric(metric);

  return { gate, dossier, runtimeRecord, auditEvent, metric };
}
