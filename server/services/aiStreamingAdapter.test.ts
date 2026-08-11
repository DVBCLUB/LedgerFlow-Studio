import { describe, it, expect } from 'vitest';
import { streamAICompletion, streamAIResponseToCallback } from './aiStreamingAdapter.ts';

describe('aiStreamingAdapter', () => {
  it('streams completion tokens via AsyncGenerator', async () => {
    const chunks: string[] = [];
    for await (const chunk of streamAICompletion([{ role: 'user', content: 'Say hello world' }], { simulatedChunkDelayMs: 0 })) {
      chunks.push(chunk.text);
    }

    expect(chunks.length).toBeGreaterThan(0);
    const text = chunks.join('');
    expect(text.length).toBeGreaterThan(0);
  });

  it('streams response to callback handler', async () => {
    const receivedChunks: string[] = [];
    const fullText = await streamAIResponseToCallback(
      [{ role: 'user', content: 'Count to 3' }],
      (chunk) => receivedChunks.push(chunk.text),
      { simulatedChunkDelayMs: 0 }
    );

    expect(receivedChunks.length).toBeGreaterThan(0);
    expect(fullText).toBe(receivedChunks.join(''));
  });
});
