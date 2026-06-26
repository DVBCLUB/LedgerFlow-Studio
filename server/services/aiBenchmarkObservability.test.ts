import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AI_WORKFORCE_BASELINE_TASKS,
  evaluateAIBaselineSuite,
  recordAIRunMetric,
  resetAIRunMetricsForTest,
  summarizeAIObservability,
} from './aiBenchmarkObservability.ts';

test('AI observability records and summarizes run metrics', () => {
  resetAIRunMetricsForTest();
  recordAIRunMetric({ lane: 'knowledge-spine', agentRole: 'Memory Agent', status: 'success', latencyMs: 100, qualityScore: 0.9, estimatedCostUsd: 0.01 });
  recordAIRunMetric({ lane: 'knowledge-spine', agentRole: 'Memory Agent', status: 'blocked', latencyMs: 300, qualityScore: 0.4, safetyBlocks: 1, estimatedCostUsd: 0.02 });
  recordAIRunMetric({ lane: 'execution-layer', agentRole: 'Robot Agent', status: 'needs_review', latencyMs: 200, qualityScore: 0.7 });

  const summary = summarizeAIObservability();
  assert.equal(summary.runs, 3);
  assert.equal(summary.successRate, 0.333);
  assert.equal(summary.blockedRate, 0.333);
  assert.equal(summary.averageLatencyMs, 200);
  assert.equal(summary.p95LatencyMs, 300);
  assert.equal(summary.estimatedCostUsd, 0.03);
  assert.equal(summary.laneBreakdown.length, 2);
});

test('AI baseline suite scores expected output signals', () => {
  const suite = evaluateAIBaselineSuite(AI_WORKFORCE_BASELINE_TASKS, {
    'memory-grounding-smoke': 'Answer includes source, confidence, and contradiction review.',
    'software-factory-smoke': 'PR handoff includes diff risk, CI summary, and readiness score.',
    'automation-safety-smoke': 'Safety envelope includes allowlist and replay but not the final keyword.',
  });

  assert.equal(suite.results.length, 3);
  assert.equal(suite.results[0].passed, true);
  assert.equal(suite.results[2].passed, true);
  assert.ok(suite.averageQualityScore >= 0.77);
});
