import express from "express";
import http from "node:http";
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
// ── Integration & DevOps (handled via registerIntegrationRoutes) ─────
// ── Accounting & Core Data ────────────────────────────────────────────
import { registerAccountingRoutes } from "./server/services/accountingRoutes";
import { registerAuthRoutes, clearLocalSession, createLocalSession, readLocalServerSession, requireLocalAuth, requireRoles, setLocalSessionCookie } from "./server/services/localAuth";
import { listUsers, createUser, deleteUser } from "./server/services/userAccounts";
import { loadLocalDatabase, saveLocalDatabase } from "./server/services/localDatabase";
import { loadHybridDatabase, saveHybridDatabase, getHybridStorageStatus } from "./server/services/hybridStorageService";
import { getMobileVibeInbox, pushToMobileVibeInbox, pullMobileVibeToDesktop, deleteMobileVibeItem } from "./server/services/mobileVibeBridgeService";
// ── AI Fabric & Control Plane (handled via registerAgentRoutes) ──────
// ── Agentic Loop & Memory (handled via registerAgentRoutes) ──────────
// ── Platform Account & Session Lease (handled via registerSystemRoutes)
// ── Agentic RAG & Prompt Optimizer ───────────────────────────────────
import { agenticRetrieve } from "./server/services/agenticRagRouter";
import { analyzeAndOptimize } from "./server/services/promptOptimizer";
// ── Observability & Cost (handled via registerSystemRoutes) ──────────
// ── AI Workforce Health (handled via registerAgentRoutes) ────────────
import { videoMakerRoutes } from "./server/services/videoMakerRoutes";
import { aiTaskBoardRoutes } from "./server/services/aiTaskBoardRoutes";
import { localOfficeRoutes } from "./server/services/localOfficeRoutes";
import { registerAgentSystemRoutes } from "./server/services/agentSystemRoutes";
import { registerMCPHttpRoutes } from "./server/services/mcpHttpRoutes";
import { hydrateExternalMCPServerCatalog } from "./server/services/mcpClientGateway";
import { registerDormantServicesRoutes } from "./server/services/dormantServicesRouter";
import { startEmployeeMailboxWorker } from "./server/services/webAiEmployeeAdapter";
import { registerBusinessRoutes } from "./server/services/businessDataRoutes";
import { registerAssetFoundryRoutes } from "./server/services/assetFoundryRoutes";
import { registerFoundryOrchestrationRoutes } from "./server/services/foundryOrchestrationRoutes";
import { registerConnectorIntegrationRoutes } from "./server/services/connectorIntegrationRoutes";
import { startGlaciaAutonomousDaemon } from "./server/services/glaciaAutonomousBackgroundRunner";

// ── Core Module Loader (Modular Monolith Setup) ─────────────────────
import { loadAllModules, registerModuleRegistryEndpoint } from "./core/server/module-loader";

// Initialize Glacia Autonomous Silent Background Daemon
try { startGlaciaAutonomousDaemon(30000); } catch {}

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
    service: "LedgerFlow Studio Server", 
    desktop: process.env.ELECTRON_DESKTOP === "true",
    timestamp: new Date().toISOString() 
  }));
  registerAuthRoutes(app);
  app.use("/api", requireLocalAuth);
  registerMCPHttpRoutes(app);

  app.post("/api/client-error", express.json(), (req, res) => {
    console.error("🔴 [ClientError]", req.body);
    res.json({ success: true });
  });

  const STORAGE_FILE = path.join(process.cwd(), "db_storage.json");
  app.get("/api/db/load", async (_req, res) => { try { res.json({ success: true, data: await loadHybridDatabase(STORAGE_FILE) }); } catch (err: any) { res.status(500).json({ success: false, error: err.message || "Failed to load database state." }); } });
  app.post("/api/db/save", async (req, res) => { try { const parsed = databaseSaveSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") }); const result = await saveHybridDatabase(STORAGE_FILE, parsed.data.payload); res.json({ success: true, message: "Database synchronized successfully.", details: result }); } catch (err: any) { res.status(500).json({ success: false, error: err.message || "Failed to save database state." }); } });
  app.get("/api/db/status", async (_req, res) => { try { res.json({ success: true, status: await getHybridStorageStatus(STORAGE_FILE) }); } catch (err: any) { res.status(500).json({ success: false, error: err.message || "Failed to check storage status." }); } });
  app.post("/api/db/sync", async (_req, res) => { try { const data = await loadHybridDatabase(STORAGE_FILE); const result = await saveHybridDatabase(STORAGE_FILE, data); res.json({ success: true, message: "Dual-Engine sync completed.", details: result }); } catch (err: any) { res.status(500).json({ success: false, error: err.message || "Failed to force sync." }); } });

  // ── MobileVibe Companion Security Gate & Satellite Routes ──────────────
  const validateMobileVibeToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const expectedToken = process.env.MOBILE_VIBE_SECRET_TOKEN;
    if (!expectedToken) return next();
    const token = req.headers['x-mobile-vibe-token'] || (typeof req.headers['authorization'] === 'string' ? req.headers['authorization'].replace(/^Bearer\s+/i, '') : '');
    if (token === expectedToken) return next();
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or missing Mobile Vibe Security Token.' });
  };
  app.use('/api/mobile-vibe', validateMobileVibeToken);

  app.get("/api/mobile-vibe/inbox", async (_req, res) => { try { res.json({ success: true, inbox: await getMobileVibeInbox() }); } catch (err: any) { res.status(500).json({ success: false, error: err.message || "Failed to fetch mobile inbox." }); } });
  app.post("/api/mobile-vibe/inbox", async (req, res) => { try { const item = await pushToMobileVibeInbox(req.body); res.json({ success: true, item }); } catch (err: any) { res.status(500).json({ success: false, error: err.message || "Failed to push item to mobile inbox." }); } });
  app.post("/api/mobile-vibe/pull", async (_req, res) => { try { const result = await pullMobileVibeToDesktop(STORAGE_FILE); res.json({ success: true, ...result }); } catch (err: any) { res.status(500).json({ success: false, error: err.message || "Failed to pull mobile inbox to desktop." }); } });
  app.delete("/api/mobile-vibe/inbox/:id", async (req, res) => { try { await deleteMobileVibeItem(req.params.id); res.json({ success: true }); } catch (err: any) { res.status(500).json({ success: false, error: err.message || "Failed to delete item from mobile inbox." }); } });

  registerConnectorIntegrationRoutes(app);

  // ── Background Status Summary (CEO Dashboard badge — no sensitive data) ──
  app.get("/api/background/status", async (_req, res) => {
    try {
      const aiKeys = await listAIKeys();
      const activeKeys = aiKeys.filter((k: any) => k.enabled && k.lastStatus === "ok").length;
      const vaultStatus = await getAIVaultSecurityStatus();
      res.json({
        success: true,
        summary: {
          daemon: true,
          daemonLabel: "Glacia Autonomous Daemon",
          servicesRunning: 6, // AI Gateway, Auth, DB, MobileVibe, Connector, MCP
          aiKeysActive: activeKeys,
          vaultLocked: vaultStatus?.isLocked ?? false,
          tasksQueued: 0,    // placeholder — future: read from task queue
          errorsLast1h: 0,   // placeholder — future: read from error log
          timestamp: new Date().toISOString(),
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to get background status." });
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
  app.get("/api/background/status", async (_req, res) => {
    try {
      res.json({
        success: true,
        status: "ok",
        daemons: {
          glaciaAutonomous: true,
          silentCronScheduler: true,
          employeeMailboxWorker: true,
          weeklyExecutiveReport: true,
          selfAuditEngine: true,
        },
        activeDaemonsCount: 5,
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to get background status." });
    }
  });

  registerAgentSystemRoutes(app);

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

  // ── Cost Dashboard Routes ──
  const { registerCostDashboardRoutes } = await import("./server/services/costDashboardRoutes.ts");
  registerCostDashboardRoutes(app);

  // ── Robot Automation Routes ──
  const { registerRobotAutomationRoutes } = await import("./server/services/robotAutomationRoutes.ts");
  registerRobotAutomationRoutes(app);

  // ═══════════════════════════════════════════════════════════════════
  // Agent System Routes & Dormant Services Router (100% Code Activation)
  // ═══════════════════════════════════════════════════════════════════
  registerAgentSystemRoutes(app);
  registerDormantServicesRoutes(app);
  registerBusinessRoutes(app);
  registerAssetFoundryRoutes(app);
  registerFoundryOrchestrationRoutes(app);

  // AI Employee mailbox worker — nhân viên AI tự "đi làm" định kỳ qua A2A hub.
  startEmployeeMailboxWorker(60_000);

  // Glacia Autonomous Background Daemons, Schedulers & Night Shift
  try {
    const { startGlaciaAutonomousDaemon } = await import("./server/services/glaciaAutonomousBackgroundRunner.ts");
    startGlaciaAutonomousDaemon(30000);
    const { startGlaciaSilentCronScheduler } = await import("./server/services/glaciaSilentCronScheduler.ts");
    startGlaciaSilentCronScheduler(60000);
    const { scheduleWeeklyExecutiveReport } = await import("./server/services/weeklyExecutiveReportEngine.ts");
    scheduleWeeklyExecutiveReport(7 * 24 * 60 * 60 * 1000);
    const { scheduleSelfAuditCron } = await import("./server/services/glaciaSelfAuditEngine.ts");
    scheduleSelfAuditCron(6 * 60 * 60 * 1000);
  } catch (err) {
    console.warn("[Glacia Daemon Boot] Notice:", err);
  }  // ═══════════════════════════════════════════════════════════════════
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
  // ── WebSocket Servers ──
  const server = http.createServer(app);
  const { startCostWebSocketServer } = await import("./server/services/costWebSocketServer.ts");
  startCostWebSocketServer(server);
  const { startRobotHistoryWebSocketServer } = await import("./server/services/robotHistoryWebSocketServer.ts");
  startRobotHistoryWebSocketServer(server);
  const { startTaskStreamWebSocketServer } = await import("./server/services/websocketTaskStream.ts");
  startTaskStreamWebSocketServer(server);

  return new Promise<void>((resolve) => { server.listen(PORT, host, () => { console.log(`LedgerFlow server running on http://${host}:${PORT}`); resolve(); }); });
}

startServer().catch((error) => { console.error("❌ Failed to start server", error); process.exit(1); });
