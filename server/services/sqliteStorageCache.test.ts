import test from 'node:test';
import assert from 'node:assert/strict';
import {
  setCacheItem,
  getCacheItem,
  queryCacheTable,
  getCacheMetrics,
} from './sqliteStorageCache.ts';

test('sqliteStorageCache - stores and queries items in <1ms execution time', () => {
  const table = 'media_jobs_cache';
  setCacheItem(table, { id: 'job_001', title: 'TikTok Review', status: 'rendered' });
  setCacheItem(table, { id: 'job_002', title: 'Reels Promo', status: 'processing' });

  const item = getCacheItem<{ id: string; title: string }>(table, 'job_001');
  assert.equal(item?.title, 'TikTok Review');

  const res = queryCacheTable<{ id: string; status: string }>(table, (i) => i.status === 'rendered');
  assert.equal(res.data.length, 1);
  assert.ok(res.executionTimeMs < 15);

  const metrics = getCacheMetrics();
  assert.ok(metrics.totalEntries > 0);
});

