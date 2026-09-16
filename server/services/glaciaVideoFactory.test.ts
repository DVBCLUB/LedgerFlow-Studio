import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getGlaciaVideoFactoryStatus,
  generateGlaciaVideo,
} from './glaciaVideoFactory.ts';

describe('Glacia Video Factory', () => {
  it('returns video factory status', async () => {
    const status = await getGlaciaVideoFactoryStatus();
    assert.ok(typeof status.available === 'boolean');
    assert.ok(Array.isArray(status.features));
    assert.ok(typeof status.ffmpegPath === 'string' || status.ffmpegPath === null);
  });

  it('generates a short video from text script', async () => {
    const result = await generateGlaciaVideo({
      title: 'Test Video',
      script: 'LedgerFlow Studio giúp bạn quản lý tài chính thông minh hơn.',
      durationSeconds: 15,
      theme: 'frost_aurora',
    });

    assert.ok(typeof result.success === 'boolean');
    assert.ok(result.durationSeconds > 0);
    assert.ok(result.outputPath);
    assert.ok(result.storyboard);
  });

  it('supports different video styles', async () => {
    const result = await generateGlaciaVideo({
      title: 'Test',
      script: 'Test video',
      durationSeconds: 5,
      theme: 'cyberpunk_glacia',
    });

    assert.equal(result.success, true);
  });

  it('handles background music parameter', async () => {
    const result = await generateGlaciaVideo({
      title: 'Music Video',
      script: 'Test with music',
      durationSeconds: 10,
      theme: 'executive_gold',
      backgroundMusicStyle: 'cyber_synth',
    });

    assert.equal(result.success, true);
  });

  it('handles empty scripts gracefully', async () => {
    const result = await generateGlaciaVideo({
      title: 'Empty',
      script: '',
      durationSeconds: 10,
      theme: 'frost_aurora',
    });

    assert.ok(result.success);
  });
});
