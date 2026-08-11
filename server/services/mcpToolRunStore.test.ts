import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { appendMCPToolRunSignal, clearMCPToolRunStoreForTest, getMCPToolRunStoreStats, listMCPToolRunSignals } from './mcpToolRunStore.ts';

test('MCP tool run store persists health signals in the runtime directory', async (t) => {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'ledgerflow-mcp-runs-'));
  const previous = process.env.MCP_TOOL_RUN_STORE_FILE;
  process.env.MCP_TOOL_RUN_STORE_FILE = path.join(directory, 'signals.json');
  await clearMCPToolRunStoreForTest();
  t.after(async () => {
    if (previous === undefined) delete process.env.MCP_TOOL_RUN_STORE_FILE;
    else process.env.MCP_TOOL_RUN_STORE_FILE = previous;
    await fs.promises.rm(directory, { recursive: true, force: true });
  });

  await appendMCPToolRunSignal({ toolId: 'read_knowledge', ok: true, latencyMs: 18, createdAt: '2026-08-11T00:00:00.000Z' });
  await appendMCPToolRunSignal({ toolId: 'external_connector', ok: false, latencyMs: 500, error: 'Timed out', createdAt: '2026-08-11T00:01:00.000Z' });

  const signals = await listMCPToolRunSignals();
  assert.equal(signals.length, 2);
  assert.equal(signals[0].toolId, 'external_connector');
  const stats = await getMCPToolRunStoreStats();
  assert.equal(stats.total, 2);
  assert.equal(stats.latestSignal?.error, 'Timed out');
  assert.ok(stats.storage.file.endsWith('signals.json'));
});
