/**
 * businessDataRoutes.ts — Express routes cho Unified Business Data API, Webhooks & Autonomous Robots.
 */

import type { Express, Request, Response } from 'express';
import {
  BUSINESS_ENTITY_TYPES,
  listBusinessEntities,
  getBusinessEntity,
  upsertBusinessEntity,
  deleteBusinessEntity,
  listBusinessStats,
  setBusinessEntityStatus,
  syncBusinessToSupabase,
  searchBusinessEntities,
  getCompanyKPIs,
  exportEntitiesAsCsv,
  bulkImportBusinessEntities,
  type BusinessEntityType,
} from './businessDataService.ts';
import { persistAgentResult } from './aiBusinessBridge.ts';
import { ingestBankWebhook, listBankWebhookLogs } from './bankWebhookIngestionService.ts';
import {
  runSoloFounderNightlySweeperRobot,
  runViralContentCrossPublisherRobot,
  runRevenueLeakReconciliationRobot,
} from './autonomousCompanyRobots.ts';

function isEntityType(value: unknown): value is BusinessEntityType {
  return typeof value === 'string' && (BUSINESS_ENTITY_TYPES as readonly string[]).includes(value);
}

const param = (value: string | string[]) => (Array.isArray(value) ? value[0] ?? '' : value);

export function registerBusinessRoutes(app: Express): void {
  app.get('/api/business', (req: Request, res: Response) => {
    const type = req.query.type ? String(req.query.type) : undefined;
    const limit = Number(req.query.limit ?? 100);
    res.json({ success: true, entities: listBusinessEntities(type && isEntityType(type) ? type : undefined, limit) });
  });

  app.get('/api/business/stats', (_req: Request, res: Response) => {
    res.json({ success: true, stats: listBusinessStats() });
  });

  app.get('/api/business/kpis', (_req: Request, res: Response) => {
    res.json({ success: true, kpis: getCompanyKPIs() });
  });

  app.get('/api/business/search', (req: Request, res: Response) => {
    const query = String(req.query.q || '');
    const type = req.query.type ? String(req.query.type) : undefined;
    const source = req.query.source ? String(req.query.source) : undefined;
    const limit = Number(req.query.limit ?? 100);
    const results = searchBusinessEntities(query, {
      type: type && isEntityType(type) ? type : undefined,
      source,
      limit,
    });
    res.json({ success: true, count: results.length, entities: results });
  });

  app.get('/api/business/export/csv', (req: Request, res: Response) => {
    const type = req.query.type ? String(req.query.type) : undefined;
    const csv = exportEntitiesAsCsv(type && isEntityType(type) ? type : undefined);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="business_data_${type || 'all'}.csv"`);
    res.send(csv);
  });

  app.post('/api/business/bulk-import', (req: Request, res: Response) => {
    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Expected array of items for bulk import.' });
    }
    const validItems = items.filter((it) => isEntityType(it.type) && it.data && typeof it.data === 'object');
    const result = bulkImportBusinessEntities(validItems);
    res.json({ success: true, result });
  });

  /**
   * GET /api/business/pending — danh sách entity đụng tiền đang chờ duyệt.
   */
  app.get('/api/business/pending', (_req: Request, res: Response) => {
    const entities = listBusinessEntities(undefined, 1000).filter((e) => e.data.status === 'pending_approval');
    res.json({ success: true, entities });
  });

  app.get('/api/business/:id', (req: Request, res: Response) => {
    const entity = getBusinessEntity(param(req.params.id));
    if (!entity) return res.status(404).json({ success: false, error: 'Not found.' });
    res.json({ success: true, entity });
  });

  app.post('/api/business', (req: Request, res: Response) => {
    const { id, type, data, source } = req.body || {};
    if (!isEntityType(type) || !data || typeof data !== 'object') {
      return res.status(400).json({ success: false, error: "Missing or invalid 'type'/'data'." });
    }
    res.json({ success: true, entity: upsertBusinessEntity({ id, type, data, source }) });
  });

  app.post('/api/business/sync', async (_req: Request, res: Response) => {
    res.json({ success: true, sync: await syncBusinessToSupabase() });
  });

  app.delete('/api/business/:id', (req: Request, res: Response) => {
    res.json({ success: deleteBusinessEntity(param(req.params.id)) });
  });

  app.post('/api/agent/persist', (req: Request, res: Response) => {
    const { type, data, source, lesson, approved } = req.body || {};
    if (!isEntityType(type) || !data || typeof data !== 'object') {
      return res.status(400).json({ success: false, error: "Missing or invalid 'type'/'data'." });
    }
    res.json({ success: true, ...persistAgentResult({ type, data, source, lesson, approved: approved === true }) });
  });

  app.post('/api/business/:id/approve', (req: Request, res: Response) => {
    const entity = setBusinessEntityStatus(param(req.params.id), 'approved');
    if (!entity) return res.status(404).json({ success: false, error: 'Not found.' });
    res.json({ success: true, entity });
  });

  app.post('/api/business/:id/reject', (req: Request, res: Response) => {
    const entity = setBusinessEntityStatus(param(req.params.id), 'rejected');
    if (!entity) return res.status(404).json({ success: false, error: 'Not found.' });
    res.json({ success: true, entity });
  });

  // ─── LIVE BANK & VIETQR WEBHOOKS ───
  app.post('/api/webhooks/bank-inbound', (req: Request, res: Response) => {
    const secretToken = req.headers['x-webhook-token'] as string | undefined;
    const result = ingestBankWebhook(req.body, { secretToken });
    res.json(result);
  });

  app.get('/api/webhooks/bank-logs', (req: Request, res: Response) => {
    const limit = Number(req.query.limit || 50);
    res.json({ success: true, logs: listBankWebhookLogs(limit) });
  });

  // ─── AUTONOMOUS COMPANY ROBOTS ───
  app.post('/api/autonomous-robots/nightly-sweeper', async (_req: Request, res: Response) => {
    try {
      const report = await runSoloFounderNightlySweeperRobot();
      res.json({ success: true, report });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Lỗi chạy Nightly Sweeper Robot.' });
    }
  });

  app.post('/api/autonomous-robots/viral-publisher', async (req: Request, res: Response) => {
    try {
      const { productTitle, description, targetAudience, preferLocal } = req.body || {};
      if (!productTitle) {
        return res.status(400).json({ success: false, error: 'Vui lòng cung cấp productTitle.' });
      }
      const result = await runViralContentCrossPublisherRobot({
        productTitle,
        description: description || `Ra mắt ${productTitle}`,
        targetAudience,
        preferLocal: preferLocal === true,
      });
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Lỗi chạy Viral Publisher Robot.' });
    }
  });

  app.post('/api/autonomous-robots/revenue-leak', async (_req: Request, res: Response) => {
    try {
      const report = await runRevenueLeakReconciliationRobot();
      res.json({ success: true, report });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Lỗi chạy Revenue Leak Robot.' });
    }
  });
}
