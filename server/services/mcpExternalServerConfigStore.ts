import { createJsonFileLocalStore } from './aiWorkforceLocalStore.ts';
import { resolveRuntimePathFromEnv } from './runtimePaths.ts';

export type MCPExternalTransport = 'streamable-http' | 'sse' | 'stdio';

export interface MCPExternalServerConfigRecord {
  id: string;
  name: string;
  transport: MCPExternalTransport;
  endpoint: string;
  credentialEnv?: string;
  enabled: boolean;
  updatedAt: string;
}

interface MCPExternalServerConfigStoreFile extends Record<string, unknown> {
  version: 1;
  servers: Record<string, MCPExternalServerConfigRecord>;
}

const store = createJsonFileLocalStore<MCPExternalServerConfigStoreFile>({
  filePath: () => resolveRuntimePathFromEnv('MCP_EXTERNAL_SERVER_CONFIG_FILE', 'mcp_external_servers.local.json'),
  emptyState: () => ({ version: 1, servers: {} }),
  normalizeState: (parsed) => {
    const candidate = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Partial<MCPExternalServerConfigStoreFile> : {};
    const servers = candidate.servers && typeof candidate.servers === 'object' ? candidate.servers : {};
    return { version: 1, servers: Object.fromEntries(Object.entries(servers).filter(([, value]) => Boolean(value && typeof value === 'object' && typeof (value as MCPExternalServerConfigRecord).id === 'string'))) as Record<string, MCPExternalServerConfigRecord> };
  },
});

export async function listMCPExternalServerConfigs() {
  const state = await store.read();
  return Object.values(state.servers).sort((a, b) => a.id.localeCompare(b.id));
}

export async function upsertMCPExternalServerConfig(input: Omit<MCPExternalServerConfigRecord, 'updatedAt'>) {
  const record: MCPExternalServerConfigRecord = { ...input, updatedAt: new Date().toISOString() };
  await store.mutate((state) => { state.servers[record.id] = record; });
  return record;
}

export async function clearMCPExternalServerConfigsForTest() {
  await store.clear();
}
