import assert from 'node:assert/strict';
import test from 'node:test';
import { assessAIWorkforceReadiness, buildAIWorkforceUpgradeBacklog } from './aiWorkforceGapAssessment.ts';

test('AI workforce readiness report exposes scored gap rows and prioritized backlog', () => {
  const report = assessAIWorkforceReadiness(new Date('2026-01-01T00:00:00.000Z'));

  assert.equal(report.generatedAt, '2026-01-01T00:00:00.000Z');
  assert.equal(report.rows.length, 8);
  assert.ok(report.overallScore >= 4);
  assert.match(report.grade, /^[ABCD]$/);
  assert.ok(report.rows.some((row) => row.id === 'memory_rag_kg' && row.status === 'achieved'));
  assert.ok(report.rows.some((row) => row.id === 'computer_browser_robotics' && row.status === 'achieved'));
  assert.ok(report.rows.some((row) => row.id === 'software_factory' && row.status === 'achieved'));
  assert.ok(report.rows.some((row) => row.id === 'benchmark_observability' && row.status === 'achieved'));
  assert.ok(report.rows.some((row) => row.id === 'mcp_tool_registry' && row.currentSignals.some((signal) => signal.includes('tool contracts'))));
  assert.ok(report.backlog.length > 0);
  assert.equal(report.backlog[0].priority, 'P0');
});

test('AI workforce backlog prioritizes runtime integration and preserves safe execution mode', () => {
  const backlog = buildAIWorkforceUpgradeBacklog([
    {
      id: 'software_factory',
      title: 'Self-healing software factory',
      score: 4,
      status: 'achieved',
      currentSignals: ['ok'],
      missing: [],
      nextUpgrade: 'No-op',
    },
    {
      id: 'computer_browser_robotics',
      title: 'Computer, browser, and robot automation',
      score: 4,
      status: 'achieved',
      currentSignals: ['browser tool'],
      missing: ['Runtime integration'],
      nextUpgrade: 'Wire safety envelope into tool execution',
    },
  ]);

  assert.equal(backlog.length, 1);
  assert.equal(backlog[0].targetId, 'computer_browser_robotics');
  assert.equal(backlog[0].safeExecutionMode, 'lab_only');
  assert.deepEqual(backlog[0].acceptanceCriteria, [
    'Keep Computer, browser, and robot automation score at or above 4/5',
    'Add automated contract checks',
    'Expose status in AI Factory Command Center',
  ]);
});
