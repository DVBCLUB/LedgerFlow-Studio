import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  registerPlugin,
  unregisterPlugin,
  listPlugins,
  loadBuiltInPlugins,
  getBuiltInPluginDefs,
  createBuiltInPlugin,
  runHook,
} from './glaciaPluginSystem.ts';

describe('Glacia Plugin System', () => {
  it('loads built-in plugins on startup', () => {
    loadBuiltInPlugins();
    const plugins = listPlugins();
    assert.ok(Array.isArray(plugins));
    assert.ok(plugins.length >= 1);
  });

  it('registers a new plugin', () => {
    const plugin = createBuiltInPlugin(
      'test-plugin',
      'Test Plugin',
      'A test plugin',
      ['web_research'],
      ['before_task', 'after_task']
    );

    const registered = registerPlugin(plugin);
    assert.equal(registered, true);
  });

  it('prevents duplicate plugin registration', () => {
    const plugin = createBuiltInPlugin(
      'test-plugin',
      'Test Plugin Duplicate',
      'Duplicate',
      [],
      []
    );

    const registered = registerPlugin(plugin);
    assert.equal(registered, false);
  });

  it('lists all registered plugins', () => {
    const plugins = listPlugins();
    assert.ok(Array.isArray(plugins));
    assert.ok(plugins.some(p => p.manifest.id === 'glacia-test-plugin'));
  });

  it('unregisters a plugin', () => {
    const unregistered = unregisterPlugin('glacia-test-plugin');
    assert.equal(unregistered, true);

    const plugins = listPlugins();
    assert.ok(!plugins.some(p => p.manifest.id === 'glacia-test-plugin'));
  });

  it('returns false when unregistering non-existent plugin', () => {
    const result = unregisterPlugin('non-existent-plugin');
    assert.equal(result, false);
  });

  it('returns built-in plugin definitions', () => {
    const defs = getBuiltInPluginDefs();
    assert.ok(Array.isArray(defs));
  });

  it('runs plugin hooks', async () => {
    const plugin = createBuiltInPlugin(
      'hook-test-plugin',
      'Hook Test',
      'Testing hooks',
      ['skill_execute'],
      ['before_task', 'on_startup']
    );
    registerPlugin(plugin);

    await runHook('on_startup', {});
    const result = await runHook('before_task', { taskId: 'test-123' });
    assert.equal(result, undefined);
  });
});
