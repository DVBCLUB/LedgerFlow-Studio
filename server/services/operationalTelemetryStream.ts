/**
 * operationalTelemetryStream.ts
 * ============================================================
 * Real-Time OS Telemetry Stream & System Diagnostics Engine for LedgerFlow OS.
 *
 * Provides real-time operational telemetry & 1-click diagnostics:
 *  - System Heartbeat, Process Uptime & Memory Metrics (`process.memoryUsage()`)
 *  - AI Gateway Latency Distribution & Circuit Breaker Telemetry
 *  - 1-Click System Diagnostics Snapshot for Dev Handoff.
 */

import { randomUUID } from 'node:crypto';
import { getCircuitBreakerStatus } from './aiRouter.ts';
import { getAgentLoopJobStats } from './agentLoopJobRunner.ts';
import { getSystemEventHistory } from './crossSystemEventBus.ts';
import { appendAuditEvent } from './auditLog.ts';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OSTelemetrySnapshot {
  systemUptimeSeconds: number;
  memoryUsageMB: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
  };
  circuitBreakerHealth: Record<string, { state: string; failureCount: number }>;
  backgroundLoopJobs: {
    running: number;
    queued: number;
    completed: number;
    failed: number;
  };
  recentEventsCount: number;
  sampledAt: string;
}

export interface DiagnosticsReport {
  id: string;
  reason: string;
  requestedBy: string;
  telemetry: OSTelemetrySnapshot;
  recentEvents: Array<{ id: string; type: string; summary: string; timestamp: string }>;
  diagnosticSummary: string;
  generatedAt: string;
}

// ─── Core Engine ──────────────────────────────────────────────────────────────

/**
 * Returns a real-time OS telemetry snapshot.
 */
export function getOperationalTelemetryStream(): OSTelemetrySnapshot {
  const mem = process.memoryUsage();
  const cbStatus = getCircuitBreakerStatus();
  const loopStats = getAgentLoopJobStats();
  const events = getSystemEventHistory(20);

  return {
    systemUptimeSeconds: Math.round(process.uptime()),
    memoryUsageMB: {
      rss: Math.round(mem.rss / (1024 * 1024)),
      heapTotal: Math.round(mem.heapTotal / (1024 * 1024)),
      heapUsed: Math.round(mem.heapUsed / (1024 * 1024)),
    },
    circuitBreakerHealth: cbStatus,
    backgroundLoopJobs: loopStats,
    recentEventsCount: events.length,
    sampledAt: new Date().toISOString(),
  };
}

/**
 * Generates a 1-Click System Diagnostics Snapshot for Dev Handoff.
 */
export async function generateDiagnosticsSnapshot(options: {
  reason?: string;
  requestedBy?: string;
} = {}): Promise<DiagnosticsReport> {
  const reportId = `diag_${Date.now()}_${randomUUID().slice(0, 6)}`;
  const reason = options.reason || 'Routine OS System Health Check';
  const requestedBy = options.requestedBy || 'executive';

  const telemetry = getOperationalTelemetryStream();
  const events = getSystemEventHistory(10).map((e) => ({
    id: e.id,
    type: e.type,
    summary: e.summary,
    timestamp: e.timestamp,
  }));

  const openBreakers = Object.values(telemetry.circuitBreakerHealth).filter((cb) => cb.state === 'open').length;
  const summary = [
    `Diagnostics Snapshot [${reportId}]: Reason "${reason}".`,
    `System Uptime: ${telemetry.systemUptimeSeconds}s | Memory Used: ${telemetry.memoryUsageMB.heapUsed}MB.`,
    `Circuit Breakers: ${openBreakers} open | Background Jobs: ${telemetry.backgroundLoopJobs.completed} completed, ${telemetry.backgroundLoopJobs.queued} queued.`,
  ].join(' ');

  const report: DiagnosticsReport = {
    id: reportId,
    reason,
    requestedBy,
    telemetry,
    recentEvents: events,
    diagnosticSummary: summary,
    generatedAt: new Date().toISOString(),
  };

  await appendAuditEvent({
    actor: requestedBy,
    workspace: 'Diagnostics',
    action: 'diagnostics.snapshot_generated',
    target: reportId,
    risk: 'LOW',
    status: 'executed',
    summary,
    evidence: { reportId, reason, openBreakers },
  }).catch(() => undefined);

  return report;
}
