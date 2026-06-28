import { listAIWorkforceAuditEvents } from './aiWorkforceOperationalLedger.ts';
import { listAIWorkforceRunMetrics } from './aiWorkforceRunMetricStore.ts';
import { listAIWorkforceRuntimeRecords } from './aiWorkforceRuntimeStore.ts';

function releaseGateTimelineItem(record: any) {
  const payload = record?.payload || {};
  return {
    id: record?.id,
    createdAt: record?.createdAt,
    queueId: payload.queueId,
    missionId: payload.missionId,
    decision: payload.decision,
    releaseReady: payload.releaseReady,
    score: payload.score,
    checksum: payload.checksum,
    finalAction: payload.finalAction,
    missingEvidence: payload.missingEvidence || [],
    warnings: payload.warnings || [],
  };
}

export async function getAIWorkforceReleaseGateDashboard() {
  const [records, auditEvents, metrics] = await Promise.all([
    listAIWorkforceRuntimeRecords({ type: 'mission_release_gate', limit: 10 }),
    listAIWorkforceAuditEvents(50),
    listAIWorkforceRunMetrics({ lane: 'mission-control', limit: 50 }),
  ]);
  const latestRecord = records[0] || null;
  const latestAuditEvent = auditEvents.find((event) => event.action === 'mission_release_gate_recorded') || null;
  const latestMetric = metrics.find((metric) => metric.toolId === 'mission_release_gate') || null;
  const payload = latestRecord?.payload as any;
  const timeline = records.map(releaseGateTimelineItem);

  return {
    totalRecords: records.length,
    timeline,
    latestRecord,
    latestAuditEvent,
    latestMetric,
    latestDecision: payload?.decision || latestAuditEvent?.metadata?.decision || null,
    latestReleaseReady: typeof payload?.releaseReady === 'boolean' ? payload.releaseReady : latestAuditEvent?.metadata?.releaseReady ?? null,
    latestScore: typeof payload?.score === 'number' ? payload.score : latestAuditEvent?.metadata?.score ?? null,
    latestChecksum: payload?.checksum || latestAuditEvent?.metadata?.checksum || null,
    latestFinalAction: payload?.finalAction || latestAuditEvent?.metadata?.finalAction || null,
    latestMissingEvidence: payload?.missingEvidence || latestAuditEvent?.metadata?.missingEvidence || [],
  };
}
