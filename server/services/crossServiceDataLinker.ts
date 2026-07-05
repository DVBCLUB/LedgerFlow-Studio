/**
 * crossServiceDataLinker.ts
 * ============================================================
 * Cross-Service Data Linker — liên kết dữ liệu giữa tất
 * cả các services để tạo bức tranh toàn cảnh thống nhất.
 *
 * Mục tiêu: mọi service đều có thể query cross-service data
 * thông qua một unified API duy nhất.
 */
import { getSnapshot } from './costObservability';
import { getStats as getMemoryStats } from './compoundMemory';
import { getAgenticLoopMetrics } from './agenticLoopEngine';
import { getStats as getRPAStats } from './rpaEngine';
import { getWatchStats } from './smartFileWatcher';
import { getGatewayStats } from './aiModelGateway';
import { getDecisionStats } from './aiDecisionExplainability';
import { getPairStats } from './fineTuningDataCollector';
import { getPluginStats } from './pluginExtensionSystem';
import { getQueueStats } from './backgroundJobQueue';
import { getNotificationStats } from './notificationEngine';
import { getStreamStats } from './eventStreamProcessor';
import { getSastStats } from './sastSecurityHub';
import { getDepHealthStats } from './dependencyHealthMonitor';
import { getDriftStats } from './configDriftDetector';
import { getReviewStats } from './aiCodeReviewQueue';
import { getLogStats } from './intelligentLogAnalyzer';
import { getTestStats } from './apiTestGenerator';
import { getKBStats } from './teamKnowledgeBase';
import { getVectorStats } from './vectorEmbeddingStore';
import { getContentStats } from './contentStudioAI';
import { getLibraryStats } from './aiPromptLibrary';
import { listDeployRuns } from './deployManager';
import { listRemediationRuns } from './autoRemediationPipeline';
import { listWorkflows } from './workflowScheduler';
import { listChains } from './promptChainComposer';
import { listTimelines } from './projectTimelineAI';
import { getSnapshotStats } from './systemSnapshotRestore';
import { getFeedbackStats } from './feedbackCollector';
import { getSkillStats } from './skillRegistry';
import { getThreadStats } from './conversationThreads';
import { getBenchmarkRuns } from './modelBenchmark';
import { generateAnalyticsReport } from './agentAnalytics';

export interface UnifiedSystemOverview {
  generatedAt: string;
  // Core
  cost: { total30d: number; dailyAvg: number; modelCount: number };
  memory: { totalRecords: number; shortTerm: number; longTerm: number };
  agents: { completed: number; failed: number; running: number };
  // Automation
  rpa: { scripts: number; executions: number; cronActive: number };
  watchers: { rules: number; active: number; totalEvents: number };
  workflows: { total: number; active: number };
  chains: { total: number };
  // Quality
  aiGateway: { totalRequests: number; successRate: string; avgLatency: string; circuitsOpen: number };
  decisions: { totalTraces: number; avgConfidence: number };
  sast: { avgScore: number; totalFindings: number };
  codeReview: { total: number; avgScore: number; approvedRate: number };
  deps: { avgHealth: number };
  configDrift: { avgScore: number };
  // Knowledge
  fineTuning: { totalPairs: number; goldPairs: number };
  plugins: { total: number; loaded: number; invocations: number };
  knowledgeBase: { totalArticles: number; totalViews: number };
  vectorStore: { namespaces: number; totalDocs: number };
  prompts: { totalTemplates: number; totalRuns: number; avgSuccessRate: number };
  content: { totalAssets: number; totalWords: number };
  // Operations
  snapshots: { total: number; totalSizeMB: number };
  notifications: { total: number; byChannel: Record<string, number> };
  jobQueue: { queued: number; running: number; completed: number; failed: number };
  eventStreams: { pipelineCount: number; totalEvents: number };
  // Testing
  apiTests: { totalSuites: number; totalTestCases: number };
  // Logs
  logs: { avgHealth: number };
  // Summary scores
  healthScore: number;        // Overall system health 0-100
  automationScore: number;    // Automation coverage 0-100
  qualityScore: number;       // Code quality score 0-100
  knowledgeScore: number;     // Knowledge maturity 0-100
  topRecommendations: string[];
}

export async function gatherSystemOverview(): Promise<UnifiedSystemOverview> {
  const now = new Date().toISOString();
  const cost = getSnapshot(30);
  const memStats = await getMemoryStats();
  const loopMetrics = getAgenticLoopMetrics();
  const rpa = getRPAStats();
  const watch = getWatchStats();
  const gw = getGatewayStats();
  const decisions = getDecisionStats();
  const ft = getPairStats();
  const plugins = getPluginStats();
  const jobs = getQueueStats();
  const notify = getNotificationStats();
  const streams = getStreamStats();
  const sast = getSastStats();
  const deps = getDepHealthStats();
  const drift = getDriftStats();
  const review = getReviewStats();
  const logs = getLogStats();
  const tests = getTestStats();
  const kb = getKBStats();
  const vecs = getVectorStats();
  const content = getContentStats();
  const prompts = getLibraryStats();
  const snaps = getSnapshotStats();

  // Compute summary scores
  const healthScore = Math.round(
    (100
      - (jobs.failed > 5 ? 15 : 0)
      - (gw.circuitBreakersOpen > 0 ? 10 * gw.circuitBreakersOpen : 0)
      - (memStats.totalRecords > 1000 ? 5 : 0)
    ));
  const automationScore = Math.round(
    Math.min(100, (rpa.scripts + watch.rules + listWorkflows().length) * 5)
  );
  const qualityScore = Math.round(
    Math.min(100, review.total > 0
      ? (review.avgScore + (sast.avgScore || 100) + (deps.avgHealth || 100)) / 3
      : 50)
  );
  const knowledgeScore = Math.round(
    Math.min(100,
      (kb.total > 0 ? 40 : 0)
      + (ft.total > 0 ? 20 : 0)
      + (prompts.totalTemplates > 0 ? 20 : 0)
      + (plugins.total > 0 ? 20 : 0)
    )
  );

  const topRecommendations: string[] = [];
  if (kb.total === 0) topRecommendations.push('📝 Tạo ít nhất 1 Knowledge Base article cho team.');
  if (rpa.scripts === 0) topRecommendations.push('🤖 Tạo RPA script đầu tiên để tự động hóa.');
  if (jobs.failed > 5) topRecommendations.push(`⚠️ ${jobs.failed} jobs failed — kiểm tra dead-letter queue.`);
  if (gw.circuitBreakersOpen > 0) topRecommendations.push(`⚡ ${gw.circuitBreakersOpen} circuit breakers open — kiểm tra providers.`);
  if (ft.total === 0) topRecommendations.push('📊 Chưa có fine-tuning data — thu thập từ feedback thành công.');
  if (deps.avgHealth < 50) topRecommendations.push('📦 Dependency health thấp — chạy npm audit fix.');
  if (topRecommendations.length === 0) topRecommendations.push('✅ Hệ thống khỏe mạnh. Tiếp tục giám sát.');

  const workflows = listWorkflows();
  const chains = listChains();

  return {
    generatedAt: now,
    cost: { total30d: cost.totalCostUsd, dailyAvg: cost.totalCostUsd / 30, modelCount: Object.keys(cost.byModel).length },
    memory: { totalRecords: memStats.totalRecords || 0, shortTerm: memStats.shortTerm?.count || 0, longTerm: memStats.longTerm?.count || 0 },
    agents: { completed: loopMetrics.completed, failed: loopMetrics.failed, running: loopMetrics.running },
    rpa: { scripts: rpa.scripts, executions: rpa.totalExecutions, cronActive: rpa.cronActive },
    watchers: { rules: watch.rules, active: watch.active, totalEvents: watch.totalEvents },
    workflows: { total: workflows.length, active: workflows.filter(w => (w as any).enabled).length },
    chains: { total: chains.length },
    aiGateway: { totalRequests: gw.totalRequests, successRate: (gw as any).successPercentage + '%', avgLatency: (gw as any).avgLatencyMs + 'ms', circuitsOpen: gw.circuitBreakersOpen },
    decisions: { totalTraces: decisions.totalTraces, avgConfidence: decisions.avgConfidence },
    sast: { avgScore: sast.avgScore, totalFindings: sast.totalFindings },
    codeReview: { total: review.total, avgScore: review.avgScore, approvedRate: review.approvedRate },
    deps: { avgHealth: deps.avgHealth },
    configDrift: { avgScore: drift.avgDriftScore },
    fineTuning: { totalPairs: ft.total, goldPairs: ft.byQuality?.gold || 0 },
    plugins: { total: plugins.total, loaded: plugins.loaded, invocations: plugins.totalInvocations },
    knowledgeBase: { totalArticles: kb.total, totalViews: kb.totalViews },
    vectorStore: { namespaces: vecs.namespaces, totalDocs: vecs.totalDocuments },
    prompts: { totalTemplates: prompts.totalTemplates, totalRuns: prompts.totalRuns, avgSuccessRate: prompts.avgSuccessRate },
    content: { totalAssets: content.total, totalWords: content.totalWords },
    snapshots: { total: snaps.total, totalSizeMB: snaps.totalSizeMB },
    notifications: { total: notify.total, byChannel: notify.byChannel },
    jobQueue: { queued: jobs.queued, running: jobs.running, completed: jobs.completed, failed: jobs.failed },
    eventStreams: { pipelineCount: streams.pipelineCount, totalEvents: streams.totalEvents },
    apiTests: { totalSuites: tests.totalSuites, totalTestCases: tests.totalTestCases },
    logs: { avgHealth: logs.avgHealth },
    healthScore, automationScore, qualityScore, knowledgeScore,
    topRecommendations,
  };
}

