import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getWorkingMemoryState,
  pushWorkingMemoryItem,
  recordEpisodicMemory,
  recallRelevantContext,
} from './glaciaWorkingMemoryEngine.ts';

test('glaciaWorkingMemoryEngine - getWorkingMemoryState returns default state', () => {
  const state = getWorkingMemoryState();
  assert.ok(Array.isArray(state.workingMemory));
  assert.ok(state.ceoProfile.email === 'davidbao1704@gmail.com');
});

test('glaciaWorkingMemoryEngine - pushWorkingMemoryItem adds item and enforces Miller law limit', () => {
  const item = pushWorkingMemoryItem({
    topic: 'Test New Task',
    summary: 'Testing working memory item insertion',
    importance: 'high',
    category: 'active_goal',
  });

  assert.ok(item.id.startsWith('wm-'));
  const state = getWorkingMemoryState();
  assert.ok(state.workingMemory.length <= 7);
  assert.equal(state.workingMemory[0].topic, 'Test New Task');
});

test('glaciaWorkingMemoryEngine - recordEpisodicMemory saves lesson node', () => {
  const node = recordEpisodicMemory({
    event: 'Kiểm thử đơn vị thành công',
    outcome: 'success',
    tags: ['test', 'unit'],
    lesson: 'Luôn viết unit test bảo vệ mã nguồn.',
  });

  assert.ok(node.id.startsWith('epi-'));
  assert.equal(node.outcome, 'success');
});

test('glaciaWorkingMemoryEngine - recallRelevantContext finds matching items', () => {
  const recalled = recallRelevantContext('Glacia');
  assert.ok(Array.isArray(recalled.workingItems));
  assert.ok(Array.isArray(recalled.episodicItems));
});
