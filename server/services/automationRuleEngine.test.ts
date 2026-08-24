import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fireAutomationEvent,
  listAutomationRules,
  createAutomationRule,
  deleteAutomationRule,
  getAutomationExecutionLog,
  evaluateCondition,
} from './automationRuleEngine.ts';

test('automationRuleEngine - evaluateCondition handles various operators', () => {
  const event = {
    id: 'evt_test_1',
    type: 'pipeline.completed' as const,
    payload: { status: 'success', count: 10, target: 'prod' },
    triggeredAt: new Date().toISOString(),
  };

  assert.equal(evaluateCondition({ field: 'payload.status', operator: 'equals', value: 'success' }, event), true);
  assert.equal(evaluateCondition({ field: 'payload.status', operator: 'equals', value: 'failed' }, event), false);
  assert.equal(evaluateCondition({ field: 'payload.count', operator: 'greater_than', value: 5 }, event), true);
  assert.equal(evaluateCondition({ field: 'payload.count', operator: 'less_than', value: 5 }, event), false);
  assert.equal(evaluateCondition({ field: 'payload.target', operator: 'contains', value: 'pr' }, event), true);
});

test('automationRuleEngine - fires built-in default rules and records execution log', async () => {
  const result = await fireAutomationEvent('pipeline.failed', {
    pipelineId: 'pipe_fail_01',
    reason: 'Timeout in step 3',
  });

  assert.ok(result.matchedRules >= 1);
  assert.ok(result.executionLogs.length >= 1);

  const matchedLog = result.executionLogs.find((l) => l.eventType === 'pipeline.failed');
  assert.ok(matchedLog);
  assert.equal(matchedLog?.status, 'success');
  assert.ok(matchedLog?.actionsExecuted.includes('log_event'));
});

test('automationRuleEngine - supports rule chaining via emit_chained_event', async () => {
  // Create a chained rule: pipeline.completed -> emit_chained_event (weekly.trigger)
  const chainedRule = createAutomationRule({
    name: 'Chained Test Rule',
    description: 'Chains pipeline complete to weekly trigger',
    enabled: true,
    triggerEvent: 'pipeline.completed',
    conditions: [{ field: 'payload.testFlag', operator: 'equals', value: 'chain_me' }],
    conditionLogic: 'AND',
    actions: [
      {
        type: 'emit_chained_event',
        params: {
          nextEventType: 'weekly.trigger',
          payloadMerge: { chained: true },
        },
        requiresApproval: false,
      },
    ],
  });

  const result = await fireAutomationEvent('pipeline.completed', {
    testFlag: 'chain_me',
  });

  assert.ok(result.matchedRules >= 1);
  const log = result.executionLogs.find((l) => l.ruleId === chainedRule.id);
  assert.ok(log);
  assert.equal(log?.status, 'success');
  assert.ok(log?.actionsExecuted.includes('emit_chained_event'));

  // Clean up test rule
  deleteAutomationRule(chainedRule.id);
});
