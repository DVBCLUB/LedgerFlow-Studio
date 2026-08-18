/**
 * agentLoopRoutes.ts
 * ============================================================
 * Domain Sub-Router for Agentic Loop Background Jobs, Circuit Breaker,
 * Performance Ledger, and Auto-Repair Sessions.
 */

import type { Express, Request, Response } from 'express';
import { z } from 'zod';
const routeParam = (value: string | string[]) => Array.isArray(value) ? value[0] ?? '' : value;

import { enqueueAgentLoopJob, getAgentLoopJobStatus, listAgentLoopJobs, getAgentLoopJobStats } from './agentLoopJobRunner.ts';
import { getCircuitBreakerStatus } from './aiRouter.ts';
import { getPerformanceDashboard, listAllPerformanceRecords, getAgentPerformanceStats, listRecentOutcomeEvents, getBestAgentForDomain } from './agentPerformanceLedger.ts';
import { retryJob, purgeJob } from './backgroundJobQueue.ts';
import { triggerAutoRepairSession, getAutoRepairSession, listAutoRepairSessions } from './agentAutoRepairEngine.ts';
import { triggerAutoHealingMission } from './autonomousSweAgentLoop.ts';

const enqueueLoopSchema = z.object({
  goal: z.string().min(3, 'goal is required'),
  domain: z.enum(['coding', 'finance', 'marketing', 'sales', 'analytics', 'general']).optional().default('coding'),
  maxLoops: z.number().int().min(1).max(10).optional().default(5),
  maxRepairAttempts: z.number().int().min(0).max(5).optional().default(3),
  autoRepair: z.boolean().optional().default(false),
  stopOnFirstError: z.boolean().optional().default(true),
  sandboxMode: z.enum(['dry_run', 'local', 'docker']).optional(),
  testCommand: z.string().optional(),
  systemInstruction: z.string().optional(),
  timeoutMs: z.number().int().min(30_000).max(60 * 60 * 1000).optional(),
  priority: z.enum(['critical', 'high', 'normal', 'low']).optional().default('normal'),
});

const getBestAgentSchema = z.object({
  domain: z.string().min(1),
  candidates: z.array(z.string()).min(1).max(20),
});

export function registerAgentLoopRoutes(app: Express): void {
  // ── Agent Loop Background Jobs ──
  app.post('/api/agent/loop/enqueue', async (req: Request, res: Response) => {
    try {
      const parsed = enqueueLoopSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: parsed.error.issues.map((i) => i.message).join(', '),
        });
      }
      const { timeoutMs, priority, ...loopOptions } = parsed.data;
      const requestedBy = typeof req.headers['x-user-id'] === 'string' ? req.headers['x-user-id'] : 'api';
      const jobId = enqueueAgentLoopJob(
        { ...loopOptions, requestedBy },
        { timeoutMs, priority },
      );
      res.json({ success: true, jobId, message: 'Agent loop enqueued. Poll /api/agent/loop/job/:id for status.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/agent/loop/job/:id', (req: Request, res: Response) => {
    const status = getAgentLoopJobStatus(routeParam(req.params.id));
    if (!status) {
      return res.status(404).json({ success: false, error: 'Job not found or not an agent_loop job.' });
    }
    res.json({ success: true, job: status });
  });

  app.get('/api/agent/loop/jobs', (req: Request, res: Response) => {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const status = req.query.status as any;
    const jobs = listAgentLoopJobs({ limit, status });
    const stats = getAgentLoopJobStats();
    res.json({ success: true, stats, jobs });
  });

  app.post('/api/agent/loop/job/:id/retry', (req: Request, res: Response) => {
    const ok = retryJob(routeParam(req.params.id));
    if (!ok) return res.status(404).json({ success: false, error: 'Job not found.' });
    res.json({ success: true, message: 'Job re-queued.' });
  });

  app.delete('/api/agent/loop/job/:id', (req: Request, res: Response) => {
    const ok = purgeJob(routeParam(req.params.id));
    if (!ok) return res.status(404).json({ success: false, error: 'Job not found.' });
    res.json({ success: true });
  });

  // ── Circuit Breaker Status ──
  app.get('/api/ai/circuit-breaker', (_req: Request, res: Response) => {
    try {
      const status = getCircuitBreakerStatus();
      res.json({ success: true, circuitBreakers: status });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ── Performance Ledger ──
  app.get('/api/agent/performance/dashboard', (_req: Request, res: Response) => {
    try {
      const dashboard = getPerformanceDashboard();
      res.json({ success: true, dashboard });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/agent/performance/records', (req: Request, res: Response) => {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const domain = req.query.domain as string | undefined;
    const records = listAllPerformanceRecords({ limit, domain });
    res.json({ success: true, count: records.length, records });
  });

  app.get('/api/agent/performance/stats/:domain', (req: Request, res: Response) => {
    const stats = getAgentPerformanceStats(routeParam(req.params.domain));
    res.json({ success: true, domain: req.params.domain, stats });
  });

  app.get('/api/agent/performance/outcomes', (req: Request, res: Response) => {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const outcomes = listRecentOutcomeEvents(limit);
    res.json({ success: true, count: outcomes.length, outcomes });
  });

  app.post('/api/agent/performance/best-agent', (req: Request, res: Response) => {
    const parsed = getBestAgentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues.map((i) => i.message).join(', ') });
    }
    const { domain, candidates } = parsed.data;
    const best = getBestAgentForDomain(domain, candidates);
    res.json({ success: true, domain, bestAgent: best });
  });

  app.get('/api/agent/performance', (_req: Request, res: Response) => {
    res.json({ success: true, dashboard: getPerformanceDashboard() });
  });

  // ── Auto-Repair Sessions ──
  app.post('/api/agent/auto-repair/session', async (req: Request, res: Response) => {
    try {
      const { failedRunId, maxAttempts } = req.body || {};
      if (!failedRunId) return res.status(400).json({ success: false, error: 'failedRunId is required' });
      const session = await triggerAutoRepairSession({
        errorLog: String(failedRunId),
        source: 'manual',
        requestedBy: 'api',
      });
      res.json({ success: true, session });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/agent/auto-repair/:id', (req: Request, res: Response) => {
    const session = getAutoRepairSession(routeParam(req.params.id));
    if (!session) return res.status(404).json({ success: false, error: 'Auto-repair session not found' });
    res.json({ success: true, session });
  });

  app.get('/api/agent/auto-repair/list', (_req: Request, res: Response) => {
    res.json({ success: true, sessions: listAutoRepairSessions() });
  });

  // ── SWE Auto-Heal Mission ──
  app.post('/api/agent/swe/auto-heal', async (req: Request, res: Response) => {
    try {
      const { missionGoal, affectedFiles } = req.body || {};
      if (!missionGoal) return res.status(400).json({ success: false, error: 'missionGoal is required' });
      const result = triggerAutoHealingMission({
        ciFailureSummary: String(missionGoal),
        targetFiles: affectedFiles || [],
      });
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
}
