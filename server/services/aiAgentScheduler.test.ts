import test from 'node:test';
import assert from 'node:assert/strict';
import {
  listCronRules,
  toggleCronRule,
  triggerCronRuleExecution,
} from './aiAgentScheduler.ts';

test('aiAgentScheduler - loads preset cron schedule rules for AI Staff', async () => {
  const rules = await listCronRules();
  assert.ok(rules.length > 0);
});

test('aiAgentScheduler - toggles cron rule enabled state and triggers execution', async () => {
  const rules = await listCronRules();
  const target = rules[0];

  const toggled = await toggleCronRule(target.id, false);
  assert.equal(toggled?.enabled, false);

  const execRes = await triggerCronRuleExecution(target.id);
  assert.equal(execRes.success, true);
  assert.ok(execRes.message);
});

