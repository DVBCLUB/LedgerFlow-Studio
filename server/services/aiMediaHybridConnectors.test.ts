import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  listSupportedHybridMediaProviders,
  optimizePromptForProvider,
  dispatchHybridMediaJob,
} from './aiMediaHybridConnectors.ts';

describe('AI Media Hybrid Connectors Service', () => {
  it('lists all supported hybrid AI media providers', () => {
    const providers = listSupportedHybridMediaProviders();
    assert.strictEqual(providers.length, 10);
    const ids = providers.map((p) => p.id);
    assert.ok(ids.includes('midjourney'));
    assert.ok(ids.includes('leonardo'));
    assert.ok(ids.includes('flux1'));
    assert.ok(ids.includes('kling'));
    assert.ok(ids.includes('sora'));
    assert.ok(ids.includes('pika'));
  });

  it('optimizes prompts for Midjourney and Flux.1 correctly', () => {
    const mjPrompt = optimizePromptForProvider('midjourney', 'Cyberpunk neon city square');
    assert.ok(mjPrompt.includes('--ar 16:9'));
    assert.ok(mjPrompt.includes('--v 6.1'));

    const fluxPrompt = optimizePromptForProvider('flux1', 'Modern SaaS workspace UI');
    assert.ok(fluxPrompt.includes('Photorealistic 4K render'));
  });

  it('dispatches a multi-step hybrid media job cleanly', async () => {
    const job = await dispatchHybridMediaJob({
      title: 'Kịch bản Video Quảng cáo AI Studio',
      steps: [
        {
          providerId: 'midjourney',
          action: 'image_storyboard',
          prompt: 'Futuristic AI workspace dashboard',
        },
        {
          providerId: 'kling',
          action: 'video_motion',
          prompt: 'Camera panning smoothly over neon holographic charts',
        },
        {
          providerId: 'elevenlabs',
          action: 'voice_narration',
          prompt: 'Xin chào, chào mừng bạn đến với LedgerFlow OS.',
        },
      ],
    });

    assert.strictEqual(job.status, 'completed');
    assert.strictEqual(job.pipelineSteps.length, 3);
    assert.strictEqual(job.resultAssets.length, 3);
    assert.strictEqual(job.resultAssets[0].type, 'image');
    assert.strictEqual(job.resultAssets[1].type, 'video');
    assert.strictEqual(job.resultAssets[2].type, 'audio');
  });
});
