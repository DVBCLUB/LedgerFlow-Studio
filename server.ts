import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { callAI, streamAI, checkAIProxyHealth, type ChatMessage, type CallAIOptions } from "./server/services/aiClient";
import { createAIKey, deleteAIKey, exportAIKeyBackup, getAIVaultSecurityStatus, getSupportedAIProviders, importAIKeyBackup, listAIKeys, lockAIVault, setupAIVaultPassphrase, unlockAIVault, updateAIKey } from "./server/services/aiKeyVault";
import { diagnoseAIRouter, testAIKey } from "./server/services/aiRouter";
import { runAIPreflight } from "./server/services/aiDoctor";
import { clearAIUsageLogs, readAIUsageLogs } from "./server/services/aiUsageLog";
import { disarmAIVaultAutoLock, getAIVaultAutoLockStatus, markAIVaultActivity, updateAIVaultAutoLockConfig } from "./server/services/aiVaultAutoLock";
import { appendIntegrationEvent, clearIntegrationEvents, listIntegrationConnectors, readIntegrationEvents, testIntegrationConnector, updateIntegrationConnector } from "./server/services/integrationRegistry";
import { createApprovedGitHubChangeRequest, createGitHubIssue, getGitHubPullRequestDigest, getGitHubSummary, getGitHubWorkflowRunJobs, requestCloseGitHubPullRequest } from "./server/services/githubConnector";
import { getGitHubWorkflowRunArtifacts } from "./server/services/githubArtifacts";
import { getLocalToolSummary, openLocalTool } from "./server/services/localToolConnector";
import { isSupabaseServerAuthConfigured, verifyLocalAdminToken, attachOptionalUser } from "./server/services/authService";
import { AGENT_ROLES, executeAgentTask, isAgentRole } from "./server/services/agentExecutor";
import { getZaloFollowers, sendZaloTextMessage, testZaloConnection } from "./server/services/zaloConnector";
import { startPipeline, PIPELINE_TEMPLATES, resumePipeline, type PipelineType } from './server/services/pipelineOrchestrator';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const databaseSaveSchema = z.object({ payload: z.record(z.string(), z.any()) });
const geminiGenerateSchema = z.object({ prompt: z.string().min(1, "Prompt cannot be empty"), model: z.string().optional(), history: z.array(z.object({ role: z.enum(["user", "model"]), text: z.string().optional() })).optional(), systemInstruction: z.string().optional(), file: z.object({ data: z.string(), mimeType: z.string() }).optional() });
const aiProviderSchema = z.enum(["gemini", "groq", "openrouter", "anthropic", "ollama"]);
const aiKeyCreateSchema = z.object({ provider: aiProviderSchema, label: z.string().optional(), apiKey: z.string().optional(), model: z.string().optional(), baseUrl: z.string().optional(), priority: z.number().optional(), enabled: z.boolean().optional() });
const aiKeyUpdateSchema = aiKeyCreateSchema.partial().extend({ lastStatus: z.enum(["ok", "error", "quota", "untested"]).optional(), lastError: z.string().optional() });
const aiBackupExportSchema = z.object({ passphrase: z.string().min(8, "Mật khẩu backup phải có ít nhất 8 ký tự.") });
const aiBackupImportSchema = z.object({ passphrase: z.string().min(8, "Mật khẩu backup phải có ít nhất 8 ký tự."), mode: z.enum(["merge", "replace"]).default("merge"), backup: z.object({ version: z.literal(1), app: z.literal("LedgerFlow Studio"), exportedAt: z.string(), kdf: z.literal("scrypt"), cipher: z.literal("aes-256-gcm"), salt: z.string(), iv: z.string(), tag: z.string(), payload: z.string(), note: z.string() }) });
const aiVaultPassphraseSchema = z.object({ passphrase: z.string().min(8, "Mật khẩu AI Vault phải có ít nhất 8 ký tự.") });
const aiVaultAutoLockSchema = z.object({ enabled: z.boolean().optional(), timeoutMinutes: z.number().min(1).max(1440).optional() });
const integrationPatchSchema = z.object({ enabled: z.boolean().optional(), status: z.enum(["connected", "local", "manual", "planned", "error"]).optional(), priority: z.enum(["P0", "P1", "P2", "P3"]).optional(), url: z.string().optional(), localCommand: z.string().optional(), notes: z.string().optional() });
const integrationEventSchema = z.object({ type: z.enum(["status", "test", "config", "handoff", "note"]).default("note"), level: z.enum(["info", "success", "warning", "error"]).default("info"), message: z.string().min(1) });
const githubIssueSchema = z.object({ repo: z.string().optional(), title: z.string().min(3, "Tiêu đề issue phải có ít nhất 3 ký tự."), body: z.string().optional(), labels: z.array(z.string()).optional() });
const githubApprovedChangeSchema = z.object({ repo: z.string().optional(), title: z.string().min(3, "Tiêu đề PR phải có ít nhất 3 ký tự."), summary: z.string().min(10, "Summary phải đủ rõ để review."), approvalPhrase: z.literal("APPROVE AI GITHUB PUSH"), baseBranch: z.string().optional(), branchName: z.string().optional(), draft: z.boolean().optional(), files: z.array(z.object({ path: z.string().min(1), content: z.string() })).min(1).max(10) });
const githubClosePullRequestSchema = z.object({ repo: z.string().optional(), reason: z.string().min(10, "Reason đóng PR phải đủ rõ để audit."), rollbackNote: z.string().min(10, "Rollback note phải đủ rõ để review."), approvalPhrase: z.literal("APPROVE AI GITHUB CLOSE") });
const localToolOpenSchema = z.object({ tool: z.enum(["vscode", "cursor", "github", "actions"]) });
const localAuthSchema = z.object({ token: z.string().min(1, "LOCAL_ADMIN_TOKEN is required.") });
const agentExecuteSchema = z.object({ taskId: z.string().min(1, "taskId is required"), agentRole: z.string().refine(isAgentRole, "Invalid agentRole"), prompt: z.string().min(1, "prompt is required"), context: z.record(z.string(), z.unknown()).optional() });
const zaloSendSchema = z.object({ userId: z.string().min(1, "userId is required"), text: z.string().min(1, "text is required").max(2000, "text is too long") });
type GeminiGenerateInput = z.infer<typeof geminiGenerateSchema>;

function getSimulatedMarketSurveyResponse(niche: string, direction?: string) { return { summary: `Mô phỏng nghiên cứu thị trường cho: ${niche}.`, metrics: { pricingPreferred: [], painPoints: [], channels: [] }, personas: [], gaps: [], competitors: [], blueprint: { direction: direction || "B2D Tool" }, sources: [{ title: "Fallback simulator", url: "local" }] }; }
function resolveProxyModel(model?: string): NonNullable<CallAIOptions["model"]> { if (!model) return "ai-assistant"; const normalized = model.toLowerCase(); return normalized.includes("pro") || normalized.includes("3.5") || normalized.includes("advanced") ? "ai-assistant-pro" : "ai-assistant"; }
function buildAIMessages({ prompt, history, systemInstruction, file }: GeminiGenerateInput): ChatMessage[] { const messages: ChatMessage[] = []; if (systemInstruction) messages.push({ role: "system", content: systemInstruction }); if (history) for (const msg of history) if (msg.text) messages.push({ role: msg.role === "user" ? "user" : "assistant", content: msg.text }); messages.push({ role: "user", content: file ? `${prompt}\n\n[Attached ${file.mimeType} as base64; current text gateway does not parse binary content directly.]` : prompt }); return messages; }
function isRateLimitOrQuotaError(err: any): boolean { const text = `${err?.status || ""} ${err?.message || ""} ${JSON.stringify(err?.body || {})}`.toLowerCase(); return text.includes("429") || text.includes("quota") || text.includes("resource_exhausted") || text.includes("rate limit") || text.includes("too many requests"); }

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT ?? 3000);
  app.set("trust proxy", 1);
  app.use((req, res, next) => { res.setHeader("X-Content-Type-Options", "nosniff"); res.setHeader("X-Frame-Options", "DENY"); res.setHeader("Referrer-Policy", "no-referrer"); res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), clipboard-read=(), clipboard-write=(self)"); res.setHeader("Cross-Origin-Opener-Policy", "same-origin"); res.setHeader("Cross-Origin-Resource-Policy", "same-origin"); if (req.path.startsWith("/api/")) res.setHeader("Cache-Control", "no-store"); next(); });
  app.use(express.json({ limit: "15mb" }));
  app.use((err: any, req: any, res: any, next: any) => {
    if (err instanceof SyntaxError && "body" in err) {
      console.error("Bad JSON:", err.message);
      return res.status(400).send({ success: false, error: "Malformed JSON in request." });
    }
    next();
  });
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));
  app.use((req, res, next) => { const allowedOrigins = ["http://localhost:3000", "http://127.0.0.1:3000", "http://0.0.0.0:3000"]; const origin = req.headers.origin; if (origin) { const isAllowed = allowedOrigins.includes(origin) || origin.endsWith(".run.app") || /https:\/\/ais-.*\.run\.app/.test(origin); if (isAllowed) res.setHeader("Access-Control-Allow-Origin", origin); } res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS"); res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Local-Auth"); if (req.method === "OPTIONS") res.sendStatus(204); else next(); });
  const apiLimiter = rateLimit({ windowMs: 60_000, max: 30, message: { error: "Bạn đã đạt giới hạn yêu cầu/phút. Vui lòng thử lại sau.", isRateLimit: true }, standardHeaders: true, legacyHeaders: false, validate: { trustProxy: false } });
  app.use("/api/gemini/", apiLimiter); app.use("/api/ai/", apiLimiter); app.use("/api/integrations/", apiLimiter); app.use("/api/agents/", apiLimiter);
  app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date() }));
  app.get("/api/auth/config", (_req, res) => res.json({ success: true, supabaseServerAuth: isSupabaseServerAuthConfigured(), localAuth: Boolean(process.env.LOCAL_ADMIN_TOKEN) }));
  app.post("/api/auth/local-session", (req, res) => { const parsed = localAuthSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") }); if (!process.env.LOCAL_ADMIN_TOKEN) return res.status(503).json({ success: false, error: "LOCAL_ADMIN_TOKEN is not configured on this machine." }); if (!verifyLocalAdminToken(parsed.data.token)) return res.status(401).json({ success: false, error: "Invalid local token." }); res.json({ success: true, session: { mode: "local", loginAt: new Date().toISOString() } }); });

  const STORAGE_FILE = path.join(process.cwd(), "db_storage.json");
  app.get("/api/db/load", async (req, res) => { try { if (!fs.existsSync(STORAGE_FILE)) return res.json({ success: true, data: {} }); res.json({ success: true, data: JSON.parse(await fs.promises.readFile(STORAGE_FILE, "utf-8")) }); } catch (err: any) { res.status(500).json({ success: false, error: err.message || "Failed to load database state." }); } });
  app.post("/api/db/save", async (req, res) => { try { const parsed = databaseSaveSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") }); await fs.promises.writeFile(STORAGE_FILE, JSON.stringify(parsed.data.payload, null, 2), "utf-8"); res.json({ success: true, message: "Database synchronized successfully on the server." }); } catch (err: any) { res.status(500).json({ success: false, error: err.message || "Failed to save database state." }); } });

  app.get("/api/integrations", async (req, res) => { try { res.json({ success: true, connectors: await listIntegrationConnectors(), events: await readIntegrationEvents(30) }); } catch (err: any) { res.status(500).json({ success: false, error: err.message || "Failed to list integrations." }); } });
  app.patch("/api/integrations/:id", async (req, res) => { try { const parsed = integrationPatchSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") }); res.json({ success: true, connector: await updateIntegrationConnector(req.params.id, parsed.data) }); } catch (err: any) { res.status(400).json({ success: false, error: err.message || "Failed to update integration." }); } });
  app.post("/api/integrations/:id/test", async (req, res) => { try { res.json({ success: true, connector: await testIntegrationConnector(req.params.id), events: await readIntegrationEvents(30) }); } catch (err: any) { res.status(400).json({ success: false, error: err.message || "Failed to test integration." }); } });
  app.post("/api/integrations/:id/events", async (req, res) => { try { const parsed = integrationEventSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") }); res.json({ success: true, event: await appendIntegrationEvent({ connectorId: req.params.id, ...parsed.data }) }); } catch (err: any) { res.status(400).json({ success: false, error: err.message || "Failed to append integration event." }); } });
  app.get("/api/integrations/events", async (req, res) => { try { res.json({ success: true, events: await readIntegrationEvents(Number(req.query.limit ?? 100)) }); } catch (err: any) { res.status(500).json({ success: false, error: err.message || "Failed to read integration events." }); } });
  // SSE stream for integration events (poll-backed)
  app.get('/api/integrations/events/stream', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    let lastId: string | null = null;
    let mounted = true;

    const iv = setInterval(async () => {
      if (!mounted) return;
      try {
        const events = await readIntegrationEvents(50);
        // send any events newer than lastId
        const toSend = lastId ? events.filter(e => e.id !== lastId).slice(0, 20) : events.slice(0, 20);
        if (toSend.length) {
          toSend.reverse().forEach((ev) => {
            res.write(`data: ${JSON.stringify(ev)}\n\n`);
          });
          lastId = toSend[0].id;
        }
      } catch (e) {
        // ignore
      }
    }, 1500);

    req.on('close', () => { mounted = false; clearInterval(iv); });
  });
  app.delete("/api/integrations/events", async (req, res) => { try { await clearIntegrationEvents(); res.json({ success: true }); } catch (err: any) { res.status(500).json({ success: false, error: err.message || "Failed to clear integration events." }); } });
  app.get("/api/integrations/github/summary", async (req, res) => { try { const summary = await getGitHubSummary(typeof req.query.repo === "string" ? req.query.repo : undefined); await appendIntegrationEvent({ connectorId: "github", type: "test", level: "success", message: `GitHub summary loaded for ${summary.repo}.` }); res.json({ success: true, summary }); } catch (err: any) { await appendIntegrationEvent({ connectorId: "github", type: "test", level: "error", message: err.message || "GitHub summary failed." }).catch(() => undefined); res.status(400).json({ success: false, error: err.message || "Failed to load GitHub summary." }); } });
  app.get("/api/integrations/github/prs/:pullNumber/digest", async (req, res) => { try { const pullNumber = Number(req.params.pullNumber); const result = await getGitHubPullRequestDigest(typeof req.query.repo === "string" ? req.query.repo : undefined, pullNumber); await appendIntegrationEvent({ connectorId: "github", type: "test", level: result.safety.touchesBlockedPath ? "warning" : "success", message: `PR digest loaded for #${pullNumber}. Files: ${result.files.length}.` }); res.json({ success: true, result }); } catch (err: any) { await appendIntegrationEvent({ connectorId: "github", type: "test", level: "error", message: err.message || "GitHub PR digest failed." }).catch(() => undefined); res.status(400).json({ success: false, error: err.message || "Failed to load PR digest." }); } });
  app.get("/api/integrations/github/runs/:runId/jobs", async (req, res) => { try { const runId = Number(req.params.runId); const result = await getGitHubWorkflowRunJobs(typeof req.query.repo === "string" ? req.query.repo : undefined, runId); await appendIntegrationEvent({ connectorId: "github", type: "test", level: result.hasFailures ? "warning" : "success", message: `Workflow jobs inspected for run ${runId}. Failed jobs: ${result.failedJobs.length}.` }); res.json({ success: true, result }); } catch (err: any) { await appendIntegrationEvent({ connectorId: "github", type: "test", level: "error", message: err.message || "GitHub workflow jobs failed." }).catch(() => undefined); res.status(400).json({ success: false, error: err.message || "Failed to inspect workflow jobs." }); } });
  app.get("/api/integrations/github/runs/:runId/artifacts", async (req, res) => { try { const runId = Number(req.params.runId); const result = await getGitHubWorkflowRunArtifacts(typeof req.query.repo === "string" ? req.query.repo : undefined, runId); await appendIntegrationEvent({ connectorId: "github", type: "test", level: result.hasArtifacts ? "success" : "warning", message: `Workflow artifacts inspected for run ${runId}. Artifacts: ${result.artifacts.length}.` }); res.json({ success: true, result }); } catch (err: any) { await appendIntegrationEvent({ connectorId: "github", type: "test", level: "error", message: err.message || "GitHub workflow artifacts failed." }).catch(() => undefined); res.status(400).json({ success: false, error: err.message || "Failed to inspect workflow artifacts." }); } });
  app.post("/api/integrations/github/issues", async (req, res) => { try { const parsed = githubIssueSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") }); const issue = await createGitHubIssue(parsed.data); await appendIntegrationEvent({ connectorId: "github", type: "handoff", level: "success", message: `Created GitHub issue #${issue.number}: ${issue.title}` }); res.json({ success: true, issue }); } catch (err: any) { await appendIntegrationEvent({ connectorId: "github", type: "handoff", level: "error", message: err.message || "Create GitHub issue failed." }).catch(() => undefined); res.status(400).json({ success: false, error: err.message || "Failed to create GitHub issue." }); } });
  app.post("/api/integrations/github/approved-change-request", async (req, res) => { try { const parsed = githubApprovedChangeSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") }); const result = await createApprovedGitHubChangeRequest(parsed.data); await appendIntegrationEvent({ connectorId: "github", type: "handoff", level: "success", message: `Created draft PR #${result.pullRequest.number} on ${result.branch}.` }); res.json({ success: true, result }); } catch (err: any) { await appendIntegrationEvent({ connectorId: "github", type: "handoff", level: "error", message: err.message || "Approved GitHub push failed." }).catch(() => undefined); res.status(400).json({ success: false, error: err.message || "Failed to create approved GitHub change request." }); } });
  app.post("/api/integrations/github/prs/:pullNumber/request-close", async (req, res) => { try { const pullNumber = Number(req.params.pullNumber); const parsed = githubClosePullRequestSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") }); const result = await requestCloseGitHubPullRequest({ ...parsed.data, pullNumber }); await appendIntegrationEvent({ connectorId: "github", type: "handoff", level: "success", message: `Closed GitHub PR #${result.pullRequest.number} on ${result.repo}.` }); res.json({ success: true, result }); } catch (err: any) { await appendIntegrationEvent({ connectorId: "github", type: "handoff", level: "error", message: err.message || "Close GitHub PR failed." }).catch(() => undefined); res.status(400).json({ success: false, error: err.message || "Failed to close GitHub pull request." }); } });
  app.get("/api/integrations/local-tools/summary", async (_req, res) => { try { res.json({ success: true, summary: getLocalToolSummary() }); } catch (err: any) { res.status(500).json({ success: false, error: err.message || "Failed to load local tool summary." }); } });
  app.post("/api/integrations/local-tools/open", async (req, res) => { try { const parsed = localToolOpenSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") }); const result = await openLocalTool(parsed.data.tool); await appendIntegrationEvent({ connectorId: "local-tools", type: "handoff", level: result.success ? "success" : "warning", message: result.message }); res.json({ success: result.success, message: result.message }); } catch (err: any) { res.status(400).json({ success: false, error: err.message || "Failed to open local tool." }); } });

  app.get("/api/integrations/zalo/test", async (_req, res) => { const result = await testZaloConnection(); await appendIntegrationEvent({ connectorId: "zalo-oa", type: "test", level: result.connected ? "success" : "error", message: result.connected ? `Zalo OA connected: ${result.oaInfo?.name || "Official Account"}.` : result.error || "Zalo OA test failed." }).catch(() => undefined); res.status(result.connected ? 200 : 400).json({ success: result.connected, ...result }); });
  app.get("/api/integrations/zalo/followers", async (req, res) => { try { const offset = Math.max(0, Number(req.query.offset || 0)); const count = Math.max(1, Math.min(50, Number(req.query.count || 50))); const result = await getZaloFollowers(offset, count); res.status(result.success ? 200 : 400).json(result); } catch (err: any) { res.status(500).json({ success: false, error: err.message || "Failed to read Zalo followers." }); } });
  app.post("/api/integrations/zalo/send", async (req, res) => { try { const parsed = zaloSendSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") }); const result = await sendZaloTextMessage(parsed.data.userId, parsed.data.text); await appendIntegrationEvent({ connectorId: "zalo-oa", type: "handoff", level: result.success ? "success" : "error", message: result.success ? `Zalo message sent to ${parsed.data.userId}.` : result.error || "Zalo send failed." }).catch(() => undefined); res.status(result.success ? 200 : 400).json(result); } catch (err: any) { res.status(500).json({ success: false, error: err.message || "Failed to send Zalo message." }); } });

  app.get("/api/agents/roles", (_req, res) => res.json({ success: true, roles: AGENT_ROLES }));
  app.post("/api/agents/execute", async (req, res) => { try { const parsed = agentExecuteSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") }); const result = await executeAgentTask({ ...parsed.data, userId: "local" }); res.status(result.success ? 200 : 500).json(result); } catch (err: any) { res.status(500).json({ success: false, error: err.message || "Agent execution failed." }); } });

  app.get('/api/pipelines/types', (_req, res) => {
    res.json({
      success: true,
      types: Object.entries(PIPELINE_TEMPLATES).map(([id, template]) => ({
        id,
        name: template.name,
        steps: template.steps.map((step) => ({
          name: step.name,
          agentRole: step.agentRole,
          requiresApproval: step.requiresApproval,
        })),
      })),
    });
  });

  // attach optional user info (Supabase Bearer or local X-Local-Auth) for pipeline routes
  app.use('/api/pipelines', attachOptionalUser as any);

  app.get('/api/pipelines', async (req, res) => {
    try {
      const userId = (req as any).user?.id || 'local';
      const sb = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '');
      const { data, error } = await sb
        .from('agent_pipelines')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      res.json({ success: true, pipelines: data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to list pipelines.' });
    }
  });

  app.post('/api/pipelines/start', async (req, res) => {
    try {
      const { pipelineType, input } = req.body;
      if (!pipelineType || !(pipelineType in PIPELINE_TEMPLATES)) {
        return res.status(400).json({ success: false, error: 'Invalid pipelineType' });
      }
      const userId = (req as any).user?.id || 'local';
      const pipeline = await startPipeline(pipelineType as PipelineType, input || {}, userId);
      res.json({ success: true, pipeline });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to start pipeline.' });
    }
  });

  app.get('/api/pipelines/:id', async (req, res) => {
    try {
      const sb = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '');
      const { data, error } = await sb.from('agent_pipelines').select('*').eq('id', req.params.id).single();
      if (error) return res.status(404).json({ success: false, error: error.message || 'Pipeline not found.' });
      res.json({ success: true, pipeline: data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to fetch pipeline.' });
    }
  });

  // Per-pipeline SSE stream for live step output chunks
  // Keep a registry of SSE clients per pipeline id to push realtime updates
  const pipelineSseClients: Map<string, Set<import('express').Response>> = new Map();

  // Setup a Supabase realtime channel to listen for updates to agent_pipelines
  // We'll keep a small cache of last-known steps per pipeline and emit only deltas (chunks)
  // Use a short debounce window to coalesce rapid updates (prevents flood).
  const lastKnownSteps: Map<string, any[]> = new Map();
  const pendingMessages: Map<string, string[]> = new Map();
  const pendingTimers: Map<string, NodeJS.Timeout> = new Map();
  const scheduleFlush = (pipelineId: string) => {
    if (pendingTimers.has(pipelineId)) return;
    const t = setTimeout(() => {
      try {
        const clients = pipelineSseClients.get(pipelineId);
        const msgs = pendingMessages.get(pipelineId) || [];
        if (clients && clients.size && msgs.length) {
          for (const res of clients) {
            try {
              for (const m of msgs) res.write(`data: ${m}\n\n`);
            } catch { /* ignore per-client errors */ }
          }
        }
      } finally {
        pendingMessages.delete(pipelineId);
        const tm = pendingTimers.get(pipelineId);
        if (tm) clearTimeout(tm);
        pendingTimers.delete(pipelineId);
      }
    }, 180);
    pendingTimers.set(pipelineId, t);
  };
  try {
    const sbGlobal = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '');
    const channel = sbGlobal.channel('realtime-agent-pipelines');
    channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'agent_pipelines' }, (payload) => {
      try {
        const row = payload.new as any;
        const id = row?.id;
        if (!id) return;
        const clients = pipelineSseClients.get(id);
        if (!clients || clients.size === 0) {
          // still update cache so next client gets baseline
          lastKnownSteps.set(id, Array.isArray(row.steps) ? row.steps : JSON.parse(row.steps || '[]'));
          return;
        }

        const newSteps = Array.isArray(row.steps) ? row.steps : JSON.parse(row.steps || '[]');
        const prevSteps = lastKnownSteps.get(id) || [];

        // compute per-step output diffs and enqueue chunk messages when output grows
        for (let i = 0; i < newSteps.length; i++) {
          const prevOut = String((prevSteps[i] && prevSteps[i].output) || '');
          const newOut = String((newSteps[i] && newSteps[i].output) || '');
          if (newOut.length > prevOut.length) {
            const chunk = newOut.slice(prevOut.length);
            const payloadMsg = JSON.stringify({ type: 'chunk', stepIndex: i, chunk });
            const arr = pendingMessages.get(id) || [];
            arr.push(payloadMsg);
            pendingMessages.set(id, arr);
          }
        }

        // If non-output fields changed (status, startedAt, completedAt), enqueue an 'update' with minimal info
        for (let i = 0; i < newSteps.length; i++) {
          const prev = prevSteps[i] || {};
          const curr = newSteps[i] || {};
          const metaChanged = prev.status !== curr.status || prev.startedAt !== curr.startedAt || prev.completedAt !== curr.completedAt || prev.error !== curr.error || prev.approvedAt !== curr.approvedAt;
          if (metaChanged) {
            const payloadMsg = JSON.stringify({ type: 'update', stepIndex: i, step: { ...curr, output: undefined } });
            const arr = pendingMessages.get(id) || [];
            arr.push(payloadMsg);
            pendingMessages.set(id, arr);
          }
        }

        // schedule a flush for this pipeline so messages are coalesced
        if (pendingMessages.has(id)) scheduleFlush(id);

        // update cache
        lastKnownSteps.set(id, newSteps);
      } catch (e) {
        // ignore
      }
    });
    channel.subscribe();
  } catch (e) {
    // ignore realtime subscription failures
  }

  app.get('/api/pipelines/:id/stream', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const pipelineId = req.params.id;
    let clients = pipelineSseClients.get(pipelineId);
    if (!clients) {
      clients = new Set();
      pipelineSseClients.set(pipelineId, clients);
    }
    clients.add(res);

    // When client closes, remove it
    req.on('close', () => {
      clients?.delete(res);
      if (clients && clients.size === 0) pipelineSseClients.delete(pipelineId);
    });
  });

  // Return number of active SSE clients for a pipeline (debug/admin)
  app.get('/api/pipelines/:id/clients', async (req, res) => {
    try {
      const pipelineId = req.params.id;
      const clients = pipelineSseClients.get(pipelineId);
      res.json({ success: true, clients: clients ? clients.size : 0 });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to fetch clients.' });
    }
  });

  app.post('/api/pipelines/:id/debug-event', async (req, res) => {
    try {
      const pipelineId = req.params.id;
      const payload = req.body || {};
      const eventType = payload.type === 'update' ? 'update' : 'chunk';
      const stepIndex = Number.isFinite(Number(payload.stepIndex)) ? Number(payload.stepIndex) : 0;
      const message: any = { type: eventType, stepIndex };
      if (eventType === 'chunk') {
        message.chunk = typeof payload.chunk === 'string' ? payload.chunk : '[test chunk]';
      } else {
        message.step = payload.step || { status: 'waiting_approval' };
      }

      const arr = pendingMessages.get(pipelineId) || [];
      arr.push(JSON.stringify(message));
      pendingMessages.set(pipelineId, arr);
      scheduleFlush(pipelineId);
      res.json({ success: true, event: message });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to emit debug event.' });
    }
  });

  // Cancel a running pipeline
  app.post('/api/pipelines/:id/cancel', async (req, res) => {
    try {
      const pipelineId = req.params.id;
      const sb = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '');
      const { data, error } = await sb.from('agent_pipelines').select('*').eq('id', pipelineId).single();
      if (error || !data) return res.status(404).json({ success: false, error: error?.message || 'Pipeline not found.' });
      const steps = Array.isArray(data.steps) ? data.steps : JSON.parse(data.steps || '[]');
      // Mark any running or pending steps as skipped/failed
      for (const s of steps) {
        if (s.status === 'running' || s.status === 'pending' || s.status === 'waiting_approval') {
          s.status = 'skipped';
          s.completedAt = new Date().toISOString();
        }
      }
      await sb.from('agent_pipelines').update({ steps: JSON.stringify(steps), status: 'paused', updated_at: new Date().toISOString() }).eq('id', pipelineId);
      res.json({ success: true, message: 'Pipeline cancelled.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to cancel pipeline.' });
    }
  });

  // Approve a waiting step and resume pipeline execution
  app.post('/api/pipelines/:id/approve', async (req, res) => {
    try {
      const pipelineId = req.params.id;
      const stepNumber = Number(req.body.stepNumber ?? NaN);
      const userId = (req as any).user?.id || 'local';
      const sb = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '');

      const { data, error } = await sb.from('agent_pipelines').select('*').eq('id', pipelineId).single();
      if (error || !data) return res.status(404).json({ success: false, error: error?.message || 'Pipeline not found.' });

      const steps = Array.isArray(data.steps) ? (data.steps as any[]) : JSON.parse(data.steps || '[]');
      const idx = Number.isFinite(stepNumber) ? stepNumber : (data.current_step_index ?? 0);
      if (!steps[idx]) return res.status(400).json({ success: false, error: 'Invalid step index' });

      // mark approved/completed so orchestrator can continue
      steps[idx].status = 'done';
      steps[idx].approvedAt = new Date().toISOString();
      steps[idx].completedAt = new Date().toISOString();

      await sb.from('agent_pipelines').update({ steps: JSON.stringify(steps), status: 'running', current_step_index: idx + 1, updated_at: new Date().toISOString() }).eq('id', pipelineId);

      // record approval in approvals table (prefer explicit approver_id from body)
      try {
        const approverIdFromBody = typeof req.body.approver_id === 'string' && req.body.approver_id.trim() ? req.body.approver_id.trim() : null;
        await sb.from('agent_pipeline_approvals').insert({
          pipeline_id: pipelineId,
          step_index: idx,
          approver_id: approverIdFromBody ?? (userId === 'local' ? null : userId),
          note: req.body.note ?? null,
        });
      } catch (e) {
        // ignore approval write failure
      }

      // resume pipeline execution asynchronously
      resumePipeline(pipelineId, userId).catch(() => undefined);

      res.json({ success: true, message: 'Step approved and pipeline resumed.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to approve step.' });
    }
  });

  // List approvals for a pipeline
  app.get('/api/pipelines/:id/approvals', async (req, res) => {
    try {
      const pipelineId = req.params.id;
      const sb = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '');
      const { data, error } = await sb.from('agent_pipeline_approvals').select('*').eq('pipeline_id', pipelineId).order('created_at', { ascending: true });
      if (error) throw error;
      res.json({ success: true, approvals: data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to fetch approvals.' });
    }
  });

  app.post("/api/gemini/generate", async (req, res) => { try { const parsed = geminiGenerateSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ error: parsed.error.issues.map(i => i.message).join(", ") }); const result = await callAI(buildAIMessages(parsed.data), { model: resolveProxyModel(parsed.data.model) }); res.json({ success: true, text: result.text, provider: result.provider, model: result.model, usage: result.usage }); } catch (error: any) { const isQuota = isRateLimitOrQuotaError(error); res.status(isQuota ? 429 : 500).json({ error: error.message || "AI proxy failed", isQuota, provider: error.provider, model: error.model }); } });
  app.post("/api/ai/chat", async (req, res) => { try { const parsed = geminiGenerateSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ error: parsed.error.issues.map(i => i.message).join(", ") }); const result = await callAI(buildAIMessages(parsed.data), { model: resolveProxyModel(parsed.data.model) }); res.json({ success: true, ...result }); } catch (error: any) { const isQuota = isRateLimitOrQuotaError(error); res.status(isQuota ? 429 : 500).json({ error: error.message || "AI proxy failed", isQuota, provider: error.provider, model: error.model }); } });
  app.post("/api/ai/chat/stream", async (req, res) => { try { const parsed = geminiGenerateSchema.safeParse(req.body); if (!parsed.success) { res.status(400).json({ error: parsed.error.issues.map(i => i.message).join(", ") }); return; } res.setHeader("Content-Type", "text/event-stream"); res.setHeader("Cache-Control", "no-cache, no-transform"); res.setHeader("Connection", "keep-alive"); for await (const chunk of streamAI(buildAIMessages(parsed.data), { model: resolveProxyModel(parsed.data.model) })) res.write(`data: ${JSON.stringify(chunk)}\n\n`); res.write("data: [DONE]\n\n"); res.end(); } catch (error: any) { res.write(`data: ${JSON.stringify({ error: error.message || "AI stream failed" })}\n\n`); res.end(); } });
  app.get("/api/ai/health", async (_req, res) => { try { res.json({ success: true, ...(await checkAIProxyHealth()) }); } catch (err: any) { res.status(500).json({ success: false, error: err.message || "AI proxy health check failed." }); } });
  app.get("/api/ai/providers", (_req, res) => res.json({ success: true, providers: getSupportedAIProviders() }));
  app.get("/api/ai/keys", (_req, res) => res.json({ success: true, keys: listAIKeys(), security: getAIVaultSecurityStatus(), autoLock: getAIVaultAutoLockStatus() }));
  app.post("/api/ai/keys", (req, res) => { try { const parsed = aiKeyCreateSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") }); const key = createAIKey(parsed.data); markAIVaultActivity(); res.json({ success: true, key, security: getAIVaultSecurityStatus(), autoLock: getAIVaultAutoLockStatus() }); } catch (err: any) { res.status(400).json({ success: false, error: err.message || "Failed to create AI key." }); } });
  app.patch("/api/ai/keys/:id", (req, res) => { try { const parsed = aiKeyUpdateSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") }); const key = updateAIKey(req.params.id, parsed.data); markAIVaultActivity(); res.json({ success: true, key, security: getAIVaultSecurityStatus(), autoLock: getAIVaultAutoLockStatus() }); } catch (err: any) { res.status(400).json({ success: false, error: err.message || "Failed to update AI key." }); } });
  app.delete("/api/ai/keys/:id", (req, res) => { try { deleteAIKey(req.params.id); markAIVaultActivity(); res.json({ success: true, keys: listAIKeys(), security: getAIVaultSecurityStatus(), autoLock: getAIVaultAutoLockStatus() }); } catch (err: any) { res.status(400).json({ success: false, error: err.message || "Failed to delete AI key." }); } });
  app.post("/api/ai/keys/test", async (req, res) => { try { const parsed = z.object({ provider: aiProviderSchema, apiKey: z.string().optional(), baseUrl: z.string().optional(), model: z.string().optional() }).safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") }); res.json({ success: true, result: await testAIKey(parsed.data) }); } catch (err: any) { res.status(400).json({ success: false, error: err.message || "AI key test failed." }); } });
  app.post("/api/ai/keys/setup-vault", (req, res) => { try { const parsed = aiVaultPassphraseSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") }); setupAIVaultPassphrase(parsed.data.passphrase); res.json({ success: true, security: getAIVaultSecurityStatus(), autoLock: getAIVaultAutoLockStatus() }); } catch (err: any) { res.status(400).json({ success: false, error: err.message || "Failed to set up AI vault." }); } });
  app.post("/api/ai/keys/unlock-vault", (req, res) => { try { const parsed = aiVaultPassphraseSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") }); unlockAIVault(parsed.data.passphrase); res.json({ success: true, security: getAIVaultSecurityStatus(), autoLock: getAIVaultAutoLockStatus() }); } catch (err: any) { res.status(400).json({ success: false, error: err.message || "Failed to unlock AI vault." }); } });
  app.post("/api/ai/keys/lock-vault", (_req, res) => { lockAIVault(); res.json({ success: true, security: getAIVaultSecurityStatus(), autoLock: getAIVaultAutoLockStatus() }); });
  app.get("/api/ai/keys/export-backup", (req, res) => { try { const parsed = aiBackupExportSchema.safeParse({ passphrase: String(req.query.passphrase || "") }); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") }); markAIVaultActivity(); res.json({ success: true, backup: exportAIKeyBackup(parsed.data.passphrase) }); } catch (err: any) { res.status(400).json({ success: false, error: err.message || "Failed to export backup." }); } });
  app.post("/api/ai/keys/import-backup", (req, res) => { try { const parsed = aiBackupImportSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") }); const keys = importAIKeyBackup(parsed.data.backup, parsed.data.passphrase, parsed.data.mode); markAIVaultActivity(); res.json({ success: true, keys, security: getAIVaultSecurityStatus(), autoLock: getAIVaultAutoLockStatus() }); } catch (err: any) { res.status(400).json({ success: false, error: err.message || "Failed to import backup." }); } });
  app.get("/api/ai/keys/auto-lock", (_req, res) => res.json({ success: true, autoLock: getAIVaultAutoLockStatus() }));
  app.patch("/api/ai/keys/auto-lock", (req, res) => { try { const parsed = aiVaultAutoLockSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") }); const autoLock = updateAIVaultAutoLockConfig(parsed.data); markAIVaultActivity(); res.json({ success: true, autoLock }); } catch (err: any) { res.status(400).json({ success: false, error: err.message || "Failed to update auto-lock." }); } });
  app.post("/api/ai/keys/auto-lock/disarm", (_req, res) => { disarmAIVaultAutoLock(); res.json({ success: true, autoLock: getAIVaultAutoLockStatus() }); });
  // Claude Code Bridge (minimal): prepare a copyable prompt for Claude Code
  app.post('/api/claude/code-bridge', async (req, res) => {
    try {
      const prompt = String((req.body && req.body.prompt) || req.query.prompt || '');
      const mode = String((req.body && req.body.mode) || req.query.mode || 'task');
      if (!prompt) return res.status(400).json({ success: false, error: 'prompt is required' });
      // Prepare a canonical Claude Code prompt wrapper
      const wrapped = `TASK MODE: ${mode}\n---\n${prompt}\n\nPlease produce a concise task spec with files to change, a small patch example, and a suggested PR description.`;
      // Do not call external APIs here; return payload for client to copy or to send to Anthropic if configured
      res.json({ success: true, prompt: wrapped });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to prepare Claude prompt' });
    }
  });
  app.get("/api/ai/usage", (_req, res) => res.json({ success: true, logs: readAIUsageLogs(200) }));
  app.delete("/api/ai/usage", (_req, res) => { clearAIUsageLogs(); res.json({ success: true }); });
  app.get("/api/ai/doctor/preflight", async (_req, res) => { try { res.json({ success: true, result: await runAIPreflight() }); } catch (err: any) { res.status(500).json({ success: false, error: err.message || "AI preflight failed." }); } });
  app.get("/api/ai/router/diagnose", async (_req, res) => { try { res.json({ success: true, result: await diagnoseAIRouter() }); } catch (err: any) { res.status(500).json({ success: false, error: err.message || "AI router diagnose failed." }); } });

  if (process.env.NODE_ENV === "production") { app.use(express.static(path.join(process.cwd(), "dist"))); app.get("*", (_req, res) => res.sendFile(path.join(process.cwd(), "dist", "index.html"))); } else { const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" }); app.use(vite.middlewares); }
  return new Promise<void>((resolve) => { app.listen(PORT, "0.0.0.0", () => { console.log(`🚀 Server running on http://0.0.0.0:${PORT}`); resolve(); }); });
}

startServer().catch((error) => { console.error("❌ Failed to start server", error); process.exit(1); });
