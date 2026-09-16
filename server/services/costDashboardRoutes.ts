/**
 * costDashboardRoutes.ts
 * ============================================================
 * REST API endpoints for Cost Dashboard, 2-Tier Metrics, and
 * Cost Governor configuration.
 *
 * These routes are registered via agentSystemRoutes.ts.
 */

import type { Express, Request, Response } from 'express';

import {
  getSnapshot,
  getDailyCosts,
  getTwoTierMetricsSummary,
  recordTwoTierMetric,
  getRecords,
  getAiUnitEconomicsSummary,
} from './costObservability.ts';

import {
  getGovernorConfig,
  setGovernorConfig,
  checkBudgetGate,
  evaluateBudgetTierDowngrade,
} from './costGovernor.ts';

import { classifyTask } from './aiClassifierEngine.ts';
import { orchestrateTaskWithTwoTierNexus } from './unifiedAiRobotNexus.ts';

export function registerCostDashboardRoutes(app: Express): void {
  // ── Cost Snapshot ──
  app.get('/api/cost/snapshot', (_req: Request, res: Response) => {
    try {
      const snapshot = getSnapshot(30);
      res.json({ success: true, snapshot });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to get cost snapshot' });
    }
  });

  // ── AI Unit Economics & ROI ──
  app.get('/api/cost/unit-economics', (req: Request, res: Response) => {
    try {
      const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);
      const summary = getAiUnitEconomicsSummary(days);
      res.json({ success: true, summary });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to get unit economics' });
    }
  });

  // ── Daily Costs ──
  app.get('/api/cost/daily', (req: Request, res: Response) => {
    try {
      const days = Math.min(Math.max(Number(req.query.days) || 7, 1), 90);
      const daily = getDailyCosts(days);
      res.json({ success: true, daily });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to get daily costs' });
    }
  });

  // ── Recent Records ──
  app.get('/api/cost/records', (req: Request, res: Response) => {
    try {
      const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
      const records = getRecords(limit);
      res.json({ success: true, records });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to get records' });
    }
  });

  // ── 2-Tier Metrics Summary ──
  app.get('/api/cost/two-tier/metrics', (_req: Request, res: Response) => {
    try {
      const metrics = getTwoTierMetricsSummary();
      res.json({ success: true, metrics });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to get 2-tier metrics' });
    }
  });

  // ── Record 2-Tier Metric ──
  app.post('/api/cost/two-tier/record', (req: Request, res: Response) => {
    try {
      const { tier, isCached, isDowngraded, promptTokens } = req.body || {};
      if (!tier) {
        return res.status(400).json({ success: false, error: 'tier is required' });
      }
      recordTwoTierMetric({ tier, isCached, isDowngraded, promptTokens });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to record metric' });
    }
  });

  // ── Governor Config ──
  app.get('/api/cost/governor/config', (_req: Request, res: Response) => {
    try {
      const config = getGovernorConfig();
      res.json({ success: true, config });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to get governor config' });
    }
  });

  app.put('/api/cost/governor/config', (req: Request, res: Response) => {
    try {
      const { enabled, monthlyCapUsd, alertThresholdPct } = req.body || {};
      const config = setGovernorConfig({ enabled, monthlyCapUsd, alertThresholdPct });
      res.json({ success: true, config });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to update governor config' });
    }
  });

  // ── Budget Gate Check ──
  app.post('/api/cost/governor/check', (req: Request, res: Response) => {
    try {
      const { agent, domain } = req.body || {};
      if (!agent) {
        return res.status(400).json({ success: false, error: 'agent is required' });
      }
      const result = checkBudgetGate({ agent, domain });
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to check budget gate' });
    }
  });

  // ── Tier Downgrade Evaluation ──
  app.post('/api/cost/governor/evaluate-tier', (req: Request, res: Response) => {
    try {
      const { requestedTier } = req.body || {};
      if (!requestedTier) {
        return res.status(400).json({ success: false, error: 'requestedTier is required' });
      }
      const result = evaluateBudgetTierDowngrade(requestedTier);
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to evaluate tier downgrade' });
    }
  });

  // ── 2-Tier Classify ──
  app.post('/api/ai/two-tier/classify', async (req: Request, res: Response) => {
    try {
      const { task, userPrompt, context } = req.body || {};
      if (!task) {
        return res.status(400).json({ success: false, error: 'task is required' });
      }
      const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
        { role: 'system', content: context || '' },
        { role: 'user', content: `${task}: ${userPrompt || ''}` },
      ];
      const result = await classifyTask(messages);
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Classification failed' });
    }
  });

  // ── 2-Tier Execute ──
  app.post('/api/ai/two-tier/execute', async (req: Request, res: Response) => {
    try {
      const { task, userPrompt, context, model, systemPrompt } = req.body || {};
      if (!task || !userPrompt) {
        return res.status(400).json({ success: false, error: 'task and userPrompt are required' });
      }
      const result = await orchestrateTaskWithTwoTierNexus(userPrompt, {
        taskHint: task,
        systemPrompt: systemPrompt || undefined,
      });
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Execution failed' });
    }
  });
}
