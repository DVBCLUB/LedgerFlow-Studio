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

function releaseGateExportHistoryItem(record: any) {
  const payload = record?.payload || {};
  return {
    id: record?.id,
    createdAt: record?.createdAt,
    format: payload.format,
    filename: payload.filename,
    checksum: payload.checksum,
    latestDecision: payload.latestDecision,
    trendDirection: payload.trendDirection,
    readyRate: payload.readyRate,
    timelineItems: payload.timelineItems,
    summary: payload.summary || {},
  };
}

function buildReleaseGateTrendAnalytics(timeline: any[]) {
  const total = timeline.length;
  const decisionBreakdown = timeline.reduce<Record<string, number>>((acc, item) => {
    const key = item.decision || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const readyCount = timeline.filter((item) => item.releaseReady === true).length;
  const scores = timeline.map((item) => Number(item.score)).filter((score) => Number.isFinite(score));
  const averageScore = scores.length ? Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2)) : null;
  const latestScore = scores.length ? scores[0] : null;
  const previousScore = scores.length > 1 ? scores[1] : null;
  const scoreDelta = latestScore !== null && previousScore !== null ? Number((latestScore - previousScore).toFixed(2)) : 0;
  const trendDirection = scoreDelta > 0 ? 'improving' : scoreDelta < 0 ? 'declining' : 'flat';
  return {
    total,
    readyCount,
    holdCount: decisionBreakdown.hold || 0,
    notReadyCount: decisionBreakdown.not_ready || 0,
    readyRate: total ? Number((readyCount / total).toFixed(3)) : 0,
    averageScore,
    latestScore,
    previousScore,
    scoreDelta,
    trendDirection,
    decisionBreakdown,
  };
}

export async function getAIWorkforceReleaseGateDashboard() {
  const [records, exportRecords, auditEvents, metrics] = await Promise.all([
    listAIWorkforceRuntimeRecords({ type: 'mission_release_gate', limit: 10 }),
    listAIWorkforceRuntimeRecords({ type: 'release_gate_export', limit: 10 }),
    listAIWorkforceAuditEvents(50),
    listAIWorkforceRunMetrics({ lane: 'mission-control', limit: 50 }),
  ]);
  const latestRecord = records[0] || null;
  const latestExportRecord = exportRecords[0] || null;
  const latestAuditEvent = auditEvents.find((event) => event.action === 'mission_release_gate_recorded') || null;
  const latestExportAuditEvent = auditEvents.find((event) => event.action === 'release_gate_exported') || null;
  const latestMetric = metrics.find((metric) => metric.toolId === 'mission_release_gate') || null;
  const latestExportMetric = metrics.find((metric) => metric.toolId === 'release_gate_export') || null;
  const payload = latestRecord?.payload as any;
  const timeline = records.map(releaseGateTimelineItem);
  const exportHistory = exportRecords.map(releaseGateExportHistoryItem);
  const trendAnalytics = buildReleaseGateTrendAnalytics(timeline);

  return {
    totalRecords: records.length,
    totalExports: exportRecords.length,
    timeline,
    exportHistory,
    latestExport: exportHistory[0] || null,
    latestExportRecord,
    latestExportAuditEvent,
    latestExportMetric,
    trendAnalytics,
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
