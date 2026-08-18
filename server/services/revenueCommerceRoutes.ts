/**
 * revenueCommerceRoutes.ts
 * ============================================================
 * Domain Sub-Router for Revenue Optimization, Dynamic Pricing,
 * Synthetic Market Simulator, and Executive Boardroom Sessions.
 */

import type { Express, Request, Response } from 'express';
const routeParam = (value: string | string[]) => Array.isArray(value) ? value[0] ?? '' : value;

import { getRevenueOptimizationRecommendations, optimizeSaaSPricingTiers, evaluateDynamicSaaSPricing } from './revenueGrowthOptimizer.ts';
import { runSyntheticCustomerFeedbackLoop, getSyntheticFeedbackReport, listSyntheticFeedbackReports } from './syntheticCustomerFeedbackLoop.ts';
import { conductExecutiveBoardroomSession, getExecutiveBoardroomSession, listExecutiveBoardroomSessions } from './aiExecutiveBoardroom.ts';

export function registerRevenueCommerceRoutes(app: Express): void {
  // ── Revenue & Pricing Optimization ──
  app.get('/api/revenue/recommendations', (_req: Request, res: Response) => {
    res.json({ success: true, recommendations: getRevenueOptimizationRecommendations() });
  });

  app.post('/api/revenue/optimize-tiers', (req: Request, res: Response) => {
    const { baseMonthlyCostUSD, targetMarginPercent } = req.body || {};
    res.json({ success: true, optimized: optimizeSaaSPricingTiers({
      baseMonthlyCostUSD: Number(baseMonthlyCostUSD) || undefined,
      targetMarginPercent: Number(targetMarginPercent) || undefined,
    }) });
  });

  app.post('/api/revenue/dynamic-pricing', (req: Request, res: Response) => {
    const { currentMRR, activeUsers, targetMarginPercent } = req.body || {};
    const result = evaluateDynamicSaaSPricing({
      currentMRR: Number(currentMRR) || 10000,
      activeUsers: Number(activeUsers) || 300,
      targetMarginPercent: Number(targetMarginPercent) || 70,
    });
    res.json({ success: true, ...result });
  });

  // ── Synthetic Customer Feedback ──
  app.post('/api/simulation/synthetic-feedback/run', async (req: Request, res: Response) => {
    try {
      const { featureTitle } = req.body || {};
      if (!featureTitle) return res.status(400).json({ success: false, error: 'featureTitle is required' });
      const report = await runSyntheticCustomerFeedbackLoop({
        productModule: featureTitle,
      });
      res.json({ success: true, report });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/simulation/synthetic-feedback/:id', (req: Request, res: Response) => {
    const report = getSyntheticFeedbackReport(routeParam(req.params.id));
    if (!report) return res.status(404).json({ success: false, error: 'Report not found' });
    res.json({ success: true, report });
  });

  app.get('/api/simulation/synthetic-feedback/list', (_req: Request, res: Response) => {
    res.json({ success: true, reports: listSyntheticFeedbackReports() });
  });

  // ── Executive Boardroom Simulation ──
  app.post('/api/simulation/boardroom/session', async (req: Request, res: Response) => {
    try {
      const { strategicTopic } = req.body || {};
      if (!strategicTopic) return res.status(400).json({ success: false, error: 'strategicTopic is required' });
      const session = await conductExecutiveBoardroomSession(strategicTopic);
      res.json({ success: true, session });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/simulation/boardroom/:id', (req: Request, res: Response) => {
    const session = getExecutiveBoardroomSession(routeParam(req.params.id));
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
    res.json({ success: true, session });
  });

  app.get('/api/simulation/boardroom/list', (_req: Request, res: Response) => {
    res.json({ success: true, sessions: listExecutiveBoardroomSessions() });
  });
}
