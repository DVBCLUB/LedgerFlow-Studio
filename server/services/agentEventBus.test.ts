import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { computePercentileFromHistogram, LATENCY_BUCKETS_MS } from './agentEventBus.ts';

// ─── Pure helper (no side effects) ────────────────────────────────────────────

test('computePercentileFromHistogram - all samples in first bucket', () => {
  const counts = [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  // total=5, p50 target=ceil(5*0.5)=3 → cum reaches 3 at bucket 0 → 0.25
  assert.equal(computePercentileFromHistogram(counts, LATENCY_BUCKETS_MS, 0, 0.5), 0.25);
});

test('computePercentileFromHistogram - overflow returns last bucket', () => {
  const counts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  // total=4 (all overflow), cum never reaches target → last bucket = 1000
  assert.equal(computePercentileFromHistogram(counts, LATENCY_BUCKETS_MS, 4, 0.99), 1000);
});

test('computePercentileFromHistogram - empty histogram returns 0', () => {
  assert.equal(computePercentileFromHistogram([], LATENCY_BUCKETS_MS, 0, 0.5), 0);
});

// ─── Functional (isolated temp log file) ──────────────────────────────────────

test('agentEventBus - publish delivers in-memory and flushes without blocking', async () => {
  process.env.AGENT_EVENT_LOG_FILE = path.join(os.tmpdir(), `agent_events_test_${Date.now()}.json`);
  const bus = await import('./agentEventBus.ts');

  bus.clearEventLog();

  let received = 0;
  const unsub = bus.subscribe('test.ping', () => {
    received += 1;
  });

  const evt = await bus.publish('test.ping', { n: 1 }, 'test');
  assert.equal(evt.type, 'test.ping');
  assert.equal(received, 1);

  const log = bus.getEventLog(10);
  assert.ok(log.some((e) => e.id === evt.id), 'published event should appear in in-memory log');

  await bus.flushEventLog();

  const metrics = bus.meshLatencyHistogram();
  assert.equal(typeof metrics.published, 'number');
  assert.equal(typeof metrics.p50Ms, 'number');

  unsub();
});
