import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  loadMcpMiningState,
  harvestOpenSourceKnowledge,
} from './glaciaOpenSourceMcpMiningEngine.ts';

describe('glaciaOpenSourceMcpMiningEngine - Level 5 Open-Source & Forum Knowledge Ingestion', () => {
  it('loads MCP mining state with default sources and practical forum snippets', () => {
    const state = loadMcpMiningState();
    assert.ok(state.sources.length >= 6);
    assert.ok(state.recentSnippets.length >= 4);
    assert.ok(state.zeroCostTokenSavingsUsd > 0);

    const githubSource = state.sources.find((s) => s.type === 'github_repos');
    assert.ok(githubSource, 'GitHub source should be present');

    const redditSource = state.sources.find((s) => s.type === 'reddit_community');
    assert.ok(redditSource, 'Reddit practical forum source should be present');
  });

  it('harvests open-source knowledge snippet from Reddit / Blender and indexes into Vector RAG', async () => {
    const result = await harvestOpenSourceKnowledge({
      sourceType: 'blender_artists_forum',
      category: 'blender_3d',
      customTopic: 'Kỹ thuật nướng ánh sáng thể tích Cycles sang Three.js PBR',
    });

    assert.equal(result.success, true);
    assert.equal(result.harvestedCount, 1);
    assert.ok(result.newSnippets[0].title.includes('Cycles'));
    assert.equal(result.newSnippets[0].executionEnvironment, 'blender_bpy');
    assert.ok(result.newSnippets[0].mcpVectorIndexed);
  });
});
