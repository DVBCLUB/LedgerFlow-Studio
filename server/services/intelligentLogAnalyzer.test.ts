import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeLogContent,
  getPatterns,
  getLogStats,
} from './intelligentLogAnalyzer.ts';

test('intelligentLogAnalyzer - detects known error patterns and calculates health score', async () => {
  const sampleLog = `
2026-08-19T10:00:00.000Z [INFO] Server started successfully on port 3000
2026-08-19T10:01:15.000Z [ERROR] Fetch failed: ETIMEDOUT connection timed out to upstream
2026-08-19T10:02:30.000Z [CRITICAL] JavaScript heap out of memory allocation failed
2026-08-19T10:03:00.000Z [WARN] Rate limit 429 too many requests from client
`;

  const analysis = await analyzeLogContent(sampleLog, 'test_runtime.log', false);
  assert.ok(analysis.id);
  assert.equal(analysis.totalLines >= 4, true);
  assert.ok(analysis.patternsFound.includes('timeout'));
  assert.ok(analysis.patternsFound.includes('out_of_memory'));
  assert.ok(analysis.patternsFound.includes('rate_limit'));
  assert.ok(analysis.anomalies.length >= 2);
  assert.ok(analysis.healthScore < 100);
});

test('intelligentLogAnalyzer - returns known patterns and stats', () => {
  const patterns = getPatterns();
  assert.ok(patterns.length >= 8);
  assert.ok(patterns.some((p) => p.name === 'circuit_breaker'));

  const stats = getLogStats();
  assert.ok(stats.total >= 0);
});
