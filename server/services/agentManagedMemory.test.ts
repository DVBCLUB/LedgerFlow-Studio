import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addManagedMemoryRule,
  listManagedMemoryRules,
  toggleManagedMemoryRule,
  deleteManagedMemoryRule,
  compileActiveMemoryContext,
} from './agentManagedMemory.ts';

test('agentManagedMemory - loads presets and adds new memory rule', async () => {
  const rules = await listManagedMemoryRules();
  assert.ok(rules.length > 0);

  const rule = await addManagedMemoryRule({
    category: 'coding_style',
    title: 'Prefer Functional Components',
    ruleText: 'Always use React functional components with hooks.',
  });

  assert.ok(rule.id);
  assert.equal(rule.title, 'Prefer Functional Components');
});

test('agentManagedMemory - compiles active memory rules into system prompt context', async () => {
  const context = await compileActiveMemoryContext();
  assert.ok(context.includes('PERSISTENT MANAGED MEMORY'));
  assert.ok(context.includes('Route AI through AI Fabric'));
});

test('agentManagedMemory - toggles and deletes rules', async () => {
  const rule = await addManagedMemoryRule({
    category: 'user_preferences',
    title: 'Temp Rule',
    ruleText: 'Temporary text',
  });

  const toggled = await toggleManagedMemoryRule(rule.id, false);
  assert.equal(toggled?.enabled, false);

  const deleted = await deleteManagedMemoryRule(rule.id);
  assert.equal(deleted, true);
});

