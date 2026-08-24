/**
 * imageGenAdapter.ts
 * ============================================================
 * Real image-generation adapter for the Asset Foundry.
 *
 * Supports (submit + poll, real HTTP, keys from the AI Key Vault):
 *   - Flux.1 (Black Forest Labs)  — api.bfl.ml
 *   - Replicate (flux-schnell)    — api.replicate.com
 *   - Leonardo.ai                 — cloud.leonardo.ai
 *   - ComfyUI (local, free)       — 127.0.0.1:8188
 *
 * Every success is registered into the content-addressed Asset Registry,
 * so downstream factories (video marketing, thumbnails) can reuse assets.
 */

import { findMediaKey, postJson, getJson, fetchBinary } from './mediaProviderClient.ts';
import { registerAsset } from './assetRegistry.ts';

export type ImageProvider = 'flux1' | 'replicate' | 'leonardo' | 'comfyui';

export interface ImageGenInput {
  prompt: string;
  negativePrompt?: string;
  provider?: ImageProvider;
  width?: number;
  height?: number;
  seed?: number;
  preferLocal?: boolean;
  /** Download cloud binaries into the local registry (default false). */
  materialize?: boolean;
}

export interface ImageGenResult {
  ok: boolean;
  status: 'completed' | 'no_provider' | 'failed';
  cid?: string;
  remoteUrl?: string;
  filePath?: string;
  provider?: string;
  model?: string;
  error?: string;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function pollJson<T>(
  url: string,
  isDone: (json: any) => boolean,
  auth: { apiKey: string; authHeaders?: Record<string, string> },
  intervalMs = 2500,
  timeoutMs = 240_000
): Promise<T | undefined> {
  const start = Date.now();
  let last: any;
  while (Date.now() - start < timeoutMs) {
    last = await getJson(url, { apiKey: auth.apiKey, authHeaders: auth.authHeaders });
    if (isDone(last)) return last as T;
    await delay(intervalMs);
  }
  return last as T | undefined;
}

// ─── Flux.1 (BFL) ─────────────────────────────────────────────────────────────

async function generateWithFlux(input: ImageGenInput, apiKey: string): Promise<{ remoteUrl?: string; bytes?: Buffer; provider: string; model: string }> {
  const model = 'flux-pro-1.1';
  const auth = { apiKey, authHeaders: { 'x-key': apiKey } };
  const submit = await postJson('https://api.bfl.ml/v1/flux-pro-1.1', {
    prompt: input.prompt,
    width: input.width || 1024,
    height: input.height || 1024,
    ...(input.seed ? { seed: input.seed } : {}),
  }, auth);
  const id = submit?.id;
  if (!id) throw new Error('BFL submit missing id');
  const result = await pollJson<{ status?: string; result?: { sample?: string; message?: string } }>(
    `https://api.bfl.ml/v1/get_result?id=${encodeURIComponent(id)}`,
    (r) => r && (r.status === 'Ready' || r.status === 'Error' || r.status === 'Content Moderated'),
    auth
  );
  const url = result?.result?.sample as string | undefined;
  if (result?.status === 'Error') throw new Error(result?.result?.message || 'BFL generation error');
  if (!url) throw new Error('BFL result missing sample URL');
  if (input.materialize) {
    return { bytes: await fetchBinary(url), provider: 'flux1', model };
  }
  return { remoteUrl: url, provider: 'flux1', model };
}

// ─── Replicate ───────────────────────────────────────────────────────────────

async function generateWithReplicate(input: ImageGenInput, apiKey: string): Promise<{ remoteUrl?: string; bytes?: Buffer; provider: string; model: string }> {
  const model = 'black-forest-labs/flux-schnell';
  const auth = { apiKey };
  const submit = await postJson('https://api.replicate.com/v1/predictions', {
    model,
    input: {
      prompt: input.prompt,
      ...(input.negativePrompt ? { negative_prompt: input.negativePrompt } : {}),
      width: input.width || 1024,
      height: input.height || 1024,
      ...(input.seed ? { seed: input.seed } : {}),
    },
  }, auth);
  const id = submit?.id;
  if (!id) throw new Error('Replicate submit missing id');
  const result = await pollJson<{ status?: string; error?: string; output?: unknown }>(
    `https://api.replicate.com/v1/predictions/${id}`,
    (r) => r && (r.status === 'succeeded' || r.status === 'failed' || r.status === 'canceled'),
    auth
  );
  if (result?.status !== 'succeeded') throw new Error(result?.error || 'Replicate generation failed');
  const url = Array.isArray(result?.output) ? result.output[0] : result?.output;
  if (!url || typeof url !== 'string') throw new Error('Replicate result missing output URL');
  if (input.materialize) {
    return { bytes: await fetchBinary(url), provider: 'replicate', model };
  }
  return { remoteUrl: url, provider: 'replicate', model };
}

// ─── Leonardo.ai ─────────────────────────────────────────────────────────────

async function generateWithLeonardo(input: ImageGenInput, apiKey: string): Promise<{ remoteUrl?: string; bytes?: Buffer; provider: string; model: string }> {
  const model = 'Leonardo Diffusion XL';
  const auth = { apiKey };
  const submit = await postJson('https://cloud.leonardo.ai/api/rest/v1/generations', {
    prompt: input.prompt,
    ...(input.negativePrompt ? { negative_prompt: input.negativePrompt } : {}),
    width: input.width || 1024,
    height: input.height || 1024,
    num_images: 1,
  }, auth);
  const generationId = submit?.sdGenerationJob?.generationId;
  if (!generationId) throw new Error('Leonardo submit missing generationId');
  const result = await pollJson<{ generations_by_pk?: { status?: string; generated_images?: Array<{ url?: string }> } }>(
    `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`,
    (r) => r && (r.generations_by_pk?.status === 'COMPLETE' || r.generations_by_pk?.status === 'FAILED'),
    auth
  );
  if (result?.generations_by_pk?.status !== 'COMPLETE') throw new Error('Leonardo generation failed');
  const url = result?.generations_by_pk?.generated_images?.[0]?.url;
  if (!url) throw new Error('Leonardo result missing image URL');
  if (input.materialize) {
    return { bytes: await fetchBinary(url), provider: 'leonardo', model };
  }
  return { remoteUrl: url, provider: 'leonardo', model };
}

// ─── ComfyUI (local) ─────────────────────────────────────────────────────────

async function generateWithComfyUI(input: ImageGenInput): Promise<{ remoteUrl?: string; bytes?: Buffer; provider: string; model: string }> {
  const base = 'http://127.0.0.1:8188';
  const clientId = `ledgerflow-${Date.now()}`;
  // Minimal SD1.5/SDXL-compatible txt2img workflow.
  const workflow: Record<string, unknown> = {
    '1': { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: 'v1-5-pruned-emaonly.safetensors' } },
    '2': { class_type: 'CLIPTextEncode', inputs: { text: input.prompt, clip: ['1', 1] } },
    '3': { class_type: 'CLIPTextEncode', inputs: { text: input.negativePrompt || 'low quality, blurry', clip: ['1', 1] } },
    '4': { class_type: 'EmptyLatentImage', inputs: { width: input.width || 1024, height: input.height || 1024, batch_size: 1 } },
    '5': { class_type: 'KSampler', inputs: { seed: input.seed || 0, steps: 20, cfg: 7, sampler_name: 'euler', scheduler: 'normal', denoise: 1, model: ['1', 0], positive: ['2', 0], negative: ['3', 0], latent_image: ['4', 0] } },
    '6': { class_type: 'VAEDecode', inputs: { samples: ['5', 0], vae: ['1', 2] } },
    '7': { class_type: 'SaveImage', inputs: { filename_prefix: 'ledgerflow', images: ['6', 0] } },
  };
  const submit = await postJson(`${base}/prompt`, { prompt: workflow, client_id: clientId }, { timeoutMs: 15_000 });
  const promptId = submit?.prompt_id;
  if (!promptId) throw new Error('ComfyUI submit missing prompt_id');
  const result = await pollJson<any>(
    `${base}/history/${promptId}`,
    (r) => r && r[promptId] && (r[promptId].status?.completed || r[promptId].status?.status_str === 'error'),
    { apiKey: '' },
    1500,
    300_000
  );
  const outputs = result?.[promptId]?.outputs || {};
  let imageMeta: { filename: string; subfolder: string; type: string } | undefined;
  for (const key of Object.keys(outputs)) {
    const imgs = outputs[key]?.images;
    if (Array.isArray(imgs) && imgs[0]) {
      imageMeta = imgs[0];
      break;
    }
  }
  if (!imageMeta) throw new Error('ComfyUI completed but no image output found');
  const bytes = await fetchBinary(
    `${base}/view?filename=${encodeURIComponent(imageMeta.filename)}&subfolder=${encodeURIComponent(imageMeta.subfolder || '')}&type=${encodeURIComponent(imageMeta.type || 'output')}`
  );
  return { bytes, provider: 'comfyui', model: 'checkpoint' };
}

/**
 * Generate an image, routing to the first available provider (or ComfyUI when
 * preferLocal). Never fabricates results: returns `no_provider` when no key
 * and no local runtime is configured.
 */
export async function generateImage(input: ImageGenInput): Promise<ImageGenResult> {
  const provider: ImageProvider = input.provider || 'flux1';

  // 1) Local ComfyUI path.
  if (input.preferLocal || provider === 'comfyui') {
    try {
      const r = await generateWithComfyUI(input);
      const rec = registerAsset({
        kind: 'image',
        name: `image_${Date.now()}.png`,
        mimeType: 'image/png',
        bytes: r.bytes,
        provenance: { source: 'imageGenAdapter', provider: 'comfyui', model: r.model, prompt: input.prompt },
      });
      return { ok: true, status: 'completed', cid: rec.cid, filePath: rec.filePath, provider: 'comfyui', model: r.model };
    } catch (err: any) {
      if (input.provider === 'comfyui') return { ok: false, status: 'failed', provider: 'comfyui', error: err.message };
      // otherwise fall through to cloud providers
    }
  }

  // 2) Cloud provider path.
  const key = await findMediaKey(provider);
  if (!key) {
    return {
      ok: false,
      status: 'no_provider',
      provider,
      error: `Chưa cấu hình API key cho "${provider}" trong AI Key Vault (hoặc chưa chạy ComfyUI local).`,
    };
  }

  try {
    const r = provider === 'replicate'
      ? await generateWithReplicate(input, key.apiKey)
      : provider === 'leonardo'
        ? await generateWithLeonardo(input, key.apiKey)
        : await generateWithFlux(input, key.apiKey);

    const rec = registerAsset({
      kind: 'image',
      name: `image_${Date.now()}.png`,
      mimeType: 'image/png',
      bytes: r.bytes,
      remoteUrl: r.remoteUrl,
      provenance: { source: 'imageGenAdapter', provider: r.provider, model: r.model, prompt: input.prompt },
    });
    return {
      ok: true,
      status: 'completed',
      cid: rec.cid,
      remoteUrl: r.remoteUrl,
      filePath: rec.filePath,
      provider: r.provider,
      model: r.model,
    };
  } catch (err: any) {
    return { ok: false, status: 'failed', provider, error: err.message };
  }
}
