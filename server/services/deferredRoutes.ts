/**
 * Deferred Routes Registration
 * 
 * This module contains all routes that are loaded on-demand
 * to improve server startup time.
 * 
 * These routes are registered when the first request to a
 * deferred path is made.
 */

import type { Express } from "express";
import { z } from "zod";

// ==========================================================================
// LAZY MODULE LOADERS
// ==========================================================================

// AI Module Loader
let aiModule: any = null;
async function getAIModule() {
  if (!aiModule) {
    aiModule = await import("./aiClient");
  }
  return aiModule;
}

// AI Key Vault Loader
let aiKeyVaultModule: any = null;
async function getAIKeyVaultModule() {
  if (!aiKeyVaultModule) {
    aiKeyVaultModule = await import("./aiKeyVault");
  }
  return aiKeyVaultModule;
}

// AI Router Loader
let aiRouterModule: any = null;
async function getAIRouterModule() {
  if (!aiRouterModule) {
    aiRouterModule = await import("./aiRouter");
  }
  return aiRouterModule;
}

// AI Doctor Loader
let aiDoctorModule: any = null;
async function getAIDoctorModule() {
  if (!aiDoctorModule) {
    aiDoctorModule = await import("./aiDoctor");
  }
  return aiDoctorModule;
}

// AI Usage Log Loader
let aiUsageLogModule: any = null;
async function getAIUsageLogModule() {
  if (!aiUsageLogModule) {
    aiUsageLogModule = await import("./aiUsageLog");
  }
  return aiUsageLogModule;
}

// AI Usage Metrics Loader
let aiUsageMetricsModule: any = null;
async function getAIUsageMetricsModule() {
  if (!aiUsageMetricsModule) {
    aiUsageMetricsModule = await import("./aiUsageMetrics");
  }
  return aiUsageMetricsModule;
}

// AI Prompt Registry Loader
let aiPromptRegistryModule: any = null;
async function getAIPromptRegistryModule() {
  if (!aiPromptRegistryModule) {
    aiPromptRegistryModule = await import("./aiPromptRegistry");
  }
  return aiPromptRegistryModule;
}

// AI Vault Auto Lock Loader
let aiVaultAutoLockModule: any = null;
async function getAIVaultAutoLockModule() {
  if (!aiVaultAutoLockModule) {
    aiVaultAutoLockModule = await import("./aiVaultAutoLock");
  }
  return aiVaultAutoLockModule;
}

// Integration Registry Loader
let integrationRegistryModule: any = null;
async function getIntegrationRegistryModule() {
  if (!integrationRegistryModule) {
    integrationRegistryModule = await import("./integrationRegistry");
  }
  return integrationRegistryModule;
}

// GitHub Connector Loader
let githubConnectorModule: any = null;
async function getGitHubConnectorModule() {
  if (!githubConnectorModule) {
    githubConnectorModule = await import("./githubConnector");
  }
  return githubConnectorModule;
}

// GitHub Artifacts Loader
let githubArtifactsModule: any = null;
async function getGitHubArtifactsModule() {
  if (!githubArtifactsModule) {
    githubArtifactsModule = await import("./githubArtifacts");
  }
  return githubArtifactsModule;
}

// Local Tool Connector Loader
let localToolConnectorModule: any = null;
async function getLocalToolConnectorModule() {
  if (!localToolConnectorModule) {
    localToolConnectorModule = await import("./localToolConnector");
  }
  return localToolConnectorModule;
}

// Connector Contract Loader
let connectorContractModule: any = null;
async function getConnectorContractModule() {
  if (!connectorContractModule) {
    connectorContractModule = await import("./connectorContract");
  }
  return connectorContractModule;
}

// IDE Bridge Loader
let ideBridgeModule: any = null;
async function getIDEBridgeModule() {
  if (!ideBridgeModule) {
    ideBridgeModule = await import("./ideBridge");
  }
  return ideBridgeModule;
}

// Accounting Routes Loader
let accountingRoutesModule: any = null;
async function getAccountingRoutesModule() {
  if (!accountingRoutesModule) {
    accountingRoutesModule = await import("./accountingRoutes");
  }
  return accountingRoutesModule;
}

// ==========================================================================
// SCHEMAS (moved from server.ts to keep them lazy)
// ==========================================================================

const geminiGenerateSchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty"),
  model: z.string().optional(),
  task: z.enum(["general", "code", "analysis", "creative", "data"]).optional(),
  history: z.array(z.object({ role: z.enum(["user", "model"]), text: z.string().optional() })).optional(),
  systemInstruction: z.string().optional(),
  file: z.object({ data: z.string(), mimeType: z.string() }).optional()
});

const aiKeyCreateSchema = z.object({
  provider: z.enum(["gemini", "groq", "openrouter", "anthropic", "ollama", "openai", "deepseek"]),
  label: z.string().optional(),
  apiKey: z.string().optional(),
  model: z.string().optional(),
  baseUrl: z.string().optional(),
  priority: z.number().optional(),
  enabled: z.boolean().optional()
});

const aiKeyUpdateSchema = aiKeyCreateSchema.partial().extend({
  lastStatus: z.enum(["ok", "error", "quota", "untested"]).optional(),
  lastError: z.string().optional()
});

const aiBackupExportSchema = z.object({
  passphrase: z.string().min(8, "Mật khẩu backup phải có ít nhất 8 ký tự.")
});

const aiBackupImportSchema = z.object({
  passphrase: z.string().min(8, "Mật khẩu backup phải có ít nhất 8 ký tự."),
  mode: z.enum(["merge", "replace"]).default("merge"),
  backup: z.object({
    version: z.literal(1),
    app: z.literal("LedgerFlow Studio"),
    exportedAt: z.string(),
    kdf: z.literal("scrypt"),
    cipher: z.literal("aes-256-gcm"),
    salt: z.string(),
    iv: z.string(),
    tag: z.string(),
    payload: z.string(),
    note: z.string()
  })
});

const aiVaultPassphraseSchema = z.object({
  passphrase: z.string().min(8, "Mật khẩu AI Vault phải có ít nhất 8 ký tự.")
});

const aiVaultAutoLockSchema = z.object({
  enabled: z.boolean().optional(),
  timeoutMinutes: z.number().min(1).max(1440).optional()
});

const aiPromptVersionCreateSchema = z.object({
  task: z.enum(["general", "code", "analysis", "creative", "data"]),
  content: z.string().min(1),
  note: z.string().optional(),
  createdBy: z.string().optional(),
  activate: z.boolean().optional(),
  label: z.string().optional(),
  description: z.string().optional()
});

const aiPromptActivateSchema = z.object({
  task: z.enum(["general", "code", "analysis", "creative", "data"]),
  version: z.number().int().min(1)
});

const integrationPatchSchema = z.object({
  enabled: z.boolean().optional(),
  status: z.enum(["connected", "local", "manual", "planned", "error"]).optional(),
  priority: z.enum(["P0", "P1", "P2", "P3"]).optional(),
  url: z.string().optional(),
  localCommand: z.string().optional(),
  notes: z.string().optional()
});

const integrationEventSchema = z.object({
  type: z.enum(["status", "test", "config", "handoff", "note"]).default("note"),
  level: z.enum(["info", "success", "warning", "error"]).default("info"),
  message: z.string().min(1)
});

const githubIssueSchema = z.object({
  repo: z.string().optional(),
  title: z.string().min(3, "Tiêu đề issue phải có ít nhất 3 ký tự."),
  body: z.string().optional(),
  labels: z.array(z.string()).optional()
});

const githubApprovedChangeSchema = z.object({
  repo: z.string().optional(),
  title: z.string().min(3, "Tiêu đề PR phải có ít nhất 3 ký tự."),
  summary: z.string().min(10, "Summary phải đủ rõ để review."),
  approvalPhrase: z.literal("APPROVE AI GITHUB PUSH"),
  baseBranch: z.string().optional(),
  branchName: z.string().optional(),
  draft: z.boolean().optional(),
  files: z.array(z.object({ path: z.string().min(1), content: z.string() })).min(1).max(10)
});

const githubClosePullRequestSchema = z.object({
  repo: z.string().optional(),
  reason: z.string().min(10, "Reason đóng PR phải đủ rõ để audit."),
  rollbackNote: z.string().min(10, "Rollback note phải đủ rõ để review."),
  approvalPhrase: z.literal("APPROVE AI GITHUB CLOSE")
});

const localToolOpenSchema = z.object({
  tool: z.enum(["vscode", "cursor", "github", "actions"])
});

// ==========================================================================
// HELPER FUNCTIONS (moved from server.ts)
// ==========================================================================

function resolveProxyModel(model?: string): string {
  if (!model) return "ai-assistant";
  const normalized = model.toLowerCase();
  return normalized.includes("pro") || normalized.includes("3.5") || normalized.includes("advanced")
    ? "ai-assistant-pro"
    : "ai-assistant";
}

function isRateLimitOrQuotaError(err: any): boolean {
  const text = `${err?.status || ""} ${err?.message || ""} ${JSON.stringify(err?.body || {})}`.toLowerCase();
  return text.includes("429") || text.includes("quota") || 
    text.includes("resource_exhausted") || text.includes("rate limit") || 
    text.includes("too many requests");
}

// ==========================================================================
// ROUTE REGISTRATION
// ==========================================================================

/**
 * Register all deferred routes
 * This is called on-demand when the first deferred route is accessed
 */
export async function registerDeferredRoutes(app: Express): Promise<void> {
  console.log("📦 Loading deferred routes on demand...");
  
  // ======================================================================
  // AI ROUTES
  // ======================================================================
  
  const aiClient = await getAIModule();
  const aiKeyVault = await getAIKeyVaultModule();
  const aiRouter = await getAIRouterModule();
  const aiDoctor = await getAIDoctorModule();
  const aiUsageLog = await getAIUsageLogModule();
  const aiUsageMetrics = await getAIUsageMetricsModule();
  const aiPromptRegistry = await getAIPromptRegistryModule();
  const aiVaultAutoLock = await getAIVaultAutoLockModule();
  
  // Helper functions for AI
  async function resolveSystemInstruction(input: any): Promise<string | undefined> {
    if (input.systemInstruction) return input.systemInstruction;
    if (!input.task) return undefined;
    const active = await aiPromptRegistry.getActivePrompt(input.task);
    return active?.content;
  }
  
  function buildAIMessages(input: any, resolvedSystemInstruction?: string) {
    const messages: any[] = [];
    if (resolvedSystemInstruction) messages.push({ role: "system", content: resolvedSystemInstruction });
    if (input.history) {
      for (const msg of input.history) {
        if (msg.text) messages.push({ role: msg.role === "user" ? "user" : "assistant", content: msg.text });
      }
    }
    messages.push({ 
      role: "user", 
      content: input.file ? `${input.prompt}\n\n[Attached ${input.file.mimeType} as base64; current text gateway does not parse binary content directly.]` : input.prompt 
    });
    return messages;
  }
  
  // AI Generation
  app.post("/api/gemini/generate", async (req, res) => {
    try {
      const parsed = geminiGenerateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues.map(i => i.message).join(", ") });
      }
      const systemInstruction = await resolveSystemInstruction(parsed.data);
      const result = await aiClient.callAI(
        buildAIMessages(parsed.data, systemInstruction),
        { model: resolveProxyModel(parsed.data.model), task: parsed.data.task }
      );
      res.json({ success: true, text: result.text, provider: result.provider, model: result.model, usage: result.usage });
    } catch (error: any) {
      const isQuota = isRateLimitOrQuotaError(error);
      res.status(isQuota ? 429 : 500).json({
        error: error.message || "AI proxy failed",
        isQuota,
        provider: error.provider,
        model: error.model
      });
    }
  });
  
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const parsed = geminiGenerateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues.map(i => i.message).join(", ") });
      }
      const systemInstruction = await resolveSystemInstruction(parsed.data);
      const result = await aiClient.callAI(
        buildAIMessages(parsed.data, systemInstruction),
        { model: resolveProxyModel(parsed.data.model), task: parsed.data.task }
      );
      res.json({ success: true, ...result });
    } catch (error: any) {
      const isQuota = isRateLimitOrQuotaError(error);
      res.status(isQuota ? 429 : 500).json({
        error: error.message || "AI proxy failed",
        isQuota,
        provider: error.provider,
        model: error.model
      });
    }
  });
  
  app.post("/api/ai/chat/stream", async (req, res) => {
    try {
      const parsed = geminiGenerateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues.map(i => i.message).join(", ") });
        return;
      }
      const systemInstruction = await resolveSystemInstruction(parsed.data);
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      for await (const chunk of aiClient.streamAI(
        buildAIMessages(parsed.data, systemInstruction),
        { model: resolveProxyModel(parsed.data.model), task: parsed.data.task }
      )) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error: any) {
      res.write(`data: ${JSON.stringify({ error: error.message || "AI stream failed" })}\n\n`);
      res.end();
    }
  });
  
  app.get("/api/ai/health", async (_req, res) => {
    try {
      res.json({ success: true, ...(await aiClient.checkAIProxyHealth()) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "AI proxy health check failed." });
    }
  });
  
  app.get("/api/ai/preflight", async (_req, res) => {
    try {
      res.json({ success: true, report: await aiDoctor.runAIPreflight() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "AI preflight failed." });
    }
  });
  
  app.get("/api/ai/diagnostics", async (_req, res) => {
    try {
      const result = await aiRouter.diagnoseAIRouter();
      res.json({ success: true, results: result.results });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "AI diagnostics failed." });
    }
  });
  
  app.get("/api/ai/providers", (_req, res) => {
    res.json({ success: true, providers: aiKeyVault.getSupportedAIProviders() });
  });
  
  // AI Keys
  app.get("/api/ai/keys", async (_req, res) => {
    res.json({
      success: true,
      keys: await aiKeyVault.listAIKeys(),
      security: await aiKeyVault.getAIVaultSecurityStatus(),
      autoLock: aiVaultAutoLock.getAIVaultAutoLockStatus()
    });
  });
  
  app.post("/api/ai/keys", async (req, res) => {
    try {
      const parsed = aiKeyCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") });
      }
      const key = await aiKeyVault.createAIKey(parsed.data);
      aiVaultAutoLock.markAIVaultActivity();
      res.json({
        success: true,
        key,
        security: await aiKeyVault.getAIVaultSecurityStatus(),
        autoLock: aiVaultAutoLock.getAIVaultAutoLockStatus()
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || "Failed to create AI key." });
    }
  });
  
  // More AI routes can be added here...
  
  console.log("✅ Deferred routes loaded successfully");
}

// ==========================================================================
// SIMPLIFIED ROUTE REGISTRATION FOR NOW
// For full implementation, all routes from server.ts should be moved here
// and loaded lazily
// ==========================================================================

