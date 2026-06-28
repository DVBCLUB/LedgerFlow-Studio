import assert from 'node:assert/strict';
import test from 'node:test';
import { getAgentToolContract } from './agentToolRegistry.ts';
import {
  assessMCPToolHealth,
  buildMCPToolManifest,
  exportMCPToolManifestCatalog,
  validateMCPToolManifest,
} from './mcpToolManifestRegistry.ts';

test('MCP tool manifest enforces approval and credential policies', () => {
  const tool = getAgentToolContract('external_connector');
  assert.ok(tool);

  const manifest = buildMCPToolManifest(tool!);
  assert.equal(manifest.schemaVersion, 'ledgerflow.mcp-tool.v1');
  assert.equal(manifest.approval.required, true);
  assert.equal(manifest.approval.policy, 'human_review');
  assert.ok(manifest.credentialScopes.some((scope) => scope.required && scope.id.includes('connector-token')));
  assert.equal(validateMCPToolManifest(manifest).ok, true);
});

test('MCP catalog exports manifests and health summary for every registered tool', () => {
  const catalog = exportMCPToolManifestCatalog([
    { toolId: 'read_knowledge', ok: true, latencyMs: 42, createdAt: '2026-01-01T00:00:00.000Z' },
    { toolId: 'external_connector', ok: false, latencyMs: 1_000, error: 'missing credential', createdAt: '2026-01-01T00:00:00.000Z' },
  ], new Date('2026-01-01T00:00:10.000Z'));

  assert.ok(catalog.manifests.length >= 10);
  assert.equal(catalog.summary.total, catalog.manifests.length);
  assert.ok(catalog.summary.approvalRequired >= 1);
  assert.ok(catalog.summary.connectorTools >= 1);
  assert.ok(catalog.health.some((row) => row.toolId === 'external_connector' && row.failures === 1));
});

test('MCP tool health degrades stale or slow tools', () => {
  const tool = getAgentToolContract('browser_check');
  assert.ok(tool);
  const manifest = buildMCPToolManifest(tool!);

  const health = assessMCPToolHealth(manifest, [
    { toolId: 'browser_check', ok: true, latencyMs: manifest.runtime.timeoutMs + 10_000, createdAt: '2026-01-01T00:00:00.000Z' },
  ], new Date('2026-01-01T00:10:00.000Z'));

  assert.notEqual(health.health, 'healthy');
  assert.ok(health.reasons.some((reason) => reason.includes('latency') || reason.includes('stale')));
});
