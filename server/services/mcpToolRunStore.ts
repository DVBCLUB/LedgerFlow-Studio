import { createJsonFileLocalStore } from './aiWorkforceLocalStore.ts';
import { resolveRuntimePathFromEnv } from './runtimePaths.ts';
import type { MCPToolRunSignal } from './mcpToolManifestRegistry.ts';

const MAX_SIGNALS = 2_000;

interface MCPToolRunStoreFile extends Record<string, unknown> {
  version: 1;
  signals: MCPToolRunSignal[];
}

const store = createJsonFileLocalStore<MCPToolRunStoreFile>({
  filePath: () => resolveRuntimePathFromEnv('MCP_TOOL_RUN_STORE_FILE', 'mcp_tool_run_signals.local.json'),
  emptyState: () => ({ version: 1, signals: [] }),
  normalizeState: (parsed) => {
    const candidate = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Partial<MCPToolRunStoreFile> : {};
    return {
      version: 1,
      signals: Array.isArray(candidate.signals) ? candidate.signals.filter((signal): signal is MCPToolRunSignal => Boolean(
        signal && typeof signal.toolId === 'string' && typeof signal.ok === 'boolean' && typeof signal.latencyMs === 'number' && typeof signal.createdAt === 'string',
      )).slice(-MAX_SIGNALS) : [],
    };
  },
});

export async function appendMCPToolRunSignal(signal: MCPToolRunSignal) {
  await store.mutate((state) => {
    state.signals.push({ ...signal });
    if (state.signals.length > MAX_SIGNALS) state.signals.splice(0, state.signals.length - MAX_SIGNALS);
  });
  return signal;
}

export async function listMCPToolRunSignals(limit = MAX_SIGNALS) {
  const state = await store.read();
  return state.signals
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, Math.max(1, Math.min(limit, MAX_SIGNALS)));
}

export async function getMCPToolRunStoreStats() {
  const signals = await listMCPToolRunSignals();
  return { total: signals.length, latestSignal: signals[0] || null, storage: await store.stats() };
}

export async function clearMCPToolRunStoreForTest() {
  await store.clear();
}
