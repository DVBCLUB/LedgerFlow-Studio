/**
 * src/utils/devopsApi.ts
 * Frontend client cho các engine DevOps (route /api/dormant/*):
 *  - agentCircuitBreaker, aiAgentScheduler, aiCodeDiffEngine
 *  - oneClickDeployService, systemSelfHealingDoctor
 *  - iacCloudArchitectEngine, webhookIntegrationHubEngine, aiCodeReviewPrEngine
 */

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

// ── Agent Circuit Breaker ────────────────────────────────────────
export interface CircuitMetrics {
  targetKey: string;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  totalCalls: number;
  errorCount: number;
  errorRate: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
  lastTripTime?: string;
  lastProbeTime?: string;
  cooldownMs: number;
  consecutiveSuccesses: number;
}
export function getCircuitBreakers(): Promise<{ success: boolean; circuits: CircuitMetrics[] }> {
  return request('/api/dormant/circuit-breaker/list');
}
export function resetCircuit(targetKey: string): Promise<{ success: boolean; metrics: CircuitMetrics }> {
  return request('/api/dormant/circuit-breaker/reset', { method: 'POST', body: JSON.stringify({ targetKey }) });
}

// ── AI Agent Scheduler ───────────────────────────────────────────
export interface CronScheduleRule {
  id: string;
  title: string;
  cronExpression: string;
  assignedAgent: string;
  actionType: 'media_gen' | 'affiliate_sync' | 'bug_triage' | string;
  enabled: boolean;
  lastRunAt?: string;
  nextRunAt: string;
  runCount: number;
}
export function getSchedulerJobs(): Promise<{ success: boolean; rules: CronScheduleRule[] }> {
  return request('/api/dormant/agent-scheduler/jobs');
}
export function triggerCronRule(ruleId: string): Promise<{ success: boolean; message: string }> {
  return request('/api/dormant/agent-scheduler/trigger', { method: 'POST', body: JSON.stringify({ ruleId }) });
}

// ── AI Code Diff Engine ──────────────────────────────────────────
export interface DiffLine {
  type: 'add' | 'remove' | 'keep';
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
}
export interface DiffHunk {
  id: string;
  header: string;
  oldStart: number;
  oldLinesCount: number;
  newStart: number;
  newLinesCount: number;
  lines: DiffLine[];
  accepted: boolean;
}
export interface FileDiffSession {
  id: string;
  targetFilePath: string;
  originalContent: string;
  proposedContent: string;
  hunks: DiffHunk[];
  status: string;
  createdAt: string;
  updatedAt: string;
}
export function generateCodeDiff(payload: { targetFilePath?: string; originalContent?: string; proposedContent?: string }): Promise<{ success: boolean; session: FileDiffSession }> {
  return request('/api/dormant/code-diff/generate', { method: 'POST', body: JSON.stringify(payload) });
}

// ── One-Click Deploy ─────────────────────────────────────────────
export interface CloudDeploymentRecord {
  id: string;
  projectName: string;
  provider: string;
  status: string;
  liveUrl?: string;
  commitHash?: string;
  buildTimeMs: number;
  deployedBy: string;
  createdAt: string;
  deployedAt?: string;
}
export function listDeployments(): Promise<{ success: boolean; deployments: CloudDeploymentRecord[] }> {
  return request('/api/dormant/deploy/list');
}
export function triggerDeploy(payload: { projectName?: string; provider?: string }): Promise<{ success: boolean; record: CloudDeploymentRecord }> {
  return request('/api/dormant/deploy/trigger', { method: 'POST', body: JSON.stringify(payload) });
}

// ── System Self-Healing Doctor ───────────────────────────────────
export interface DoctorHealthReport {
  timestamp: string;
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  memory: { heapUsedMb: number; heapTotalMb: number; rssMb: number; usageRatio: number };
  circuitBreakersCount: number;
  openCircuits: string[];
  selfHealingActionsTaken: string[];
  recommendations: string[];
}
export function getSelfHealingReport(): Promise<{ success: boolean; report: DoctorHealthReport }> {
  return request('/api/dormant/system/self-healing');
}

// ── IaC Cloud Architect ──────────────────────────────────────────
export interface IaCTemplate {
  id: string;
  name: string;
  category: string;
  cloudProvider: string;
  description: string;
  estimatedMonthlyCostUsd: number;
  tags: string[];
}
export interface GeneratedIaCResult {
  architectureId: string;
  architectureName: string;
  targetPlatform: string;
  generatedFiles: { filename: string; language: string; content: string }[];
  deploymentGuideVi: string;
  estimatedCostBreakdown: { item: string; costUsd: number }[];
  generatedAt: string;
}
export function getIaCTemplates(): Promise<{ success: boolean; availableTemplates: IaCTemplate[]; totalGeneratedArchitectures: number; supportedRuntimes: string[]; lastUpdated: string }> {
  return request('/api/dormant/iac-architect/templates');
}
export function generateIaC(prompt: string): Promise<{ success: boolean } & GeneratedIaCResult> {
  return request('/api/dormant/iac-architect/generate', { method: 'POST', body: JSON.stringify({ prompt }) });
}

// ── Webhook Integration Hub ──────────────────────────────────────
export interface WebhookEndpoint {
  id: string;
  name: string;
  targetUrl: string;
  direction: 'inbound' | 'outbound';
  events: string[];
  status: 'active' | 'paused' | 'failing' | string;
  successRatePercent: number;
  totalDispatches: number;
  lastFiredAt: string;
  secretMasked: string;
}
export interface WebhookHubData {
  endpoints: WebhookEndpoint[];
  totalDispatched24h: number;
  avgLatencyMs: number;
  deadLetterQueueCount: number;
  supportedIntegrations: string[];
  lastAuditAt: string;
}
export function getWebhookEndpoints(): Promise<{ success: boolean } & WebhookHubData> {
  return request('/api/dormant/webhooks/endpoints');
}
export function dispatchWebhookTest(endpointId: string): Promise<{ success: boolean; endpointId: string; eventId: string; httpStatusCode: number; latencyMs: number; deliveredAt: string; payloadSummary: string }> {
  return request('/api/dormant/webhooks/dispatch-test', { method: 'POST', body: JSON.stringify({ endpointId }) });
}

// ── AI Code Review PR ────────────────────────────────────────────
export interface PullRequestReview {
  prId: string;
  title: string;
  author: string;
  branch: string;
  filesChanged: number;
  additions: number;
  deletions: number;
  securityScore: number;
  codeSmellsDetected: number;
  status: string;
  suggestedChangelog: string;
  vulnerabilities: { severity: string; description: string; file: string; line: number }[];
}
export interface CodeReviewData {
  openPullRequests: PullRequestReview[];
  averageReviewTimeSec: number;
  autoMergeEligibleCount: number;
  overallRepoHealthScore: number;
  lastAnalysisAt: string;
}
export function getCodeReviewPRs(): Promise<{ success: boolean } & CodeReviewData> {
  return request('/api/dormant/code-review/pull-requests');
}
export function analyzePullRequest(prId: string): Promise<{ success: boolean; prId: string; decision: string; automatedSummary: string; securityAuditPassed: boolean; generatedReleaseNotes: string; reviewedAt: string }> {
  return request('/api/dormant/code-review/analyze', { method: 'POST', body: JSON.stringify({ prId }) });
}
