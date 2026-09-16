import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  listDocIngestionTargets,
  updateDocIngestionTarget,
  addDocIngestionTarget,
} from './glaciaDocIngestionSchedule.ts';

describe('Glacia Doc Ingestion Schedule', () => {
  it('lists default ingestion targets', () => {
    const targets = listDocIngestionTargets();
    assert.ok(Array.isArray(targets));
    assert.ok(targets.length >= 4);
    assert.ok(targets.some(t => t.id === 'blender_python_api'));
    assert.ok(targets.some(t => t.id === 'ffmpeg_filters_guide'));
  });

  it('returns targets with correct structure', () => {
    const targets = listDocIngestionTargets();
    const first = targets[0];
    assert.ok(first.id);
    assert.ok(first.name);
    assert.ok(first.url);
    assert.ok(first.category);
    assert.ok(['daily', 'weekly', 'monthly'].includes(first.frequency));
    assert.ok(first.maxPages > 0);
    assert.ok(['idle', 'running', 'completed', 'failed'].includes(first.status));
    assert.ok(typeof first.enabled === 'boolean');
  });

  it('updates an existing target', () => {
    const updated = updateDocIngestionTarget('blender_python_api', {
      frequency: 'daily',
      maxPages: 50,
      enabled: false,
    });

    assert.ok(updated);
    assert.equal(updated?.frequency, 'daily');
    assert.equal(updated?.maxPages, 50);
    assert.equal(updated?.enabled, false);
  });

  it('returns undefined for non-existent target update', () => {
    const result = updateDocIngestionTarget('non-existent-id', { enabled: true });
    assert.equal(result, undefined);
  });

  it('adds a new ingestion target', () => {
    const newTarget = addDocIngestionTarget({
      name: 'React Documentation',
      url: 'https://react.dev',
      category: 'fullstack_code',
      frequency: 'weekly',
      maxPages: 10,
      enabled: true,
    });

    assert.ok(newTarget.id.startsWith('target_'));
    assert.equal(newTarget.status, 'idle');
    assert.equal(newTarget.name, 'React Documentation');
    assert.equal(newTarget.enabled, true);
  });
});
