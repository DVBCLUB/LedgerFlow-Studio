const DEFAULT_ALLOWED_HOSTS = ['127.0.0.1', 'localhost', '::1'];
const DEFAULT_TIMEOUT_MS = 10_000;

export interface MCPExternalProbeResult {
  ok: boolean;
  endpoint: string;
  protocolVersion?: string;
  serverInfo?: { name?: string; version?: string };
  tools?: Array<{ name: string; description?: string }>;
  latencyMs: number;
  error?: string;
}

export interface MCPExternalProbeOptions {
  timeoutMs?: number;
  /** Server-side only. This value is never returned in a probe result. */
  authorization?: string;
}

function allowedHosts() {
  const configured = (process.env.MCP_EXTERNAL_ALLOWED_HOSTS || '')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
  return new Set(configured.length ? configured : DEFAULT_ALLOWED_HOSTS);
}

function assertAllowedEndpoint(endpoint: string) {
  const url = new URL(endpoint);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('External MCP endpoint must use HTTP(S).');
  if (!allowedHosts().has(url.hostname.toLowerCase())) throw new Error(`External MCP host is not allowlisted: ${url.hostname}`);
  return url;
}

async function callJsonRpc(endpoint: URL, body: Record<string, unknown>, signal: AbortSignal, authorization?: string) {
  const response = await fetch(endpoint, {
    method: 'POST',
    signal,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(authorization ? { Authorization: authorization } : {}) },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`External MCP returned HTTP ${response.status}.`);
  const payload = await response.json() as { result?: any; error?: { message?: string } };
  if (payload.error) throw new Error(payload.error.message || 'External MCP returned a JSON-RPC error.');
  return payload.result || {};
}

/** Read-only handshake and discovery for a streamable HTTP MCP endpoint. */
export async function probeExternalMCPHttpServer(endpoint: string, options: MCPExternalProbeOptions | number = {}): Promise<MCPExternalProbeResult> {
  const startedAt = Date.now();
  const normalizedOptions = typeof options === 'number' ? { timeoutMs: options } : options;
  const timeoutMs = normalizedOptions.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let parsedEndpoint: URL;
  try {
    parsedEndpoint = assertAllowedEndpoint(endpoint);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.max(1_000, Math.min(timeoutMs, 30_000)));
    try {
      const initialized = await callJsonRpc(parsedEndpoint, {
        jsonrpc: '2.0', id: 'ledgerflow-probe-initialize', method: 'initialize',
        params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'LedgerFlow MCP Probe', version: '1.0.0' } },
      }, controller.signal, normalizedOptions.authorization);
      const listed = await callJsonRpc(parsedEndpoint, {
        jsonrpc: '2.0', id: 'ledgerflow-probe-tools-list', method: 'tools/list', params: {},
      }, controller.signal, normalizedOptions.authorization);
      const tools = Array.isArray(listed.tools) ? listed.tools
        .filter((tool: unknown): tool is { name: string; description?: string } => Boolean(tool && typeof tool === 'object' && typeof (tool as any).name === 'string'))
        .map((tool: { name: string; description?: string }) => ({ name: tool.name, description: tool.description })) : [];
      return { ok: true, endpoint: parsedEndpoint.toString(), protocolVersion: initialized.protocolVersion, serverInfo: initialized.serverInfo, tools, latencyMs: Date.now() - startedAt };
    } finally {
      clearTimeout(timer);
    }
  } catch (error: any) {
    return { ok: false, endpoint, latencyMs: Date.now() - startedAt, error: error?.name === 'AbortError' ? 'External MCP probe timed out.' : error?.message || 'External MCP probe failed.' };
  }
}
