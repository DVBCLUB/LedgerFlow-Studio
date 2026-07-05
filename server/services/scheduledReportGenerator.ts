/**
 * scheduledReportGenerator.ts
 * ============================================================
 * Scheduled Report Generator — tự động sinh báo cáo AI
 * theo lịch định kỳ (hàng ngày, hàng tuần, hàng tháng).
 *
 * Reports: daily summary, weekly analytics, monthly trends,
 * system health, cost analysis, agent performance.
 */
import { randomUUID } from 'node:crypto';
import { dispatchTextThroughFabric } from './aiFabric';
import { captureTelemetry } from './aiSystemTelemetry';
import { generateAnalyticsReport } from './agentAnalytics';
import { getSnapshot } from './costObservability';
import { getStats as getMemoryStats } from './compoundMemory';
import { getBenchmarkRuns } from './modelBenchmark';
import { appendAuditEvent } from './auditLog';
import fs from 'fs';
import path from 'path';
import { ensureRuntimeRootSync, resolveRuntimeDirPath, resolveRuntimePathFromEnv, resolveRuntimeReadDirFromEnv, resolveRuntimeReadPathFromEnv } from './runtimePaths.ts';

// ─── Types ──────────────────────────────────────────────────────────
export type ReportType = 'daily' | 'weekly' | 'monthly' | 'custom';
export type ReportFormat = 'markdown' | 'html' | 'json';

export interface ReportSchedule {
  id: string;
  name: string;
  type: ReportType;
  cronExpression: string;
  format: ReportFormat;
  sections: ReportSection[];
  outputDir: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastGeneratedAt?: string;
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'ai_generated' | 'metrics_table' | 'cost_analysis' | 'agent_performance' | 'system_health';
  description: string;
  enabled: boolean;
}

export interface GeneratedReport {
  id: string;
  scheduleId: string;
  scheduleName: string;
  type: ReportType;
  format: ReportFormat;
  content: string;
  filePath: string;
  sections: number;
  generatedAt: string;
  generationMs: number;
}

// ─── Storage ────────────────────────────────────────────────────────
const SCHEDULES_FILE = resolveRuntimePathFromEnv('REPORT_SCHEDULES_FILE', 'report_schedules.json');
const REPORTS_DIR = path.join(resolveRuntimeDirPath('reports'), 'auto-generated');
const REPORTS_READ_DIR = path.join(resolveRuntimeReadDirFromEnv('REPORTS_DIR', 'reports'), 'auto-generated');

let schedules: ReportSchedule[] = [];
let generated: GeneratedReport[] = [];
const cronTimers = new Map<string, ReturnType<typeof setInterval>>();

async function init(): Promise<void> {
  try {
    if (!fs.existsSync(REPORTS_DIR)) await fs.promises.mkdir(REPORTS_DIR, { recursive: true });
    const schedulesFile = resolveRuntimeReadPathFromEnv('REPORT_SCHEDULES_FILE', 'report_schedules.json');
    if (fs.existsSync(schedulesFile)) schedules = JSON.parse(await fs.promises.readFile(schedulesFile, 'utf8'));
    // Load previously generated reports
    if (fs.existsSync(REPORTS_READ_DIR)) {
      const files = fs.readdirSync(REPORTS_READ_DIR).filter(f => f.endsWith('.report.json'));
      for (const f of files.slice(-20)) {
        try { generated.push(JSON.parse(await fs.promises.readFile(path.join(REPORTS_READ_DIR, f), 'utf8'))); } catch { }
      }
    }
  } catch { }
}
init().catch(() => undefined);

async function saveSchedules(): Promise<void> {
  ensureRuntimeRootSync();
  await fs.promises.writeFile(SCHEDULES_FILE, JSON.stringify(schedules, null, 2), 'utf8');
}

// ─── Core API ───────────────────────────────────────────────────────

export function createSchedule(input: {
  name: string; type?: ReportType; cronExpression?: string;
  format?: ReportFormat; sections?: ReportSection[]; outputDir?: string;
}): ReportSchedule {
  const now = new Date().toISOString();
  const schedule: ReportSchedule = {
    id: `rpt_${Date.now()}_${randomUUID().slice(0, 6)}`,
    name: input.name.slice(0, 100),
    type: input.type || 'daily',
    cronExpression: input.cronExpression || getDefaultCron(input.type || 'daily'),
    format: input.format || 'markdown',
    sections: input.sections || getDefaultSections(input.type || 'daily'),
    outputDir: input.outputDir || REPORTS_DIR,
    enabled: true,
    createdAt: now,
    updatedAt: now,
  };
  schedules.push(schedule);
  saveSchedules().catch(() => undefined);
  startCron(schedule);
  return schedule;
}

export function getSchedule(id: string): ReportSchedule | undefined { return schedules.find(s => s.id === id); }
export function listSchedules(): ReportSchedule[] { return [...schedules]; }

export function deleteSchedule(id: string): boolean {
  const timer = cronTimers.get(id);
  if (timer) { clearInterval(timer); cronTimers.delete(id); }
  const idx = schedules.findIndex(s => s.id === id);
  if (idx < 0) return false;
  schedules.splice(idx, 1);
  saveSchedules().catch(() => undefined);
  return true;
}

// ─── Report Generation ──────────────────────────────────────────────

export async function generateReport(scheduleId: string): Promise<GeneratedReport> {
  const schedule = schedules.find(s => s.id === scheduleId);
  if (!schedule) throw new Error(`Schedule "${scheduleId}" not found.`);

  const reportId = `rgen_${Date.now()}`;
  const started = Date.now();

  // Gather data
  const [telemetry, analytics, cost, memStats] = await Promise.all([
    captureTelemetry().catch(() => null),
    generateAnalyticsReport(30).catch(() => null),
    Promise.resolve(getSnapshot(30)),
    getMemoryStats().catch(() => ({ totalRecords: 0 })),
  ]);

  const parts: string[] = [];
  const activeSections = schedule.sections.filter(s => s.enabled);

  for (const section of activeSections) {
    switch (section.type) {
      case 'metrics_table': {
        parts.push(`## ${section.title}\n\n`);
        parts.push(`| Metric | Value |\n|--------|-------|\n`);
        if (telemetry) {
          parts.push(`| Health Score | ${telemetry.healthScore}/100 |\n`);
          parts.push(`| API p95 Latency | ${telemetry.latency.api.p95}ms |\n`);
          parts.push(`| Requests/min | ${telemetry.throughput.requestsPerMinute} |\n`);
          parts.push(`| Error Rate | ${telemetry.errors.errorRate}% |\n`);
          parts.push(`| Memory | ${telemetry.resources.memoryMB}MB |\n`);
          parts.push(`| Uptime | ${telemetry.resources.uptimeMinutes} min |\n`);
        }
        parts.push('\n');
        break;
      }
      case 'cost_analysis': {
        parts.push(`## ${section.title}\n\n`);
        parts.push(`**Total cost (30 days):** $${cost.totalCostUsd.toFixed(5)}\n\n`);
        parts.push(`| Agent | Cost | Calls |\n|-------|------|-------|\n`);
        for (const [agent, data] of Object.entries(cost.byAgent)) {
          parts.push(`| ${agent} | $${(data as any).cost.toFixed(5)} | ${(data as any).calls} |\n`);
        }
        parts.push('\n');
        break;
      }
      case 'agent_performance': {
        parts.push(`## ${section.title}\n\n`);
        if (analytics) {
          for (const ap of analytics.agentPerformance.slice(0, 5)) {
            const trend = ap.trend === 'improving' ? '↑' : ap.trend === 'declining' ? '↓' : '→';
            parts.push(`- **${ap.agent}**: ${ap.successRate}% success, ${ap.totalCalls} calls, $${ap.totalCostUsd.toFixed(4)} ${trend}\n`);
          }
          if (analytics.recommendations.length > 0) {
            parts.push('\n**Recommendations:**\n');
            for (const r of analytics.recommendations.slice(0, 3)) parts.push(`- ${r}\n`);
          }
        }
        parts.push('\n');
        break;
      }
      case 'system_health': {
        parts.push(`## ${section.title}\n\n`);
        parts.push(`- **Daemon**: ${telemetry ? 'Running' : 'Unknown'}\n`);
        parts.push(`- **Observer**: Auto-started\n`);
        parts.push(`- **Self-Healing**: Auto-started\n`);
        parts.push(`- **Memory records**: ${(memStats as any).totalRecords} total\n`);
        if (telemetry?.bottlenecks.length) {
          parts.push(`- **Bottlenecks**: ${telemetry.bottlenecks.length} detected\n`);
          for (const b of telemetry.bottlenecks) {
            parts.push(`  - [${b.severity}] ${b.component}: ${b.description}\n`);
          }
        } else {
          parts.push(`- **Bottlenecks**: None\n`);
        }
        parts.push('\n');
        break;
      }
      case 'ai_generated': {
        parts.push(`## ${section.title}\n\n`);
        try {
          const context = buildReportContext(section, { telemetry, analytics, cost });
          const aiResult = await dispatchTextThroughFabric(
            `Generate a ${schedule.type} report section titled "${section.title}". ${section.description}\n\nContext:\n${context}`,
            'Bạn là một AI Reporter. Viết báo cáo ngắn gọn, có số liệu, chuyên nghiệp.',
            { domain: 'general', localFallback: true }
          );
          parts.push(aiResult.winner?.contentPreview || `AI generation unavailable. ${section.description}`);
          parts.push('\n\n');
        } catch {
          parts.push(`*AI generation skipped - no provider available.*\n\n`);
        }
        break;
      }
    }
  }

  // Build report
  const title = `${schedule.name} - ${new Date().toLocaleDateString()}`;
  let content = `# ${title}\n\n**Generated:** ${new Date().toISOString()} | **Type:** ${schedule.type} | **Sections:** ${activeSections.length}\n\n---\n\n`;
  content += parts.join('');

  // Write to file
  const fileName = `${schedule.type}_${new Date().toISOString().slice(0, 10)}_${reportId.slice(-6)}.${schedule.format === 'json' ? 'report.json' : 'md'}`;
  const filePath = path.join(schedule.outputDir, fileName);

  if (schedule.format === 'json') {
    await fs.promises.writeFile(filePath, JSON.stringify({
      title: schedule.name, type: schedule.type, content, sections: activeSections.length,
      metrics: telemetry ? { health: telemetry.healthScore, latency: telemetry.latency.api, throughput: telemetry.throughput } : null,
      generatedAt: new Date().toISOString(),
    }, null, 2), 'utf8');
  } else {
    await fs.promises.writeFile(filePath, content, 'utf8');
  }

  const report: GeneratedReport = {
    id: reportId,
    scheduleId: schedule.id,
    scheduleName: schedule.name,
    type: schedule.type,
    format: schedule.format,
    content,
    filePath,
    sections: activeSections.length,
    generatedAt: new Date().toISOString(),
    generationMs: Date.now() - started,
  };

  generated.push(report);
  schedule.lastGeneratedAt = report.generatedAt;

  await appendAuditEvent({
    actor: 'system', workspace: 'Report Generator', action: 'report.generated',
    target: schedule.name, risk: 'LOW', status: 'executed',
    summary: `Report "${schedule.name}": ${report.sections} sections, ${(report.generationMs / 1000).toFixed(1)}s`,
    connectorId: 'report-generator',
    evidence: { reportId, type: schedule.type, sections: report.sections },
  }).catch(() => undefined);

  return report;
}

function buildReportContext(section: ReportSection, data: any): string {
  const ctx: string[] = [];
  if (data.telemetry) ctx.push(`Health: ${data.telemetry.healthScore}/100, API p95: ${data.telemetry.latency.api.p95}ms, Error Rate: ${data.telemetry.errors.errorRate}%`);
  if (data.analytics) ctx.push(`Agents: ${data.analytics.agentPerformance.map((a: any) => `${a.agent}(${a.successRate}%)`).join(', ')}`);
  if (data.cost) ctx.push(`Total cost (30d): $${data.cost.totalCostUsd.toFixed(5)}`);
  return ctx.join('\n');
}

// ─── Cron ───────────────────────────────────────────────────────────

function startCron(schedule: ReportSchedule): void {
  if (!schedule.enabled) return;
  if (cronTimers.has(schedule.id)) return;

  const parts = schedule.cronExpression.split(/\s+/);
  if (parts.length < 2) return;
  const minute = parts[0] === '*' ? -1 : parseInt(parts[0]);
  const hour = parts[1] === '*' ? -1 : parseInt(parts[1]);

  const check = () => {
    const now = new Date();
    if ((minute === -1 || now.getMinutes() === minute) && (hour === -1 || now.getHours() === hour)) {
      generateReport(schedule.id).catch(() => undefined);
    }
  };
  const timer = setInterval(check, 60000);
  cronTimers.set(schedule.id, timer);
  console.log(`[Report Generator] Cron: "${schedule.name}" (${schedule.cronExpression})`);
}

function getDefaultCron(type: ReportType): string {
  switch (type) {
    case 'daily': return '0 9 * * *';     // 9AM daily
    case 'weekly': return '0 9 * * 1';    // 9AM Monday
    case 'monthly': return '0 9 1 * *';   // 9AM 1st of month
    case 'custom': return '0 9 * * *';
  }
}

function getDefaultSections(type: ReportType): ReportSection[] {
  const base: ReportSection[] = [
    { id: 'health', title: 'System Health', type: 'system_health', description: 'Overall system health status', enabled: true },
    { id: 'cost', title: 'Cost Analysis', type: 'cost_analysis', description: 'AI cost breakdown by agent/model', enabled: true },
    { id: 'metrics', title: 'Performance Metrics', type: 'metrics_table', description: 'Key performance indicators', enabled: true },
    { id: 'agents', title: 'Agent Performance', type: 'agent_performance', description: 'Agent success rates and trends', enabled: true },
  ];
  if (type === 'weekly' || type === 'monthly') {
    base.push({ id: 'ai_summary', title: 'AI Executive Summary', type: 'ai_generated', description: 'AI-generated executive summary of the period', enabled: true });
  }
  return base;
}

export function listGeneratedReports(): GeneratedReport[] { return [...generated].reverse(); }
export function getGeneratedReport(id: string): GeneratedReport | undefined { return generated.find(r => r.id === id); }
export function getReportContent(id: string): string | undefined {
  const report = generated.find(r => r.id === id);
  if (!report || !fs.existsSync(report.filePath)) return undefined;
  return fs.readFileSync(report.filePath, 'utf8');
}
