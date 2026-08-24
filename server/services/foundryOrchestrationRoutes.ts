/**
 * foundryOrchestrationRoutes.ts
 * ============================================================
 * Sub-router for the cross-factory orchestration layer (capture, publish,
 * monetize) of the Asset Foundry. Mounted by server.ts under `/api`.
 */

import type { Express, Request, Response } from 'express';
import { captureFrames } from './captureEngine.ts';
import { publishAsset, listPublishes } from './publishOrchestrator.ts';
import { generateVietQrLink, generateStripePaymentLink, issueLicenseKey, recordSale, listSales } from './monetizationOrchestrator.ts';
import { buildSourceBundle, computeAssetChecksum, signAsset, verifyAssetSignature, packageRelease } from './buildEngine.ts';
import { onVideoWebhook } from './videoGenAdapter.ts';

export function registerFoundryOrchestrationRoutes(app: Express): void {
  // ── Capture (code/gameplay → frames) ──
  app.post('/api/asset-foundry/capture', async (req: Request, res: Response) => {
    try {
      const result = await captureFrames(req.body || {});
      res.status(result.ok ? 200 : 400).json({ success: result.ok, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ── Publish ──
  app.get('/api/asset-foundry/publishes', (_req: Request, res: Response) => {
    res.json({ success: true, publishes: listPublishes(50) });
  });

  app.post('/api/asset-foundry/publish', async (req: Request, res: Response) => {
    try {
      const result = await publishAsset(req.body || {});
      res.status(result.ok ? 200 : 400).json({ success: result.ok, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ── Monetize ──
  app.post('/api/asset-foundry/vietqr', (req: Request, res: Response) => {
    const result = generateVietQrLink(req.body || {});
    res.json({ success: true, ...result });
  });

  app.post('/api/asset-foundry/stripe-link', async (req: Request, res: Response) => {
    const result = await generateStripePaymentLink(req.body || {});
    res.status(result.ok ? 200 : 400).json({ success: result.ok, ...result });
  });

  app.post('/api/asset-foundry/license', (req: Request, res: Response) => {
    const result = issueLicenseKey(req.body || {});
    res.json({ success: true, ...result });
  });

  app.post('/api/asset-foundry/sale', (req: Request, res: Response) => {
    const result = recordSale(req.body || {});
    res.json({ success: true, sale: result });
  });

  app.get('/api/asset-foundry/sales', (_req: Request, res: Response) => {
    res.json({ success: true, sales: listSales(50) });
  });

  // ── Build / checksum / sign / package ──
  app.post('/api/asset-foundry/build', async (req: Request, res: Response) => {
    try {
      const result = await buildSourceBundle(req.body || {});
      res.status(result.ok ? 200 : 400).json({ success: result.ok, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/asset-foundry/build/package', (req: Request, res: Response) => {
    const result = packageRelease(req.body || {});
    res.status(result.ok ? 200 : 400).json({ success: result.ok, ...result });
  });

  app.post('/api/asset-foundry/checksum', (req: Request, res: Response) => {
    const { cid } = req.body || {};
    const result = computeAssetChecksum(String(cid || ''));
    res.status(result.ok ? 200 : 400).json({ success: result.ok, ...result });
  });

  app.post('/api/asset-foundry/sign', (req: Request, res: Response) => {
    const { cid } = req.body || {};
    const result = signAsset(String(cid || ''));
    res.status(result.ok ? 200 : 400).json({ success: result.ok, ...result });
  });

  app.post('/api/asset-foundry/verify', (req: Request, res: Response) => {
    const { cid, signature } = req.body || {};
    const result = verifyAssetSignature(String(cid || ''), String(signature || ''));
    res.status(result.ok ? 200 : 400).json({ success: result.ok, ...result });
  });

  // ── Provider webhook receiver (real-time completion) ──
  app.post('/api/asset-foundry/video/webhook/:provider', async (req: Request, res: Response) => {
    try {
      const provider = req.params.provider as any;
      const result = await onVideoWebhook({ provider, providerTaskId: String(req.body?.providerTaskId || ''), videoUrl: req.body?.videoUrl, status: req.body?.status, error: req.body?.error });
      res.status(result.ok ? 200 : 400).json({ success: result.ok, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
}
