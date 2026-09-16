import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  loadAudioTracks,
  generateProceduralAudioTrack,
  runAiPlaytestBenchmark,
} from './glaciaProceduralAudioLab.ts';

describe('glaciaProceduralAudioLab - Level 5 WebAudio Generator & Playtest Benchmark', () => {
  it('loads audio tracks and sound effects pack', () => {
    const tracks = loadAudioTracks();
    assert.ok(tracks.length >= 1);
    assert.ok(tracks[0].generatedCodeSnippet.includes('WebAudio'));
    assert.ok(tracks[0].sfxTriggers.laser_beam);
  });

  it('procedurally generates boss battle metal track with WebAudio sound engine code', () => {
    const track = generateProceduralAudioTrack({
      style: 'boss_battle_metal',
      tempoBpm: 150,
      customTitle: 'Titan Mecha Sovereign Boss Fight OST',
    });

    assert.equal(track.style, 'boss_battle_metal');
    assert.equal(track.tempoBpm, 150);
    assert.ok(track.generatedCodeSnippet.includes('AudioContext'));
    assert.ok(track.notesSequence.length >= 4);
  });

  it('executes autonomous AI playtest benchmark with fun factor and retention scoring', () => {
    const result = runAiPlaytestBenchmark({
      gameTitle: 'Neon Stellar Defender 2026',
    });

    assert.ok(result.funFactorScore >= 80);
    assert.ok(result.averageFpsBenchmark >= 55);
    assert.ok(result.aiPlaytestMetrics.recommendedFixes.length >= 2);
    assert.ok(result.geneticEvolutionAction.includes('Invulnerability'));
  });
});
