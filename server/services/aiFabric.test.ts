import assert from 'node:assert/strict';
import test from 'node:test';
import type { CallAIOptions, ChatMessage, ToolSpec } from './aiClient.ts';
import { dispatchTextThroughFabric, setAIFabricRouterForTest } from './aiFabric.ts';

const sampleTools: ToolSpec[] = [
  {
    name: 'read_knowledge',
    description: 'Read reviewed company knowledge.',
    parameters: {
      type: 'object',
      properties: {
        goal: { type: 'string' },
      },
      required: ['goal'],
      additionalProperties: false,
    },
  },
];

test('AI Fabric forwards native tool-calling options to the router', async (t) => {
  let capturedMessages: ChatMessage[] = [];
  let capturedOptions: CallAIOptions | undefined;

  const restore = setAIFabricRouterForTest(async (messages, options = {}) => {
    capturedMessages = messages;
    capturedOptions = options;
    return {
      content: '',
      modelUsed: 'openai/gpt-test',
      raw: {},
      toolCalls: [{ id: 'call_1', name: 'read_knowledge', args: { goal: 'Find policy' } }],
    };
  });
  t.after(restore);

  const run = await dispatchTextThroughFabric('Find relevant policy.', undefined, {
    task: 'coding',
    domain: 'coding',
    tools: sampleTools,
    toolChoice: 'auto',
    localFallback: false,
  });

  assert.equal(run.status, 'completed');
  assert.equal(capturedMessages.at(-1)?.content, 'Find relevant policy.');
  assert.equal(capturedOptions?.tools, sampleTools);
  assert.equal(capturedOptions?.toolChoice, 'auto');
  assert.deepEqual(run.winner?.toolCalls, [
    { id: 'call_1', name: 'read_knowledge', args: { goal: 'Find policy' } },
  ]);
});
