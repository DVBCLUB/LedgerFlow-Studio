import { describe, it, expect } from 'vitest';
import {
  addManagedMemoryRule,
  listManagedMemoryRules,
  toggleManagedMemoryRule,
  deleteManagedMemoryRule,
  compileActiveMemoryContext,
} from './agentManagedMemory.ts';

describe('agentManagedMemory', () => {
  it('loads presets and adds new memory rule', async () => {
    const rules = await listManagedMemoryRules();
    expect(rules.length).toBeGreaterThan(0);

    const rule = await addManagedMemoryRule({
      category: 'coding_style',
      title: 'Prefer Functional Components',
      ruleText: 'Always use React functional components with hooks.',
    });

    expect(rule.id).toBeDefined();
    expect(rule.title).toBe('Prefer Functional Components');
  });

  it('compiles active memory rules into system prompt context', async () => {
    const context = await compileActiveMemoryContext();
    expect(context).toContain('PERSISTENT MANAGED MEMORY');
    expect(context).toContain('Route AI through AI Fabric');
  });

  it('toggles and deletes rules', async () => {
    const rule = await addManagedMemoryRule({
      category: 'user_preferences',
      title: 'Temp Rule',
      ruleText: 'Temporary text',
    });

    const toggled = await toggleManagedMemoryRule(rule.id, false);
    expect(toggled?.enabled).toBe(false);

    const deleted = await deleteManagedMemoryRule(rule.id);
    expect(deleted).toBe(true);
  });
});
