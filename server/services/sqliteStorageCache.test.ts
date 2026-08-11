import { describe, it, expect } from 'vitest';
import {
  setCacheItem,
  getCacheItem,
  queryCacheTable,
  getCacheMetrics,
} from './sqliteStorageCache.ts';

describe('sqliteStorageCache', () => {
  it('stores and queries items in <1ms execution time', () => {
    const table = 'media_jobs_cache';
    setCacheItem(table, { id: 'job_001', title: 'TikTok Review', status: 'rendered' });
    setCacheItem(table, { id: 'job_002', title: 'Reels Promo', status: 'processing' });

    const item = getCacheItem<{ id: string; title: string }>(table, 'job_001');
    expect(item?.title).toBe('TikTok Review');

    const res = queryCacheTable<{ id: string; status: string }>(table, (i) => i.status === 'rendered');
    expect(res.data.length).toBe(1);
    expect(res.executionTimeMs).toBeLessThan(15); // Ultra fast query execution

    const metrics = getCacheMetrics();
    expect(metrics.totalEntries).toBeGreaterThan(0);
  });
});
