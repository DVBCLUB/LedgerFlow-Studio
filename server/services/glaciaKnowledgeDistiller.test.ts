/**
 * server/services/glaciaKnowledgeDistiller.test.ts
 * Unit tests for Glacia Knowledge Distiller & Rule Engine.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  distillKnowledgeLesson,
  searchKnowledgeLessons,
  listDistilledLessons,
  expireStaleLessons,
  exportProjectRules,
} from './glaciaKnowledgeDistiller.ts';

describe('Glacia Knowledge Distiller Engine', () => {
  it('distills a verified solution into a structured lesson with TTL and memory entry', () => {
    const lesson = distillKnowledgeLesson({
      summary: 'Unity 6 Physics.Raycast: Xử lý lỗi NullReference',
      query: 'Unity 6 Physics.Raycast null reference exception',
      solution: 'Thêm null check hit.collider != null trước khi truy cập transform.',
      codeSnippet: 'if (Physics.Raycast(ray, out RaycastHit hit) && hit.collider != null) { ... }',
      sourceUrl: 'https://docs.unity3d.com/ScriptReference/Physics.Raycast.html',
      tags: ['unity6', 'csharp', 'physics'],
      ttlDays: 45,
      confidence: 99,
    });

    assert.ok(lesson.id.startsWith('lesson_'));
    assert.equal(lesson.ttlDays, 45);
    assert.ok(lesson.tags.includes('unity6'));

    const all = listDistilledLessons();
    assert.ok(all.some((l) => l.id === lesson.id));
  });

  it('searches lessons by semantic query or tags', () => {
    const results = searchKnowledgeLessons('Unity physics raycast');
    assert.ok(results.length > 0, 'Should find related lesson');
    assert.ok(results[0].summary.includes('Unity'));
  });

  it('exports active rules to markdown format', () => {
    const rules = exportProjectRules();
    assert.ok(rules.includes('# Glacia Distilled Project Rules'));
    assert.ok(rules.includes('Verified Solution'));
  });

  it('checks for expired stale lessons', () => {
    const stats = expireStaleLessons();
    assert.ok(typeof stats.activeCount === 'number');
  });
});
