import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createJsonFileLocalStore, createSQLiteReadyLocalStore, type SQLiteReadyLocalStoreEngine } from './aiWorkforceLocalStore.ts';

interface SmokeState extends Record<string, unknown> {
  records: Record<string, { id: string; value: number; createdAt: string }>;
}

async function withTempFile(t: any) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'ledgerflow-aiw-local-store-'));
  t.after(async () => fs.rm(directory, { recursive: true, force: true }));
  return path.join(directory, 'store.json');
}

function createMockSQLiteEngine(file = 'mock-ai-workforce.sqlite'): SQLiteReadyLocalStoreEngine & { schemaCalls: () => number; writes: () => number } {
  const rows = new Map<string, unknown>();
  let schemaCallCount = 0;
  let writeCount = 0;
  let updatedAt: string | null = null;

  return {
    path: () => file,
    async ensureSchema() {
      schemaCallCount += 1;
    },
    async readJson(key: string) {
      return rows.has(key) ? structuredClone(rows.get(key)) : null;
    },
    async writeJson(key: string, value: unknown) {
      rows.set(key, structuredClone(value));
      writeCount += 1;
      updatedAt = new Date(2026, 0, writeCount).toISOString();
    },
    async deleteKey(key: string) {
      rows.delete(key);
      updatedAt = new Date(2026, 1, 1).toISOString();
    },
    async stats() {
      return { bytes: JSON.stringify(Object.fromEntries(rows)).length, updatedAt };
    },
    schemaCalls: () => schemaCallCount,
    writes: () => writeCount,
  };
}

test('JSON local-first store queues mutations, writes atomically and reports storage metadata', async (t) => {
  const file = await withTempFile(t);
  const store = createJsonFileLocalStore<SmokeState>({
    filePath: () => file,
    emptyState: () => ({ records: {} }),
    normalizeState: (parsed) => {
      const candidate = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Partial<SmokeState> : {};
      return { records: candidate.records && typeof candidate.records === 'object' ? candidate.records : {} };
    },
  });

  const writes = Array.from({ length: 8 }, (_, index) => store.mutate((state) => {
    state.records[`r-${index}`] = { id: `r-${index}`, value: index, createdAt: new Date(2026, 0, index + 1).toISOString() };
    return state.records[`r-${index}`];
  }));
  const written = await Promise.all(writes);
  assert.equal(written.length, 8);

  const state = await store.read();
  assert.equal(Object.keys(state.records).length, 8);
  assert.equal(state.records['r-7'].value, 7);

  const stats = await store.stats();
  assert.equal(stats.driver, 'json-file');
  assert.equal(stats.file, path.resolve(file));
  assert.ok(stats.bytes > 0);
  assert.ok(stats.collections.includes('records'));
  assert.ok(stats.updatedAt);

  await store.clear();
  assert.deepEqual(await store.read(), { records: {} });
});

test('JSON local-first store can normalize legacy raw JSON shapes', async (t) => {
  const file = await withTempFile(t);
  await fs.writeFile(file, JSON.stringify({ old: { id: 'old', value: 1, createdAt: '2026-01-01T00:00:00.000Z' } }), 'utf8');

  const store = createJsonFileLocalStore<SmokeState>({
    filePath: () => file,
    emptyState: () => ({ records: {} }),
    normalizeState: (parsed) => ({ records: parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as SmokeState['records'] : {} }),
  });

  const state = await store.read();
  assert.equal(state.records.old.id, 'old');
  assert.equal(state.records.old.value, 1);
});

test('SQLite-ready local-first store uses the same facade with a mockable engine', async () => {
  const engine = createMockSQLiteEngine('/tmp/ledgerflow-ai-workforce.sqlite');
  const store = createSQLiteReadyLocalStore<SmokeState>({
    key: 'runtime-store',
    engine,
    emptyState: () => ({ records: {} }),
    normalizeState: (parsed) => {
      const candidate = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Partial<SmokeState> : {};
      return { records: candidate.records && typeof candidate.records === 'object' ? candidate.records : {} };
    },
  });

  await store.mutate((state) => {
    state.records.one = { id: 'one', value: 1, createdAt: '2026-01-01T00:00:00.000Z' };
  });
  await store.mutate((state) => {
    state.records.two = { id: 'two', value: 2, createdAt: '2026-01-02T00:00:00.000Z' };
  });

  const state = await store.read();
  assert.equal(state.records.one.value, 1);
  assert.equal(state.records.two.value, 2);
  assert.ok(engine.schemaCalls() >= 3);
  assert.equal(engine.writes(), 2);

  const stats = await store.stats();
  assert.equal(stats.driver, 'sqlite-ready');
  assert.equal(stats.file, '/tmp/ledgerflow-ai-workforce.sqlite');
  assert.ok(stats.collections.includes('records'));
  assert.ok(stats.bytes > 0);
  assert.ok(stats.updatedAt);

  await store.clear();
  assert.deepEqual(await store.read(), { records: {} });
});
