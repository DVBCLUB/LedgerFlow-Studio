import type { Express, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { appendAuditEvent } from './auditLog.ts';
import {
  handleMCPJSONRPCRequest,
  type JSONRPCRequest,
  type JSONRPCResponse,
} from './mcpTransportServer.ts';
import { exportMCPToolManifestCatalog } from './mcpToolManifestRegistry.ts';
import { appendMCPToolRunSignal, getMCPToolRunStoreStats, listMCPToolRunSignals } from './mcpToolRunStore.ts';
import { probeExternalMCPHttpServer } from './mcpExternalProbe.ts';
import { configureExternalMCPServer } from './mcpClientGateway.ts';
import { listMCPExternalServerConfigs } from './mcpExternalServerConfigStore.ts';
import { approveAgentToolExecution } from './agentToolExecutionGate.ts';

function isJsonRpcRequest(value: unknown): value is JSONRPCRequest {
  return Boolean(value && typeof value === 'object' && (value as JSONRPCRequest).jsonrpc === '2.0' && typeof (value as JSONRPCRequest).method === 'string');
}

function mcpAuditStatus(response: JSONRPCResponse) {
  if (response.error) return 'failed' as const;
  const serialized = JSON.stringify(response.result || '');
  return serialized.includes('pending_approval') ? 'pending_approval' as const : 'executed' as const;
}

/**
 * Installs the authenticated HTTP/SSE boundary around the internal MCP transport.
 * Authentication is intentionally owned by server.ts and must be mounted after
 * requireLocalAuth so this local control plane is never anonymously exposed.
 */
export function registerMCPHttpRoutes(app: Express) {
  app.post('/api/mcp/approvals', async (req: Request, res: Response) => {
    const previewId = typeof req.body?.previewId === 'string' ? req.body.previewId : '';
    const fingerprint = typeof req.body?.fingerprint === 'string' ? req.body.fingerprint : '';
    if (!previewId || !/^[a-f0-9]{64}$/.test(fingerprint)) {
      return res.status(400).json({ success: false, error: 'previewId and a valid fingerprint are required.' });
    }
    try {
      const approval = approveAgentToolExecution(previewId, fingerprint);
      await appendAuditEvent({
        actor: 'founder', workspace: 'mcp-control-plane', action: 'mcp.approval.granted', target: previewId,
        risk: 'HIGH', status: 'approved', summary: 'Approved a fingerprint-bound MCP execution preview.', evidence: { fingerprint, expiresAt: approval.expiresAt },
      });
      return res.json({ success: true, ...approval });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error?.message || 'MCP approval failed.' });
    }
  });

  app.get('/api/mcp/external/config', async (_req, res) => {
    res.json({ success: true, servers: await listMCPExternalServerConfigs() });
  });

  app.put('/api/mcp/external/config/:id', async (req: Request, res: Response) => {
    const id = req.params.id.trim().toLowerCase();
    const body = req.body || {};
    if (!/^[a-z0-9_]{3,64}$/.test(id) || typeof body.name !== 'string' || typeof body.endpoint !== 'string' || !['streamable-http', 'sse', 'stdio'].includes(body.transport)) {
      return res.status(400).json({ success: false, error: 'Invalid MCP server configuration.' });
    }
    if (body.credentialEnv !== undefined && (typeof body.credentialEnv !== 'string' || !/^MCP_EXTERNAL_[A-Z0-9_]+_AUTHORIZATION$/.test(body.credentialEnv))) {
      return res.status(400).json({ success: false, error: 'credentialEnv must use MCP_EXTERNAL_<NAME>_AUTHORIZATION.' });
    }
    try {
      if (body.transport === 'streamable-http') {
        const endpoint = new URL(body.endpoint);
        if (!['http:', 'https:'].includes(endpoint.protocol)) throw new Error('HTTP(S) endpoint required.');
      }
      const server = await configureExternalMCPServer({ id, name: body.name.trim(), transport: body.transport, endpoint: body.endpoint.trim(), credentialEnv: body.credentialEnv, enabled: body.enabled !== false });
      return res.json({ success: true, server });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error?.message || 'Invalid MCP server configuration.' });
    }
  });

  app.get('/api/mcp/catalog', async (_req, res) => {
    const signals = await listMCPToolRunSignals();
    res.json({ success: true, catalog: exportMCPToolManifestCatalog(signals), storage: await getMCPToolRunStoreStats() });
  });

  app.post('/api/mcp', async (req: Request, res: Response) => {
    if (!isJsonRpcRequest(req.body)) {
      return res.status(400).json({ jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid JSON-RPC 2.0 request.' } });
    }

    const correlationId = typeof req.header('x-correlation-id') === 'string' && req.header('x-correlation-id')
      ? req.header('x-correlation-id')!
      : randomUUID();
    const startedAt = Date.now();
    const response = await handleMCPJSONRPCRequest(req.body);
    const toolId = typeof req.body.params?.name === 'string' ? req.body.params.name : undefined;
    if (req.body.method === 'tools/call' && toolId) {
      await appendMCPToolRunSignal({
        toolId,
        ok: !response.error,
        latencyMs: Date.now() - startedAt,
        error: response.error?.message,
        createdAt: new Date().toISOString(),
      }).catch(() => undefined);
    }
    await appendAuditEvent({
      actor: 'connector',
      workspace: 'mcp-control-plane',
      action: `mcp.${req.body.method}`,
      target: typeof req.body.params?.name === 'string' ? req.body.params.name : 'mcp-server',
      risk: req.body.method === 'tools/call' ? 'MEDIUM' : 'LOW',
      status: mcpAuditStatus(response),
      summary: response.error ? response.error.message : `MCP ${req.body.method} handled.`,
      evidence: { correlationId, requestId: req.body.id, method: req.body.method, hasError: Boolean(response.error) },
    }).catch(() => undefined);

    res.setHeader('X-Correlation-Id', correlationId);
    return res.json(response);
  });

  app.post('/api/mcp/external/probe', async (req: Request, res: Response) => {
    const endpoint = typeof req.body?.endpoint === 'string' ? req.body.endpoint.trim() : '';
    if (!endpoint) return res.status(400).json({ success: false, error: 'endpoint is required.' });
    const result = await probeExternalMCPHttpServer(endpoint);
    await appendAuditEvent({
      actor: 'connector', workspace: 'mcp-control-plane', action: 'mcp.external.probe', target: endpoint,
      risk: 'LOW', status: result.ok ? 'executed' : 'failed', summary: result.ok ? 'External MCP read-only handshake completed.' : result.error || 'External MCP probe failed.',
      evidence: { endpoint: result.endpoint, latencyMs: result.latencyMs, toolCount: result.tools?.length || 0 },
    }).catch(() => undefined);
    return res.status(result.ok ? 200 : 400).json({ success: result.ok, result });
  });
}
