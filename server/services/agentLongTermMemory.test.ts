import { describe, it, expect, beforeEach } from 'vitest';
import {
  addLessonLearned,
  searchLongTermMemory,
  injectLessonsIntoSystemPrompt,
  reinforceLesson,
  listLessonsLearned,
} from './agentLongTermMemory.ts';

describe('agentLongTermMemory', () => {
  it('adds and searches lessons learned', async () => {
    const lesson = await addLessonLearned({
      category: 'coding',
      topic: 'React Hook Dependency Array',
      insight: 'Omitted dependencies cause stale closure bugs in custom hooks.',
      recommendedAction: 'Always include all referenced state in useEffect dependency array.',
      confidence: 0.9,
    });

    expect(lesson.id).toBeDefined();
    expect(lesson.topic).toBe('React Hook Dependency Array');

    const results = await searchLongTermMemory('useEffect stale closure hook dependencies', 'coding');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].topic).toBe('React Hook Dependency Array');
  });

  it('injects relevant lessons into system prompt', async () => {
    await addLessonLearned({
      category: 'finance',
      topic: 'VAS 200 Reconcile Rule',
      insight: 'Account 111 vs 112 mismatches are frequent during tax audits.',
      recommendedAction: 'Verify bank deposit slips against cash vouchers before entry.',
      confidence: 0.95,
    });

    const basePrompt = 'You are an AI Accountant.';
    const augmented = await injectLessonsIntoSystemPrompt(basePrompt, 'finance', 'Account 111 vs 112 bank deposit slips');

    expect(augmented).toContain('LESSONS LEARNED & BEST PRACTICES');
    expect(augmented).toContain('VAS 200 Reconcile Rule');
  });

  it('reinforces or decays lesson confidence based on feedback', async () => {
    const lesson = await addLessonLearned({
      category: 'rpa',
      topic: 'Shell Timeout Adjustment',
      insight: 'Heavy npm build steps require at least 120s timeout.',
      recommendedAction: 'Set timeoutMs to 120000 for npm build actions.',
      confidence: 0.8,
    });

    const updated = await reinforceLesson(lesson.id, true);
    expect(updated?.confidence).toBeGreaterThan(0.8);
  });
});
