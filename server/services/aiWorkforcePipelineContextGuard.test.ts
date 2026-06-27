import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPipelineStepGroundedContext } from './aiWorkforcePipelineContextGuard.ts';

test('pipeline step context guard builds a grounded prompt with source map metadata', () => {
  const result = buildPipelineStepGroundedContext({
    pipelineId: 'pipeline-1',
    pipelineType: 'software_product',
    stepId: 'step-1',
    stepName: 'AI Dev — Plan code',
    agentRole: 'AI Dev',
    prompt: 'Plan code for LedgerFlow AI Workforce runtime dashboard using React and Express.',
    userInput: { idea: 'AI Workforce runtime dashboard', targetUser: 'LedgerFlow founder' },
    memoryContext: 'LedgerFlow uses React 19, TypeScript, Vite, Express and desktop-first workflows.',
    previousOutputs: ['Product spec requires source maps, confidence score and approval checkpoint.'],
    highImpact: true,
  });

  assert.equal(result.guard.ok, true);
  assert.equal(result.highImpact, true);
  assert.ok(result.sourceCount >= 3);
  assert.ok(result.confidence >= 0.65);
  assert.match(result.groundedPrompt, /GROUNDED PIPELINE CONTEXT/);
  assert.match(result.groundedPrompt, /Context Pack:/);
  assert.match(result.groundedPrompt, /PIPELINE TASK/);
  assert.ok(result.pack.sourceMap.some((source) => source.kind === 'memory'));
  assert.ok(result.pack.graph.nodes.length > 0);
});

test('pipeline step context guard blocks high-impact contradictory sources', () => {
  const result = buildPipelineStepGroundedContext({
    pipelineId: 'pipeline-2',
    pipelineType: 'robot_lab',
    stepId: 'step-robot',
    stepName: 'Robot motion decision',
    agentRole: 'Automation Safety Agent',
    prompt: 'Decide whether robot movement can run without human review.',
    highImpact: true,
    additionalSources: [
      {
        kind: 'sop',
        title: 'Robot SOP',
        content: 'Robot movement requires human approval and emergency stop readiness.',
        tags: ['pipeline-step', 'robot_lab'],
        facts: { robot_motion_policy: 'human_approval_required' },
      },
      {
        kind: 'runtime',
        title: 'Unsafe runtime note',
        content: 'Robot movement may run automatically without review.',
        tags: ['pipeline-step', 'robot_lab'],
        facts: { robot_motion_policy: 'automatic_without_review' },
      },
    ],
  });

  assert.equal(result.guard.ok, false);
  assert.ok(result.contradictionCount >= 1);
  assert.match(result.groundedPrompt, /blocked/);
});
