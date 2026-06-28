import { listAIWorkforceAuditEvents } from './aiWorkforceOperationalLedger.ts';
import { listAIWorkforceRunMetrics } from './aiWorkforceRunMetricStore.ts';
import { listAIWorkforceRuntimeRecords } from './aiWorkforceRuntimeStore.ts';

export async function getAIWorkforceReleaseGateDashboard() {
  const [records, auditEvents, metrics] = await Promise.all([
    listAIWorkforceRuntimeRecords({ type: 'mission_release_gate', limit: 5 }),
    listAIWorkforceAuditEvents(50),
    listAIWorkforceRunMetrics({ lane: 'mission-control', limit: 50 }),
  ]);
  const latestRecord = records[0] || null;
  const latestAuditEvent = auditEvents.find((event) => event.action === 'mission_release_gate_recorded') || null;
  const latestMetric = metrics.find((metric) => metric.toolId === 'mission_release_gate') || null;
  const payload = latestRecord?.payload as any;

  return {
    totalRecords: records.length,
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
