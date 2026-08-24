/**
 * captureEngine.ts
 * ============================================================
 * Cross-factory capture engine: turns a running app/game URL into a frame
 * sequence (Puppeteer screenshots) registered in the Asset Registry.
 * Those frames then feed assetRenderEngine (FFmpeg) to produce marketing
 * footage with zero human intervention — the Code/Gameplay → Video synergy.
 */

import { registerAsset } from './assetRegistry.ts';
import { publishSystemEvent } from './crossSystemEventBus.ts';

export interface CaptureInput {
  url: string;
  durationSec?: number;
  fps?: number;
  viewport?: { width: number; height: number };
}

export interface CaptureResult {
  ok: boolean;
  status: 'completed' | 'failed' | 'puppeteer_missing';
  frameCids: string[];
  count: number;
  error?: string;
}

export async function captureFrames(input: CaptureInput): Promise<CaptureResult> {
  if (!input.url?.trim()) {
    return { ok: false, status: 'failed', frameCids: [], count: 0, error: 'url is required' };
  }

  let puppeteer: any;
  try {
    const mod: any = await import('puppeteer');
    puppeteer = mod?.default || mod;
  } catch {
    return { ok: false, status: 'puppeteer_missing', frameCids: [], count: 0, error: 'puppeteer không khả dụng' };
  }

  const durationSec = Math.min(Math.max(input.durationSec || 6, 1), 30);
  const fps = Math.min(Math.max(input.fps || 1, 1), 4);
  const frameCount = Math.max(1, Math.round(durationSec * fps));
  const intervalMs = Math.round((durationSec * 1000) / frameCount);

  void publishSystemEvent('asset.render_started', 'captureEngine', `Capturing ${frameCount} frames`, { url: input.url });

  let browser: any;
  try {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport(input.viewport || { width: 1080, height: 1920 });
    await page.goto(input.url, { waitUntil: 'networkidle2', timeout: 30_000 });

    const frameCids: string[] = [];
    for (let i = 0; i < frameCount; i += 1) {
      const shot: Buffer = await page.screenshot({ type: 'jpeg', quality: 80 });
      const rec = registerAsset({
        kind: 'image',
        name: `capture_${Date.now()}_${i}.jpg`,
        mimeType: 'image/jpeg',
        bytes: shot,
        provenance: { source: 'captureEngine', prompt: input.url },
      });
      frameCids.push(rec.cid);
      if (i < frameCount - 1) await new Promise((r) => setTimeout(r, intervalMs));
    }

    void publishSystemEvent('asset.render_completed', 'captureEngine', `Captured ${frameCids.length} frames`, { url: input.url, frameCids });
    return { ok: true, status: 'completed', frameCids, count: frameCids.length };
  } catch (err: any) {
    void publishSystemEvent('asset.render_failed', 'captureEngine', 'Capture failed', { url: input.url, error: err.message });
    return { ok: false, status: 'failed', frameCids: [], count: 0, error: err.message };
  } finally {
    if (browser) {
      try { await browser.close(); } catch { /* ignore */ }
    }
  }
}
