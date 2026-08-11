/**
 * agentSystemRoutes.ts
 * ============================================================
 * Express API routes for:
 *  - Agent Loop Background Jobs  (POST /api/agent/loop/enqueue, GET /api/agent/loop/jobs, ...)
 *  - Circuit Breaker Status      (GET /api/ai/circuit-breaker)
 *  - Agent Performance Ledger    (GET /api/agent/performance, GET /api/agent/performance/dashboard)
 *
 * Registered lazily from server.ts or deferredRoutes.ts.
 */
import type { Express, Request, Response } from 'express';
import { z } from 'zod';
import {
  enqueueAgentLoopJob,
  getAgentLoopJobStatus,
  listAgentLoopJobs,
  getAgentLoopJobStats,
} from './agentLoopJobRunner.ts';
import { getCircuitBreakerStatus } from './aiRouter.ts';
import {
  getPerformanceDashboard,
  listAllPerformanceRecords,
  getAgentPerformanceStats,
  listRecentOutcomeEvents,
  getBestAgentForDomain,
} from './agentPerformanceLedger.ts';
import { retryJob, purgeJob, getJob } from './backgroundJobQueue.ts';
import {
  triggerAutoRepairSession,
  getAutoRepairSession,
  listAutoRepairSessions,
} from './agentAutoRepairEngine.ts';
import { assessActionRisk, getRiskMatrixRegistry } from './dynamicRiskMatrix.ts';
import { conductMultiAgentDebate } from './agentConsensusEngine.ts';
import {
  runBusinessDigitalTwinSimulation,
  getDigitalTwinSimulation,
  listDigitalTwinSimulations,
} from './businessDigitalTwinSimulator.ts';
import {
  executeSoftwareRobotWorkflow,
  getSoftwareRobotWorkflow,
  listSoftwareRobotWorkflows,
} from './softwareRobotOrchestrator.ts';
import { scanAndCleanseContextPrompt } from './zeroTrustPoisonShield.ts';
import { getAIWorkforceCockpitOverview } from './aiWorkforceCockpit.ts';
import {
  publishAutomatedReleaseHandoff,
  getReleaseHandoffPackage,
  listReleaseHandoffPackages,
} from './automatedHandoffPublisher.ts';
import {
  dispatchAgentSwarm,
  getSwarmExecution,
  listSwarmExecutions,
} from './swarmDynamicOrchestrator.ts';
import {
  runSyntheticCustomerFeedbackLoop,
  getSyntheticFeedbackReport,
  listSyntheticFeedbackReports,
} from './syntheticCustomerFeedbackLoop.ts';
import {
  getEnterpriseGovernanceOverview,
  allocateResourceBudget,
} from './enterpriseSelfGovernance.ts';
import { getSystemEventHistory } from './crossSystemEventBus.ts';
import {
  listAIStaffWorkstations,
  assignTaskToAIStaff,
} from './aiStaffWorkstation.ts';
import {
  getOperationalTelemetryStream,
  generateDiagnosticsSnapshot,
} from './operationalTelemetryStream.ts';
import { subscribeTelemetry } from './agentTelemetryStream.ts';
import {
  publishDistributionCampaign,
  generateLeadDemoScenario,
  listDistributionCampaigns,
} from './autonomousDistributionHub.ts';
import {
  getRevenueOptimizationRecommendations,
  optimizeSaaSPricingTiers,
} from './revenueGrowthOptimizer.ts';
import { handleMCPJSONRPCRequest, registerSSEClient, unregisterSSEClient } from './mcpTransportServer.ts';
import { listExternalMCPServers, connectExternalMCPServerLive } from './mcpClientGateway.ts';
import {
  conductExecutiveBoardroomSession,
  getExecutiveBoardroomSession,
  listExecutiveBoardroomSessions,
} from './aiExecutiveBoardroom.ts';
import { triggerAutoHealingMission } from './autonomousSweAgentLoop.ts';
import { checkEdgeLlmHealth, callEdgeLlm } from './edgeLlmAdapter.ts';
import { broadcastCrossAgentInsight, queryCollectiveAgentKnowledge } from './crossAgentLearning.ts';
import {
  dispatchMultiPlatformRobotMission,
  getMultiPlatformRobotMission,
  listMultiPlatformRobotMissions,
} from './multiPlatformRobotSwarm.ts';
import { runComplianceDoctorAudit } from './enterpriseSelfGovernance.ts';
import { evaluateDynamicSaaSPricing } from './revenueGrowthOptimizer.ts';
import { generateProductReleaseMediaCampaign } from './mediaFactoryEngine.ts';
import { healRobotActionSelector } from './robotVisionHealer.ts';
import {
  registerRobotCronJob,
  listRobotCronJobs,
  triggerRobotCronJobNow,
} from './robotCronScheduler.ts';
import { synthesizeRobotWorkflowFromGoal } from './robotWorkflowSynthesizer.ts';
import { runDigitalTwinRobotSandboxSimulation } from './robotDigitalTwinSandbox.ts';
import { executeEdgeRobotActionFast } from './edgeRobotExecutionNode.ts';
import { startGeminiLiveVoiceStreamSession } from './geminiLiveVoiceStream.ts';
import { streamGeminiReasoningThoughtTrajectory } from './geminiReasoningGateway.ts';
import { tuneGeminiSystemPrompt } from './geminiPromptTuner.ts';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const enqueueLoopSchema = z.object({
  goal: z.string().min(3, 'goal is required'),
  domain: z.enum(['coding', 'finance', 'marketing', 'sales', 'analytics', 'general']).optional().default('coding'),
  maxLoops: z.number().int().min(1).max(10).optional().default(5),
  maxRepairAttempts: z.number().int().min(0).max(5).optional().default(3),
  autoRepair: z.boolean().optional().default(false),
  stopOnFirstError: z.boolean().optional().default(true),
  sandboxMode: z.string().optional(),
  testCommand: z.string().optional(),
  systemInstruction: z.string().optional(),
  timeoutMs: z.number().int().min(30_000).max(60 * 60 * 1000).optional(),
  priority: z.enum(['critical', 'high', 'normal', 'low']).optional().default('normal'),
});

const getBestAgentSchema = z.object({
  domain: z.string().min(1),
  candidates: z.array(z.string()).min(1).max(20),
});

// ─── Route Registration ───────────────────────────────────────────────────────

export function registerAgentSystemRoutes(app: Express): void {

  // ── Agent Loop Background Jobs ───────────────────────────────────────────────

  /**
   * POST /api/agent/loop/enqueue
   * Enqueue an agentic loop as a durable background job.
   * Returns jobId immediately — does not block.
   */
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
      const requestedBy = (req.headers['x-user-id'] as string) || 'api';
      const jobId = enqueueAgentLoopJob(
        { ...loopOptions, requestedBy },
        { timeoutMs, priority },
      );
      res.json({ success: true, jobId, message: 'Agent loop enqueued. Poll /api/agent/loop/job/:id for status.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * GET /api/agent/loop/job/:id
   * Get the status of a specific agent loop job.
   */
  app.get('/api/agent/loop/job/:id', (req: Request, res: Response) => {
    const status = getAgentLoopJobStatus(req.params.id);
    if (!status) {
      return res.status(404).json({ success: false, error: 'Job not found or not an agent_loop job.' });
    }
    res.json({ success: true, job: status });
  });

  /**
   * GET /api/agent/loop/jobs
   * List recent agent loop jobs.
   * Query params: limit (default 20), status (queued|running|completed|failed|dead_letter)
   */
  app.get('/api/agent/loop/jobs', (req: Request, res: Response) => {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const status = req.query.status as any;
    const jobs = listAgentLoopJobs({ limit, status });
    const stats = getAgentLoopJobStats();
    res.json({ success: true, stats, jobs });
  });

  /**
   * POST /api/agent/loop/job/:id/retry
   * Retry a failed or dead-letter agent loop job.
   */
  app.post('/api/agent/loop/job/:id/retry', (req: Request, res: Response) => {
    const ok = retryJob(req.params.id);
    if (!ok) return res.status(404).json({ success: false, error: 'Job not found.' });
    res.json({ success: true, message: 'Job re-queued.' });
  });

  /**
   * DELETE /api/agent/loop/job/:id
   * Purge (delete) a job from the queue.
   */
  app.delete('/api/agent/loop/job/:id', (req: Request, res: Response) => {
    const ok = purgeJob(req.params.id);
    if (!ok) return res.status(404).json({ success: false, error: 'Job not found.' });
    res.json({ success: true });
  });

  // ── Circuit Breaker Status ────────────────────────────────────────────────────

  /**
   * GET /api/ai/circuit-breaker
   * Returns real-time circuit breaker state for all AI providers.
   * Used by the AI Settings dashboard widget.
   */
  app.get('/api/ai/circuit-breaker', (_req: Request, res: Response) => {
    const status = getCircuitBreakerStatus();
    const summary = Object.entries(status).map(([key, cb]) => ({
      providerKey: key,
      state: cb.state,
      failures: cb.failures,
      openedAt: cb.openedAt ? new Date(cb.openedAt).toISOString() : null,
      lastFailureAt: cb.lastFailureAt ? new Date(cb.lastFailureAt).toISOString() : null,
      cooldownRemainingMs: cb.openedAt && cb.state === 'open'
        ? Math.max(0, 60_000 - (Date.now() - cb.openedAt))
        : 0,
    }));
    const hasOpen = summary.some((s) => s.state === 'open');
    res.json({
      success: true,
      checkedAt: new Date().toISOString(),
      hasOpenCircuits: hasOpen,
      circuits: summary,
    });
  });

  // ── Agent Performance Ledger ──────────────────────────────────────────────────

  /**
   * GET /api/agent/performance/dashboard
   * Returns a performance dashboard snapshot.
   */
  app.get('/api/agent/performance/dashboard', (_req: Request, res: Response) => {
    res.json({ success: true, dashboard: getPerformanceDashboard() });
  });

  /**
   * GET /api/agent/performance
   * List all performance records.
   * Query params: domain, minRuns, limit
   */
  app.get('/api/agent/performance', (req: Request, res: Response) => {
    const domain = req.query.domain as string | undefined;
    const minRuns = req.query.minRuns ? Number(req.query.minRuns) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 100;
    const records = listAllPerformanceRecords({ domain, minRuns, limit });
    res.json({ success: true, records });
  });

  /**
   * GET /api/agent/performance/:role
   * Get performance records for a specific agent role.
   * Query params: domain
   */
  app.get('/api/agent/performance/:role', (req: Request, res: Response) => {
    const domain = req.query.domain as string | undefined;
    const records = getAgentPerformanceStats(req.params.role, domain);
    res.json({ success: true, records });
  });

  /**
   * GET /api/agent/performance/events/recent
   * Get recent outcome events.
   */
  app.get('/api/agent/performance/events/recent', (req: Request, res: Response) => {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    res.json({ success: true, events: listRecentOutcomeEvents(limit) });
  });

  /**
   * POST /api/agent/performance/best
   * Find the best agent for a domain from a list of candidates.
   * Body: { domain: string, candidates: string[] }
   */
  app.post('/api/agent/performance/best', (req: Request, res: Response) => {
    const parsed = getBestAgentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues.map((i) => i.message).join(', ') });
    }
    const result = getBestAgentForDomain(parsed.data.domain, parsed.data.candidates);
    res.json({ success: true, ...result });
  });

  // ── Auto-Repair Engine Routes ────────────────────────────────────────────────

  const autoRepairTriggerSchema = z.object({
    errorLog: z.string().min(5, 'errorLog is required'),
    targetFile: z.string().optional(),
    goal: z.string().optional(),
  });

  /**
   * POST /api/agent/auto-repair/trigger
   * Trigger an autonomous diagnosis and patch repair session.
   */
  app.post('/api/agent/auto-repair/trigger', async (req: Request, res: Response) => {
    try {
      const parsed = autoRepairTriggerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.issues.map((i) => i.message).join(', ') });
      }
      const requestedBy = (req.headers['x-user-id'] as string) || 'api';
      const session = await triggerAutoRepairSession({ ...parsed.data, requestedBy, source: 'rest_api' });
      res.json({ success: true, session });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * GET /api/agent/auto-repair/session/:id
   * Get status of an auto-repair session.
   */
  app.get('/api/agent/auto-repair/session/:id', (req: Request, res: Response) => {
    const session = getAutoRepairSession(req.params.id);
    if (!session) return res.status(404).json({ success: false, error: 'Auto-repair session not found.' });
    res.json({ success: true, session });
  });

  /**
   * GET /api/agent/auto-repair/sessions
   * List recent auto-repair sessions.
   */
  app.get('/api/agent/auto-repair/sessions', (req: Request, res: Response) => {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    res.json({ success: true, sessions: listAutoRepairSessions(limit) });
  });

  // ── Dynamic Risk Matrix Routes ───────────────────────────────────────────────

  const riskAssessSchema = z.object({
    actionId: z.string().min(1),
    category: z.enum(['read', 'write', 'shell', 'git', 'finance', 'robot', 'system']).optional(),
    agentRole: z.string().optional(),
    domain: z.string().optional(),
    environment: z.enum(['sandbox', 'local', 'staging', 'production']).optional(),
    payload: z.record(z.string(), z.any()).optional(),
  });

  /**
   * POST /api/agent/risk/assess
   * Evaluate dynamic risk level and policy decision for an action.
   */
  app.post('/api/agent/risk/assess', (req: Request, res: Response) => {
    const parsed = riskAssessSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues.map((i) => i.message).join(', ') });
    }
    const assessment = assessActionRisk(parsed.data);
    res.json({ success: true, assessment });
  });

  /**
   * GET /api/agent/risk/matrix
   * List all registered action risk rules in the matrix.
   */
  app.get('/api/agent/risk/matrix', (_req: Request, res: Response) => {
    res.json({ success: true, rules: getRiskMatrixRegistry() });
  });

  // ── Multi-Agent Consensus Debate Routes ──────────────────────────────────────

  const consensusDebateSchema = z.object({
    topic: z.string().min(3, 'topic is required'),
    domain: z.string().optional(),
    agentRoles: z.array(z.string()).optional(),
    context: z.string().optional(),
    minConsensusThreshold: z.number().min(0.5).max(1.0).optional(),
  });

  /**
   * POST /api/agent/consensus/debate
   * Conduct a multi-agent debate session and evaluate consensus.
   */
  app.post('/api/agent/consensus/debate', async (req: Request, res: Response) => {
    try {
      const parsed = consensusDebateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.issues.map((i) => i.message).join(', ') });
      }
      const session = await conductMultiAgentDebate(parsed.data);
      res.json({ success: true, session });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ── Business Digital Twin Simulator Routes ─────────────────────────────────

  const digitalTwinSimSchema = z.object({
    iterations: z.number().int().min(100).max(10000).optional(),
    timeframeDays: z.number().int().min(30).max(180).optional(),
    currentCashUSD: z.number().optional(),
    monthlyRevenueUSD: z.number().optional(),
    monthlyBurnUSD: z.number().optional(),
    apiTokenBudgetUSD: z.number().optional(),
    churnRateMonthly: z.number().optional(),
    userGrowthMonthly: z.number().optional(),
  });

  /**
   * POST /api/simulation/digital-twin/run
   * Run a Monte Carlo Business Digital Twin simulation.
   */
  app.post('/api/simulation/digital-twin/run', async (req: Request, res: Response) => {
    try {
      const parsed = digitalTwinSimSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.issues.map((i) => i.message).join(', ') });
      }
      const result = await runBusinessDigitalTwinSimulation(parsed.data);
      res.json({ success: true, simulation: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * GET /api/simulation/digital-twin/session/:id
   * Get simulation result by ID.
   */
  app.get('/api/simulation/digital-twin/session/:id', (req: Request, res: Response) => {
    const sim = getDigitalTwinSimulation(req.params.id);
    if (!sim) return res.status(404).json({ success: false, error: 'Simulation result not found.' });
    res.json({ success: true, simulation: sim });
  });

  /**
   * GET /api/simulation/digital-twin/history
   * List recent Monte Carlo simulation runs.
   */
  app.get('/api/simulation/digital-twin/history', (req: Request, res: Response) => {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    res.json({ success: true, simulations: listDigitalTwinSimulations(limit) });
  });

  // ── Software Robot Orchestrator Routes ──────────────────────────────────────

  const softwareRobotExecuteSchema = z.object({
    name: z.string().min(3, 'name is required'),
    dryRun: z.boolean().optional(),
    actions: z.array(
      z.object({
        id: z.string(),
        type: z.enum(['rpa_script', 'browser_scrape', 'browser_form_fill', 'office_file_process', 'shell_cmd']),
        name: z.string(),
        payload: z.record(z.string(), z.any()),
        requiresVisualCheckpoint: z.boolean().optional(),
      })
    ).min(1, 'actions cannot be empty'),
  });

  /**
   * POST /api/robot/software/execute
   * Execute a software robot workflow with visual checkpoints.
   */
  app.post('/api/robot/software/execute', async (req: Request, res: Response) => {
    try {
      const parsed = softwareRobotExecuteSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.issues.map((i) => i.message).join(', ') });
      }
      const requestedBy = (req.headers['x-user-id'] as string) || 'api';
      const workflow = await executeSoftwareRobotWorkflow({ ...parsed.data, requestedBy });
      res.json({ success: true, workflow });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * GET /api/robot/software/workflow/:id
   * Get status and visual checkpoints of a software robot workflow.
   */
  app.get('/api/robot/software/workflow/:id', (req: Request, res: Response) => {
    const workflow = getSoftwareRobotWorkflow(req.params.id);
    if (!workflow) return res.status(404).json({ success: false, error: 'Software robot workflow not found.' });
    res.json({ success: true, workflow });
  });

  /**
   * GET /api/robot/software/workflows
   * List recent software robot workflows.
   */
  app.get('/api/robot/software/workflows', (req: Request, res: Response) => {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    res.json({ success: true, workflows: listSoftwareRobotWorkflows(limit) });
  });

  // ── Zero-Trust Context Poison Shield Routes ───────────────────────────────

  const poisonScanSchema = z.object({
    rawContent: z.string().min(1, 'rawContent is required'),
    source: z.enum(['web_scrape', 'pdf_invoice', 'email', 'webhook', 'user_input']).optional(),
  });

  /**
   * POST /api/security/poison-shield/scan
   * Scan and cleanse context prompt for injection or exfiltration threats.
   */
  app.post('/api/security/poison-shield/scan', async (req: Request, res: Response) => {
    try {
      const parsed = poisonScanSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.issues.map((i) => i.message).join(', ') });
      }
      const result = await scanAndCleanseContextPrompt(parsed.data);
      res.json({ success: true, scan: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ── Executive AI Workforce Cockpit Routes ─────────────────────────────────

  /**
   * GET /api/agent/cockpit/overview
   * Get real-time Enterprise Autonomy Score and consolidated cockpit telemetry.
   */
  app.get('/api/agent/cockpit/overview', (_req: Request, res: Response) => {
    const overview = getAIWorkforceCockpitOverview();
    res.json({ success: true, overview });
  });

  // ── Automated Handoff & Release Publisher Routes ─────────────────────────

  const releasePublishSchema = z.object({
    version: z.string().optional(),
    title: z.string().optional(),
    author: z.string().optional(),
    features: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        category: z.enum(['feature', 'fix', 'security', 'performance', 'automation']),
        summary: z.string(),
        agentRole: z.string().optional(),
      })
    ).optional(),
  });

  /**
   * POST /api/release/handoff/publish
   * Publish an automated release package with SHA-256 checksum and handoff docs.
   */
  app.post('/api/release/handoff/publish', async (req: Request, res: Response) => {
    try {
      const parsed = releasePublishSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.issues.map((i) => i.message).join(', ') });
      }
      const author = (req.headers['x-user-id'] as string) || parsed.data.author || 'AI Workforce Lead';
      const releasePackage = await publishAutomatedReleaseHandoff({ ...parsed.data, author });
      res.json({ success: true, releasePackage });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * GET /api/release/handoff/package/:id
   * Get details of a published release package.
   */
  app.get('/api/release/handoff/package/:id', (req: Request, res: Response) => {
    const pkg = getReleaseHandoffPackage(req.params.id);
    if (!pkg) return res.status(404).json({ success: false, error: 'Release package not found.' });
    res.json({ success: true, releasePackage: pkg });
  });

  /**
   * GET /api/release/handoff/history
   * List published release packages.
   */
  app.get('/api/release/handoff/history', (req: Request, res: Response) => {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    res.json({ success: true, releases: listReleaseHandoffPackages(limit) });
  });

  // ── Swarm Dynamic Orchestrator Routes ──────────────────────────────────────

  const swarmDispatchSchema = z.object({
    goal: z.string().min(3, 'goal is required'),
    topology: z.enum(['hierarchical', 'consensus_grid', 'sequential_pipeline']).optional(),
    domain: z.string().optional(),
    agentRoles: z.array(z.string()).optional(),
  });

  /**
   * POST /api/agent/swarm/dispatch
   * Dispatch an Agent Swarm with dynamic topology.
   */
  app.post('/api/agent/swarm/dispatch', async (req: Request, res: Response) => {
    try {
      const parsed = swarmDispatchSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.issues.map((i) => i.message).join(', ') });
      }
      const requestedBy = (req.headers['x-user-id'] as string) || 'api';
      const swarm = await dispatchAgentSwarm({ ...parsed.data, requestedBy });
      res.json({ success: true, swarm });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * GET /api/agent/swarm/execution/:id
   * Get status of a swarm execution.
   */
  app.get('/api/agent/swarm/execution/:id', (req: Request, res: Response) => {
    const swarm = getSwarmExecution(req.params.id);
    if (!swarm) return res.status(404).json({ success: false, error: 'Swarm execution not found.' });
    res.json({ success: true, swarm });
  });

  /**
   * GET /api/agent/swarm/executions
   * List recent swarm executions.
   */
  app.get('/api/agent/swarm/executions', (req: Request, res: Response) => {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    res.json({ success: true, swarms: listSwarmExecutions(limit) });
  });

  // ── Synthetic Customer Feedback Loop Routes ───────────────────────────────

  const syntheticFeedbackSchema = z.object({
    productModule: z.string().optional(),
    sampleSize: z.number().int().min(50).max(1000).optional(),
  });

  /**
   * POST /api/simulation/synthetic-feedback/run
   * Run a Synthetic Customer Feedback simulation over ICP personas.
   */
  app.post('/api/simulation/synthetic-feedback/run', async (req: Request, res: Response) => {
    try {
      const parsed = syntheticFeedbackSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.issues.map((i) => i.message).join(', ') });
      }
      const report = await runSyntheticCustomerFeedbackLoop(parsed.data);
      res.json({ success: true, report });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * GET /api/simulation/synthetic-feedback/report/:id
   * Get details of a synthetic feedback report.
   */
  app.get('/api/simulation/synthetic-feedback/report/:id', (req: Request, res: Response) => {
    const report = getSyntheticFeedbackReport(req.params.id);
    if (!report) return res.status(404).json({ success: false, error: 'Feedback report not found.' });
    res.json({ success: true, report });
  });

  /**
   * GET /api/simulation/synthetic-feedback/results
   * List recent synthetic feedback reports.
   */
  app.get('/api/simulation/synthetic-feedback/results', (req: Request, res: Response) => {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    res.json({ success: true, reports: listSyntheticFeedbackReports(limit) });
  });

  // ── Enterprise Self-Governance Routes ──────────────────────────────────────

  /**
   * GET /api/governance/strategy/overview
   * Get executive self-governance overview, AI ROI, and role OKRs.
   */
  app.get('/api/governance/strategy/overview', (_req: Request, res: Response) => {
    const overview = getEnterpriseGovernanceOverview();
    res.json({ success: true, overview });
  });

  const budgetAllocateSchema = z.object({
    totalMonthlyBudgetUSD: z.number().positive().optional(),
    priorityDomain: z.enum(['software_studio', 'growth_marketing', 'sales_crm', 'ai_sandbox']).optional(),
  });

  /**
   * POST /api/governance/budget/allocate
   * Generate optimal resource budget allocation across product lines.
   */
  app.post('/api/governance/budget/allocate', (req: Request, res: Response) => {
    try {
      const parsed = budgetAllocateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.issues.map((i) => i.message).join(', ') });
      }
      const proposal = allocateResourceBudget(parsed.data);
      res.json({ success: true, proposal });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ── Universal System Event Bus Routes ──────────────────────────────────────

  /**
   * GET /api/system/events/history
   * Get real-time system event history stream.
   */
  app.get('/api/system/events/history', (req: Request, res: Response) => {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    res.json({ success: true, events: getSystemEventHistory(limit) });
  });

  // ── AI Staff Workstation Routes ───────────────────────────────────────────

  /**
   * GET /api/agent/staff/workstations
   * Get realtime status and workload utilization across 7 AI Staff roles.
   */
  app.get('/api/agent/staff/workstations', (_req: Request, res: Response) => {
    res.json({ success: true, workstations: listAIStaffWorkstations() });
  });

  const assignTaskSchema = z.object({
    role: z.string().min(2, 'role is required'),
    taskTitle: z.string().min(3, 'taskTitle is required'),
    payload: z.record(z.string(), z.any()).optional(),
  });

  /**
   * POST /api/agent/staff/assign-task
   * Assign and execute a task directly on an AI Staff Workstation.
   */
  app.post('/api/agent/staff/assign-task', async (req: Request, res: Response) => {
    try {
      const parsed = assignTaskSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.issues.map((i) => i.message).join(', ') });
      }
      const assignedBy = (req.headers['x-user-id'] as string) || 'api';
      const result = await assignTaskToAIStaff({ ...parsed.data, assignedBy });
      res.json({ success: true, taskResult: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ── Real-Time Operational Telemetry Stream Routes ─────────────────────────

  /**
   * GET /api/system/telemetry/stream
   * Get real-time OS telemetry snapshot (uptime, memory, circuit breakers, background jobs).
   */
  app.get('/api/system/telemetry/stream', (_req: Request, res: Response) => {
    res.json({ success: true, telemetry: getOperationalTelemetryStream() });
  });

  /**
   * GET /api/system/telemetry/sse
   * Live Server-Sent Events stream for agent, robot, and swarm telemetry.
   */
  app.get('/api/system/telemetry/sse', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const unsubscribe = subscribeTelemetry((event) => {
      res.write(`event: telemetry\ndata: ${JSON.stringify(event)}\n\n`);
    });

    res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', timestamp: new Date().toISOString() })}\n\n`);

    req.on('close', () => {
      unsubscribe();
    });
  });

  const diagnosticsSnapshotSchema = z.object({
    reason: z.string().optional(),
  });

  /**
   * POST /api/system/telemetry/diagnostics-snapshot
   * Generate a 1-Click System Diagnostics Snapshot for Dev Handoff.
   */
  app.post('/api/system/telemetry/diagnostics-snapshot', async (req: Request, res: Response) => {
    try {
      const parsed = diagnosticsSnapshotSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.issues.map((i) => i.message).join(', ') });
      }
      const requestedBy = (req.headers['x-user-id'] as string) || 'api';
      const snapshot = await generateDiagnosticsSnapshot({ ...parsed.data, requestedBy });
      res.json({ success: true, diagnosticsReport: snapshot });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ── Autonomous Multi-Channel Distribution Hub Routes ─────────────────────

  const campaignPublishSchema = z.object({
    releaseVersion: z.string().optional(),
    campaignTitle: z.string().optional(),
    targetAudience: z.string().optional(),
    channels: z.array(z.enum(['telegram_channel', 'tech_blog', 'partner_webhook', 'lead_board'])).optional(),
  });

  /**
   * POST /api/distribution/campaign/publish
   * Publish an autonomous multi-channel distribution campaign.
   */
  app.post('/api/distribution/campaign/publish', async (req: Request, res: Response) => {
    try {
      const parsed = campaignPublishSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.issues.map((i) => i.message).join(', ') });
      }
      const requestedBy = (req.headers['x-user-id'] as string) || 'api';
      const campaign = await publishDistributionCampaign({ ...parsed.data, requestedBy });
      res.json({ success: true, campaign });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  const leadDemoSchema = z.object({
    leadName: z.string().min(2, 'leadName is required'),
    company: z.string().optional(),
    industry: z.string().optional(),
  });

  /**
   * POST /api/distribution/lead-demo/generate
   * Generate a personalized Lead Demo Scenario for sales prospects.
   */
  app.post('/api/distribution/lead-demo/generate', (req: Request, res: Response) => {
    try {
      const parsed = leadDemoSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.issues.map((i) => i.message).join(', ') });
      }
      const scenario = generateLeadDemoScenario(parsed.data);
      res.json({ success: true, leadDemoScenario: scenario });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * GET /api/distribution/campaigns
   * List recent multi-channel distribution campaigns.
   */
  app.get('/api/distribution/campaigns', (req: Request, res: Response) => {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    res.json({ success: true, campaigns: listDistributionCampaigns(limit) });
  });

  // ── AI Revenue & Monetization Growth Optimizer Routes ────────────────────

  /**
   * GET /api/revenue/optimization/recommendations
   * Get ARR growth recommendations, pricing tier optimizations, and MRR projections.
   */
  app.get('/api/revenue/optimization/recommendations', (_req: Request, res: Response) => {
    const overview = getRevenueOptimizationRecommendations();
    res.json({ success: true, revenueOverview: overview });
  });

  const pricingTiersSchema = z.object({
    baseMonthlyCostUSD: z.number().positive().optional(),
    targetMarginPercent: z.number().min(10).max(95).optional(),
  });

  /**
   * POST /api/revenue/pricing/tiers
   * Generate optimal SaaS pricing tiers (Starter, Growth, Enterprise).
   */
  app.post('/api/revenue/pricing/tiers', (req: Request, res: Response) => {
    try {
      const parsed = pricingTiersSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.issues.map((i) => i.message).join(', ') });
      }
      const tiers = optimizeSaaSPricingTiers(parsed.data);
      res.json({ success: true, pricingTiers: tiers });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * GET /api/mcp/sse
   * Server-Sent Events stream for Model Context Protocol (MCP) clients.
   */
  app.get('/api/mcp/sse', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const clientId = `mcp_client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    registerSSEClient({
      id: clientId,
      send: (data: string) => res.write(data),
      close: () => res.end(),
      connectedAt: new Date().toISOString(),
    });

    res.write(`event: endpoint\ndata: /api/mcp/messages?sessionId=${clientId}\n\n`);

    req.on('close', () => {
      unregisterSSEClient(clientId);
    });
  });

  /**
   * POST /api/mcp/messages
   * JSON-RPC 2.0 endpoint for MCP request handling.
   */
  app.post('/api/mcp/messages', async (req: Request, res: Response) => {
    try {
      const response = await handleMCPJSONRPCRequest(req.body);
      res.json(response);
    } catch (err: any) {
      res.status(500).json({
        jsonrpc: '2.0',
        id: req.body?.id,
        error: { code: -32000, message: err.message || 'Internal MCP server error' },
      });
    }
  });

  /**
   * GET /api/mcp/external/servers
   * List connected external MCP servers.
   */
  app.get('/api/mcp/external/servers', (_req: Request, res: Response) => {
    const servers = listExternalMCPServers();
    res.json({ success: true, servers });
  });

  /**
   * POST /api/mcp/external/connect
   * Connect to an external MCP server.
   */
  app.post('/api/mcp/external/connect', async (req: Request, res: Response) => {
    const { serverId } = req.body || {};
    if (!serverId) {
      return res.status(400).json({ success: false, error: 'serverId is required' });
    }
    const result = await connectExternalMCPServerLive(serverId);
    res.status(result.ok ? 200 : 400).json(result);
  });

  /**
   * POST /api/simulation/boardroom/session
   * Conduct a new AI Executive Boardroom strategic session.
   */
  app.post('/api/simulation/boardroom/session', async (req: Request, res: Response) => {
    try {
      const topic = req.body?.topic as string | undefined;
      const session = await conductExecutiveBoardroomSession(topic);
      res.json({ success: true, session });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * GET /api/simulation/boardroom/session/:id
   * Get specific Boardroom session minutes & resolution details.
   */
  app.get('/api/simulation/boardroom/session/:id', (req: Request, res: Response) => {
    const session = getExecutiveBoardroomSession(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    res.json({ success: true, session });
  });

  /**
   * GET /api/simulation/boardroom/sessions
   * List recent Boardroom sessions.
   */
  app.get('/api/simulation/boardroom/sessions', (req: Request, res: Response) => {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const sessions = listExecutiveBoardroomSessions(limit);
    res.json({ success: true, sessions });
  });

  /**
   * POST /api/agent/swe/auto-heal
   * Trigger an autonomous self-healing SWE mission from CI failure log summary.
   */
  app.post('/api/agent/swe/auto-heal', (req: Request, res: Response) => {
    const { ciFailureSummary, targetFiles, testCommand } = req.body || {};
    if (!ciFailureSummary) {
      return res.status(400).json({ success: false, error: 'ciFailureSummary is required' });
    }
    const result = triggerAutoHealingMission({ ciFailureSummary, targetFiles, testCommand });
    res.json({ success: true, ...result });
  });

  /**
   * GET /api/ai/edge/health
   * Check local zero-trust Edge LLM (Ollama/LMStudio) health status.
   */
  app.get('/api/ai/edge/health', async (_req: Request, res: Response) => {
    const health = await checkEdgeLlmHealth();
    res.json({ success: true, health });
  });

  /**
   * POST /api/ai/edge/generate
   * Execute zero-trust local edge LLM generation.
   */
  app.post('/api/ai/edge/generate', async (req: Request, res: Response) => {
    try {
      const { prompt, systemInstruction, model } = req.body || {};
      if (!prompt) {
        return res.status(400).json({ success: false, error: 'prompt is required' });
      }
      const result = await callEdgeLlm({ prompt, systemInstruction, model });
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * POST /api/agent/learning/broadcast
   * Broadcast a new cross-agent insight into the vector knowledge graph.
   */
  app.post('/api/agent/learning/broadcast', (req: Request, res: Response) => {
    const { sourceAgent, domain, title, content, confidence, tags } = req.body || {};
    if (!sourceAgent || !domain || !title || !content) {
      return res.status(400).json({ success: false, error: 'sourceAgent, domain, title, and content are required' });
    }
    const event = broadcastCrossAgentInsight({ sourceAgent, domain, title, content, confidence, tags });
    res.json({ success: true, event });
  });

  /**
   * GET /api/agent/learning/query
   * Query collective agent knowledge via semantic vector search.
   */
  app.get('/api/agent/learning/query', (req: Request, res: Response) => {
    const query = req.query.query as string;
    const domain = req.query.domain as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 5, 20);
    if (!query) {
      return res.status(400).json({ success: false, error: 'query parameter is required' });
    }
    const hits = queryCollectiveAgentKnowledge(query, domain, limit);
    res.json({ success: true, hits });
  });

  /**
   * POST /api/robot/multi-platform/dispatch
   * Dispatch a multi-platform (Web + Desktop + Mobile) RPA mission.
   */
  app.post('/api/robot/multi-platform/dispatch', async (req: Request, res: Response) => {
    try {
      const { title, webTarget, desktopCommand, telegramChatId } = req.body || {};
      if (!title) {
        return res.status(400).json({ success: false, error: 'title is required' });
      }
      const mission = await dispatchMultiPlatformRobotMission({ title, webTarget, desktopCommand, telegramChatId });
      res.json({ success: true, mission });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * GET /api/robot/multi-platform/mission/:id
   * Get specific multi-platform RPA mission details.
   */
  app.get('/api/robot/multi-platform/mission/:id', (req: Request, res: Response) => {
    const mission = getMultiPlatformRobotMission(req.params.id);
    if (!mission) {
      return res.status(404).json({ success: false, error: 'Mission not found' });
    }
    res.json({ success: true, mission });
  });

  /**
   * GET /api/robot/multi-platform/missions
   * List recent multi-platform RPA missions.
   */
  app.get('/api/robot/multi-platform/missions', (req: Request, res: Response) => {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const missions = listMultiPlatformRobotMissions(limit);
    res.json({ success: true, missions });
  });

  /**
   * POST /api/governance/compliance/audit
   * Execute 24/7 Compliance Doctor audit scan.
   */
  app.post('/api/governance/compliance/audit', (req: Request, res: Response) => {
    const { scanSecurity, scanAccountingVAS } = req.body || {};
    const report = runComplianceDoctorAudit({ scanSecurity, scanAccountingVAS });
    res.json({ success: true, report });
  });

  /**
   * POST /api/revenue/dynamic-pricing
   * Evaluate AI dynamic SaaS pricing models and MRR lift recommendations.
   */
  app.post('/api/revenue/dynamic-pricing', (req: Request, res: Response) => {
    const { currentMRR, activeUsers, targetMarginPercent } = req.body || {};
    const result = evaluateDynamicSaaSPricing({
      currentMRR: Number(currentMRR) || 10000,
      activeUsers: Number(activeUsers) || 300,
      targetMarginPercent: Number(targetMarginPercent) || 70,
    });
    res.json({ success: true, ...result });
  });

  /**
   * POST /api/media/campaign/generate
   * Generate multi-modal AI media campaign (video script + social post + n8n webhook payload).
   */
  app.post('/api/media/campaign/generate', async (req: Request, res: Response) => {
    try {
      const { featureTitle, targetAudience, platforms } = req.body || {};
      if (!featureTitle || !targetAudience) {
        return res.status(400).json({ success: false, error: 'featureTitle and targetAudience are required' });
      }
      const campaign = await generateProductReleaseMediaCampaign({ featureTitle, targetAudience, platforms });
      res.json({ success: true, campaign });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * POST /api/robot/vision/heal
   * Heal broken UI element selector using AI Vision OCR heuristics.
   */
  app.post('/api/robot/vision/heal', (req: Request, res: Response) => {
    const { selector, targetLabel, pageContentText } = req.body || {};
    if (!selector || !targetLabel) {
      return res.status(400).json({ success: false, error: 'selector and targetLabel are required' });
    }
    const result = healRobotActionSelector({ selector, targetLabel, pageContentText });
    res.json({ success: true, result });
  });

  /**
   * POST /api/robot/cron/register
   * Register a recurring automated robot cron job.
   */
  app.post('/api/robot/cron/register', (req: Request, res: Response) => {
    const { cronExpression, title, webTarget, desktopCommand, telegramChatId } = req.body || {};
    if (!title) {
      return res.status(400).json({ success: false, error: 'title is required' });
    }
    const job = registerRobotCronJob({ cronExpression, title, webTarget, desktopCommand, telegramChatId });
    res.json({ success: true, job });
  });

  /**
   * GET /api/robot/cron/list
   * List all active robot cron jobs.
   */
  app.get('/api/robot/cron/list', (_req: Request, res: Response) => {
    const jobs = listRobotCronJobs();
    res.json({ success: true, jobs });
  });

  /**
   * POST /api/robot/cron/trigger/:id
   * Manually trigger a robot cron job execution immediately.
   */
  app.post('/api/robot/cron/trigger/:id', async (req: Request, res: Response) => {
    try {
      const mission = await triggerRobotCronJobNow(req.params.id);
      res.json({ success: true, mission });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * POST /api/robot/v6/synthesize
   * Dynamically synthesize an RPA workflow on-the-fly from natural language goal prompt.
   */
  app.post('/api/robot/v6/synthesize', (req: Request, res: Response) => {
    const { goalPrompt } = req.body || {};
    if (!goalPrompt) {
      return res.status(400).json({ success: false, error: 'goalPrompt is required' });
    }
    const workflow = synthesizeRobotWorkflowFromGoal(goalPrompt);
    res.json({ success: true, workflow });
  });

  /**
   * POST /api/robot/v6/simulate
   * Pre-simulate workflow in Digital Twin Headless Sandbox (1,000 virtual iterations).
   */
  app.post('/api/robot/v6/simulate', (req: Request, res: Response) => {
    const { workflow, virtualIterations } = req.body || {};
    if (!workflow) {
      return res.status(400).json({ success: false, error: 'workflow is required' });
    }
    const simulation = runDigitalTwinRobotSandboxSimulation(workflow, Number(virtualIterations) || 1000);
    res.json({ success: true, simulation });
  });

  /**
   * POST /api/robot/v6/execute-fast
   * Execute local edge robot action loop with zero cloud API latency (<20ms).
   */
  app.post('/api/robot/v6/execute-fast', async (req: Request, res: Response) => {
    try {
      const { step } = req.body || {};
      if (!step) {
        return res.status(400).json({ success: false, error: 'step is required' });
      }
      const result = await executeEdgeRobotActionFast(step);
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * POST /api/ai/gemini/live-voice/start
   * Start Multimodal Gemini 2.0 Live Voice & Vision streaming session (<300ms latency).
   */
  app.post('/api/ai/gemini/live-voice/start', (req: Request, res: Response) => {
    const { audioFormat, enableVisionShare } = req.body || {};
    const session = startGeminiLiveVoiceStreamSession({ audioFormat, enableVisionShare });
    res.json({ success: true, session });
  });

  /**
   * POST /api/ai/gemini/reasoning/stream
   * Stream DeepMind Gemini Flash Thinking reasoning steps & CoT trajectory.
   */
  app.post('/api/ai/gemini/reasoning/stream', (req: Request, res: Response) => {
    const { prompt, thinkingBudgetTokens } = req.body || {};
    if (!prompt) {
      return res.status(400).json({ success: false, error: 'prompt is required' });
    }
    const trajectory = streamGeminiReasoningThoughtTrajectory({ prompt, thinkingBudgetTokens: Number(thinkingBudgetTokens) || 1024 });
    res.json({ success: true, trajectory });
  });

  /**
   * POST /api/ai/gemini/prompt/tune
   * Tune system prompt with Google AI Studio strict JSON schema validation.
   */
  app.post('/api/ai/gemini/prompt/tune', (req: Request, res: Response) => {
    const { roleName, basePrompt, strictSchema } = req.body || {};
    if (!roleName || !basePrompt) {
      return res.status(400).json({ success: false, error: 'roleName and basePrompt are required' });
    }
    const result = tuneGeminiSystemPrompt({ roleName, basePrompt, strictSchema });
    res.json({ success: true, result });
  });

  console.log('✅ Agent system routes registered: /api/agent/loop/*, /api/ai/circuit-breaker, /api/agent/performance/*, /api/agent/auto-repair/*, /api/agent/risk/*, /api/agent/consensus/*, /api/simulation/digital-twin/*, /api/robot/software/*, /api/security/poison-shield/*, /api/agent/cockpit/*, /api/release/handoff/*, /api/agent/swarm/*, /api/simulation/synthetic-feedback/*, /api/governance/*, /api/system/events/*, /api/agent/staff/*, /api/system/telemetry/*, /api/distribution/*, /api/revenue/*, /api/mcp/*, /api/simulation/boardroom/*, /api/agent/swe/auto-heal, /api/ai/edge/*, /api/agent/learning/*, /api/robot/multi-platform/*, /api/governance/compliance/*, /api/revenue/dynamic-pricing, /api/media/campaign/*, /api/robot/vision/*, /api/robot/cron/*, /api/robot/v6/*, /api/ai/gemini/*');
}
