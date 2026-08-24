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

export function registerConnectorIntegrationRoutes(app: Express): void {
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
