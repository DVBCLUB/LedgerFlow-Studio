import assert from 'node:assert/strict';
import test from 'node:test';
import { assessAIWorkforceReadiness, buildAIWorkforceUpgradeBacklog } from './aiWorkforceGapAssessment.ts';

test('AI workforce readiness report exposes scored gap rows and prioritized backlog', () => {
  const report = assessAIWorkforceReadiness(new Date('2026-01-01T00:00:00.000Z'));

  assert.equal(report.generatedAt, '2026-01-01T00:00:00.000Z');
  assert.equal(report.rows.length, 8);
  assert.ok(report.overallScore > 0);
  assert.match(report.grade, /^[ABCD]$/);
  assert.ok(report.rows.some((row) => row.id === 'memory_rag_kg' && row.status === 'partial'));
  assert.ok(report.rows.some((row) => row.id === 'mcp_tool_registry' && row.currentSignals.some((signal) => signal.includes('tool contracts'))));
  assert.ok(report.backlog.length > 0);
  assert.equal(report.backlog[0].priority, 'P0');
});

test('AI workforce backlog only includes non-achieved rows and preserves safe execution mode', () => {
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
      score: 2,
      status: 'partial',
      currentSignals: ['browser tool'],
      missing: ['Emergency stop'],
      nextUpgrade: 'Add safety envelope',
    },
  ]);

  assert.equal(backlog.length, 1);
  assert.equal(backlog[0].targetId, 'computer_browser_robotics');
  assert.equal(backlog[0].safeExecutionMode, 'lab_only');
  assert.deepEqual(backlog[0].acceptanceCriteria, [
    'Raise Computer, browser, and robot automation score to at least 4/5',
    'Add automated contract checks',
    'Expose status in AI Factory Command Center',
  ]);
});
