import assert from 'node:assert/strict';
import test from 'node:test';
import { buildGroundedContextPack, requireGroundedContextForHighImpact } from './groundedContextPack.ts';

test('grounded context pack creates source map, graph, and confidence', () => {
  const pack = buildGroundedContextPack({
    question: 'Tạo roadmap cho AI Workforce và memory RAG',
    requiredTags: ['ai-workforce'],
    sources: [
      {
        kind: 'decision',
        title: 'AI Workforce Decision Log',
        content: 'LedgerFlow needs mission control, grounded memory, RAG, and safety guardrails.',
        tags: ['ai-workforce', 'rag'],
        facts: { memory_mode: 'grounded' },
        confidence: 0.92,
      },
      {
        kind: 'document',
        title: 'Marketing Plan',
        content: 'Unrelated sales content.',
        tags: ['marketing'],
      },
    ],
  });

  assert.equal(pack.sourceMap.length, 1);
  assert.equal(pack.sourceMap[0].kind, 'decision');
  assert.ok(pack.context.includes('[S1'));
  assert.ok(pack.graph.nodes.some((node) => node.type === 'entity' && node.label === 'ai-workforce'));
  assert.ok(pack.confidence >= 0.8);
  assert.equal(requireGroundedContextForHighImpact(pack), true);
});

test('grounded context pack detects contradictory facts and blocks high-impact output', () => {
  const pack = buildGroundedContextPack({
    question: 'Kiểm tra chính sách robot automation',
    sources: [
      { kind: 'sop', title: 'Robot SOP A', content: 'Robot move requires approval.', tags: ['robot'], facts: { robot_move: 'approval_required' } },
      { kind: 'runtime', title: 'Robot Runtime B', content: 'Robot move can run automatically.', tags: ['robot'], facts: { robot_move: 'auto_allowed' } },
    ],
  });

  assert.equal(pack.contradictions.length, 1);
  assert.equal(pack.contradictions[0].factKey, 'robot_move');
  assert.throws(() => requireGroundedContextForHighImpact(pack), /contradiction review/);
});
