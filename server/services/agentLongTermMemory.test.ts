import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addLessonLearned,
  searchLongTermMemory,
  injectLessonsIntoSystemPrompt,
  reinforceLesson,
  listLessonsLearned,
} from './agentLongTermMemory.ts';

test('agentLongTermMemory - adds and searches lessons learned', async () => {
  const lesson = await addLessonLearned({
    category: 'coding',
    topic: 'React Hook Dependency Array',
    insight: 'Omitted dependencies cause stale closure bugs in custom hooks.',
    recommendedAction: 'Always include all referenced state in useEffect dependency array.',
    confidence: 0.9,
  });

  assert.ok(lesson.id);
  assert.equal(lesson.topic, 'React Hook Dependency Array');

  const results = await searchLongTermMemory('useEffect stale closure hook dependencies', 'coding');
  assert.ok(results.length > 0);
  assert.equal(results[0].topic, 'React Hook Dependency Array');
});

test('agentLongTermMemory - injects relevant lessons into system prompt', async () => {
  await addLessonLearned({
    category: 'finance',
    topic: 'VAS 200 Reconcile Rule',
    insight: 'Account 111 vs 112 mismatches are frequent during tax audits.',
    recommendedAction: 'Verify bank deposit slips against cash vouchers before entry.',
    confidence: 0.95,
  });

  const basePrompt = 'You are an AI Accountant.';
  const augmented = await injectLessonsIntoSystemPrompt(basePrompt, 'finance', 'Account 111 vs 112 bank deposit slips');

  assert.ok(augmented.includes('LESSONS LEARNED & BEST PRACTICES'));
  assert.ok(augmented.includes('VAS 200 Reconcile Rule'));
});

test('agentLongTermMemory - reinforces or decays lesson confidence based on feedback', async () => {
  const lesson = await addLessonLearned({
    category: 'rpa',
    topic: 'Shell Timeout Adjustment',
    insight: 'Heavy npm build steps require at least 120s timeout.',
    recommendedAction: 'Set timeoutMs to 120000 for npm build actions.',
    confidence: 0.8,
  });

  const updated = await reinforceLesson(lesson.id, true);
  assert.ok((updated?.confidence ?? 0) > 0.8);
});

