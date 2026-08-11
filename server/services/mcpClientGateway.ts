/**
 * mcpClientGateway.ts
 * ============================================================
 * LedgerFlow Studio — MCP External Client Gateway
 * 
 * Manages outgoing connections to 3rd-party MCP servers (e.g. PostgreSQL MCP,
 * GitHub MCP, Brave Search MCP), discovers external tools, and registers them into
 * LedgerFlow's tool registry.
 */

import { registerAgentToolContract, type AgentToolContract } from './agentToolRegistry.ts';
import { probeExternalMCPHttpServer } from './mcpExternalProbe.ts';
import { listMCPExternalServerConfigs, upsertMCPExternalServerConfig, type MCPExternalTransport } from './mcpExternalServerConfigStore.ts';

export interface ExternalMCPServerConfig {
  id: string;
  name: string;
  transport: MCPExternalTransport;
  endpoint: string; // HTTP URL, SSE URL, or a server-side stdio profile reference
  status: 'connected' | 'disconnected' | 'planned' | 'error';
  lastPingAt?: string;
  toolCount: number;
  /** Name of a server-side environment variable holding a Bearer token. Never a token itself. */
  credentialEnv?: string;
  error?: string;
}

export interface ExternalMCPTool {
  serverId: string;
  name: string;
  description: string;
  schema?: Record<string, unknown>;
}

const connectedServers = new Map<string, ExternalMCPServerConfig>();
const externalTools = new Map<string, ExternalMCPTool[]>();

// Catalog entries are intentionally disconnected templates, never simulated live connections.
const defaultServers: ExternalMCPServerConfig[] = [
  {
    id: 'github_mcp',
    name: 'GitHub Official MCP Server',
    transport: 'sse',
    endpoint: 'https://mcp.github.com/v1/sse',
    status: 'planned',
    toolCount: 0,
  },
  {
    id: 'postgres_mcp',
    name: 'Local PostgreSQL MCP Server',
    transport: 'stdio',
    endpoint: 'npx -y @modelcontextprotocol/server-postgres postgresql://localhost/ledgerflow',
    status: 'planned',
    toolCount: 0,
  },
  {
    id: 'brave_search_mcp',
    name: 'Brave Web Search MCP Server',
    transport: 'sse',
    endpoint: 'https://mcp.brave.com/v1/sse',
    status: 'planned',
    toolCount: 0,
  },
];

for (const s of defaultServers) {
  connectedServers.set(s.id, s);
}

export function listExternalMCPServers(): ExternalMCPServerConfig[] {
  return Array.from(connectedServers.values());
}

export function registerExternalMCPServer(config: Omit<ExternalMCPServerConfig, 'status' | 'toolCount'>): ExternalMCPServerConfig {
  const fullConfig: ExternalMCPServerConfig = {
    ...config,
    status: 'disconnected',
    toolCount: 0,
  };
  connectedServers.set(config.id, fullConfig);
  return fullConfig;
}

export async function configureExternalMCPServer(config: Omit<ExternalMCPServerConfig, 'status' | 'toolCount' | 'lastPingAt' | 'error'> & { enabled?: boolean }) {
  const saved = await upsertMCPExternalServerConfig({
    id: config.id, name: config.name, transport: config.transport, endpoint: config.endpoint,
    credentialEnv: config.credentialEnv, enabled: config.enabled ?? true,
  });
  if (saved.enabled) registerExternalMCPServer(saved);
  else connectedServers.delete(saved.id);
  return saved;
}

export async function hydrateExternalMCPServerCatalog() {
  const savedConfigs = await listMCPExternalServerConfigs();
  for (const config of savedConfigs) {
    if (config.enabled) registerExternalMCPServer(config);
    else connectedServers.delete(config.id);
  }
  return listExternalMCPServers();
}

function resolveServerAuthorization(server: ExternalMCPServerConfig) {
  if (!server.credentialEnv) return undefined;
  if (!/^MCP_EXTERNAL_[A-Z0-9_]+_AUTHORIZATION$/.test(server.credentialEnv)) {
    throw new Error('credentialEnv must use the MCP_EXTERNAL_<NAME>_AUTHORIZATION allowlisted format.');
  }
  const authorization = process.env[server.credentialEnv]?.trim();
  if (!authorization) throw new Error(`Server-side credential is not configured: ${server.credentialEnv}`);
  return authorization;
}

export function connectExternalMCPServer(serverId: string): { ok: boolean; server?: ExternalMCPServerConfig; tools?: ExternalMCPTool[]; error?: string } {
  const server = connectedServers.get(serverId);
  if (!server) return { ok: false, error: `Server ${serverId} not found` };
  return { ok: false, server: { ...server }, error: 'Synchronous MCP connection is disabled. Use connectExternalMCPServerLive for a real handshake.' };
}

/**
 * Connect a streamable-HTTP MCP endpoint using a real, read-only handshake.
 * SSE and stdio require dedicated adapters and are rejected rather than mocked.
 */
export async function connectExternalMCPServerLive(serverId: string): Promise<{ ok: boolean; server?: ExternalMCPServerConfig; tools?: ExternalMCPTool[]; error?: string }> {
  const server = connectedServers.get(serverId);
  if (!server) return { ok: false, error: `Server ${serverId} not found` };
  if (server.transport !== 'streamable-http') {
    server.status = 'error';
    server.error = `Live ${server.transport} transport adapter is not enabled. Configure a streamable-http endpoint or install the dedicated adapter.`;
    return { ok: false, server: { ...server }, error: server.error };
  }

  let authorization: string | undefined;
  try {
    authorization = resolveServerAuthorization(server);
  } catch (error: any) {
    server.status = 'error';
    server.error = error?.message || 'External MCP credential configuration failed.';
    return { ok: false, server: { ...server }, error: server.error };
  }
  const probe = await probeExternalMCPHttpServer(server.endpoint, { authorization });
  if (!probe.ok) {
    server.status = 'error';
    server.error = probe.error || 'External MCP handshake failed.';
    return { ok: false, server: { ...server }, error: server.error };
  }

  const discovered = (probe.tools || []).map((tool) => ({
    serverId,
    name: tool.name,
    description: tool.description || `External MCP tool from ${server.name}.`,
  }));
  server.status = 'connected';
  server.lastPingAt = new Date().toISOString();
  server.toolCount = discovered.length;
  server.error = undefined;
  externalTools.set(serverId, discovered);

  for (const tool of discovered) {
    const contract: AgentToolContract = {
      id: `mcp_${serverId}_${tool.name}`.replace(/[^a-zA-Z0-9_]+/g, '_').toLowerCase(),
      description: tool.description,
      permission: 'connector:write',
      risk: 'high',
      requiresApproval: true,
      timeoutMs: 30_000,
      maxAttempts: 1,
      execution: 'connector',
    };
    registerAgentToolContract(contract);
  }
  return { ok: true, server: { ...server }, tools: discovered };
}

export function disconnectExternalMCPServer(serverId: string): { ok: boolean } {
  const server = connectedServers.get(serverId);
  if (server) {
    server.status = 'disconnected';
    externalTools.delete(serverId);
  }
  return { ok: true };
}
