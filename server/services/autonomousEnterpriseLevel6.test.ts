import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getCeoAutopilotState,
  triggerCeoAutopilotCycle,
  listStrategicOKRs,
  decomposeStrategicOKR,
} from './aiCeoAutopilotEngine.ts';

import {
  executeNLCommand,
  getSmartCommandSuggestions,
  parseNLCommand,
} from './naturalLanguageOSRouter.ts';

import {
  getUnifiedActivityFeed,
  resolveActivityItem,
  pushActivityStreamItem,
} from './unifiedActivityStreamEngine.ts';

import {
  getCompanyOperatingSchedule,
  completeOperatingEvent,
} from './operatingRhythmScheduler.ts';

import {
  listReconciliationRecords,
  runAutoReconciliationBatch,
  approveDiscrepancyReconciliation,
} from './crossModuleAutoReconciler.ts';

import {
  getPredictiveAccountingMetrics,
} from './predictiveAccountingEngine.ts';

import {
  getFactoryAutoScaleStatuses,
} from './factoryAutoScaleEngine.ts';

import {
  getFactoryOptimizationReport,
} from './factoryPerformanceOptimizer.ts';

import {
  getFactoryRevenueAttribution,
} from './factoryRevenueImpactTracker.ts';

import {
  getDepartmentHealthReports,
} from './departmentHealthScoreEngine.ts';

import {
  listWorkflowEvolutionProposals,
  approveWorkflowEvolution,
} from './selfEvolvingWorkflowEngine.ts';

import {
  getCompanyAgentROIMetrics,
} from './agentROIDashboardEngine.ts';

test('AI CEO Autopilot Engine - fetches state, executes cycle, and decomposes OKRs', async () => {
  const state = getCeoAutopilotState();
  assert.ok(state.currentPhase);
  assert.ok(state.metrics.autopilotConfidenceScore >= 0);

  const cycleResult = await triggerCeoAutopilotCycle('test_suite');
  assert.equal(cycleResult.success, true);
  assert.ok(cycleResult.cycleId);

  const okrs = listStrategicOKRs();
  assert.ok(okrs.length > 0);

  const decomposeResult = decomposeStrategicOKR(okrs[0].id);
  assert.ok(decomposeResult.decomposedSprints.length > 0);
});

test('Natural Language OS Router - parses commands and provides suggestions', async () => {
  const suggestions = getSmartCommandSuggestions();
  assert.ok(suggestions.length >= 3);

  const dealCmd = await executeNLCommand('Chốt deal khách hàng FPT 150tr');
  assert.equal(dealCmd.parsedIntent.targetWorkspace, 'sales_crm');
  assert.ok(dealCmd.parsedIntent.confidence > 0.8);

  const taxCmd = await executeNLCommand('Kê khai thuế quý 3');
  assert.equal(taxCmd.parsedIntent.targetWorkspace, 'finance_accounting');

  const factoryCmd = await executeNLCommand('Tạo video marketing giới thiệu sản phẩm');
  assert.equal(factoryCmd.parsedIntent.targetWorkspace, 'ai_factory');
});

test('Unified Activity Stream - ingests, queries, and resolves activity items', () => {
  const feed = getUnifiedActivityFeed();
  assert.ok(Array.isArray(feed));

  pushActivityStreamItem({
    department: 'engineering',
    eventType: 'task.completed',
    title: 'Unit Test Ingestion Event',
    description: 'Verifying real-time stream ingestion',
    urgency: 'info',
    actor: 'AI QA Engineer',
    isActionable: true,
  });

  const updatedFeed = getUnifiedActivityFeed();
  const createdItem = updatedFeed.find(i => i.title === 'Unit Test Ingestion Event');
  assert.ok(createdItem);

  const resolveRes = resolveActivityItem(createdItem.id);
  assert.equal(resolveRes, true);
});

test('Operating Rhythm Scheduler - manages standups, reviews, and closes', () => {
  const schedule = getCompanyOperatingSchedule();
  assert.ok(schedule.length >= 4);

  const targetEvent = schedule[0];
  const completeRes = completeOperatingEvent(targetEvent.id);
  assert.equal(completeRes, true);
});

test('Cross-Module Auto-Reconciler - 3-way matching and discrepancy approval', async () => {
  const records = listReconciliationRecords();
  assert.ok(records.length > 0);

  const batchRes = runAutoReconciliationBatch();
  assert.ok(batchRes.processedCount >= 0);

  const approveRes = approveDiscrepancyReconciliation('rec_3', 'Approved for unit test');
  assert.equal(approveRes, true);
});

test('Predictive Accounting Engine - expense anomalies and revenue forecasts', () => {
  const metrics = getPredictiveAccountingMetrics();
  assert.ok(metrics.projectedRevenueNextMonthVnd > 0);
  assert.ok(metrics.monthlyVarianceTrend.length >= 4);
  assert.ok(Array.isArray(metrics.anomaliesDetected));
});

test('Factory Auto-Scale & Performance Optimizer - auto-scales and detects bottlenecks', () => {
  const scaleStatuses = getFactoryAutoScaleStatuses();
  assert.ok(scaleStatuses.length === 4);
  assert.ok(scaleStatuses.every(s => s.activeWorkers >= 1));

  const perfReport = getFactoryOptimizationReport();
  assert.ok(perfReport.overallThroughputScore >= 0);
  assert.ok(perfReport.bottlenecksIdentified.length > 0);
});

test('Factory Revenue Impact Tracker - calculates multi-factory MRR and ROI', () => {
  const attributions = getFactoryRevenueAttribution();
  assert.ok(attributions.length === 4);
  assert.ok(attributions.every(a => a.attributedRevenueVnd > 0));
  assert.ok(attributions.every(a => a.roiRatio > 1));
});

test('Department Health Scorecards & Self-Evolving Workflows', () => {
  const reports = getDepartmentHealthReports();
  assert.ok(reports.length === 5);
  assert.ok(reports.every(r => r.overallScore >= 0 && r.overallScore <= 100));

  const proposals = listWorkflowEvolutionProposals();
  assert.ok(proposals.length > 0);

  const approveRes = approveWorkflowEvolution(proposals[0].id);
  assert.equal(approveRes, true);
  assert.equal(proposals[0].status, 'promoted');
});

test('AI Agent ROI Dashboard Engine - calculates token economics and FTE equivalence', () => {
  const roiMetrics = getCompanyAgentROIMetrics();
  assert.ok(roiMetrics.totalAiWorkforceCostVnd > 0);
  assert.ok(roiMetrics.totalValueGeneratedVnd > 0);
  assert.ok(roiMetrics.netCompanyRoiMultiplier > 1);
  assert.ok(roiMetrics.totalFteReplacedEquivalent >= 5);
  assert.ok(roiMetrics.agentLeaderboard.length >= 5);
});
