import { createHash } from 'node:crypto';
import { getAIWorkforceReleaseGateDashboard } from './aiWorkforceReleaseGateDashboard.ts';

export type AIWorkforceReleaseGateExportFormat = 'json' | 'markdown';

export interface AIWorkforceReleaseGateExport {
  id: string;
  format: AIWorkforceReleaseGateExportFormat;
  filename: string;
  checksum: string;
  content: string;
  createdAt: string;
  summary: {
    totalRecords: number;
    latestDecision: string | null;
    latestReleaseReady: boolean | null;
    latestScore: number | null;
    readyRate: number;
    averageScore: number | null;
    scoreDelta: number;
    trendDirection: string;
    timelineItems: number;
  };
}

function sha(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function summaryFromDashboard(dashboard: any) {
  const trend = dashboard?.trendAnalytics || {};
  const timeline = Array.isArray(dashboard?.timeline) ? dashboard.timeline : [];
  return {
    totalRecords: Number(dashboard?.totalRecords || 0),
    latestDecision: dashboard?.latestDecision || null,
    latestReleaseReady: typeof dashboard?.latestReleaseReady === 'boolean' ? dashboard.latestReleaseReady : null,
    latestScore: typeof dashboard?.latestScore === 'number' ? dashboard.latestScore : null,
    readyRate: Number(trend.readyRate || 0),
    averageScore: typeof trend.averageScore === 'number' ? trend.averageScore : null,
    scoreDelta: Number(trend.scoreDelta || 0),
    trendDirection: trend.trendDirection || 'flat',
    timelineItems: timeline.length,
  };
}

function jsonContent(dashboard: any, createdAt: string, summary: AIWorkforceReleaseGateExport['summary']) {
  return JSON.stringify({
    version: 1,
    kind: 'ai_workforce_release_gate_dashboard_export',
    createdAt,
    summary,
    latest: {
      decision: dashboard?.latestDecision || null,
      releaseReady: dashboard?.latestReleaseReady ?? null,
      score: dashboard?.latestScore ?? null,
      checksum: dashboard?.latestChecksum || null,
      finalAction: dashboard?.latestFinalAction || null,
      missingEvidence: dashboard?.latestMissingEvidence || [],
    },
    trendAnalytics: dashboard?.trendAnalytics || {},
    timeline: dashboard?.timeline || [],
  }, null, 2);
}

function markdownContent(dashboard: any, createdAt: string, summary: AIWorkforceReleaseGateExport['summary']) {
  const trend = dashboard?.trendAnalytics || {};
  const timeline = Array.isArray(dashboard?.timeline) ? dashboard.timeline : [];
  const lines = [
    '# AI Workforce Release Gate Export Summary',
    '',
    `Generated: ${createdAt}`,
    `Latest decision: ${summary.latestDecision || 'none'}`,
    `Release ready: ${String(summary.latestReleaseReady)}`,
    `Latest score: ${summary.latestScore ?? 'n/a'}`,
    `Ready rate: ${Math.round(summary.readyRate * 100)}%`,
    `Average score: ${summary.averageScore ?? 'n/a'}`,
    `Score delta: ${summary.scoreDelta}`,
    `Trend direction: ${summary.trendDirection}`,
    '',
    '## Trend analytics',
    `- Total records: ${summary.totalRecords}`,
    `- Ready count: ${trend.readyCount || 0}`,
    `- Hold count: ${trend.holdCount || 0}`,
    `- Not ready count: ${trend.notReadyCount || 0}`,
    `- Decision breakdown: ${JSON.stringify(trend.decisionBreakdown || {})}`,
    '',
    '## Latest gate',
    `- Checksum: ${dashboard?.latestChecksum || 'none'}`,
    `- Final action: ${dashboard?.latestFinalAction || 'none'}`,
    `- Missing evidence: ${(dashboard?.latestMissingEvidence || []).join('; ') || 'none'}`,
    '',
    '## Release gate timeline',
    ...(timeline.length ? timeline.map((item: any, index: number) => `- ${index + 1}. ${item.createdAt || 'unknown'} — ${item.decision || 'unknown'} — score ${item.score ?? 'n/a'} — checksum ${item.checksum || 'none'}`) : ['- No release gate timeline yet.']),
  ];
  return lines.join('\n');
}

export function buildReleaseGateDashboardExport(dashboard: any, options: { format?: AIWorkforceReleaseGateExportFormat; createdAt?: string } = {}): AIWorkforceReleaseGateExport {
  const createdAt = options.createdAt || new Date().toISOString();
  const format = options.format || 'json';
  const summary = summaryFromDashboard(dashboard);
  const content = format === 'markdown' ? markdownContent(dashboard, createdAt, summary) : jsonContent(dashboard, createdAt, summary);
  const checksum = sha(content);
  return {
    id: `release_gate_export_${checksum.slice(0, 16)}`,
    format,
    filename: `release-gate-dashboard-${createdAt.slice(0, 10)}.${format === 'markdown' ? 'md' : 'json'}`,
    checksum,
    content,
    createdAt,
    summary,
  };
}

export async function buildAIWorkforceReleaseGateExport(options: { format?: AIWorkforceReleaseGateExportFormat; createdAt?: string } = {}) {
  const dashboard = await getAIWorkforceReleaseGateDashboard();
  const exportArtifact = buildReleaseGateDashboardExport(dashboard, options);
  return { exportArtifact, dashboard };
}
