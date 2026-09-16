import assert from 'node:assert/strict';
import test from 'node:test';
import {
  fetchCleanWebpage,
  formatGeminiWebchatStealthPrompt,
  analyzeWebpageWithGemini,
} from './glaciaGeminiDeepWebBridge.ts';

test('glaciaGeminiDeepWebBridge - formatGeminiWebchatStealthPrompt formats human-like prompt for webchat', () => {
  const url = 'https://ai.google.dev/docs';
  const question = 'Gemini 2.5 Flash context window là bao nhiêu?';
  const prompt = formatGeminiWebchatStealthPrompt(url, question);

  assert.ok(prompt.includes(url), 'Prompt must include the target URL');
  assert.ok(prompt.includes(question), 'Prompt must include the user question');
  assert.ok(prompt.includes('Hãy truy cập') || prompt.includes('đọc nội dung'), 'Prompt must use natural conversational request');
});

test('glaciaGeminiDeepWebBridge - fetchCleanWebpage extracts structured content gracefully', async () => {
  // Test fallback extraction for non-existent or test domain
  const res = await fetchCleanWebpage('https://example.com/test-article');

  assert.ok(res.url.includes('example.com'));
  assert.ok(res.title);
  assert.ok(Array.isArray(res.headings));
  assert.ok(typeof res.mainText === 'string');
});

test('glaciaGeminiDeepWebBridge - analyzeWebpageWithGemini generates grounded response structure', async () => {
  const result = await analyzeWebpageWithGemini({
    url: 'https://docs.ledgerflow.example/docs',
    question: 'Tóm tắt các chính sách quan trọng nhất?',
    enableSearchGrounding: true,
  });

  assert.ok(result.id.startsWith('gem_web_'));
  assert.ok(result.url);
  assert.ok(result.answer);
  assert.ok(result.answerWithCitations.includes('NGUỒN TRÍCH DẪN'));
  assert.ok(result.sources.length >= 1);
  assert.ok(result.charCountAnalyzed >= 0);
});
