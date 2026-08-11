import { describe, it, expect } from 'vitest';
import {
  listCronRules,
  toggleCronRule,
  triggerCronRuleExecution,
} from './aiAgentScheduler.ts';

describe('aiAgentScheduler', () => {
  it('loads preset cron schedule rules for AI Staff', async () => {
    const rules = await listCronRules();
    expect(rules.length).toBeGreaterThan(0);
  });

  it('toggles cron rule enabled state and triggers execution', async () => {
    const rules = await listCronRules();
    const target = rules[0];

    const toggled = await toggleCronRule(target.id, false);
    expect(toggled?.enabled).toBe(false);

    const execRes = await triggerCronRuleExecution(target.id);
    expect(execRes.success).toBe(true);
    expect(execRes.message).toBeDefined();
  });
});
