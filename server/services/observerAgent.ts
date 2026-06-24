/**
 * observerAgent.ts
 * ============================================================
 * Observer Agent — giám sát toàn bộ hệ thống AI 24/7.
 * Định kỳ kiểm tra health của Fabric, Memory, Sandbox, Triggers,
 * Agent Loop, và gửi cảnh báo qua audit log khi phát hiện
 * bất thường.
 */
import { appendAuditEvent } from './auditLog';
import { checkFabricHealth } from './aiFabric';
import { getStats as getCompoundMemoryStats } from './compoundMemory';
import { getAgenticLoopMetrics } from './agenticLoopEngine';

// ─── Types ──────────────────────────────────────────────────────────

export interface ObserverCheck {
  id: string;
  component: string;
  status: 'ok' | 'degraded' | 'down' | 'unknown';
  message: string;
  detail: Record<string, unknown>;
  checkedAt: string;
  latencyMs: number;
}

export interface ObserverReport {
  id: string;
  generatedAt: string;
  checks: ObserverCheck[];
  summary: {
    total: number;
    ok: number;
    degraded: number;
    down: number;
  };
  alerts: string[];
  recommendations: string[];
}

export interface ObserverConfig {
  intervalMs: number;          // Khoảng cách giữa các lần check (default 30s)
  alertOnDegraded: boolean;    // Cảnh báo khi degraded
  maxAlertsBeforeEscalate: number;
  enabled: boolean;
}

// ─── State ──────────────────────────────────────────────────────────
const reports: ObserverReport[] = [];
let config: ObserverConfig = {
  intervalMs: 30_000,
  alertOnDegraded: true,
  maxAlertsBeforeEscalate: 3,
  enabled: false,
};
let intervalHandle: ReturnType<typeof setInterval> | null = null;
let consecutiveDegraded = 0;

// ─── Core ───────────────────────────────────────────────────────────

export async function runObserverCheck(): Promise<ObserverReport> {
  const id = `obs_${Date.now()}`;
  const checks: ObserverCheck[] = [];
  const alerts: string[] = [];
  const recommendations: string[] = [];

  // 1. AI Fabric health
  try {
    const start = Date.now();
    const health = await checkFabricHealth();
    checks.push({
      id: `${id}_fabric`, component: 'AI Fabric',
      status: health.ok ? 'ok' : 'degraded',
      message: health.message,
      detail: { apiKeys: health.apiKeys, webProfiles: health.webProfiles, localAvailable: health.localAvailable },
      checkedAt: new Date().toISOString(), latencyMs: Date.now() - start,
    });
    if (!health.ok) {
      alerts.push(`AI Fabric degraded: ${health.message}`);
      recommendations.push('Kiểm tra API keys và web profiles. Cấu hình thêm ít nhất 1 key hoặc enable Ollama local.');
    }
  } catch (err: any) {
    checks.push({ id: `${id}_fabric`, component: 'AI Fabric', status: 'down', message: err.message, detail: {}, checkedAt: new Date().toISOString(), latencyMs: 0 });
    alerts.push('AI Fabric DOWN: cannot check health.');
  }

  // 2. Compound Memory health
  try {
    const start = Date.now();
    const stats = await getCompoundMemoryStats();
    checks.push({
      id: `${id}_memory`, component: 'Compound Memory',
      status: 'ok',
      message: `${stats.totalRecords} records across 3 tiers`,
      detail: { session: stats.session.count, shortTerm: stats.shortTerm.count, longTerm: stats.longTerm.count },
      checkedAt: new Date().toISOString(), latencyMs: Date.now() - start,
    });
    if (stats.totalRecords > 100) {
      recommendations.push(`Memory đang phát triển (${stats.totalRecords} records). Cân nhắc curate vào long-term.`);
    }
  } catch (err: any) {
    checks.push({ id: `${id}_memory`, component: 'Compound Memory', status: 'degraded', message: err.message, detail: {}, checkedAt: new Date().toISOString(), latencyMs: 0 });
  }

  // 3. Agent Loop health
  try {
    const start = Date.now();
    const metrics = getAgenticLoopMetrics();
    const failed = metrics.failed || 0;
    const running = metrics.running || 0;
    let status: ObserverCheck['status'] = 'ok';
    let msg = `${metrics.completed} completed, ${failed} failed, ${running} running`;
    if (failed > 0) {
      status = 'degraded';
      alerts.push(`${failed} agentic loop(s) failed.`);
      recommendations.push('Kiểm tra Agent Loop Monitor để xem chi tiết lỗi từng bước.');
    }
    if (running > 3) {
      alerts.push(`${running} loops đang chạy đồng thời. Có thể gây quá tải.`);
    }
    checks.push({ id: `${id}_loop`, component: 'Agent Loop', status, message: msg, detail: metrics as any, checkedAt: new Date().toISOString(), latencyMs: Date.now() - start });
  } catch (err: any) {
    checks.push({ id: `${id}_loop`, component: 'Agent Loop', status: 'degraded', message: err.message, detail: {}, checkedAt: new Date().toISOString(), latencyMs: 0 });
  }

  // Build report
  const okCount = checks.filter(c => c.status === 'ok').length;
  const degradedCount = checks.filter(c => c.status === 'degraded').length;
  const downCount = checks.filter(c => c.status === 'down').length;
  const total = checks.length;

  const report: ObserverReport = {
    id,
    generatedAt: new Date().toISOString(),
    checks,
    summary: { total, ok: okCount, degraded: degradedCount, down: downCount },
    alerts,
    recommendations,
  };

  reports.push(report);
  if (reports.length > 100) reports.shift();

  // Handle alerting
  if (alerts.length > 0) {
    consecutiveDegraded++;
    if (consecutiveDegraded >= config.maxAlertsBeforeEscalate) {
      await appendAuditEvent({
        actor: 'observer',
        workspace: 'Observer Agent',
        action: 'observer.escalate',
        target: 'system-health',
        risk: 'HIGH',
        status: 'failed',
        summary: `ESCALATION: ${consecutiveDegraded} consecutive checks with alerts. Alerts: ${alerts.join('; ')}`,
        connectorId: 'observer-agent',
        evidence: { reportId: id, alerts, consecutiveDegraded },
      }).catch(() => undefined);
    } else {
      await appendAuditEvent({
        actor: 'observer',
        workspace: 'Observer Agent',
        action: 'observer.alert',
        target: alerts[0]?.slice(0, 80) || 'system',
        risk: 'MEDIUM',
        status: 'executed',
        summary: `Health check found ${alerts.length} issue(s): ${alerts.slice(0, 2).join('; ')}`,
        connectorId: 'observer-agent',
        evidence: { reportId: id, summary: report.summary },
      }).catch(() => undefined);
    }
  } else {
    // Reset escalation counter on clean checks
    consecutiveDegraded = 0;
  }

  return report;
}

// ─── Start / Stop ───────────────────────────────────────────────────

export function startObserver(override?: Partial<ObserverConfig>): void {
  if (override) config = { ...config, ...override };
  if (!config.enabled) return;
  if (intervalHandle) return; // Already running

  intervalHandle = setInterval(() => {
    runObserverCheck().catch(() => undefined);
  }, config.intervalMs);

  // Run immediately on start
  runObserverCheck().catch(() => undefined);

  console.log(`[Observer Agent] Started. Interval: ${config.intervalMs}ms.`);
}

export function stopObserver(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
  console.log('[Observer Agent] Stopped.');
}

export function getObserverConfig(): ObserverConfig {
  return { ...config };
}

export function getLatestReport(): ObserverReport | undefined {
  return reports[reports.length - 1];
}

export function listRecentReports(limit = 20): ObserverReport[] {
  return reports.slice(-limit).reverse();
}

export function getObserverHealth(): {
  running: boolean;
  lastCheckAt?: string;
  totalChecks: number;
  consecutiveDegraded: number;
} {
  return {
    running: intervalHandle !== null,
    lastCheckAt: reports[reports.length - 1]?.generatedAt,
    totalChecks: reports.length,
    consecutiveDegraded,
  };
}
