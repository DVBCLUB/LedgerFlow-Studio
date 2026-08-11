import express from "express";
import path from "path";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import { z } from "zod";
// ── AI Gateway (core — không được thay đổi) ──────────────────────────
import { callAI, streamAI, checkAIProxyHealth, type ChatMessage, type CallAIOptions } from "./server/services/aiClient";
import { createAIKey, deleteAIKey, exportAIKeyBackup, getAIVaultSecurityStatus, getSupportedAIProviders, importAIKeyBackup, listAIKeys, lockAIVault, setupAIVaultPassphrase, unlockAIVault, updateAIKey } from "./server/services/aiKeyVault";
import { diagnoseAIRouter, testAIKey } from "./server/services/aiRouter";
import { runAIPreflight } from "./server/services/aiDoctor";
import { clearAIUsageLogs, readAIUsageLogs } from "./server/services/aiUsageLog";
import { buildAIUsageMetrics } from "./server/services/aiUsageMetrics";
import { AI_PROMPT_TASKS, activatePromptVersion, createPromptVersion, getActivePrompt, listPromptTemplates } from "./server/services/aiPromptRegistry";
import { disarmAIVaultAutoLock, getAIVaultAutoLockStatus, markAIVaultActivity, updateAIVaultAutoLockConfig } from "./server/services/aiVaultAutoLock";
// ── Integration & DevOps ──────────────────────────────────────────────
import { appendIntegrationEvent, clearIntegrationEvents, listIntegrationConnectors, readIntegrationEvents, testIntegrationConnector, updateIntegrationConnector } from "./server/services/integrationRegistry";
import { createApprovedGitHubChangeRequest, createGitHubIssue, getGitHubPullRequestDigest, getGitHubSummary, getGitHubWorkflowRunJobs, requestCloseGitHubPullRequest, getGitLocalStatus, gitPullLocal, gitPushLocal } from "./server/services/githubConnector";
import { getGitHubWorkflowRunArtifacts } from "./server/services/githubArtifacts";
import { getLocalToolSummary, openLocalTool } from "./server/services/localToolConnector";
import { seedContractsFromRegistry, listContracts, getContract, updateContractHealth } from "./server/services/connectorContract";
import { checkAllIDEs, openIDE, generateHandoffPrompt, checkIDEBridgeHealth, type IDETarget } from "./server/services/ideBridge";
// ── Accounting & Core Data ────────────────────────────────────────────
import { registerAccountingRoutes } from "./server/services/accountingRoutes";
import { clearLocalSession, createLocalSession, readLocalServerSession, requireLocalAuth, setLocalSessionCookie } from "./server/services/localAuth";
import { loadLocalDatabase, saveLocalDatabase } from "./server/services/localDatabase";
// ── AI Fabric & Control Plane ────────────────────────────────────────
import { dispatchThroughFabric, dispatchTextThroughFabric, checkFabricHealth, type AIFabricOptions } from "./server/services/aiFabric";
import { executeControlPlaneRun, getControlPlaneRun, listControlPlaneRuns, getControlPlaneMetrics, cleanupStaleRuns, type AgentControlPlaneOptions } from "./server/services/agentControlPlane";
// ── Agentic Loop & Memory ────────────────────────────────────────────
import { runAgenticLoop, stopAgenticLoop, getAgenticLoopRun, listAgenticLoopRuns, getAgenticLoopMetrics, cleanupStaleLoops, type AgenticLoopOptions } from "./server/services/agenticLoopEngine";
import { createAgentMemory, reviewAgentMemory, searchAgentMemory } from "./server/services/agentMemoryStore";
import { searchMemory, getStats as getMemoryStats, promoteToLongTerm, recordObservation, cleanExpiredShortTerm, clearSessionMemory, getSessionMemory } from "./server/services/compoundMemory";
// ── Platform Account & Session Lease ─────────────────────────────────
import { PlatformAccountBroker } from "./server/services/platformAccountBroker";
import { SessionLeaseManager } from "./server/services/sessionLeaseManager";
// ── Browser Runbook & Robot ──────────────────────────────────────────
import { startBrowserSession, getActiveBrowserSession, listActiveBrowserSessions, getRunbookHistory, getBrowserRunbookSummary, completeBrowserSession, cancelBrowserSession, cleanOldRunbookEntries } from "./server/services/browserRunbookEngine";
import { getAdapterState, acceptRobotCommand, setEmergencyStop, getRunbook as getRobotRunbook, type RobotCommand } from "./server/services/robotAdapterBoundary";
// ── Agentic RAG & Prompt Optimizer ───────────────────────────────────
import { agenticRetrieve } from "./server/services/agenticRagRouter";
import { analyzeAndOptimize } from "./server/services/promptOptimizer";
// ── Observability & Cost ─────────────────────────────────────────────
import { getSnapshot as getCostSnapshot, getDailyCosts } from "./server/services/costObservability";
// ── AI Workforce Health ───────────────────────────────────────────────
import { getAIWorkforceHealthSnapshot } from "./server/services/aiWorkforceRuntimeHub";
import { videoMakerRoutes } from "./server/services/videoMakerRoutes";
import { aiTaskBoardRoutes } from "./server/services/aiTaskBoardRoutes";
import { localOfficeRoutes } from "./server/services/localOfficeRoutes";
import { registerAgentSystemRoutes } from "./server/services/agentSystemRoutes";
import { registerMCPHttpRoutes } from "./server/services/mcpHttpRoutes";
import { hydrateExternalMCPServerCatalog } from "./server/services/mcpClientGateway";

// ── Core Module Loader (Modular Monolith Setup) ─────────────────────
import { loadAllModules, registerModuleRegistryEndpoint } from "./core/server/module-loader";

dotenv.config();
if (process.env.FROM_DEV_LAUNCHER === "true") {
  process.env.NODE_ENV = "development";
}

const databaseSaveSchema = z.object({ payload: z.record(z.string(), z.any()) });
const aiPromptTaskSchema = z.enum(AI_PROMPT_TASKS);
const geminiGenerateSchema = z.object({ prompt: z.string().min(1, "Prompt cannot be empty"), model: z.string().optional(), task: aiPromptTaskSchema.optional(), history: z.array(z.object({ role: z.enum(["user", "model"]), text: z.string().optional() })).optional(), systemInstruction: z.string().optional(), file: z.object({ data: z.string(), mimeType: z.string() }).optional() });
const aiProviderSchema = z.enum(["gemini", "groq", "openrouter", "anthropic", "ollama", "openai", "deepseek"]);
const aiKeyCreateSchema = z.object({ provider: aiProviderSchema, label: z.string().optional(), apiKey: z.string().optional(), model: z.string().optional(), baseUrl: z.string().optional(), priority: z.number().optional(), enabled: z.boolean().optional() });
const aiKeyUpdateSchema = aiKeyCreateSchema.partial().extend({ lastStatus: z.enum(["ok", "error", "quota", "untested"]).optional(), lastError: z.string().optional() });
const aiBackupExportSchema = z.object({ passphrase: z.string().min(8, "Mật khẩu backup phải có ít nhất 8 ký tự.") });
const aiBackupImportSchema = z.object({ passphrase: z.string().min(8, "Mật khẩu backup phải có ít nhất 8 ký tự."), mode: z.enum(["merge", "replace"]).default("merge"), backup: z.object({ version: z.literal(1), app: z.literal("LedgerFlow Studio"), exportedAt: z.string(), kdf: z.literal("scrypt"), cipher: z.literal("aes-256-gcm"), salt: z.string(), iv: z.string(), tag: z.string(), payload: z.string(), note: z.string() }) });
const aiVaultPassphraseSchema = z.object({ passphrase: z.string().min(8, "Mật khẩu AI Vault phải có ít nhất 8 ký tự.") });
const aiVaultAutoLockSchema = z.object({ enabled: z.boolean().optional(), timeoutMinutes: z.number().min(1).max(1440).optional() });
const aiPromptVersionCreateSchema = z.object({ task: aiPromptTaskSchema, content: z.string().min(1), note: z.string().optional(), createdBy: z.string().optional(), activate: z.boolean().optional(), label: z.string().optional(), description: z.string().optional() });
const aiPromptActivateSchema = z.object({ task: aiPromptTaskSchema, version: z.number().int().min(1) });
const localSessionSchema = z.object({
  email: z.string().email("Email không hợp lệ."),
  password: z.string().min(1, "Mật khẩu không được để trống."),
});
const integrationPatchSchema = z.object({ enabled: z.boolean().optional(), status: z.enum(["connected", "local", "manual", "planned", "error"]).optional(), priority: z.enum(["P0", "P1", "P2", "P3"]).optional(), url: z.string().optional(), localCommand: z.string().optional(), notes: z.string().optional() });
const integrationEventSchema = z.object({ type: z.enum(["status", "test", "config", "handoff", "note"]).default("note"), level: z.enum(["info", "success", "warning", "error"]).default("info"), message: z.string().min(1) });
const githubIssueSchema = z.object({ repo: z.string().optional(), title: z.string().min(3, "Tiêu đề issue phải có ít nhất 3 ký tự."), body: z.string().optional(), labels: z.array(z.string()).optional() });
const githubApprovedChangeSchema = z.object({ repo: z.string().optional(), title: z.string().min(3, "Tiêu đề PR phải có ít nhất 3 ký tự."), summary: z.string().min(10, "Summary phải đủ rõ để review."), approvalPhrase: z.literal("APPROVE AI GITHUB PUSH"), baseBranch: z.string().optional(), branchName: z.string().optional(), draft: z.boolean().optional(), files: z.array(z.object({ path: z.string().min(1), content: z.string() })).min(1).max(10) });
const githubClosePullRequestSchema = z.object({ repo: z.string().optional(), reason: z.string().min(10, "Reason đóng PR phải đủ rõ để audit."), rollbackNote: z.string().min(10, "Rollback note phải đủ rõ để review."), approvalPhrase: z.literal("APPROVE AI GITHUB CLOSE") });
const localToolOpenSchema = z.object({ tool: z.enum(["vscode", "cursor", "github", "actions"]) });
type GeminiGenerateInput = z.infer<typeof geminiGenerateSchema>;

function getSimulatedMarketSurveyResponse(niche: string, direction?: string) { return { summary: `Mô phỏng nghiên cứu thị trường cho: ${niche}.`, metrics: { pricingPreferred: [], painPoints: [], channels: [] }, personas: [], gaps: [], competitors: [], blueprint: { direction: direction || "B2D Tool" }, sources: [{ title: "Fallback simulator", url: "local" }] }; }
function resolveProxyModel(model?: string): NonNullable<CallAIOptions["model"]> { if (!model) return "ai-assistant"; const normalized = model.toLowerCase(); return normalized.includes("pro") || normalized.includes("3.5") || normalized.includes("advanced") ? "ai-assistant-pro" : "ai-assistant"; }
async function resolveSystemInstruction(input: GeminiGenerateInput): Promise<string | undefined> {
  if (input.systemInstruction) return input.systemInstruction;
  if (!input.task) return undefined;
  const active = await getActivePrompt(input.task);
  return active?.content;
}
function buildAIMessages(input: GeminiGenerateInput, resolvedSystemInstruction?: string): ChatMessage[] { const messages: ChatMessage[] = []; if (resolvedSystemInstruction) messages.push({ role: "system", content: resolvedSystemInstruction }); if (input.history) for (const msg of input.history) if (msg.text) messages.push({ role: msg.role === "user" ? "user" : "assistant", content: msg.text }); messages.push({ role: "user", content: input.file ? `${input.prompt}\n\n[Attached ${input.file.mimeType} as base64; current text gateway does not parse binary content directly.]` : input.prompt }); return messages; }
function isRateLimitOrQuotaError(err: any): boolean { const text = `${err?.status || ""} ${err?.message || ""} ${JSON.stringify(err?.body || {})}`.toLowerCase(); return text.includes("429") || text.includes("quota") || text.includes("resource_exhausted") || text.includes("rate limit") || text.includes("too many requests"); }

async function startServer() {
  await hydrateExternalMCPServerCatalog();
  const app = express();
  const PORT = Number(process.env.PORT ?? 3000);
  app.set("trust proxy", 1);
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), clipboard-read=(), clipboard-write=(self)");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    if (req.path.startsWith("/api/")) res.setHeader("Cache-Control", "no-store");

    // Intercept Content-Type header to enforce UTF-8 charset on text and JS resources
    const originalSetHeader = res.setHeader;
    res.setHeader = function (this: any, name: string, value: any) {
      if (typeof name === "string" && name.toLowerCase() === "content-type" && typeof value === "string") {
        if (
          (value.startsWith("text/") ||
            value.startsWith("application/javascript") ||
            value.startsWith("application/json") ||
            value.startsWith("application/x-javascript")) &&
          !value.toLowerCase().includes("charset")
        ) {
          value = `${value}; charset=utf-8`;
        }
      }
      return originalSetHeader.call(this, name, value);
    } as any;

    next();
  });
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));
  app.use((req, res, next) => { const allowedOrigins = ["http://localhost:3000", "http://127.0.0.1:3000", "http://0.0.0.0:3000"]; const origin = req.headers.origin; if (origin) { const isAllowed = allowedOrigins.includes(origin) || origin.endsWith(".run.app") || /https:\/\/ais-.*\.run\.app/.test(origin); if (isAllowed) res.setHeader("Access-Control-Allow-Origin", origin); } res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS"); res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization"); if (req.method === "OPTIONS") res.sendStatus(204); else next(); });
  const isDev = process.env.NODE_ENV !== "production";
  const apiLimiter = rateLimit({ windowMs: 60_000, max: isDev ? 240 : 30, skip: (req) => isDev && ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.ip || ""), message: { error: "Bạn đã đạt giới hạn yêu cầu/phút. Vui lòng thử lại sau.", isRateLimit: true }, standardHeaders: true, legacyHeaders: false, validate: { trustProxy: false } });
  app.use("/api/gemini/", apiLimiter); app.use("/api/ai/", apiLimiter); app.use("/api/integrations/", apiLimiter);
  app.get("/api/health", (_req, res) => res.json({
    status: "ok",
    desktop: process.env.ELECTRON_DESKTOP === "true",
    time: new Date()
  }));
  app.post("/api/auth/local-session", (req, res) => {
    const parsed = localSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues.map((i) => i.message).join(", ") });
    }

    const email = parsed.data.email.trim().toLowerCase();
    let result;
    try {
      result = createLocalSession(email, parsed.data.password);
    } catch (error: any) {
      return res.status(503).json({ success: false, error: error.message || "Local authentication is not configured." });
    }
    if (!result) return res.status(401).json({ success: false, error: "Email hoặc mật khẩu không đúng." });
    setLocalSessionCookie(res, result.token);
    return res.json({
      success: true,
      usesDevPassword: result.usesDevPassword,
      session: result.session,
    });
  });
  app.get("/api/auth/session", (req, res) => {
    const session = readLocalServerSession(req);
    if (!session) return res.status(401).json({ success: false, error: "Authentication required." });
    return res.json({ success: true, session });
  });
  app.post("/api/auth/logout", (req, res) => {
    clearLocalSession(req, res);
    return res.json({ success: true });
  });
  app.use("/api", requireLocalAuth);
  registerMCPHttpRoutes(app);

  app.post("/api/client-error", express.json(), (req, res) => {
    console.error("🔴 [ClientError]", req.body);
    res.json({ success: true });
  });

  const STORAGE_FILE = path.join(process.cwd(), "db_storage.json");
  app.get("/api/db/load", async (_req, res) => { try { res.json({ success: true, data: await loadLocalDatabase(STORAGE_FILE) }); } catch (err: any) { res.status(500).json({ success: false, error: err.message || "Failed to load database state." }); } });
  app.post("/api/db/save", async (req, res) => { try { const parsed = databaseSaveSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") }); await saveLocalDatabase(STORAGE_FILE, parsed.data.payload); res.json({ success: true, message: "Database synchronized successfully on the server." }); } catch (err: any) { res.status(500).json({ success: false, error: err.message || "Failed to save database state." }); } });

  app.get("/api/integrations", async (req, res) => { try { res.json({ success: true, connectors: await listIntegrationConnectors(), events: await readIntegrationEvents(30) }); } catch (err: any) { res.status(500).json({ success: false, error: err.message || "Failed to list integrations." }); } });
  app.patch("/api/integrations/:id", async (req, res) => { try { const parsed = integrationPatchSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") }); res.json({ success: true, connector: await updateIntegrationConnector(req.params.id, parsed.data) }); } catch (err: any) { res.status(400).json({ success: false, error: err.message || "Failed to update integration." }); } });
  app.post("/api/integrations/:id/test", async (req, res) => { try { res.json({ success: true, connector: await testIntegrationConnector(req.params.id), events: await readIntegrationEvents(30) }); } catch (err: any) { res.status(400).json({ success: false, error: err.message || "Failed to test integration." }); } });
  app.post("/api/integrations/:id/events", async (req, res) => { try { const parsed = integrationEventSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") }); res.json({ success: true, event: await appendIntegrationEvent({ connectorId: req.params.id, ...parsed.data }) }); } catch (err: any) { res.status(400).json({ success: false, error: err.message || "Failed to append integration event." }); } });
  app.get("/api/integrations/events", async (req, res) => { try { res.json({ success: true, events: await readIntegrationEvents(Number(req.query.limit ?? 100)) }); } catch (err: any) { res.status(500).json({ success: false, error: err.message || "Failed to read integration events." }); } });
  app.delete("/api/integrations/events", async (req, res) => { try { await clearIntegrationEvents(); res.json({ success: true }); } catch (err: any) { res.status(500).json({ success: false, error: err.message || "Failed to clear integration events." }); } });
  app.get("/api/integrations/github/summary", async (req, res) => { try { const summary = await getGitHubSummary(typeof req.query.repo === "string" ? req.query.repo : undefined); await appendIntegrationEvent({ connectorId: "github", type: "test", level: "success", message: `GitHub summary loaded for ${summary.repo}.` }); res.json({ success: true, summary }); } catch (err: any) { await appendIntegrationEvent({ connectorId: "github", type: "test", level: "error", message: err.message || "GitHub summary failed." }).catch(() => undefined); res.status(400).json({ success: false, error: err.message || "Failed to load GitHub summary." }); } });
  app.get("/api/integrations/github/prs/:pullNumber/digest", async (req, res) => { try { const pullNumber = Number(req.params.pullNumber); const result = await getGitHubPullRequestDigest(typeof req.query.repo === "string" ? req.query.repo : undefined, pullNumber); await appendIntegrationEvent({ connectorId: "github", type: "test", level: result.safety.touchesBlockedPath ? "warning" : "success", message: `PR digest loaded for #${pullNumber}. Files: ${result.files.length}.` }); res.json({ success: true, result }); } catch (err: any) { await appendIntegrationEvent({ connectorId: "github", type: "test", level: "error", message: err.message || "GitHub PR digest failed." }).catch(() => undefined); res.status(400).json({ success: false, error: err.message || "Failed to load PR digest." }); } });
  app.get("/api/integrations/github/runs/:runId/jobs", async (req, res) => { try { const runId = Number(req.params.runId); const result = await getGitHubWorkflowRunJobs(typeof req.query.repo === "string" ? req.query.repo : undefined, runId); await appendIntegrationEvent({ connectorId: "github", type: "test", level: result.hasFailures ? "warning" : "success", message: `Workflow jobs inspected for run ${runId}. Failed jobs: ${result.failedJobs.length}.` }); res.json({ success: true, result }); } catch (err: any) { await appendIntegrationEvent({ connectorId: "github", type: "test", level: "error", message: err.message || "GitHub workflow jobs failed." }).catch(() => undefined); res.status(400).json({ success: false, error: err.message || "Failed to inspect workflow jobs." }); } });
  app.get("/api/integrations/github/runs/:runId/artifacts", async (req, res) => { try { const runId = Number(req.params.runId); const result = await getGitHubWorkflowRunArtifacts(typeof req.query.repo === "string" ? req.query.repo : undefined, runId); await appendIntegrationEvent({ connectorId: "github", type: "test", level: result.hasArtifacts ? "success" : "warning", message: `Workflow artifacts inspected for run ${runId}. Artifacts: ${result.artifacts.length}.` }); res.json({ success: true, result }); } catch (err: any) { await appendIntegrationEvent({ connectorId: "github", type: "test", level: "error", message: err.message || "GitHub workflow artifacts failed." }).catch(() => undefined); res.status(400).json({ success: false, error: err.message || "Failed to inspect workflow artifacts." }); } });
  app.post("/api/integrations/github/issues", async (req, res) => { try { const parsed = githubIssueSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") }); const issue = await createGitHubIssue(parsed.data); await appendIntegrationEvent({ connectorId: "github", type: "handoff", level: "success", message: `Created GitHub issue #${issue.number}: ${issue.title}` }); res.json({ success: true, issue }); } catch (err: any) { await appendIntegrationEvent({ connectorId: "github", type: "handoff", level: "error", message: err.message || "Create GitHub issue failed." }).catch(() => undefined); res.status(400).json({ success: false, error: err.message || "Failed to create GitHub issue." }); } });
  app.post("/api/integrations/github/approved-change-request", async (req, res) => { try { const parsed = githubApprovedChangeSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") }); const result = await createApprovedGitHubChangeRequest(parsed.data); await appendIntegrationEvent({ connectorId: "github", type: "handoff", level: "success", message: `Created draft PR #${result.pullRequest.number} on ${result.branch}.` }); res.json({ success: true, result }); } catch (err: any) { await appendIntegrationEvent({ connectorId: "github", type: "handoff", level: "error", message: err.message || "Approved GitHub push failed." }).catch(() => undefined); res.status(400).json({ success: false, error: err.message || "Failed to create approved GitHub change request." }); } });
  app.post("/api/integrations/github/prs/:pullNumber/request-close", async (req, res) => { try { const pullNumber = Number(req.params.pullNumber); const parsed = githubClosePullRequestSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") }); const result = await requestCloseGitHubPullRequest({ ...parsed.data, pullNumber }); await appendIntegrationEvent({ connectorId: "github", type: "handoff", level: "success", message: `Closed GitHub PR #${result.pullRequest.number} on ${result.repo}.` }); res.json({ success: true, result }); } catch (err: any) { await appendIntegrationEvent({ connectorId: "github", type: "handoff", level: "error", message: err.message || "Close GitHub PR failed." }).catch(() => undefined); res.status(400).json({ success: false, error: err.message || "Failed to close GitHub pull request." }); } });
  app.get("/api/integrations/local-tools/summary", async (_req, res) => { try { res.json({ success: true, summary: await getLocalToolSummary() }); } catch (err: any) { res.status(500).json({ success: false, error: err.message || "Failed to load local tool summary." }); } });
  app.post("/api/integrations/local-tools/open", async (req, res) => { try { const parsed = localToolOpenSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") }); const result = await openLocalTool(parsed.data.tool); await appendIntegrationEvent({ connectorId: "local-tools", type: "handoff", level: result.success ? "success" : "warning", message: result.message }); res.json({ success: result.success, message: result.message }); } catch (err: any) { res.status(400).json({ success: false, error: err.message || "Failed to open local tool." }); } });

  app.get("/api/integrations/git/status", async (_req, res) => {
    try {
      res.json({ success: true, status: await getGitLocalStatus() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to load local Git status." });
    }
  });

  app.post("/api/integrations/git/pull", async (_req, res) => {
    try {
      const result = await gitPullLocal();
      await appendIntegrationEvent({ connectorId: "github", type: "handoff", level: result.success ? "success" : "warning", message: "Git Pull executed local." });
      res.json({ success: result.success, log: result.log });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || "Git Pull failed." });
    }
  });

  app.post("/api/integrations/git/push", async (_req, res) => {
    try {
      const result = await gitPushLocal();
      await appendIntegrationEvent({ connectorId: "github", type: "handoff", level: result.success ? "success" : "warning", message: "Git Push executed local." });
      res.json({ success: result.success, log: result.log });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || "Git Push failed." });
    }
  });

  // ── Connector Contracts API ──────────────────────────────────────────
  app.get("/api/contracts", async (req, res) => {
    try {
      // Seed contracts từ registry mỗi lần gọi để luôn đồng bộ
      const connectors = await listIntegrationConnectors();
      seedContractsFromRegistry(connectors);
      const category = typeof req.query.category === 'string' ? req.query.category : undefined;
      res.json({ success: true, contracts: listContracts(category) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to list contracts." });
    }
  });
  app.get("/api/contracts/:id", async (req, res) => {
    try {
      const contract = getContract(req.params.id);
      if (!contract) return res.status(404).json({ success: false, error: "Contract not found." });
      res.json({ success: true, contract });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ── IDE Bridge API ──────────────────────────────────────────────────
  app.get("/api/ide/check", async (_req, res) => {
    try {
      const results = checkAllIDEs();
      res.json({ success: true, results });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to check IDEs." });
    }
  });
  app.get("/api/ide/health", async (_req, res) => {
    try {
      const health = checkIDEBridgeHealth();
      res.json({ success: true, health });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/ide/open", async (req, res) => {
    try {
      const { target, filePath } = (req.body || {}) as { target?: string; filePath?: string };
      if (!target) return res.status(400).json({ success: false, error: "Missing 'target' IDE." });
      const result = openIDE(target as IDETarget, filePath);
      await appendIntegrationEvent({ connectorId: "ide-bridge", type: "handoff", level: result.ok ? "success" : "warning", message: result.message });
      res.json({ success: result.ok, ...result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || "Failed to open IDE." });
    }
  });
  app.post("/api/ide/handoff", async (req, res) => {
    try {
      const { target, task, files, context } = (req.body || {}) as { target?: string; task?: string; files?: string[]; context?: string };
      if (!target || !task) return res.status(400).json({ success: false, error: "Missing 'target' or 'task'." });
      const prompt = generateHandoffPrompt(target as IDETarget, task, files, context);
      await appendIntegrationEvent({
        connectorId: "ide-bridge", type: "handoff", level: "success",
        message: `Handoff prompt generated for ${target}: ${task.slice(0, 80)}`,
      });
      res.json({ success: true, prompt });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || "Failed to generate handoff." });
    }
  });

  app.post("/api/gemini/generate", async (req, res) => { try { const parsed = geminiGenerateSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ error: parsed.error.issues.map(i => i.message).join(", ") }); const systemInstruction = await resolveSystemInstruction(parsed.data); const result = await callAI(buildAIMessages(parsed.data, systemInstruction), { model: resolveProxyModel(parsed.data.model), task: parsed.data.task }); res.json({ success: true, text: result.text, provider: result.provider, model: result.model, usage: result.usage }); } catch (error: any) { const isQuota = isRateLimitOrQuotaError(error); res.status(isQuota ? 429 : 500).json({ error: error.message || "AI proxy failed", isQuota, provider: error.provider, model: error.model }); } });
  app.post("/api/ai/chat", async (req, res) => { try { const parsed = geminiGenerateSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ error: parsed.error.issues.map(i => i.message).join(", ") }); const systemInstruction = await resolveSystemInstruction(parsed.data); const result = await callAI(buildAIMessages(parsed.data, systemInstruction), { model: resolveProxyModel(parsed.data.model), task: parsed.data.task }); res.json({ success: true, ...result }); } catch (error: any) { const isQuota = isRateLimitOrQuotaError(error); res.status(isQuota ? 429 : 500).json({ error: error.message || "AI proxy failed", isQuota, provider: error.provider, model: error.model }); } });
  app.post("/api/ai/chat/stream", async (req, res) => { try { const parsed = geminiGenerateSchema.safeParse(req.body); if (!parsed.success) { res.status(400).json({ error: parsed.error.issues.map(i => i.message).join(", ") }); return; } const systemInstruction = await resolveSystemInstruction(parsed.data); res.setHeader("Content-Type", "text/event-stream"); res.setHeader("Cache-Control", "no-cache, no-transform"); res.setHeader("Connection", "keep-alive"); for await (const chunk of streamAI(buildAIMessages(parsed.data, systemInstruction), { model: resolveProxyModel(parsed.data.model), task: parsed.data.task })) res.write(`data: ${JSON.stringify(chunk)}\n\n`); res.write("data: [DONE]\n\n"); res.end(); } catch (error: any) { res.write(`data: ${JSON.stringify({ error: error.message || "AI stream failed" })}\n\n`); res.end(); } });
  app.get("/api/ai/health", async (_req, res) => { try { res.json({ success: true, ...(await checkAIProxyHealth()) }); } catch (err: any) { res.status(500).json({ success: false, error: err.message || "AI proxy health check failed." }); } });
  app.get("/api/ai/preflight", async (_req, res) => { try { res.json({ success: true, report: await runAIPreflight() }); } catch (err: any) { res.status(500).json({ success: false, error: err.message || "AI preflight failed." }); } });
  app.get("/api/ai/diagnostics", async (_req, res) => { try { const result = await diagnoseAIRouter(); res.json({ success: true, results: result.results }); } catch (err: any) { res.status(500).json({ success: false, error: err.message || "AI diagnostics failed." }); } });
  app.get("/api/ai/providers", (_req, res) => res.json({ success: true, providers: getSupportedAIProviders() }));
  app.get("/api/ai/keys", async (_req, res) => res.json({ success: true, keys: await listAIKeys(), security: await getAIVaultSecurityStatus(), autoLock: getAIVaultAutoLockStatus() }));
  app.post("/api/ai/keys", async (req, res) => { try { const parsed = aiKeyCreateSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") }); const key = await createAIKey(parsed.data); markAIVaultActivity(); res.json({ success: true, key, security: await getAIVaultSecurityStatus(), autoLock: getAIVaultAutoLockStatus() }); } catch (err: any) { res.status(400).json({ success: false, error: err.message || "Failed to create AI key." }); } });
  app.patch("/api/ai/keys/:id", async (req, res) => { try { const parsed = aiKeyUpdateSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") }); const key = await updateAIKey(req.params.id, parsed.data); markAIVaultActivity(); res.json({ success: true, key, security: await getAIVaultSecurityStatus(), autoLock: getAIVaultAutoLockStatus() }); } catch (err: any) { res.status(400).json({ success: false, error: err.message || "Failed to update AI key." }); } });
  app.delete("/api/ai/keys/:id", async (req, res) => { try { await deleteAIKey(req.params.id); markAIVaultActivity(); res.json({ success: true, keys: await listAIKeys(), security: await getAIVaultSecurityStatus(), autoLock: getAIVaultAutoLockStatus() }); } catch (err: any) { res.status(400).json({ success: false, error: err.message || "Failed to delete AI key." }); } });
  app.post("/api/ai/keys/test", async (req, res) => { try { const parsed = z.object({ provider: aiProviderSchema, apiKey: z.string().optional(), baseUrl: z.string().optional(), model: z.string().optional() }).safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") }); res.json({ success: true, result: await testAIKey(parsed.data) }); } catch (err: any) { res.status(400).json({ success: false, error: err.message || "AI key test failed." }); } });
  app.post("/api/ai/keys/setup-vault", async (req, res) => { try { const parsed = aiVaultPassphraseSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") }); await setupAIVaultPassphrase(parsed.data.passphrase); res.json({ success: true, security: await getAIVaultSecurityStatus(), autoLock: getAIVaultAutoLockStatus() }); } catch (err: any) { res.status(400).json({ success: false, error: err.message || "Failed to set up AI vault." }); } });
  app.post("/api/ai/keys/unlock-vault", async (req, res) => { try { const parsed = aiVaultPassphraseSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") }); await unlockAIVault(parsed.data.passphrase); res.json({ success: true, security: await getAIVaultSecurityStatus(), autoLock: getAIVaultAutoLockStatus() }); } catch (err: any) { res.status(400).json({ success: false, error: err.message || "Failed to unlock AI vault." }); } });
  app.post("/api/ai/keys/lock-vault", async (_req, res) => { await lockAIVault(); res.json({ success: true, security: await getAIVaultSecurityStatus(), autoLock: getAIVaultAutoLockStatus() }); });
  app.get("/api/ai/keys/export-backup", async (req, res) => { try { const parsed = aiBackupExportSchema.safeParse({ passphrase: String(req.query.passphrase || "") }); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") }); markAIVaultActivity(); res.json({ success: true, backup: await exportAIKeyBackup(parsed.data.passphrase) }); } catch (err: any) { res.status(400).json({ success: false, error: err.message || "Failed to export backup." }); } });
  app.post("/api/ai/keys/import-backup", async (req, res) => { try { const parsed = aiBackupImportSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") }); const result = await importAIKeyBackup(parsed.data.backup, parsed.data.passphrase, parsed.data.mode); markAIVaultActivity(); res.json({ success: true, ...result, security: await getAIVaultSecurityStatus(), autoLock: getAIVaultAutoLockStatus() }); } catch (err: any) { res.status(400).json({ success: false, error: err.message || "Failed to import backup." }); } });
  app.post("/api/ai/backup/export", async (req, res) => { try { const parsed = aiBackupExportSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") }); markAIVaultActivity(); res.json({ success: true, backup: await exportAIKeyBackup(parsed.data.passphrase) }); } catch (err: any) { res.status(400).json({ success: false, error: err.message || "Failed to export backup." }); } });
  app.post("/api/ai/backup/import", async (req, res) => { try { const parsed = aiBackupImportSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") }); const result = await importAIKeyBackup(parsed.data.backup, parsed.data.passphrase, parsed.data.mode); markAIVaultActivity(); res.json({ success: true, ...result }); } catch (err: any) { res.status(400).json({ success: false, error: err.message || "Failed to import backup." }); } });
  app.get("/api/ai/keys/auto-lock", (_req, res) => res.json({ success: true, autoLock: getAIVaultAutoLockStatus() }));
  app.patch("/api/ai/keys/auto-lock", (req, res) => { try { const parsed = aiVaultAutoLockSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") }); const autoLock = updateAIVaultAutoLockConfig(parsed.data); markAIVaultActivity(); res.json({ success: true, autoLock }); } catch (err: any) { res.status(400).json({ success: false, error: err.message || "Failed to update auto-lock." }); } });
  app.post("/api/ai/keys/auto-lock/disarm", (_req, res) => { disarmAIVaultAutoLock(); res.json({ success: true, autoLock: getAIVaultAutoLockStatus() }); });

  // AI Vault APIs aligning with frontend fetch expectations in aiSettingsApi.ts
  app.get("/api/ai/vault/status", async (_req, res) => {
    try {
      res.json({ success: true, vault: await getAIVaultSecurityStatus() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to get AI vault status." });
    }
  });
  app.get("/api/ai/vault/auto-lock", (_req, res) => {
    res.json({ success: true, autoLock: getAIVaultAutoLockStatus() });
  });
  app.patch("/api/ai/vault/auto-lock", (req, res) => {
    try {
      const parsed = aiVaultAutoLockSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") });
      const autoLock = updateAIVaultAutoLockConfig(parsed.data);
      markAIVaultActivity();
      res.json({ success: true, autoLock });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || "Failed to update auto-lock." });
    }
  });
  app.post("/api/ai/vault/passphrase", async (req, res) => {
    try {
      const parsed = aiVaultPassphraseSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") });
      await setupAIVaultPassphrase(parsed.data.passphrase);
      res.json({ success: true, vault: await getAIVaultSecurityStatus() });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || "Failed to set up AI vault." });
    }
  });
  app.post("/api/ai/vault/unlock", async (req, res) => {
    try {
      const parsed = aiVaultPassphraseSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") });
      await unlockAIVault(parsed.data.passphrase);
      res.json({ success: true, vault: await getAIVaultSecurityStatus() });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || "Failed to unlock AI vault." });
    }
  });
  app.post("/api/ai/vault/lock", async (_req, res) => {
    try {
      await lockAIVault();
      res.json({ success: true, vault: await getAIVaultSecurityStatus() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to lock AI vault." });
    }
  });
  app.get("/api/ai/prompts", async (_req, res) => { try { res.json({ success: true, templates: await listPromptTemplates() }); } catch (err: any) { res.status(500).json({ success: false, error: err.message || "Failed to list prompt templates." }); } });
  app.post("/api/ai/prompts/version", async (req, res) => { try { const parsed = aiPromptVersionCreateSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") }); const template = await createPromptVersion(parsed.data); res.json({ success: true, template }); } catch (err: any) { res.status(400).json({ success: false, error: err.message || "Failed to create prompt version." }); } });
  app.post("/api/ai/prompts/activate", async (req, res) => { try { const parsed = aiPromptActivateSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") }); const template = await activatePromptVersion(parsed.data.task, parsed.data.version); res.json({ success: true, template }); } catch (err: any) { res.status(400).json({ success: false, error: err.message || "Failed to activate prompt version." }); } });
  app.get("/api/ai/usage", async (_req, res) => res.json({ success: true, logs: await readAIUsageLogs(200) }));
  app.delete("/api/ai/usage", async (_req, res) => { await clearAIUsageLogs(); res.json({ success: true }); });
  app.get("/api/ai/logs", async (_req, res) => res.json({ success: true, logs: await readAIUsageLogs(200) }));
  app.delete("/api/ai/logs", async (_req, res) => { await clearAIUsageLogs(); res.json({ success: true }); });
  app.get("/api/ai/metrics", async (req, res) => { try { const hours = Number(req.query.hours ?? 24); res.json({ success: true, report: await buildAIUsageMetrics(hours) }); } catch (err: any) { res.status(500).json({ success: false, error: err.message || "Failed to build AI usage metrics." }); } });
  app.get("/api/ai/doctor/preflight", async (_req, res) => { try { res.json({ success: true, result: await runAIPreflight() }); } catch (err: any) { res.status(500).json({ success: false, error: err.message || "AI preflight failed." }); } });
  app.get("/api/ai/router/diagnose", async (_req, res) => { try { res.json({ success: true, result: await diagnoseAIRouter() }); } catch (err: any) { res.status(500).json({ success: false, error: err.message || "AI router diagnose failed." }); } });

  // ═══════════════════════════════════════════════════════════════════
  // AI Fabric — lớp dispatch thống nhất API / Web AI / Local LLM
  // ═══════════════════════════════════════════════════════════════════
  app.post("/api/ai-fabric/dispatch", async (req, res) => {
    try {
      const { text, task, domain, webPlatform, profileId, localFallback, systemInstruction } = (req.body || {}) as {
        text?: string; task?: string; domain?: string; webPlatform?: string; profileId?: string; localFallback?: boolean; systemInstruction?: string;
      };
      if (!text || typeof text !== "string" || text.trim().length === 0) {
        return res.status(400).json({ ok: false, error: "Missing or empty 'text' field." });
      }
      const run = await dispatchTextThroughFabric(text.trim(), systemInstruction, {
        task, domain: domain as AIFabricOptions["domain"],
        webPlatform, profileId, localFallback,
      });
      res.json({ ok: true, run });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message || "AI Fabric dispatch failed." });
    }
  });

  app.get("/api/ai-fabric/health", async (_req, res) => {
    try {
      const health = await checkFabricHealth();
      res.json({ ok: true, health });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message || "AI Fabric health check failed." });
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // Agent Control Plane — điều phối AI → IDE → Connector
  // ═══════════════════════════════════════════════════════════════════
  app.post("/api/control-plane/run", async (req, res) => {
    try {
      const options = (req.body || {}) as AgentControlPlaneOptions;
      if (!options.goal) return res.status(400).json({ success: false, error: "Missing 'goal' field." });
      const run = await executeControlPlaneRun(options);
      res.json({ success: true, run });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Control plane run failed." });
    }
  });

  app.get("/api/control-plane/runs", async (_req, res) => {
    try { res.json({ success: true, runs: listControlPlaneRuns() }); }
    catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
  });

  app.get("/api/control-plane/runs/:id", async (req, res) => {
    try {
      const run = getControlPlaneRun(req.params.id);
      if (!run) return res.status(404).json({ success: false, error: "Run not found." });
      res.json({ success: true, run });
    } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
  });

  app.get("/api/control-plane/metrics", async (_req, res) => {
    try { res.json({ success: true, metrics: getControlPlaneMetrics() }); }
    catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
  });

  app.post("/api/control-plane/cleanup", async (_req, res) => {
    try { res.json({ success: true, cleaned: cleanupStaleRuns() }); }
    catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
  });

  // ═══════════════════════════════════════════════════════════════════
  // Agentic Loop Engine — vòng lặp Plan→Do→Observe→Replan
  // ═══════════════════════════════════════════════════════════════════
  app.post("/api/agent-loop/run", async (req, res) => {
    try {
      const options = (req.body || {}) as AgenticLoopOptions;
      if (!options.goal) return res.status(400).json({ success: false, error: "Missing 'goal' field." });
      const run = await runAgenticLoop(options);
      res.json({ success: true, run });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Agentic loop failed." });
    }
  });

  app.post("/api/agent-loop/:id/stop", async (req, res) => {
    try {
      const stopped = stopAgenticLoop(req.params.id, req.body?.reason);
      res.json({ success: true, stopped });
    } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
  });

  app.get("/api/agent-loop/runs", async (_req, res) => {
    try { res.json({ success: true, runs: listAgenticLoopRuns() }); }
    catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
  });

  app.get("/api/agent-loop/runs/:id", async (req, res) => {
    try {
      const run = getAgenticLoopRun(req.params.id);
      if (!run) return res.status(404).json({ success: false, error: "Loop run not found." });
      res.json({ success: true, run });
    } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
  });

  app.get("/api/agent-loop/metrics", async (_req, res) => {
    try { res.json({ success: true, metrics: getAgenticLoopMetrics() }); }
    catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
  });

  app.post("/api/agent-loop/cleanup", async (_req, res) => {
    try { res.json({ success: true, cleaned: cleanupStaleLoops() }); }
    catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
  });

  // ═══════════════════════════════════════════════════════════════════
  // Agent Memory Store — bộ nhớ dài hạn cho agent
  // ═══════════════════════════════════════════════════════════════════
  app.post("/api/agent-memory", async (req, res) => {
    try {
      const record = await createAgentMemory(req.body || {});
      res.json({ success: true, record });
    } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
  });

  app.get("/api/agent-memory/search", async (req, res) => {
    try {
      const q = typeof req.query.q === "string" ? req.query.q : "";
      const limit = Number(req.query.limit ?? 20);
      const includeDrafts = req.query.includeDrafts === "true";
      const results = await searchAgentMemory(q, { limit, includeDrafts });
      res.json({ success: true, results });
    } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
  });

  app.patch("/api/agent-memory/:id/review", async (req, res) => {
    try {
      const status = req.body?.status as "reviewed" | "rejected";
      if (!status || !["reviewed", "rejected"].includes(status)) {
        return res.status(400).json({ success: false, error: "Invalid status. Use 'reviewed' or 'rejected'." });
      }
      const record = await reviewAgentMemory(req.params.id, status);
      res.json({ success: true, record });
    } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
  });

  // ═══════════════════════════════════════════════════════════════════
  // Compound Memory — 3 tầng: session / short-term / long-term
  // ═══════════════════════════════════════════════════════════════════
  app.get("/api/memory/search", async (req, res) => {
    try {
      const q = typeof req.query.q === "string" ? req.query.q : "";
      const domain = typeof req.query.domain === "string" ? req.query.domain : undefined;
      const limit = Number(req.query.limit ?? 20);
      const results = await searchMemory(q, { domain, limit });
      res.json({ success: true, results });
    } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
  });

  app.get("/api/memory/stats", async (_req, res) => {
    try { res.json({ success: true, stats: await getMemoryStats() }); }
    catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
  });

  app.post("/api/memory/observation", async (req, res) => {
    try {
      const { domain, title, content, confidence, source, success } = req.body || {};
      if (!domain || !title || !content) return res.status(400).json({ success: false, error: "Missing 'domain', 'title', or 'content'." });
      const record = await recordObservation(
        domain, title, content,
        confidence ?? 0.5,
        source || "api",
        success ?? true
      );
      res.json({ success: true, record });
    } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
  });

  app.post("/api/memory/promote", async (req, res) => {
    try {
      const { id, curatedTitle, curatedContent } = req.body || {};
      if (!id) return res.status(400).json({ success: false, error: "Missing memory 'id'." });
      const ok = await promoteToLongTerm(id, curatedTitle, curatedContent);
      if (!ok) return res.status(404).json({ success: false, error: "Memory record not found." });
      res.json({ success: true, promoted: true });
    } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
  });

  app.post("/api/memory/cleanup", async (_req, res) => {
    try { res.json({ success: true, cleaned: await cleanExpiredShortTerm() }); }
    catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
  });

  app.post("/api/memory/clear-session", async (_req, res) => {
    try { clearSessionMemory(); res.json({ success: true }); }
    catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
  });

  // ═══════════════════════════════════════════════════════════════════
  // Platform Account Broker — quản lý tài khoản nền tảng
  // ═══════════════════════════════════════════════════════════════════
  app.get("/api/platform-accounts/snapshot", async (_req, res) => {
    try {
      const snapshot = await PlatformAccountBroker.getSnapshot();
      res.json({ success: true, snapshot });
    } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
  });

  app.get("/api/platform-accounts/resources", async (req, res) => {
    try {
      const platform = typeof req.query.platform === "string" ? req.query.platform : undefined;
      const snapshot = await PlatformAccountBroker.getSnapshot(platform);
      res.json({ success: true, resources: snapshot.resources, summary: snapshot.summary });
    } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
  });

  // ═══════════════════════════════════════════════════════════════════
  // Session Lease Manager — quản lý phiên thuê tài nguyên
  // ═══════════════════════════════════════════════════════════════════
  app.get("/api/session-leases", async (_req, res) => {
    try {
      const leases = await SessionLeaseManager.listActiveLeases();
      res.json({ success: true, leases });
    } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
  });

  app.post("/api/session-leases/cleanup", async (_req, res) => {
    try {
      const cleaned = await SessionLeaseManager.cleanupExpiredLeases();
      res.json({ success: true, cleaned });
    } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
  });

  // ═══════════════════════════════════════════════════════════════════
  // Browser Runbook Engine — ghi nhận & replay phiên browser
  // ═══════════════════════════════════════════════════════════════════
  app.post("/api/browser-runbook/start", async (req, res) => {
    try {
      const { platform, profileId, task } = req.body || {};
      if (!platform || !task) return res.status(400).json({ success: false, error: "Missing 'platform' or 'task'." });
      const session = await startBrowserSession(platform, task, profileId);
      res.json({ success: true, session });
    } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
  });

  app.get("/api/browser-runbook/active", async (_req, res) => {
    try { res.json({ success: true, sessions: listActiveBrowserSessions() }); }
    catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
  });

  app.get("/api/browser-runbook/history", async (req, res) => {
    try {
      const limit = Number(req.query.limit ?? 50);
      res.json({ success: true, sessions: await getRunbookHistory(limit) });
    } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
  });

  app.get("/api/browser-runbook/summary", async (_req, res) => {
    try { res.json({ success: true, summary: await getBrowserRunbookSummary() }); }
    catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
  });

  app.get("/api/browser-runbook/:id", async (req, res) => {
    try {
      const session = getActiveBrowserSession(req.params.id);
      if (!session) return res.status(404).json({ success: false, error: "Session not found." });
      res.json({ success: true, session });
    } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
  });

  app.post("/api/browser-runbook/:id/complete", async (req, res) => {
    try {
      const session = await completeBrowserSession(req.params.id, req.body?.result);
      res.json({ success: true, session });
    } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
  });

  app.post("/api/browser-runbook/:id/cancel", async (req, res) => {
    try {
      const ok = await cancelBrowserSession(req.params.id);
      res.json({ success: ok });
    } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
  });

  app.post("/api/browser-runbook/cleanup", async (_req, res) => {
    try { res.json({ success: true, cleaned: await cleanOldRunbookEntries() }); }
    catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
  });

  // ═══════════════════════════════════════════════════════════════════
  // Robot Adapter Boundary — safety envelope cho robot
  // ═══════════════════════════════════════════════════════════════════
  app.get("/api/robot/state", async (_req, res) => {
    try { res.json({ success: true, state: getAdapterState() }); }
    catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
  });

  app.post("/api/robot/command", async (req, res) => {
    try {
      const command = req.body as RobotCommand;
      if (!command || !command.type) return res.status(400).json({ success: false, error: "Missing command." });
      const result = acceptRobotCommand(command);
      res.json({ success: result.accepted, result });
    } catch (err: any) { res.status(400).json({ success: false, error: err.message }); }
  });

  app.post("/api/robot/estop", async (_req, res) => {
    try {
      setEmergencyStop(true);
      res.json({ success: true, message: "Emergency stop activated." });
    } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
  });

  // ═══════════════════════════════════════════════════════════════════
  // Agentic RAG Router — truy xuất tri thức chủ động
  // ═══════════════════════════════════════════════════════════════════
  app.post("/api/rag/query", async (req, res) => {
    try {
      const { query, context, domain, maxRetrievals } = req.body || {};
      if (!query) return res.status(400).json({ success: false, error: "Missing 'query'." });
      const result = await agenticRetrieve(query, context || "", { domain, maxCycles: maxRetrievals ?? 3 });
      res.json({ success: true, result });
    } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
  });

  // ═══════════════════════════════════════════════════════════════════
  // Prompt Optimizer — tự động tinh chỉnh system prompt
  // ═══════════════════════════════════════════════════════════════════
  app.post("/api/prompt/optimize", async (req, res) => {
    try {
      const { roleId, domain, currentPrompt } = req.body || {};
      if (!roleId || !domain || !currentPrompt) return res.status(400).json({ success: false, error: "Missing 'roleId', 'domain', or 'currentPrompt'." });
      const result = await analyzeAndOptimize(roleId, domain, currentPrompt);
      res.json({ success: true, result });
    } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
  });

  // ═══════════════════════════════════════════════════════════════════
  // Video & Media Maker Studio
  // ═══════════════════════════════════════════════════════════════════
  app.use("/api/video-maker", videoMakerRoutes);

  // ═══════════════════════════════════════════════════════════════════
  // AI Workforce Task Board (Kanban)
  // ═══════════════════════════════════════════════════════════════════
  app.use("/api/ai-tasks", aiTaskBoardRoutes);

  // ═══════════════════════════════════════════════════════════════════
  // AI Local Office Agent (Thao tác File)
  // ═══════════════════════════════════════════════════════════════════
  app.use("/api/local-office", localOfficeRoutes);

  // ═══════════════════════════════════════════════════════════════════
  // AI Workforce Health & Stream — background engine cho frontend
  // ═══════════════════════════════════════════════════════════════════

  // Lightweight health snapshot — dùng cho background polling, trả về nhanh
  app.get("/api/ai-workforce/health", async (_req, res) => {
    try {
      const snapshot = await getAIWorkforceHealthSnapshot();
      res.json({ success: true, snapshot });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "AI workforce health check failed." });
    }
  });

  // Server-Sent Events stream — frontend subscribe nhận push update
  // Không block UI, chạy ngầm hoàn toàn
  const sseClients = new Set<import("http").ServerResponse>();

  app.get("/api/ai-workforce/stream", async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
    sseClients.add(res);

    // Gửi snapshot ngay khi kết nối
    try {
      const snapshot = await getAIWorkforceHealthSnapshot();
      res.write(`event: health\ndata: ${JSON.stringify(snapshot)}\n\n`);
    } catch { /* ignore */ }

    // Heartbeat mỗi 30s để giữ kết nối và cập nhật trạng thái
    const heartbeat = setInterval(async () => {
      try {
        const snapshot = await getAIWorkforceHealthSnapshot();
        res.write(`event: health\ndata: ${JSON.stringify(snapshot)}\n\n`);
      } catch {
        res.write("event: ping\ndata: {}\n\n");
      }
    }, 30_000);

    req.on("close", () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Agent System Routes — Loop Jobs, Circuit Breaker, Performance Ledger
  // ═══════════════════════════════════════════════════════════════════
  registerAgentSystemRoutes(app);

  // ═══════════════════════════════════════════════════════════════════
  // Cost Observability — theo dõi chi phí token/$
  // ═══════════════════════════════════════════════════════════════════
  app.get("/api/cost/report", async (req, res) => {
    try {
      const days = Number(req.query.days ?? 30);
      const report = getCostSnapshot(days);
      res.json({ success: true, report });
    } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
  });

  // ═══════════════════════════════════════════════════════════════════
  // Dynamic Module Loader — Auto registration for modular monolith
  // ═══════════════════════════════════════════════════════════════════
  const moduleLoadResult = await loadAllModules(app);
  registerModuleRegistryEndpoint(app, moduleLoadResult);

  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.use((_req, res) => res.sendFile(path.join(process.cwd(), "dist", "index.html")));
  } else {
    const vitePkg = "vi" + "te";
    const { createServer: createViteServer } = await import(vitePkg);
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  }
  const host = process.env.HOST || (process.env.ELECTRON_DESKTOP === "true" ? "127.0.0.1" : "0.0.0.0");
  return new Promise<void>((resolve) => { app.listen(PORT, host, () => { console.log(`LedgerFlow server running on http://${host}:${PORT}`); resolve(); }); });
}

startServer().catch((error) => { console.error("❌ Failed to start server", error); process.exit(1); });
