import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  transpileNaturalLanguageToWorkflow,
  parseScheduleFromPrompt,
  extractActionSteps,
  listRegisteredBusinessWorkflows,
  toggleBusinessWorkflow,
  executeWorkflowImmediately,
} from './glaciaNLUWorkflowTranspiler.ts';

describe('Glacia Natural Language Workflow Transpiler (Frontier 3)', () => {
  it('parses natural language Vietnamese schedule expressions into standard cron strings', () => {
    const s1 = parseScheduleFromPrompt('Mỗi sáng thứ 2 lúc 8h hãy tổng hợp báo cáo tài chính');
    assert.equal(s1.cronExpression, '0 8 * * 1');

    const s2 = parseScheduleFromPrompt('Mỗi ngày lúc 6:00 sáng tự động gửi briefing');
    assert.equal(s2.cronExpression, '0 6 * * *');

    const s3 = parseScheduleFromPrompt('Cuối tháng tự động đối soát VAT');
    assert.equal(s3.cronExpression, '0 9 28 * *');
  });

  it('extracts multi-step business actions from combined natural language prompt', () => {
    const prompt = 'Tổng hợp doanh thu kế toán và gửi báo cáo PDF qua Telegram cho tôi';
    const actions = extractActionSteps(prompt);

    assert.ok(actions.length >= 2);
    assert.ok(actions.some((a) => a.type === 'generate_financial_pdf'));
    assert.ok(actions.some((a) => a.type === 'send_telegram_report'));
  });

  it('transpiles natural language request into a validated, persistent GlaciaBusinessRule', () => {
    const prompt = 'Mỗi thứ 2 tự động quét giá đối thủ và gửi báo cáo Telegram cho tôi';
    const result = transpileNaturalLanguageToWorkflow(prompt);

    assert.ok(result.ruleId.startsWith('wf-nlu-'));
    assert.equal(result.cronExpression, '0 9 * * 1');
    assert.ok(result.actions.length >= 2);
    assert.ok(result.yamlDefinition.includes('schedule:'));

    const list = listRegisteredBusinessWorkflows();
    const saved = list.find((r) => r.id === result.ruleId);
    assert.ok(saved);
    assert.equal(saved.isActive, true);
  });

  it('toggles and executes registered workflow immediately on demand', () => {
    const list = listRegisteredBusinessWorkflows();
    assert.ok(list.length > 0);
    const target = list[0];

    const toggleRes = toggleBusinessWorkflow(target.id, false);
    assert.ok(toggleRes.success);
    assert.equal(toggleRes.rule?.isActive, false);

    const execRes = executeWorkflowImmediately(target.id);
    assert.ok(execRes.success);
    assert.ok(execRes.executedActions > 0);
    assert.equal(execRes.results[0].status, 'completed');
  });
});
