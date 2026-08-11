/**
 * mcpTransportServer.ts
 * ============================================================
 * LedgerFlow Studio — MCP Standard Transport Server Layer
 * 
 * Provides JSON-RPC 2.0 compliant handlers for the Model Context Protocol (MCP).
 * Supports tools/list, tools/call, initialize, and ping methods.
 * Manages active SSE event clients for live server-to-client streaming.
 */

import { listMCPToolManifests, getMCPToolManifest, recordMCPToolRun } from './mcpToolManifestRegistry.ts';
import { createAgentToolExecutionPreview, consumeAgentToolExecution } from './agentToolExecutionGate.ts';

// ─── Types ──────────────────────────────────────────────────────────
export interface JSONRPCRequest {
  jsonrpc: '2.0';
  id?: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface JSONRPCResponse {
  jsonrpc: '2.0';
  id?: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface SSEClient {
  id: string;
  send: (data: string) => void;
  close: () => void;
  connectedAt: string;
}

// ─── Active SSE clients ─────────────────────────────────────────────
const sseClients = new Map<string, SSEClient>();

export function registerSSEClient(client: SSEClient): void {
  sseClients.set(client.id, client);
}

export function unregisterSSEClient(clientId: string): void {
  const client = sseClients.get(clientId);
  if (client) {
    try {
      client.close();
    } catch {
      // ignore
    }
    sseClients.delete(clientId);
  }
}

export function broadcastMCPEvent(event: string, payload: unknown): void {
  const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const [id, client] of sseClients) {
    try {
      client.send(message);
    } catch {
      sseClients.delete(id);
    }
  }
}

export function getActiveSSEClientsCount(): number {
  return sseClients.size;
}

// ─── JSON-RPC 2.0 Handler ───────────────────────────────────────────
export async function handleMCPJSONRPCRequest(request: JSONRPCRequest): Promise<JSONRPCResponse> {
  const { id, method, params = {} } = request;

  try {
    switch (method) {
      case 'initialize': {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {
                listChanged: true,
              },
              logging: {},
            },
            serverInfo: {
              name: 'LedgerFlow Studio MCP Server',
              version: '3.0.0',
              description: 'AI Software Company OS & Agentic Meta-Harness Platform',
            },
          },
        };
      }

      case 'ping': {
        return {
          jsonrpc: '2.0',
          id,
          result: {},
        };
      }

      case 'tools/list': {
        const manifests = listMCPToolManifests();
        const tools = manifests.map((m) => ({
          name: m.id,
          description: `[Risk: ${m.risk.toUpperCase()}] ${m.description}`,
          inputSchema: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Execution title or purpose' },
              target: { type: 'string', description: 'Target resource or URL' },
              payload: { type: 'object', description: 'Execution parameters' },
            },
            required: ['title'],
          },
          permission: m.permission,
          risk: m.risk,
          execution: m.execution,
        }));

        return {
          jsonrpc: '2.0',
          id,
          result: {
            tools,
            summary: {
              total: tools.length,
              activeSSEClients: sseClients.size,
            },
          },
        };
      }

      case 'tools/call': {
        const toolName = typeof params.name === 'string' ? params.name : (params.toolId as string);
        if (!toolName) {
          return {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32602,
              message: 'Invalid params: "name" or "toolId" is required',
            },
          };
        }

        const argumentsObj = (params.arguments as Record<string, unknown>) || (params.payload as Record<string, unknown>) || {};
        const title = (params.title as string) || `MCP Execution: ${toolName}`;
        const target = params.target as string | undefined;

        const startTime = Date.now();
        const manifest = getMCPToolManifest(toolName);

        if (!manifest) {
          return {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32601,
              message: `Method not found: Tool "${toolName}" is not registered in MCP Manifest Catalog`,
            },
          };
        }

        if (manifest.risk === 'blocked') {
          return {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32000,
              message: `Execution Blocked: Tool "${toolName}" is blocked by security policy`,
            },
          };
        }

        // Create or consume an execution preview through the safety gate. A caller
        // can only consume the exact fingerprint it had previously reviewed.
        const executionInput = {
          toolId: toolName,
          title,
          target,
          payload: argumentsObj,
          executionMode: manifest.execution === 'connector' ? ('connector' as const) : ('simulation' as const),
        };
        const existingPreviewId = typeof params.previewId === 'string' ? params.previewId : undefined;
        const approvalToken = typeof params.approvalToken === 'string' ? params.approvalToken : undefined;
        if (existingPreviewId) {
          const result = consumeAgentToolExecution({ ...executionInput, previewId: existingPreviewId, approvalToken });
          const latencyMs = Date.now() - startTime;
          recordMCPToolRun({ toolId: toolName, ok: result.safetyDecision.approved, latencyMs, createdAt: new Date().toISOString() });
          broadcastMCPEvent('mcp_tool_approved_execution_consumed', { toolId: toolName, previewId: existingPreviewId, latencyMs });
          return {
            jsonrpc: '2.0', id,
            result: { content: [{ type: 'text', text: JSON.stringify({ status: 'approved_execution_consumed', previewId: result.id, toolId: toolName, safetyDecision: result.safetyDecision }, null, 2) }], isError: false },
          };
        }
        const preview = createAgentToolExecutionPreview(executionInput);

        // Direct execution for simulation/low-risk tools, requiring approval otherwise
        if (!preview.requiresApproval) {
          const result = consumeAgentToolExecution({ ...executionInput, previewId: preview.id });
          const latencyMs = Date.now() - startTime;
          recordMCPToolRun({ toolId: toolName, ok: result.ok, latencyMs, createdAt: new Date().toISOString() });

          broadcastMCPEvent('mcp_tool_executed', { toolId: toolName, ok: result.ok, latencyMs });

          return {
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
              isError: !result.ok,
            },
          };
        } else {
          const latencyMs = Date.now() - startTime;
          recordMCPToolRun({ toolId: toolName, ok: true, latencyMs, createdAt: new Date().toISOString() });

          return {
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    status: 'pending_approval',
                    previewId: preview.id,
                    fingerprint: preview.fingerprint,
                    requiresApproval: true,
                    message: `Tool "${toolName}" requires explicit human approval before execution. High risk level: ${manifest.risk}.`,
                    safetyDecision: preview.safetyDecision,
                  }, null, 2),
                },
              ],
              isError: false,
            },
          };
        }
      }

      default:
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: `Method not found: "${method}"`,
          },
        };
    }
  } catch (err: any) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32000,
        message: err.message || 'Internal server error processing MCP request',
      },
    };
  }
}
