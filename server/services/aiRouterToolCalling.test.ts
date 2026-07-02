import assert from 'node:assert/strict';
import test from 'node:test';
import type { ToolSpec } from './aiClient.ts';
import {
  parseAnthropicToolCalls,
  parseGeminiToolCalls,
  parseOpenAIToolCalls,
  testAIKey,
  toAnthropicTools,
  toGeminiTools,
  toOpenAITools,
} from './aiRouter.ts';

const sampleTools: ToolSpec[] = [
  {
    name: 'lookup_customer',
    description: 'Look up a customer by ID.',
    parameters: {
      type: 'object',
      properties: {
        customerId: { type: 'string', description: 'Customer ID.' },
      },
      required: ['customerId'],
      additionalProperties: false,
    },
  },
];

test('provider tool adapters emit exact schema shapes', () => {
  assert.deepEqual(toAnthropicTools(sampleTools), [
    {
      name: 'lookup_customer',
      description: 'Look up a customer by ID.',
      input_schema: sampleTools[0].parameters,
    },
  ]);

  assert.deepEqual(toOpenAITools(sampleTools), [
    {
      type: 'function',
      function: {
        name: 'lookup_customer',
        description: 'Look up a customer by ID.',
        parameters: sampleTools[0].parameters,
      },
    },
  ]);

  assert.deepEqual(toGeminiTools(sampleTools), [
    {
      functionDeclarations: [
        {
          name: 'lookup_customer',
          description: 'Look up a customer by ID.',
          parameters: sampleTools[0].parameters,
        },
      ],
    },
  ]);
});

test('native provider responses normalize tool calls', () => {
  assert.deepEqual(parseAnthropicToolCalls({
    content: [
      { type: 'text', text: 'I will check.' },
      { type: 'tool_use', id: 'toolu_1', name: 'lookup_customer', input: { customerId: 'C-100' } },
    ],
  }), [{ id: 'toolu_1', name: 'lookup_customer', args: { customerId: 'C-100' } }]);

  assert.deepEqual(parseOpenAIToolCalls({
    choices: [{
      message: {
        tool_calls: [{
          id: 'call_1',
          type: 'function',
          function: { name: 'lookup_customer', arguments: '{"customerId":"C-101"}' },
        }],
      },
    }],
  }), [{ id: 'call_1', name: 'lookup_customer', args: { customerId: 'C-101' } }]);

  assert.deepEqual(parseGeminiToolCalls({
    candidates: [{
      content: {
        parts: [{ functionCall: { name: 'lookup_customer', args: { customerId: 'C-102' } } }],
      },
    }],
  }), [{ id: 'gemini_tool_1', name: 'lookup_customer', args: { customerId: 'C-102' } }]);
});

test('OpenAI-compatible transport includes tools in fetch body', async (t) => {
  const originalFetch = globalThis.fetch;
  let capturedBody: any;
  globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
    capturedBody = JSON.parse(String(init?.body || '{}'));
    return new Response(JSON.stringify({
      model: 'gpt-test',
      choices: [{ message: { content: 'OK', tool_calls: [] } }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  const result = await testAIKey({
    provider: 'openai',
    apiKey: 'sk-test',
    model: 'gpt-test',
  }, {
    tools: sampleTools,
    toolChoice: 'auto',
  });

  assert.equal(result.success, true);
  assert.ok(Array.isArray(capturedBody.tools));
  assert.equal(capturedBody.tools[0].function.name, 'lookup_customer');
  assert.equal(capturedBody.tool_choice, 'auto');
});
