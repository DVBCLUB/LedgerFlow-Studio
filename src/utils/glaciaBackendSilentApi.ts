/**
 * src/utils/glaciaBackendSilentApi.ts
 * Frontend Client SDK for Glacia Silent Services:
 * - NightShift SWE Autopilot
 * - Tax Compliance & VAT XML Sentinel
 * - Executive Briefing Synthesizer
 * - Hands-Free Voice Commands
 */

export interface NightTask {
  id: string;
  name: string;
  category: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  resultSummary?: string;
  durationMs?: number;
  completedAt?: string;
}

export interface NightShiftSession {
  id: string;
  startedAt: string;
  endedAt?: string;
  status: 'active' | 'completed' | 'paused';
  tasks: NightTask[];
  tasksCompleted: number;
  tasksFailed: number;
  systemHealthScore: number;
  morningHandoffBriefing?: string;
  logs: Array<{ timestamp: string; message: string; level: 'info' | 'warn' | 'success' | 'error' }>;
}

export interface TaxAuditCheckItem {
  checkId: string;
  category: string;
  targetEntity: string;
  taxCode: string;
  status: 'PASSED' | 'FLAGGED_RISK' | 'BLOCKED';
  riskScore: number;
  findingsSummary: string;
  statutoryRule: string;
  checkedAt: string;
}

export interface TaxComplianceStatus {
  checks: TaxAuditCheckItem[];
  complianceScore: number;
  totalInvoicesScanned: number;
  flaggedRisksCount: number;
}

export interface ExecutiveBriefing {
  greeting: string;
  headline: string;
  morningReport: string;
  taxComplianceScore: number;
  invoicesVerified: number;
  runwayMonths: number;
  cashflowSafe: boolean;
}

export interface VoiceIntentResult {
  rawTranscript: string;
  recognizedIntent: string;
  actionSummary: string;
  spokenAudioFeedbackVi: string;
  executionPayload?: Record<string, any>;
  confidence: number;
}

export async function fetchNightshiftAutopilotStatus(): Promise<{ history: NightShiftSession[]; morningBriefing: string }> {
  const res = await fetch('/api/glacia/nightshift/status');
  if (!res.ok) throw new Error('Không thể tải trạng thái ca trực đêm');
  const data = await res.json();
  return { history: data.history || [], morningBriefing: data.morningBriefing || '' };
}

export async function triggerNightshiftRun(): Promise<NightShiftSession> {
  const res = await fetch('/api/glacia/nightshift/run', { method: 'POST' });
  if (!res.ok) throw new Error('Không thể khởi chạy ca trực đêm');
  const data = await res.json();
  return data.session;
}

export async function fetchTaxSentinelStatus(): Promise<TaxComplianceStatus> {
  const res = await fetch('/api/glacia/tax/sentinel/status');
  if (!res.ok) throw new Error('Không thể tải trạng thái kiểm toán thuế');
  const data = await res.json();
  return data.status;
}

export async function runTaxSentinelScan(): Promise<{ success: boolean; complianceScore: number; newChecksCount: number }> {
  const res = await fetch('/api/glacia/tax/sentinel/scan', { method: 'POST' });
  if (!res.ok) throw new Error('Không thể kích hoạt quét thuế VAS');
  const data = await res.json();
  return data.result;
}

export async function fetchExecutiveBriefing(): Promise<ExecutiveBriefing> {
  const res = await fetch('/api/glacia/executive/briefing');
  if (!res.ok) throw new Error('Không thể tải bản tin điều hành CEO');
  const data = await res.json();
  return data.briefing;
}

export async function sendExecutiveVoiceCommand(transcript: string): Promise<VoiceIntentResult> {
  const res = await fetch('/api/glacia/executive/voice/command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript }),
  });
  if (!res.ok) throw new Error('Không thể phân tích lệnh giọng nói');
  const data = await res.json();
  return data.result;
}

export interface WeeklyExecutiveReportData {
  reportId: string;
  generatedAt: string;
  reportingPeriod: string;
  executiveSummary: string;
  overallHealthScore: number;
  financialMetrics: {
    totalRevenueAttributedVnd: number;
    expansionArrVnd: number;
    nrrRatePercent: number;
    reconciledTransactionsCount: number;
    discrepanciesCount: number;
  };
  aiWorkforceROI: {
    totalAiCostVnd: number;
    totalValueGeneratedVnd: number;
    blendedROI: number;
    humanHoursSaved: number;
    fteEquivalence: number;
  };
  markdownContent: string;
}

export interface GlaciaSelfAuditData {
  id: string;
  auditedAt: string;
  totalFilesScanned: number;
  totalLinesOfCode: number;
  architectureHealthScore: number;
  issuesSummary: {
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
}

export async function fetchWeeklyExecutiveReport(): Promise<WeeklyExecutiveReportData> {
  const res = await fetch('/api/glacia/weekly-report/status');
  if (!res.ok) throw new Error('Không thể tải báo cáo tuần');
  const data = await res.json();
  return data.report;
}

export async function triggerWeeklyExecutiveReport(): Promise<WeeklyExecutiveReportData> {
  const res = await fetch('/api/glacia/weekly-report/generate', { method: 'POST' });
  if (!res.ok) throw new Error('Không thể tạo báo cáo tuần');
  const data = await res.json();
  return data.report;
}

export async function fetchSelfAuditStatus(): Promise<GlaciaSelfAuditData> {
  const res = await fetch('/api/glacia/self-audit/status');
  if (!res.ok) throw new Error('Không thể tải kết quả tự kiểm tra mã nguồn');
  const data = await res.json();
  return data.audit;
}

export async function triggerSelfAudit(): Promise<GlaciaSelfAuditData> {
  const res = await fetch('/api/glacia/self-audit/run', { method: 'POST' });
  if (!res.ok) throw new Error('Không thể khởi chạy tự kiểm tra mã nguồn');
  const data = await res.json();
  return data.audit;
}

