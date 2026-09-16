import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  loadGiantToolsCatalog,
  executeGiantProductionPipeline,
} from './glaciaGiantToolsPipelineEngine.ts';

describe('glaciaGiantToolsPipelineEngine - Best of Breed Tools for Software, Game & Video', () => {
  it('loads catalog of best-of-breed tools for software, game, and video', () => {
    const catalog = loadGiantToolsCatalog();
    assert.ok(catalog.length >= 9);
    assert.ok(catalog.some((t) => t.domain === 'software' && t.id.includes('monaco')));
    assert.ok(catalog.some((t) => t.domain === 'game' && t.id.includes('threejs')));
    assert.ok(catalog.some((t) => t.domain === 'video' && t.id.includes('blender')));
  });

  it('synthesizes software pipeline using Monaco, TypeScript and Electron', () => {
    const result = executeGiantProductionPipeline({
      domain: 'software',
      projectName: 'LedgerFlow Suite Pro',
    });

    assert.equal(result.domain, 'software');
    assert.equal(result.executionMetrics.costUsd, 0.0);
    assert.ok(result.toolsUsed.some((t) => t.giant === 'Microsoft'));
    assert.ok(result.synthesizedCodeArtifact.includes('Electron'));
  });

  it('synthesizes game pipeline using Three.js, Rapier Wasm and NVIDIA shaders', () => {
    const result = executeGiantProductionPipeline({
      domain: 'game',
      projectName: 'Stellar Defender 2026',
    });

    assert.equal(result.domain, 'game');
    assert.ok(result.toolsUsed.some((t) => t.giant.includes('Google') || t.giant.includes('Mr.doob')));
    assert.ok(result.synthesizedCodeArtifact.includes('THREE'));
    assert.ok(result.synthesizedCodeArtifact.includes('RAPIER'));
  });

  it('synthesizes video pipeline using Blender bpy and FFmpeg', () => {
    const result = executeGiantProductionPipeline({
      domain: 'video',
      projectName: 'Cuộc Chiến Lượng Tử 4K',
    });

    assert.equal(result.domain, 'video');
    assert.ok(result.synthesizedCodeArtifact.includes('bpy'));
    assert.ok(result.glaciaSynthesisLog.includes('Blender Foundation'));
  });
});
