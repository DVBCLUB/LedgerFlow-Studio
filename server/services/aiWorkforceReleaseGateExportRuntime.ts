import { buildAIWorkforceReleaseGateExport, type AIWorkforceReleaseGateExportFormat } from './aiWorkforceReleaseGateExport.ts';
import { appendAIWorkforceRuntimeRecord } from './aiWorkforceRuntimeStore.ts';
import { appendAIWorkforceAuditEvent } from './aiWorkforceOperationalLedger.ts';
import { recordAIRunMetric } from './aiBenchmarkObservability.ts';
import { appendAIWorkforceRunMetric } from './aiWorkforceRunMetricStore.ts';
import { pruneRuntimeRecordsByType } from './aiWorkforceRuntimeRecordRetention.ts';

const DEFAULT_RELEASE_GATE_EXPORT_RETENTION = 10;

export interface BuildRuntimeReleaseGateExportOptions {
  format?: AIWorkforceReleaseGateExportFormat;
  actor?: string;
  createdAt?: string;
  retentionLimit?: number;
}

function resolveRetentionLimit(input?: number) {
  const raw = input ?? Number(process.env.AI_WORKFORCE_RELEASE_GATE_EXPORT_RETENTION || DEFAULT_RELEASE_GATE_EXPORT_RETENTION);
  return Number.isFinite(raw) ? Math.max(1, Math.floor(raw)) : DEFAULT_RELEASE_GATE_EXPORT_RETENTION;
}

export async function buildRuntimeReleaseGateExport(options: BuildRuntimeReleaseGateExportOptions = {}) {
  const startedAt = Date.now();
  const createdAt = options.createdAt || new Date().toISOString();
  const actor = options.actor || 'Mission Operator';
  const retentionLimit = resolveRetentionLimit(options.retentionLimit);
  const { exportArtifact, dashboard } = await buildAIWorkforceReleaseGateExport({ format: options.format, createdAt });

  const runtimeRecord = await appendAIWorkforceRuntimeRecord({
    id: exportArtifact.id,
    type: 'release_gate_export',
    createdAt,
    payload: {
      format: exportArtifact.format,
      filename: exportArtifact.filename,
      checksum: exportArtifact.checksum,
      summary: exportArtifact.summary,
      latestDecision: exportArtifact.summary.latestDecision,
      trendDirection: exportArtifact.summary.trendDirection,
      readyRate: exportArtifact.summary.readyRate,
      timelineItems: exportArtifact.summary.timelineItems,
    },
  });
  const retention = await pruneRuntimeRecordsByType({ type: 'release_gate_export', keep: retentionLimit });

  const auditEvent = await appendAIWorkforceAuditEvent({
    action: 'release_gate_exported',
    severity: exportArtifact.summary.latestReleaseReady === false ? 'warning' : 'info',
    actor,
    summary: `Release gate ${exportArtifact.format} export created: ${exportArtifact.filename}.`,
    entityId: exportArtifact.id,
    createdAt,
    metadata: {
      exportId: exportArtifact.id,
      format: exportArtifact.format,
      filename: exportArtifact.filename,
      checksum: exportArtifact.checksum,
      summary: exportArtifact.summary,
      retention,
    },
  });

  const metric = recordAIRunMetric({
    lane: 'mission-control',
    agentRole: 'Release Gate Exporter',
    toolId: 'release_gate_export',
    status: 'success',
    latencyMs: Math.max(0, Date.now() - startedAt),
    qualityScore: 0.94,
    safetyBlocks: 0,
    createdAt,
  });
  await appendAIWorkforceRunMetric(metric);

  return { exportArtifact, dashboard, runtimeRecord, auditEvent, metric, retention };
}
