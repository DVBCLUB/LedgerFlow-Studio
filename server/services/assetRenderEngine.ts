/**
 * assetRenderEngine.ts
 * ============================================================
 * Local media compositing engine (FFmpeg) for the Asset Foundry.
 *
 * Composes registered asset images + optional TTS audio into an MP4 slideshow
 * (the deterministic, free path vs. paid cloud video generation). FFmpeg is
 * detected at runtime — graceful `ffmpeg_missing` status when unavailable.
 *
 * Emits `asset.render_started` / `asset.render_completed` / `asset.render_failed`.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { getAssetFilePath, registerAsset } from './assetRegistry.ts';
import { publishSystemEvent } from './crossSystemEventBus.ts';
import { resolveRuntimeDirPath } from './runtimePaths.ts';

export interface RenderInput {
  imageCids: string[];
  audioCid?: string;
  outputName?: string;
  fps?: number;
  secondsPerImage?: number;
  width?: number;
  height?: number;
  subtitleText?: string;
}

export interface RenderResult {
  ok: boolean;
  status: 'completed' | 'ffmpeg_missing' | 'failed';
  cid?: string;
  filePath?: string;
  outputName?: string;
  error?: string;
  plan?: { inputs: string[]; command: string[] };
}

function probeFfmpegOnPath(): string | null {
  const envPath = (process.env.FFMPEG_PATH || '').trim();
  if (envPath && fs.existsSync(envPath)) return envPath;

  const probe = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' });
  if (!probe.error && probe.status === 0) return 'ffmpeg';
  return null;
}

async function resolveFfmpeg(): Promise<string | null> {
  const onPath = probeFfmpegOnPath();
  if (onPath) return onPath;

  // Optional: resolve ffmpeg-static from node_modules without a static import
  // (the package is optional, so no compile-time dependency).
  const staticCandidates = [
    path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'),
    path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg'),
  ];
  for (const candidate of staticCandidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * Render a slideshow MP4 from registered image assets (and optional audio).
 * Pure local compositing — no cloud cost. Requires FFmpeg on PATH or
 * FFMPEG_PATH env / ffmpeg-static package.
 */
export async function renderVideoFromAssets(input: RenderInput): Promise<RenderResult> {
  const imageCids = input.imageCids || [];
  if (imageCids.length === 0) return { ok: false, status: 'failed', error: 'imageCids is required' };

  const imagePaths: string[] = [];
  for (const cid of imageCids) {
    const p = getAssetFilePath(cid);
    if (!p) return { ok: false, status: 'failed', error: `Image asset not materialized locally: ${cid}` };
    imagePaths.push(p);
  }

  const ffmpegPath = await resolveFfmpeg();
  if (!ffmpegPath) {
    return {
      ok: false,
      status: 'ffmpeg_missing',
      error: 'FFmpeg không khả dụng. Cài ffmpeg-static hoặc đặt FFMPEG_PATH.',
      plan: { inputs: imagePaths, command: ['ffmpeg', '-loop', '1', '-i', '<image>', '<output>.mp4'] },
    };
  }

  const fps = input.fps || 1;
  const perImage = input.secondsPerImage || 3;
  const outputName = input.outputName || `render_${Date.now()}.mp4`;
  const outDir = resolveRuntimeDirPath('assets');
  const outputPath = path.join(outDir, outputName);

  void publishSystemEvent('asset.render_started', 'assetRenderEngine', `Rendering ${imagePaths.length} frames`, { outputName });

  try {
    // Build: for each image, -loop 1 -t <dur> -i img ; filter_complex concat + scale.
    const args: string[] = ['-y'];
    const filters: string[] = [];
    for (let i = 0; i < imagePaths.length; i += 1) {
      args.push('-loop', '1', '-t', String(perImage), '-i', imagePaths[i]);
      filters.push(`[${i}:v]scale=${input.width || 1080}:${input.height || 1920}:force_original_aspect_ratio=decrease,pad=${input.width || 1080}:${input.height || 1920}:(ow-iw)/2:(oh-ih)/2,setsar=1[v${i}]`);
    }

    let filterComplex = filters.map((f, i) => f).join(';');
    filterComplex += `;${imagePaths.map((_, i) => `[v${i}]`).join('')}concat=n=${imagePaths.length}:v=1:a=0[vout]`;

    args.push('-filter_complex', filterComplex, '-map', '[vout]', '-r', String(fps), '-c:v', 'libx264', '-pix_fmt', 'yuv420p');

    if (input.audioCid) {
      const audioPath = getAssetFilePath(input.audioCid);
      if (audioPath) {
        args.push('-i', audioPath, '-shortest', '-c:a', 'aac', '-b:a', '128k');
      }
    }

    if (input.subtitleText) {
      // Burn subtitles (requires libfreetype in the ffmpeg build).
      args.push('-vf', `drawtext=text='${input.subtitleText.replace(/'/g, '')}':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-160:box=1:boxcolor=black@0.5`);
    }

    args.push(outputPath);

    const result = spawnSync(ffmpegPath, args, { encoding: 'utf8' });
    if (result.error || result.status !== 0) {
      const err = result.stderr?.slice(-800) || result.error?.message || 'FFmpeg failed';
      void publishSystemEvent('asset.render_failed', 'assetRenderEngine', 'Render failed', { outputName, error: err });
      return { ok: false, status: 'failed', error: err };
    }

    const bytes = fs.readFileSync(outputPath);
    const rec = registerAsset({
      kind: 'video',
      name: outputName,
      mimeType: 'video/mp4',
      bytes,
      dependsOn: imageCids,
      provenance: { source: 'assetRenderEngine', inputCids: imageCids },
    });

    void publishSystemEvent('asset.render_completed', 'assetRenderEngine', `Render completed: ${outputName}`, { cid: rec.cid, sizeBytes: bytes.length });

    return { ok: true, status: 'completed', cid: rec.cid, filePath: rec.filePath, outputName };
  } catch (err: any) {
    void publishSystemEvent('asset.render_failed', 'assetRenderEngine', 'Render failed', { outputName, error: err.message });
    return { ok: false, status: 'failed', error: err.message };
  }
}

/** Synchronous FFmpeg availability check (for UI status). */
export function detectFfmpegSync(): { available: boolean; path: string | null } {
  const p = probeFfmpegOnPath();
  return { available: !!p, path: p };
}
