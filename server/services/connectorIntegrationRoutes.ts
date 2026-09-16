/**
 * connectorIntegrationRoutes.ts
 * ============================================================
 * Domain Sub-Router for Telemetry, System Events, MCP Server,
 * Edge LLM, Nexus Blueprints, Distribution Hub, CRM Scout & AI ROI.
 */

import type { Express, Request, Response } from 'express';
const routeParam = (value: string | string[]) => Array.isArray(value) ? value[0] ?? '' : value;

import { getSystemEventHistory } from './crossSystemEventBus.ts';
import { getOperationalTelemetryStream, generateDiagnosticsSnapshot } from './operationalTelemetryStream.ts';
import { subscribeTelemetry } from './agentTelemetryStream.ts';
import { publishDistributionCampaign, generateLeadDemoScenario, listDistributionCampaigns } from './autonomousDistributionHub.ts';
import { handleMCPJSONRPCRequest, registerSSEClient, unregisterSSEClient } from './mcpTransportServer.ts';
import { listExternalMCPServers, connectExternalMCPServerLive } from './mcpClientGateway.ts';
import { checkEdgeLlmHealth, callEdgeLlm } from './edgeLlmAdapter.ts';
import { broadcastCrossAgentInsight, queryCollectiveAgentKnowledge } from './crossAgentLearning.ts';
import { retrieveLessons, getLearningStats, exportLessonsForFinetune, syncLessonsToSupabase, fetchLessonsFromSupabase, pruneLocalLessons } from './localLearningStore.ts';
import { exportIdeContext, generateCrossPlatformAppBlueprint, generatePcAndMobileGamePackage, generateAiEndToEndVideoSpec, getNexusSystemHealth } from './unifiedAiRobotNexus.ts';
import { scanLeadsAndProposeFollowups } from './crmAiScoutService.ts';
import { calculateAiRoiSummary } from './aiRoiAnalytics.ts';
import { meshLatencyHistogram, getEventLog, getSubscriberCount, flushEventLog } from './agentEventBus.ts';
import { cancelTask, executeParallel, executeTask, executeWorkflowDAG, getCompletedTasks, getOrchestrationMetrics, getQueuedTasks } from './glaciaOrchestrationEngine.ts';
import { queryAIActionLedger } from './aiActionLedger.ts';
import { loadAutonomyState } from './glaciaAutonomyGate.ts';

const GLACIA_TASK_TYPES = new Set([
  'skill_execute', 'vision_analyze', 'web_research', 'self_heal', 'swarm_shift',
  'telegram_command', 'multi_model_reason', 'auto_program', 'blender_render',
  'video_generate', 'banner_design',
]);
const GLACIA_TASK_PRIORITIES = new Set(['critical', 'high', 'normal', 'low']);

function isSafeGlaciaPayload(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isValidGlaciaTask(task: any): boolean {
  return Boolean(task)
    && GLACIA_TASK_TYPES.has(task.type)
    && isSafeGlaciaPayload(task.payload)
    && (task.priority === undefined || GLACIA_TASK_PRIORITIES.has(task.priority));
}

function validateGlaciaDag(nodes: unknown[]): string | null {
  const ids = new Set<string>();
  for (const node of nodes as any[]) {
    if (!isValidGlaciaTask(node) || typeof node.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(node.id)) {
      return 'Each DAG node needs a unique safe id, supported type, object payload and valid priority.';
    }
    if (ids.has(node.id)) return `Duplicate DAG node id: ${node.id}.`;
    ids.add(node.id);
  }
  for (const node of nodes as any[]) {
    if (node.dependsOn !== undefined && (!Array.isArray(node.dependsOn) || node.dependsOn.some((dependency: unknown) => typeof dependency !== 'string' || !ids.has(dependency) || dependency === node.id))) {
      return `Invalid dependency list for DAG node: ${node.id}.`;
    }
  }
  return null;
}

export function registerConnectorIntegrationRoutes(app: Express): void {
  // ── Glacia orchestration: one audited, autonomy-gated robot entrypoint ──
  app.post('/api/glacia/orchestrate/execute', async (req: Request, res: Response) => {
    const { type, payload, priority, maxRetries } = req.body || {};
    if (!isValidGlaciaTask({ type, payload, priority })) {
      return res.status(400).json({ success: false, error: 'A supported task type and object payload are required.' });
    }
    try {
      const task = await executeTask(type as any, payload, priority, Number.isInteger(maxRetries) && maxRetries >= 0 && maxRetries <= 3 ? maxRetries : 2);
      res.json({ success: task.status === 'completed', task });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Glacia orchestration failed.' });
    }
  });

  app.post('/api/glacia/orchestrate/parallel', async (req: Request, res: Response) => {
    const tasks = req.body?.tasks;
    if (!Array.isArray(tasks) || tasks.length === 0 || tasks.length > 12 || tasks.some((task) => !isValidGlaciaTask(task))) {
      return res.status(400).json({ success: false, error: 'tasks must contain 1 to 12 items.' });
    }
    try { res.json({ success: true, tasks: await executeParallel(tasks) }); }
    catch (err: any) { res.status(500).json({ success: false, error: err?.message || 'Parallel execution failed.' }); }
  });

  app.post('/api/glacia/orchestrate/dag', async (req: Request, res: Response) => {
    const nodes = req.body?.nodes;
    const validationError = Array.isArray(nodes) ? validateGlaciaDag(nodes) : 'nodes must be an array.';
    if (!Array.isArray(nodes) || nodes.length === 0 || nodes.length > 20 || validationError) {
      return res.status(400).json({ success: false, error: validationError || 'nodes must contain 1 to 20 items.' });
    }
    try {
      const result = await executeWorkflowDAG(typeof req.body?.workflowId === 'string' ? req.body.workflowId : `glacia-dag-${Date.now()}`, nodes);
      res.json({ success: result.success, result });
    } catch (err: any) { res.status(500).json({ success: false, error: err?.message || 'DAG execution failed.' }); }
  });

  app.get('/api/glacia/orchestrate/metrics', (_req: Request, res: Response) => res.json({ success: true, metrics: getOrchestrationMetrics() }));
  app.get('/api/glacia/orchestrate/tasks', (_req: Request, res: Response) => res.json({ success: true, queued: getQueuedTasks(), completed: getCompletedTasks() }));
  app.get('/api/glacia/orchestrate/trust-report', (req: Request, res: Response) => {
    const requestedLimit = Number(req.query.limit);
    const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 30;
    const audit = queryAIActionLedger({ domain: 'glacia_orchestration', limit });
    res.json({ success: true, autonomy: loadAutonomyState(), audit });
  });
  app.post('/api/glacia/orchestrate/cancel', (req: Request, res: Response) => {
    const taskId = typeof req.body?.taskId === 'string' ? req.body.taskId : '';
    const success = Boolean(taskId) && cancelTask(taskId);
    res.status(success ? 200 : 404).json({ success });
  });

  // ── System Events & Telemetry ──
  app.get('/api/system/events/history', (_req: Request, res: Response) => {
    res.json({ success: true, events: getSystemEventHistory() });
  });

  app.get('/api/system/telemetry/stream', (_req: Request, res: Response) => {
    res.json({ success: true, telemetry: getOperationalTelemetryStream() });
  });

  app.get('/api/system/telemetry/diagnostics', (_req: Request, res: Response) => {
    res.json({ success: true, diagnostics: generateDiagnosticsSnapshot() });
  });

  app.get('/api/agent/mesh/metrics', (_req: Request, res: Response) => {
    res.json({ success: true, metrics: meshLatencyHistogram(), subscribers: getSubscriberCount(), logSize: getEventLog(1000).length });
  });

  app.post('/api/agent/mesh/flush', async (_req: Request, res: Response) => {
    await flushEventLog();
    res.json({ success: true });
  });

  app.get('/api/system/telemetry/subscribe', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    const unsubscribe = subscribeTelemetry((data) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    });
    req.on('close', () => {
      unsubscribe();
    });
  });

  // ── Distribution Hub ──
  app.post('/api/distribution/campaign/publish', (req: Request, res: Response) => {
    const { title, channels, payload } = req.body || {};
    if (!title) return res.status(400).json({ success: false, error: 'title is required' });
    const campaign = publishDistributionCampaign({ campaignTitle: title, channels: channels || [] });
    res.json({ success: true, campaign });
  });

  app.post('/api/distribution/demo/generate', (req: Request, res: Response) => {
    const { targetAudience, featureName } = req.body || {};
    res.json({ success: true, demo: generateLeadDemoScenario({ leadName: targetAudience || 'B2B', company: featureName || 'LedgerFlow' }) });
  });

  app.get('/api/distribution/campaigns', (_req: Request, res: Response) => {
    res.json({ success: true, campaigns: listDistributionCampaigns() });
  });

  // ── MCP Transport & Client Gateway ──
  app.post('/api/mcp/jsonrpc', async (req: Request, res: Response) => {
    try {
      const response = await handleMCPJSONRPCRequest(req.body);
      res.json(response);
    } catch (err: any) {
      res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: err.message }, id: req.body?.id || null });
    }
  });

  app.get('/api/mcp/sse', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    const clientId = String(Date.now());
    registerSSEClient({
      id: clientId,
      send: (data: string) => res.write(data),
      close: () => res.end(),
      connectedAt: new Date().toISOString(),
    });
    req.on('close', () => {
      unregisterSSEClient(clientId);
    });
  });

  app.get('/api/mcp/servers/external', (_req: Request, res: Response) => {
    res.json({ success: true, servers: listExternalMCPServers() });
  });

  app.post('/api/mcp/servers/external/connect', async (req: Request, res: Response) => {
    try {
      const { serverId } = req.body || {};
      const status = await connectExternalMCPServerLive(serverId);
      res.json({ success: true, status });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ── Edge LLM Adapter ──
  app.get('/api/ai/edge/health', async (_req: Request, res: Response) => {
    const health = await checkEdgeLlmHealth();
    res.json({ success: true, health });
  });

  app.post('/api/ai/edge/call', async (req: Request, res: Response) => {
    try {
      const { prompt } = req.body || {};
      if (!prompt) return res.status(400).json({ success: false, error: 'prompt is required' });
      const result = await callEdgeLlm({ prompt });
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ── Cross-Agent Learning & Local Store ──
  app.post('/api/agent/learning/broadcast', (req: Request, res: Response) => {
    const { sourceAgent, insightTopic, payload } = req.body || {};
    broadcastCrossAgentInsight({
      sourceAgent: sourceAgent || 'agent_general',
      domain: 'general',
      title: insightTopic || 'general',
      content: JSON.stringify(payload || {}),
    });
    res.json({ success: true, message: 'Insight broadcasted' });
  });

  app.get('/api/agent/learning/query', (req: Request, res: Response) => {
    const topic = req.query.topic as string || '';
    res.json({ success: true, insights: queryCollectiveAgentKnowledge(topic) });
  });

  app.get('/api/agent/learning', (req: Request, res: Response) => {
    const domain = req.query.domain as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    res.json({ success: true, lessons: retrieveLessons('', domain, limit), stats: getLearningStats() });
  });

  // ── Unified AI Robot Nexus ──
  app.get('/api/nexus/health', (_req: Request, res: Response) => {
    res.json({ success: true, health: getNexusSystemHealth() });
  });

  app.get('/api/nexus/ide-export', (_req: Request, res: Response) => {
    res.json({ success: true, context: exportIdeContext('vscode') });
  });

  app.post('/api/nexus/blueprint/app', (req: Request, res: Response) => {
    const { appType, features, targetPlatforms } = req.body || {};
    res.json({ success: true, blueprint: generateCrossPlatformAppBlueprint({
      appName: 'ledgerflow-app',
      appType: appType || 'saas_web_desktop',
      includeMobile: (targetPlatforms || []).includes('android'),
    }) });
  });

  app.post('/api/nexus/blueprint/game', async (req: Request, res: Response) => {
    try {
      const { genre, artStyle, mechanics } = req.body || {};
      const pkg = await generatePcAndMobileGamePackage({
        gameTitle: 'LedgerFlow Game',
        genre: genre as any,
        themeDescription: artStyle || 'pixel',
      });
      res.json({ success: true, package: pkg });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/nexus/blueprint/video', async (req: Request, res: Response) => {
    try {
      const { topic, scriptStyle, durationSec } = req.body || {};
      const spec = await generateAiEndToEndVideoSpec({ topic: topic || 'overview', targetDurationSec: Number(durationSec) || 60 });
      res.json({ success: true, spec });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ── CRM Scout & AI ROI Analytics ──
  app.get('/api/crm/ai-scout/suggestions', (_req: Request, res: Response) => {
    res.json({ success: true, suggestions: scanLeadsAndProposeFollowups() });
  });

  app.get('/api/analytics/ai-roi', (_req: Request, res: Response) => {
    res.json({ success: true, roi: calculateAiRoiSummary() });
  });
}
