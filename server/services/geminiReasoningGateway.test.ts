import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { streamGeminiReasoningThoughtTrajectory } from './geminiReasoningGateway.ts';

describe('Milestone 2: DeepMind Gemini Flash Thinking Reasoning Visualizer', () => {
  it('extracts step-by-step reasoning steps and visualizes thought trajectory', () => {
    const result = streamGeminiReasoningThoughtTrajectory({
      prompt: 'Tối ưu hóa ngân sách marketing SaaS',
      thinkingBudgetTokens: 2048,
    });

    assert.equal(result.model, 'gemini-2.0-flash-thinking-exp');
    assert.equal(result.thinkingBudgetTokens, 2048);
    assert.ok(result.thoughtSteps.length >= 3);
    assert.ok(result.finalConclusion.includes('Reasoning Approved'));
  });
});
