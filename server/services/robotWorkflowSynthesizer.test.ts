import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { synthesizeRobotWorkflowFromGoal } from './robotWorkflowSynthesizer.ts';

describe('Milestone 1: Generative Self-Synthesizing Workflow Engine', () => {
  it('synthesizes multi-step RPA pipeline on-the-fly from natural language goal prompt', () => {
    const workflow = synthesizeRobotWorkflowFromGoal('Quét toàn bộ hóa đơn MISA chưa thanh toán và gửi tin nhắn Telegram cho CFO');

    assert.ok(workflow.id.startsWith('wf_v6_'));
    assert.equal(workflow.steps.length, 3);
    assert.equal(workflow.steps[0].platform, 'web');
    assert.equal(workflow.steps[1].platform, 'desktop');
    assert.equal(workflow.steps[2].platform, 'mobile_telegram');
    assert.ok(workflow.synthesisConfidence >= 0.9);
  });
});
