import assert from 'node:assert/strict';
import http from 'node:http';
import test from 'node:test';
import { probeExternalMCPHttpServer } from './mcpExternalProbe.ts';
import { connectExternalMCPServerLive, registerExternalMCPServer } from './mcpClientGateway.ts';

test('external MCP probe performs a real read-only initialize and tools/list handshake', async (t) => {
  const server = http.createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const request = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    assert.equal(req.headers.authorization, 'Bearer local-test-token');
    const result = request.method === 'initialize'
      ? { protocolVersion: '2024-11-05', serverInfo: { name: 'Test MCP', version: '1.0.0' } }
      : { tools: [{ name: 'read_only_tool', description: 'Safe tool' }] };
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ jsonrpc: '2.0', id: request.id, result }));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const endpoint = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}/mcp`;
  t.after(() => new Promise<void>((resolve) => server.close(() => resolve())));

  const result = await probeExternalMCPHttpServer(endpoint, { authorization: 'Bearer local-test-token' });
  assert.equal(result.ok, true);
  assert.equal(result.serverInfo?.name, 'Test MCP');
  assert.equal(result.tools?.[0]?.name, 'read_only_tool');

  const previousCredential = process.env.MCP_EXTERNAL_TEST_HTTP_AUTHORIZATION;
  process.env.MCP_EXTERNAL_TEST_HTTP_AUTHORIZATION = 'Bearer local-test-token';
  t.after(() => {
    if (previousCredential === undefined) delete process.env.MCP_EXTERNAL_TEST_HTTP_AUTHORIZATION;
    else process.env.MCP_EXTERNAL_TEST_HTTP_AUTHORIZATION = previousCredential;
  });
  registerExternalMCPServer({ id: 'test_http_mcp', name: 'Test HTTP MCP', transport: 'streamable-http', endpoint, credentialEnv: 'MCP_EXTERNAL_TEST_HTTP_AUTHORIZATION' });
  const live = await connectExternalMCPServerLive('test_http_mcp');
  assert.equal(live.ok, true);
  assert.equal(live.server?.status, 'connected');
  assert.equal(live.tools?.[0]?.name, 'read_only_tool');
});

test('external MCP probe rejects non-allowlisted hosts before connecting', async () => {
  const result = await probeExternalMCPHttpServer('https://example.invalid/mcp');
  assert.equal(result.ok, false);
  assert.match(result.error || '', /not allowlisted/);
});

test('live connector rejects a credential environment variable outside the MCP allowlist', async () => {
  registerExternalMCPServer({ id: 'bad_credential_mcp', name: 'Bad credential config', transport: 'streamable-http', endpoint: 'http://127.0.0.1:1/mcp', credentialEnv: 'UNSAFE_TOKEN' });
  const result = await connectExternalMCPServerLive('bad_credential_mcp');
  assert.equal(result.ok, false);
  assert.match(result.error || '', /credentialEnv/);
});
