/**
 * src/utils/glaciaMcpApi.ts
 * ============================================================
 * GLACIA NATIVE MCP (MODEL CONTEXT PROTOCOL) CLIENT SDK
 * ------------------------------------------------------------
 * Client SDK kết nối Frontend Cockpit với Glacia Native MCP Server:
 *  - fetchGlaciaMcpTools: Danh sách toàn bộ các MCP Tools
 *  - executeGlaciaTool: Thực thi trực tiếp MCP Tool
 *  - sendGlaciaMcpRpc: Gửi JSON-RPC 2.0 theo chuẩn MCP 2024-11-05
 * ============================================================
 */

export interface McpToolSchema {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface McpExecutionResult<T = any> {
  success: boolean;
  toolName: string;
  result?: T;
  error?: string;
  latencyMs: number;
  executedAt: string;
}

async function mcpFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`MCP API Error HTTP ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

/**
 * Lấy danh sách các MCP Tools hiện có của Glacia
 */
export async function fetchGlaciaMcpTools(): Promise<McpToolSchema[]> {
  const data = await mcpFetch<{ success: boolean; tools: McpToolSchema[] }>('/api/mcp/glacia/tools');
  return data.tools || [];
}

/**
 * Thực thi một MCP Tool của Glacia qua REST/HTTP
 */
export async function executeGlaciaMcpToolDirect<T = any>(
  toolName: string,
  args: Record<string, any> = {}
): Promise<McpExecutionResult<T>> {
  const start = Date.now();
  try {
    const data = await mcpFetch<{ success: boolean; result: T; error?: string }>('/api/mcp/glacia/tools/execute', {
      method: 'POST',
      body: JSON.stringify({ name: toolName, args }),
    });

    return {
      success: data.success,
      toolName,
      result: data.result,
      error: data.error,
      latencyMs: Date.now() - start,
      executedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      success: false,
      toolName,
      error: err?.message || 'MCP execution failed',
      latencyMs: Date.now() - start,
      executedAt: new Date().toISOString(),
    };
  }
}

/**
 * Gửi yêu cầu JSON-RPC 2.0 chuẩn MCP
 */
export async function sendGlaciaMcpRpc(method: string, params?: any): Promise<any> {
  const payload = {
    jsonrpc: '2.0',
    id: `mcp-${Date.now()}`,
    method,
    params,
  };

  const response = await mcpFetch<any>('/api/mcp/glacia/rpc', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (response.error) {
    throw new Error(response.error.message || 'MCP RPC Error');
  }

  return response.result;
}
