import test from 'node:test';
import assert from 'node:assert/strict';
import { generateGroundedResponse } from './searchGroundingEngine.ts';

test('searchGroundingEngine - generates grounded AI response with citation sources', async () => {
  const res = await generateGroundedResponse('Quy định thuế GTGT Thông tư 78 năm 2026');

  assert.ok(res.id);
  assert.ok(res.answer);
  assert.ok(res.sources.length > 0);
  assert.ok(res.answerWithCitations.includes('GROUNDING CITATIONS'));
  assert.equal(res.grounded, true);
});

