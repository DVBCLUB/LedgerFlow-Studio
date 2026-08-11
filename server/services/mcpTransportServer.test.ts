import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { handleMCPJSONRPCRequest } from './mcpTransportServer.ts';
import { listExternalMCPServers, connectExternalMCPServer } from './mcpClientGateway.ts';
import { approveAgentToolExecution } from './agentToolExecutionGate.ts';

describe('MCP Transport Server & Client Gateway', () => {
  it('handles initialize method returning MCP server capabilities', async () => {
    const res = await handleMCPJSONRPCRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
    });

    assert.equal(res.jsonrpc, '2.0');
    assert.equal(res.id, 1);
    const result = res.result as any;
    assert.equal(result.serverInfo.name, 'LedgerFlow Studio MCP Server');
    assert.equal(result.protocolVersion, '2024-11-05');
  });

  it('handles tools/list method returning registered MCP tool manifests', async () => {
    const res = await handleMCPJSONRPCRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
    });

    assert.equal(res.jsonrpc, '2.0');
    assert.equal(res.id, 2);
    const result = res.result as any;
    assert.ok(Array.isArray(result.tools));
    assert.ok(result.tools.length > 0);
  });

  it('handles tools/call method for simulation tool execution', async () => {
    const res = await handleMCPJSONRPCRequest({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'read_knowledge',
        arguments: {
          query: 'accounting rules',
        },
      },
    });

    assert.equal(res.jsonrpc, '2.0');
    assert.equal(res.id, 3);
    const result = res.result as any;
    assert.ok(Array.isArray(result.content));
    assert.equal(result.content[0].type, 'text');
  });

  it('requires and consumes a fingerprint-bound approval for high-risk MCP tools', async () => {
    const pending = await handleMCPJSONRPCRequest({
      jsonrpc: '2.0', id: 4, method: 'tools/call',
      params: { name: 'external_connector', title: 'Reviewed connector action', target: 'connector://configured/write', arguments: { allowedTargets: ['connector://configured'], humanCheckpoint: true } },
    });
    const pendingPayload = JSON.parse(((pending.result as any).content[0].text));
    assert.equal(pendingPayload.status, 'pending_approval');
    const approval = approveAgentToolExecution(pendingPayload.previewId, pendingPayload.fingerprint);
    const consumed = await handleMCPJSONRPCRequest({
      jsonrpc: '2.0', id: 5, method: 'tools/call',
      params: { name: 'external_connector', title: 'Reviewed connector action', target: 'connector://configured/write', arguments: { allowedTargets: ['connector://configured'], humanCheckpoint: true }, previewId: pendingPayload.previewId, approvalToken: approval.approvalToken },
    });
    const consumedPayload = JSON.parse(((consumed.result as any).content[0].text));
    assert.equal(consumedPayload.status, 'approved_execution_consumed');
  });

  it('lists external MCP templates without reporting a simulated connection', () => {
    const servers = listExternalMCPServers();
    assert.ok(servers.length >= 3);

    const connectResult = connectExternalMCPServer('github_mcp');
    assert.equal(connectResult.ok, false);
    assert.equal(connectResult.server?.status, 'planned');
    assert.match(connectResult.error || '', /disabled/);
  });
});
