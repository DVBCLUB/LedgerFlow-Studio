import type { Express, Request, Response } from 'express';
import { addLessonLearned, searchLongTermMemory } from '../agentLongTermMemory.ts';
import { queryKnowledgeRAG, addKnowledgeDocument, listKnowledgeDocuments } from '../knowledgeRAGPipeline.ts';
import { recordTaskLearning, listLearningInsights, getLearningDashboard } from '../continuousLearningEngine.ts';
import { listRolePolicies, canAccessWorkspace } from '../rbacEngine.ts';
import { getHarvestedKnowledgeInsights, approveHarvestedInsight, triggerAutoHarvestBatch } from '../autonomousKnowledgeHarvester.ts';
import { getSemanticSearchData, semanticSearch } from '../semanticRagSearchEngine.ts';
import { notionObsidianKnowledgeBridgeEngine } from '../notionObsidianKnowledgeBridgeEngine.ts';

function successResponse(res: Response, data: any) {
  return res.json({ success: true, ...data });
}

function errorResponse(res: Response, err: unknown, status = 500) {
  const message = err instanceof Error ? err.message : String(err);
  return res.status(status).json({ success: false, error: message });
}

export function registerAiKnowledgeRoutes(app: Express): void {
  app.post('/api/dormant/agent-memory/save', async (req: Request, res: Response) => {
    try {
      const { category, topic, insight, recommendedAction, confidence, tags } = req.body || {};
      if (!topic || !insight || !recommendedAction) {
        return res.status(400).json({ success: false, error: 'Missing topic, insight, or recommendedAction.' });
      }
      const lesson = await addLessonLearned({
        category: category || 'general',
        topic,
        insight,
        recommendedAction,
        confidence,
        tags,
      });
      return successResponse(res, { lesson });
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  app.get('/api/dormant/agent-memory/search', async (req: Request, res: Response) => {
    try {
      const query = String(req.query.q || '');
      const results = await searchLongTermMemory(query);
      return successResponse(res, { results });
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  // 🟢 11. AI Code Diff Engine API

  app.post('/api/dormant/knowledge/rag-query', (req: Request, res: Response) => {
    try {
      const { query, category, topK } = req.body || {};
      if (!query) return res.status(400).json({ success: false, error: 'Missing search query.' });
      const result = queryKnowledgeRAG(String(query), category, Number(topK || 3));
      return successResponse(res, { result });
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  // 47. List / Add Knowledge Documents

  app.get('/api/dormant/knowledge/documents', (req: Request, res: Response) => {
    try {
      const category = req.query.category as any;
      const documents = listKnowledgeDocuments(category);
      return successResponse(res, { documents, count: documents.length });
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  app.post('/api/dormant/knowledge/documents', async (req: Request, res: Response) => {
    try {
      const { title, category, content, tags, source } = req.body || {};
      if (!title || !content) return res.status(400).json({ success: false, error: 'Missing title or content.' });
      const doc = await addKnowledgeDocument({ title, category: category || 'company_sop', content, tags: tags || [], source: source || 'User' });
      return successResponse(res, { document: doc });
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  // 48. Continuous Learning Insights & Dashboard

  app.get('/api/dormant/learning/dashboard', (_req: Request, res: Response) => {
    try {
      const dashboard = getLearningDashboard();
      const insights = listLearningInsights();
      return successResponse(res, { dashboard, insights });
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  app.post('/api/dormant/learning/record', async (req: Request, res: Response) => {
    try {
      const { source, agentRole, topic, lessonSummary, actionableRule, confidence } = req.body || {};
      if (!agentRole || !topic || !lessonSummary) {
        return res.status(400).json({ success: false, error: 'Missing required learning payload fields.' });
      }
      const insight = await recordTaskLearning({ source: source || 'agent_run', agentRole, topic, lessonSummary, actionableRule: actionableRule || lessonSummary, confidence });
      return successResponse(res, { insight });
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 🟢 PHASE D — RBAC Policy APIs
  // ═══════════════════════════════════════════════════════════════════════════

  // 49. List RBAC Policies & Check Access

  app.get('/api/dormant/rbac/policies', (_req: Request, res: Response) => {
    try {
      const policies = listRolePolicies();
      return successResponse(res, { policies });
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  app.post('/api/dormant/rbac/check-access', (req: Request, res: Response) => {
    try {
      const { role, workspace } = req.body || {};
      if (!role || !workspace) return res.status(400).json({ success: false, error: 'Missing role or workspace.' });
      const allowed = canAccessWorkspace(role, workspace);
      return successResponse(res, { allowed, role, workspace });
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 🟢 PHASE F — Multi-Factory Orchestration & Quality Gate APIs
  // ═══════════════════════════════════════════════════════════════════════════

  // 50. Multi-Factory Pipeline List & Trigger

  app.get('/api/dormant/knowledge/harvested', (_req: Request, res: Response) => {
    try {
      return successResponse(res, { insights: getHarvestedKnowledgeInsights() });
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  app.post('/api/dormant/knowledge/harvest-batch', (_req: Request, res: Response) => {
    try {
      const result = triggerAutoHarvestBatch();
      return successResponse(res, result);
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  app.post('/api/dormant/knowledge/approve-harvest', (req: Request, res: Response) => {
    try {
      const { id } = req.body || {};
      if (!id) {
        return res.status(400).json({ success: false, error: "Missing 'id'." });
      }
      const result = approveHarvestedInsight(id);
      return successResponse(res, result);
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  // 71. AI Employee Probation & Benchmarking Engine

  app.get('/api/dormant/rag-search/index', (_req: Request, res: Response) => {
    try { return successResponse(res, getSemanticSearchData()); } catch (err) { return errorResponse(res, err); }
  });

  app.post('/api/dormant/rag-search/query', (req: Request, res: Response) => {
    try {
      const { query, corpus } = req.body || {};
      if (!query) return res.status(400).json({ success: false, error: "Missing 'query'." });
      return successResponse(res, semanticSearch(query, corpus ?? 'all'));
    } catch (err) { return errorResponse(res, err); }
  });

  // 🟢 125. PWA Offline Sync

  app.get('/api/dormant/knowledge-bridge/overview', (_req: Request, res: Response) => {
    try { return successResponse(res, notionObsidianKnowledgeBridgeEngine.getBridgeOverview()); } catch (err) { return errorResponse(res, err); }
  });

  app.post('/api/dormant/knowledge-bridge/sync', (_req: Request, res: Response) => {
    try { return successResponse(res, notionObsidianKnowledgeBridgeEngine.triggerBiDirectionalSync()); } catch (err) { return errorResponse(res, err); }
  });

  // 🟢 186. Real-Time Enterprise Telemetry Stream & WebSocket Hub (Pillar 119)
}
