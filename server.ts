import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { callAI, streamAI, checkAIProxyHealth, type ChatMessage, type CallAIOptions } from "./server/services/aiClient";
import { createAIKey, deleteAIKey, getSupportedAIProviders, listAIKeys, updateAIKey } from "./server/services/aiKeyVault";
import { testAIKey } from "./server/services/aiRouter";

dotenv.config();

const databaseSaveSchema = z.object({ payload: z.record(z.string(), z.any()) });
const geminiGenerateSchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty"),
  model: z.string().optional(),
  history: z.array(z.object({ role: z.enum(["user", "model"]), text: z.string().optional() })).optional(),
  systemInstruction: z.string().optional(),
  file: z.object({ data: z.string(), mimeType: z.string() }).optional()
});
const aiProviderSchema = z.enum(["gemini", "groq", "openrouter", "anthropic", "ollama"]);
const aiKeyCreateSchema = z.object({
  provider: aiProviderSchema,
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
type GeminiGenerateInput = z.infer<typeof geminiGenerateSchema>;

function getSimulatedMarketSurveyResponse(niche: string, direction?: string) {
  return {
    summary: `Mô phỏng nghiên cứu thị trường cho: ${niche}.`,
    metrics: { pricingPreferred: [], painPoints: [], channels: [] },
    personas: [], gaps: [], competitors: [],
    blueprint: { direction: direction || "B2D Tool" },
    sources: [{ title: "Fallback simulator", url: "local" }]
  };
}

function resolveProxyModel(model?: string): NonNullable<CallAIOptions["model"]> {
  if (!model) return "ai-assistant";
  const normalized = model.toLowerCase();
  return normalized.includes("pro") || normalized.includes("3.5") || normalized.includes("advanced") ? "ai-assistant-pro" : "ai-assistant";
}

function buildAIMessages({ prompt, history, systemInstruction, file }: GeminiGenerateInput): ChatMessage[] {
  const messages: ChatMessage[] = [];
  if (systemInstruction) messages.push({ role: "system", content: systemInstruction });
  if (history) {
    for (const msg of history) {
      if (msg.text) messages.push({ role: msg.role === "user" ? "user" : "assistant", content: msg.text });
    }
  }
  messages.push({
    role: "user",
    content: file ? `${prompt}\n\n[Attached ${file.mimeType} as base64; current text gateway does not parse binary content directly.]` : prompt
  });
  return messages;
}

function isRateLimitOrQuotaError(err: any): boolean {
  const text = `${err?.status || ""} ${err?.message || ""} ${JSON.stringify(err?.body || {})}`.toLowerCase();
  return text.includes("429") || text.includes("quota") || text.includes("resource_exhausted") || text.includes("rate limit") || text.includes("too many requests");
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT ?? 3000);
  app.set("trust proxy", 1);
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  app.use((req, res, next) => {
    const allowedOrigins = ["http://localhost:3000", "http://127.0.0.1:3000", "http://0.0.0.0:3000"];
    const origin = req.headers.origin;
    if (origin) {
      const isAllowed = allowedOrigins.includes(origin) || origin.endsWith(".run.app") || /https:\/\/ais-.*\.run\.app/.test(origin);
      if (isAllowed) res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    if (req.method === "OPTIONS") res.sendStatus(204); else next();
  });

  const apiLimiter = rateLimit({
    windowMs: 60_000,
    max: 30,
    message: { error: "Bạn đã đạt giới hạn yêu cầu/phút. Vui lòng thử lại sau.", isRateLimit: true },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false }
  });
  app.use("/api/gemini/", apiLimiter);
  app.use("/api/ai/", apiLimiter);

  app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date() }));

  const STORAGE_FILE = path.join(process.cwd(), "db_storage.json");
  app.get("/api/db/load", async (req, res) => {
    try {
      if (!fs.existsSync(STORAGE_FILE)) return res.json({ success: true, data: {} });
      res.json({ success: true, data: JSON.parse(await fs.promises.readFile(STORAGE_FILE, "utf-8")) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to load database state." });
    }
  });
  app.post("/api/db/save", async (req, res) => {
    try {
      const parsed = databaseSaveSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") });
      await fs.promises.writeFile(STORAGE_FILE, JSON.stringify(parsed.data.payload, null, 2), "utf-8");
      res.json({ success: true, message: "Database synchronized successfully on the server." });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to save database state." });
    }
  });

  app.get("/api/ai/providers", (req, res) => res.json({ success: true, providers: getSupportedAIProviders() }));
  app.get("/api/ai/keys", async (req, res) => {
    try { res.json({ success: true, keys: await listAIKeys() }); }
    catch (err: any) { res.status(500).json({ success: false, error: err.message || "Failed to list AI keys." }); }
  });
  app.post("/api/ai/keys", async (req, res) => {
    try {
      const parsed = aiKeyCreateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") });
      res.json({ success: true, key: await createAIKey(parsed.data) });
    } catch (err: any) { res.status(400).json({ success: false, error: err.message || "Failed to create AI key." }); }
  });
  app.patch("/api/ai/keys/:id", async (req, res) => {
    try {
      const parsed = aiKeyUpdateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") });
      res.json({ success: true, key: await updateAIKey(req.params.id, parsed.data) });
    } catch (err: any) { res.status(400).json({ success: false, error: err.message || "Failed to update AI key." }); }
  });
  app.delete("/api/ai/keys/:id", async (req, res) => {
    try { res.json({ success: true, deleted: await deleteAIKey(req.params.id) }); }
    catch (err: any) { res.status(400).json({ success: false, error: err.message || "Failed to delete AI key." }); }
  });
  app.post("/api/ai/keys/test", async (req, res) => {
    const parsed = aiKeyCreateSchema.pick({ provider: true, apiKey: true, model: true, baseUrl: true }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") });
    const result = await testAIKey(parsed.data);
    res.status(result.success ? 200 : 400).json(result);
  });

  app.get("/api/gemini/status", async (req, res) => {
    const keys = await listAIKeys().catch(() => []);
    const routerHealthy = await checkAIProxyHealth();
    res.json({
      success: true,
      usingCustomKey: keys.length > 0,
      keyName: keys.length > 0 ? `AI Key Vault (${keys.filter(k => k.enabled).length}/${keys.length} enabled)` : "No local AI keys configured",
      isProReady: routerHealthy,
      localKeyCount: keys.length,
      enabledKeyCount: keys.filter(k => k.enabled).length
    });
  });

  app.post("/api/gemini/generate", async (req, res) => {
    try {
      const parsed = geminiGenerateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.issues.map(i => i.message).join(", ") });
      const response = await callAI(buildAIMessages(parsed.data), { model: resolveProxyModel(parsed.data.model) });
      res.json({ success: true, text: response.content, modelUsed: response.modelUsed });
    } catch (err: any) {
      const isQuota = isRateLimitOrQuotaError(err);
      res.status(isQuota ? 400 : 500).json({ success: false, isMissingKey: isQuota, error: err.message || "An error occurred during generation." });
    }
  });

  app.post("/api/gemini/market-survey", async (req, res) => {
    try {
      const { niche, selectedDirection } = req.body;
      const targetNiche = niche || "Phần mềm quản trị B2D hoặc Kế toán SME Việt Nam";
      const prompt = `Return JSON only for market research about ${targetNiche}. Schema: summary, metrics, personas, gaps, competitors, blueprint, sources.`;
      const response = await callAI([{ role: "user", content: prompt }], { model: "ai-assistant-pro", temperature: 0.2 });
      const text = (response.content || "").replace(/```json/g, "").replace(/```/g, "").trim();
      const match = text.match(/\{[\s\S]*\}/);
      const data = JSON.parse(match ? match[0] : text);
      data.modelUsed = response.modelUsed;
      res.json({ success: true, data });
    } catch (err: any) {
      const { niche, selectedDirection } = req.body;
      res.json({ success: true, isSimulatedFallback: true, error: err.message, data: getSimulatedMarketSurveyResponse(niche || "Phần mềm B2D / Kế toán SME Việt Nam", selectedDirection) });
    }
  });

  app.post("/api/gemini/stream", async (req, res) => {
    try {
      const parsed = geminiGenerateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.issues.map(i => i.message).join(", ") });
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();
      for await (const text of streamAI(buildAIMessages(parsed.data), { model: resolveProxyModel(parsed.data.model) })) {
        if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (err: any) {
      if (!res.headersSent) return res.status(400).json({ isMissingKey: isRateLimitOrQuotaError(err), error: err.message || "An error occurred during streaming." });
      res.write(`data: ${JSON.stringify({ error: err.message || "An error occurred during streaming." })}\n\n`);
      res.end();
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log("AI Settings UI: http://127.0.0.1:3000/ai-settings.html");
  });
}

startServer();
