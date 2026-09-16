import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateBusinessRule, serializeRuleToYaml } from './glaciaBusinessRulesDSL.ts';

describe('Glacia Business Rules DSL', () => {
  it('validates a complete business rule successfully', () => {
    const result = validateBusinessRule({
      name: 'Kiểm tra số dư cuối ngày',
      trigger: 'cron_schedule',
      cronExpression: '0 23 * * *',
      conditions: [
        { field: 'so_du', operator: 'less_than', value: 10000000 },
      ],
      actions: [
        { actionId: 'act-1', type: 'send_telegram_report', params: {}, description: 'Gửi báo cáo số dư' },
      ],
    });

    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });

  it('rejects rule with missing name', () => {
    const result = validateBusinessRule({
      trigger: 'manual_voice',
      conditions: [],
      actions: [],
    });
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('Tên')));
  });

  it('rejects rule with empty name', () => {
    const result = validateBusinessRule({
      name: '   ',
      trigger: 'manual_voice',
      conditions: [],
      actions: [],
    });
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('Tên')));
  });

  it('rejects rule with missing trigger', () => {
    const result = validateBusinessRule({
      name: 'Valid Name',
      conditions: [],
      actions: [],
    });
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('trigger')));
  });

  it('rejects invalid action types', () => {
    const result = validateBusinessRule({
      name: 'Test',
      trigger: 'manual_voice',
      conditions: [],
      actions: [
        { actionId: 'bad', type: 'hack_system' as any, params: {}, description: 'Bad' },
      ],
    });
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('Hành động')));
  });

  it('rejects rule with no actions', () => {
    const result = validateBusinessRule({
      name: 'Test',
      trigger: 'cron_schedule',
      cronExpression: '0 23 * * *',
      conditions: [],
      actions: [],
    });
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('hành động')));
  });

  it('serializes a valid rule to YAML', () => {
    const rule = {
      id: 'rule-test-123',
      name: 'Báo cáo doanh thu tự động',
      description: 'Gửi báo cáo doanh thu qua Telegram mỗi tối',
      isActive: true,
      trigger: 'cron_schedule' as const,
      cronExpression: '0 22 * * *',
      conditions: [],
      actions: [
        { actionId: 'act-2', type: 'send_telegram_report' as const, params: { channel: 'ceo' }, description: 'Gửi báo cáo' },
      ],
      executionCount: 0,
      createdAt: new Date().toISOString(),
    };

    const yaml = serializeRuleToYaml(rule);
    assert.ok(yaml.includes('Báo cáo doanh thu tự động'));
    assert.ok(yaml.includes('cron_schedule'));
    assert.ok(yaml.includes('send_telegram_report'));
    assert.ok(yaml.startsWith('# Glacia Autonomous Business Rule'));
  });
});
