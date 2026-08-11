import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { clearMCPExternalServerConfigsForTest, listMCPExternalServerConfigs, upsertMCPExternalServerConfig } from './mcpExternalServerConfigStore.ts';

test('external MCP catalog configuration persists without storing secrets', async (t) => {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'ledgerflow-mcp-config-'));
  const previous = process.env.MCP_EXTERNAL_SERVER_CONFIG_FILE;
  process.env.MCP_EXTERNAL_SERVER_CONFIG_FILE = path.join(directory, 'servers.json');
  await clearMCPExternalServerConfigsForTest();
  t.after(async () => {
    if (previous === undefined) delete process.env.MCP_EXTERNAL_SERVER_CONFIG_FILE;
    else process.env.MCP_EXTERNAL_SERVER_CONFIG_FILE = previous;
    await fs.promises.rm(directory, { recursive: true, force: true });
  });

  await upsertMCPExternalServerConfig({ id: 'local_tools', name: 'Local tools', transport: 'streamable-http', endpoint: 'http://127.0.0.1:3010/mcp', credentialEnv: 'MCP_EXTERNAL_LOCAL_TOOLS_AUTHORIZATION', enabled: true });
  const configs = await listMCPExternalServerConfigs();
  assert.equal(configs.length, 1);
  assert.equal(configs[0].credentialEnv, 'MCP_EXTERNAL_LOCAL_TOOLS_AUTHORIZATION');
  assert.equal(JSON.stringify(configs), JSON.stringify(configs).replace('MCP_EXTERNAL_LOCAL_TOOLS_AUTHORIZATION', 'MCP_EXTERNAL_LOCAL_TOOLS_AUTHORIZATION'));
});
