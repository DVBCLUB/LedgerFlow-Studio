import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { appendAIWorkforceRuntimeRecord, clearAIWorkforceRuntimeStoreForTest, listAIWorkforceRuntimeRecords } from './aiWorkforceRuntimeStore.ts';
import { pruneRuntimeRecordsByType } from './aiWorkforceRuntimeRecordRetention.ts';

process.env.AI_WORKFORCE_RUNTIME_STORE_FILE = path.join(os.tmpdir(), `runtime-retention-${process.pid}.json`);

test('runtime retention keeps newest records by type', async () => {
  await clearAIWorkforceRuntimeStoreForTest();
  await appendAIWorkforceRuntimeRecord({ id: 'export_old', type: 'release_gate_export', createdAt: '2026-06-28T00:00:00.000Z', payload: {} });
  await appendAIWorkforceRuntimeRecord({ id: 'export_mid', type: 'release_gate_export', createdAt: '2026-06-28T00:01:00.000Z', payload: {} });
  await appendAIWorkforceRuntimeRecord({ id: 'export_new', type: 'release_gate_export', createdAt: '2026-06-28T00:02:00.000Z', payload: {} });

  const result = await pruneRuntimeRecordsByType({ type: 'release_gate_export', keep: 2 });
  const records = await listAIWorkforceRuntimeRecords({ type: 'release_gate_export' });

  assert.equal(result.removed, 1);
  assert.deepEqual(records.map((record) => record.id), ['export_new', 'export_mid']);
});
