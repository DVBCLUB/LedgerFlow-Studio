/**
 * server/services/glaciaMcpNativeServer.test.ts
 * Unit tests for Glacia Native Model Context Protocol (MCP) Server.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getGlaciaMcpManifest,
  executeGlaciaMcpTool,
  handleGlaciaMcpJsonRpc,
} from './glaciaMcpNativeServer.ts';

describe('Glacia Native MCP Server', () => {
  it('returns valid MCP 2024-11-05 manifest with registered tools', () => {
    const manifest = getGlaciaMcpManifest();
    assert.equal(manifest.name, 'glacia-autonomous-mcp-server');
    assert.equal(manifest.protocolVersion, '2024-11-05');
    assert.ok(manifest.tools.length >= 6, 'Should expose at least 6 MCP tools');

    const searchDocsTool = manifest.tools.find((t) => t.name === 'glacia_search_docs');
    assert.ok(searchDocsTool, 'glacia_search_docs should be present');
  });

  it('executes glacia_recall_lesson tool properly', async () => {
    const res = await executeGlaciaMcpTool('glacia_recall_lesson', { query: 'blender', limit: 2 });
    assert.ok(res.query, 'Should return query');
    assert.ok(Array.isArray(res.lessons), 'Should return lessons array');
  });

  it('executes glacia_export_rules tool', async () => {
    const res = await executeGlaciaMcpTool('glacia_export_rules');
    assert.equal(res.fileName, '.glaciarules');
    assert.ok(res.content.includes('# Glacia Distilled Project Rules'));
  });

  it('handles MCP JSON-RPC 2.0 initialize message', async () => {
    const response = await handleGlaciaMcpJsonRpc({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
    });

    assert.equal(response.jsonrpc, '2.0');
    assert.equal(response.id, 1);
    assert.ok(response.result?.serverInfo?.name.includes('glacia'));
  });

  it('handles MCP JSON-RPC 2.0 tools/list message', async () => {
    const response = await handleGlaciaMcpJsonRpc({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
    });

    assert.equal(response.jsonrpc, '2.0');
    assert.ok(Array.isArray(response.result?.tools));
    assert.ok(response.result.tools.length >= 8);
  });

  it('executes glacia_get_morning_briefing MCP tool properly', async () => {
    const brief = await executeGlaciaMcpTool('glacia_get_morning_briefing', {});
    assert.ok(brief.greeting.includes('Giám đốc'));
    assert.equal(brief.top3Priorities.length, 3);
  });

  it('executes glacia_trigger_night_shift MCP tool properly', async () => {
    const report = await executeGlaciaMcpTool('glacia_trigger_night_shift', {});
    assert.equal(report.success, true);
    assert.ok(report.jobsCompleted >= 2);
  });

  it('executes glacia_produce_video_project MCP tool properly', async () => {
    const res = await executeGlaciaMcpTool('glacia_produce_video_project', {
      topic: 'Giới thiệu Glacia AI',
      aspectRatio: '9:16',
    });
    assert.equal(res.success, true);
    assert.ok(res.project.scenes.length > 0);
  });

  it('handles MCP JSON-RPC 2.0 tools/call message', async () => {
    const response = await handleGlaciaMcpJsonRpc({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'glacia_export_rules',
        arguments: {},
      },
    });

    assert.equal(response.jsonrpc, '2.0');
    assert.ok(response.result?.content?.[0]?.text);
  });
});
