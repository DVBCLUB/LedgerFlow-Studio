import test from 'node:test';
import assert from 'node:assert/strict';
import { streamAICompletion, streamAIResponseToCallback } from './aiStreamingAdapter.ts';

test('aiStreamingAdapter - streams completion tokens via AsyncGenerator', async () => {
  const chunks: string[] = [];
  for await (const chunk of streamAICompletion([{ role: 'user', content: 'Say hello world' }], { simulatedChunkDelayMs: 0 })) {
    chunks.push(chunk.text);
  }

  assert.ok(chunks.length > 0);
  const text = chunks.join('');
  assert.ok(text.length > 0);
});

test('aiStreamingAdapter - streams response to callback handler', async () => {
  const receivedChunks: string[] = [];
  const fullText = await streamAIResponseToCallback(
    [{ role: 'user', content: 'Count to 3' }],
    (chunk) => receivedChunks.push(chunk.text),
    { simulatedChunkDelayMs: 0 }
  );

  assert.ok(receivedChunks.length > 0);
  assert.equal(fullText, receivedChunks.join(''));
});

