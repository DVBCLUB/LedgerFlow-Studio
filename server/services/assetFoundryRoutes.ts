/**
 * assetFoundryRoutes.ts
 * ============================================================
 * Domain sub-router for the Multi-Modal Asset Foundry (Autonomous Digital
 * Factory). Mounted by server.ts. Every endpoint is protected by the global
 * `/api` local-auth gate already in server.ts.
 */

import type { Express, Request, Response } from 'express';
import { generateImage } from './imageGenAdapter.ts';
import { synthesizeSpeech } from './audioGenAdapter.ts';
import { submitVideoJob, pollVideoJob, listVideoJobs } from './videoGenAdapter.ts';
import { renderVideoFromAssets, detectFfmpegSync } from './assetRenderEngine.ts';
import { listAssets, getAsset, getAssetGraph, getAssetStats, getAssetFilePath } from './assetRegistry.ts';

export function registerAssetFoundryRoutes(app: Express): void {
  // ── Registry / graph ──
  app.get('/api/asset-foundry/stats', (_req: Request, res: Response) => {
    res.json({ success: true, stats: getAssetStats() });
  });

  app.get('/api/asset-foundry/assets', (req: Request, res: Response) => {
    const kind = (req.query.kind as string) || undefined;
    const limit = Number(req.query.limit) || 100;
    res.json({ success: true, assets: listAssets({ kind: kind as any, limit }) });
  });

  app.get('/api/asset-foundry/assets/:cid', (req: Request, res: Response) => {
    const asset = getAsset(String(req.params.cid));
    if (!asset) return res.status(404).json({ success: false, error: 'asset not found' });
    res.json({ success: true, asset });
  });

  app.get('/api/asset-foundry/assets/:cid/file', (req: Request, res: Response) => {
    const p = getAssetFilePath(String(req.params.cid));
    if (!p) return res.status(404).json({ success: false, error: 'asset binary not available' });
    res.sendFile(p);
  });

  app.get('/api/asset-foundry/graph/:cid', (req: Request, res: Response) => {
    res.json({ success: true, graph: getAssetGraph(String(req.params.cid)) });
  });

  app.get('/api/asset-foundry/ffmpeg', (_req: Request, res: Response) => {
    res.json({ success: true, ffmpeg: detectFfmpegSync() });
  });

  // ── Generation ──
  app.post('/api/asset-foundry/image', async (req: Request, res: Response) => {
    try {
      const result = await generateImage(req.body || {});
      res.status(result.ok ? 200 : 400).json({ success: result.ok, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/asset-foundry/tts', async (req: Request, res: Response) => {
    try {
      const result = await synthesizeSpeech(req.body || {});
      res.status(result.ok ? 200 : 400).json({ success: result.ok, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ── Video (submit + poll) ──
  app.post('/api/asset-foundry/video/submit', async (req: Request, res: Response) => {
    try {
      const result = await submitVideoJob(req.body || {});
      res.status(result.ok ? 200 : 400).json({ success: result.ok, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/asset-foundry/video/poll', async (req: Request, res: Response) => {
    try {
      const result = await pollVideoJob(req.body || {});
      res.status(result.ok ? 200 : 400).json({ success: result.ok, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/asset-foundry/video/jobs', (_req: Request, res: Response) => {
    res.json({ success: true, jobs: listVideoJobs(50) });
  });

  // ── Local render (FFmpeg slideshow) ──
  app.post('/api/asset-foundry/render', async (req: Request, res: Response) => {
    try {
      const result = await renderVideoFromAssets(req.body || {});
      res.status(result.ok ? 200 : 400).json({ success: result.ok, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
}
