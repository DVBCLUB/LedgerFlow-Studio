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
import { runMonteCarloDsge } from './monteCarloDsgeEngine.ts';
import { optimizeWorkingCapital } from './workingCapitalOptimizer.ts';
import { decideOvernightSweep } from './liquidityBufferEngine.ts';
import { runTreasuryCycle, persistTreasurySnapshot } from './treasuryController.ts';
import { startZeroTouchLoop, advanceLoopStage, getLoopRun, listLoopRuns, recordLoopRevenue, persistLoopBusiness } from './zeroTouchCommerceLoop.ts';

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

  // ── Treasury & Capital Allocation ──
  app.post('/api/treasury/monte-carlo', (req: Request, res: Response) => {
    const { params, config } = req.body || {};
    const result = runMonteCarloDsge(params || undefined, config || {});
    res.json({ success: true, stats: result.stats });
  });

  app.post('/api/treasury/working-capital', (req: Request, res: Response) => {
    const state = req.body || {};
    const plan = optimizeWorkingCapital(state);
    res.json({ success: true, plan });
  });

  app.post('/api/treasury/sweep', (req: Request, res: Response) => {
    const { idleCashVnd, cvar99BufferVnd, minOperatingCashVnd } = req.body || {};
    const decision = decideOvernightSweep(
      Number(idleCashVnd) || 0,
      Number(cvar99BufferVnd) || 0,
      Number(minOperatingCashVnd) || 0,
    );
    res.json({ success: true, decision });
  });

  app.post('/api/treasury/cycle', async (req: Request, res: Response) => {
    const defaultWc = { dioDays: 45, dsoDays: 30, dpoDays: 25, inventoryVnd: 2_000_000_000, receivablesVnd: 3_000_000_000, payablesVnd: 1_500_000_000, dailyBurnVnd: 50_000_000 };
    const input = {
      dsge: req.body?.dsge,
      monteCarlo: req.body?.monteCarlo,
      workingCapital: { ...defaultWc, ...(req.body?.workingCapital || {}) },
      wcBounds: req.body?.wcBounds,
      idleCashVnd: Number(req.body?.idleCashVnd) || 28_400_000_000,
      minOperatingCashVnd: Number(req.body?.minOperatingCashVnd) || 3_000_000_000,
      instruments: req.body?.instruments,
    };
    const snapshot = runTreasuryCycle(input);
    await persistTreasurySnapshot(snapshot);
    res.json({ success: true, snapshot });
  });

  // ── Zero-Touch Product-to-Revenue Loop ──
  app.post('/api/commerce/loop/start', (req: Request, res: Response) => {
    const productId = String(req.body?.productId || '').trim();
    if (!productId) return res.status(400).json({ success: false, error: 'productId is required' });
    res.json({ success: true, run: startZeroTouchLoop(productId) });
  });

  app.post('/api/commerce/loop/:id/advance', async (req: Request, res: Response) => {
    const run = advanceLoopStage(routeParam(req.params.id), Boolean(req.body?.approve));
    if (!run) return res.status(404).json({ success: false, error: 'run not found' });
    await persistLoopBusiness(run);
    res.json({ success: true, run });
  });

  app.post('/api/commerce/loop/:id/revenue', async (req: Request, res: Response) => {
    const run = recordLoopRevenue(routeParam(req.params.id), Number(req.body?.revenueVnd) || 0, Number(req.body?.costVnd) || 0);
    if (!run) return res.status(404).json({ success: false, error: 'run not found' });
    await persistLoopBusiness(run);
    res.json({ success: true, run });
  });

  app.get('/api/commerce/loop/:id', (req: Request, res: Response) => {
    const run = getLoopRun(routeParam(req.params.id));
    if (!run) return res.status(404).json({ success: false, error: 'run not found' });
    res.json({ success: true, run });
  });

  app.get('/api/commerce/loop', (_req: Request, res: Response) => {
    res.json({ success: true, runs: listLoopRuns() });
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
