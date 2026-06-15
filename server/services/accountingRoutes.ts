// @ts-nocheck
import type { Express } from "express";
import { createClient } from "@supabase/supabase-js";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { callAI } from "./aiClient";
import { getAgentRole, listAgentRoles } from "./agentRoles";
import { registerBrief3Routes } from "./brief3Routes";
import { getCronStatus, startCronScheduler, triggerJobNow } from "./cronScheduler";
import { getGitHubSummary } from "./githubConnector";
import { extractInvoiceFromImage } from "./invoiceOCR";
import { getPipelineById, listPipelineTypes, PIPELINE_TEMPLATES, resumePipeline, startPipeline, type PipelineType } from "./pipelineOrchestrator";
import { aiClassifyUnknown, reconcileStatement } from "./vietqrReconciler";

let securityInstalled = false;

const transactionSchema = z.object({ id: z.string().optional(), date: z.string().min(1), description: z.string().default(""), amount: z.number(), balance: z.number().default(0), bank: z.string().optional(), accountNo: z.string().optional() });
const reconcileSchema = z.object({ transactions: z.array(transactionSchema).min(1, "transactions array required"), useAI: z.boolean().optional().default(true) });
const invoiceOcrSchema = z.object({ imageBase64: z.string().min(20, "imageBase64 required"), mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]).default("image/jpeg") });
const pipelineStartSchema = z.object({ pipelineType: z.string().min(1), input: z.record(z.string(), z.unknown()).optional().default({}), userId: z.string().optional().default("local") });
const pipelineApproveSchema = z.object({ userId: z.string().optional().default("local") });
const cronTriggerSchema = z.object({ jobName: z.enum(["daily_brief", "weekly_report", "monthly_close_reminder"]), userId: z.string().uuid() });
const notificationTestSchema = z.object({ userId: z.string().uuid(), message: z.string().optional() });

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) throw new Error("SUPABASE_URL và SUPABASE_SERVICE_KEY chưa cấu hình.");
  return createClient(url, key);
}

function installSecurityHardening(app: Express) {
  if (securityInstalled) return;
  securityInstalled = true;

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'", "https://*.supabase.co", "https://api.anthropic.com", "https://generativelanguage.googleapis.com"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  const agentRateLimit = rateLimit({ windowMs: 60_000, max: 30, message: { error: "Quá nhiều AI requests. Vui lòng chờ 1 phút." }, standardHeaders: true, legacyHeaders: false, validate: { trustProxy: false } });
  const generalRateLimit = rateLimit({ windowMs: 60_000, max: 200, message: { error: "Quá nhiều requests." }, standardHeaders: true, legacyHeaders: false, validate: { trustProxy: false } });
  app.use("/api/agents/", agentRateLimit);
  app.use("/api/pipelines/", agentRateLimit);
  app.use("/api/", generalRateLimit);
}

export function registerAccountingRoutes(app: Express) {
  installSecurityHardening(app);
  startCronScheduler();

  app.get("/api/cron/status", (_req, res) => res.json({ success: true, jobs: getCronStatus() }));
  app.post("/api/cron/trigger", async (req, res) => {
    try { const parsed = cronTriggerSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map((issue) => issue.message).join(", ") }); res.json(await triggerJobNow(parsed.data.jobName, parsed.data.userId)); }
    catch (err: any) { res.status(500).json({ success: false, error: err?.message || String(err) }); }
  });

  app.get("/api/notifications", (_req, res) => res.json({ success: true, message: "Use Supabase Realtime client-side for notifications." }));
  app.post("/api/notifications/test", async (req, res) => {
    try {
      const parsed = notificationTestSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map((issue) => issue.message).join(", ") });
      const { userId, message } = parsed.data;
      const { error } = await supabaseAdmin().from("notifications").insert({ user_id: userId, title: "Test Notification", content: message || "Realtime notifications đang hoạt động! 🎉", type: "info", is_read: false });
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) { res.status(500).json({ success: false, error: err?.message || String(err) }); }
  });

  app.get("/api/agents/roles", (_req, res) => res.json({ success: true, roles: listAgentRoles() }));
  app.get("/api/agents/roles/:id", (req, res) => { const role = getAgentRole(req.params.id); if (!role) return res.status(404).json({ success: false, error: "Agent role not found." }); res.json({ success: true, role }); });
  app.get("/api/pipelines/types", (_req, res) => res.json({ success: true, types: listPipelineTypes() }));

  app.post("/api/pipelines/start", async (req, res) => {
    try {
      const parsed = pipelineStartSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map((issue) => issue.message).join(", ") });
      if (!PIPELINE_TEMPLATES[parsed.data.pipelineType as PipelineType]) return res.status(400).json({ success: false, error: "Invalid pipelineType" });
      const pipeline = await startPipeline(parsed.data.pipelineType as PipelineType, parsed.data.input, parsed.data.userId);
      res.json({ success: true, pipeline });
    } catch (err: any) { res.status(500).json({ success: false, error: err?.message || "Failed to start pipeline." }); }
  });

  app.post("/api/pipelines/:id/approve", async (req, res) => {
    try { const parsed = pipelineApproveSchema.safeParse(req.body || {}); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map((issue) => issue.message).join(", ") }); const pipeline = await resumePipeline(req.params.id, parsed.data.userId); res.json({ success: true, pipeline }); }
    catch (err: any) { res.status(400).json({ success: false, error: err?.message || "Failed to approve/resume pipeline." }); }
  });

  app.get("/api/pipelines/:id", async (req, res) => {
    try { const pipeline = await getPipelineById(req.params.id); if (!pipeline) return res.status(404).json({ success: false, error: "Pipeline not found or Supabase service key is not configured." }); res.json({ success: true, pipeline }); }
    catch (err: any) { res.status(500).json({ success: false, error: err?.message || "Failed to load pipeline." }); }
  });

  app.get("/api/github/prs", async (req, res) => {
    try { const summary = await getGitHubSummary(typeof req.query.repo === "string" ? req.query.repo : undefined); const pullRequests = summary.openPullRequests.map((pr) => ({ number: pr.number, title: pr.title, state: pr.state, htmlUrl: pr.htmlUrl, updatedAt: pr.updatedAt, labels: pr.labels })); res.json({ success: true, repo: summary.repo, pullRequests, prs: pullRequests, lastCheckedAt: summary.lastCheckedAt }); }
    catch (err: any) { res.status(500).json({ success: false, error: err?.message || "Failed to load GitHub pull requests." }); }
  });

  app.post("/api/accounting/reconcile", async (req, res) => {
    try {
      const parsed = reconcileSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.issues.map((issue) => issue.message).join(", ") });
      const transactions = parsed.data.transactions.map((txn, index) => ({ ...txn, id: txn.id || `txn-${Date.now()}-${index}` }));
      const result = reconcileStatement(transactions);
      if (parsed.data.useAI && result.stats.needsReview > 0) {
        const aiEntries = await aiClassifyUnknown(transactions, async (prompt) => {
          const output = await callAI([{ role: "system", content: "Bạn là kế toán viên Việt Nam chuyên VAS/Thông tư 200. Luôn trả JSON hợp lệ khi được yêu cầu." }, { role: "user", content: prompt }], { model: "ai-assistant" });
          return output.content || output.text || "[]";
        }).catch(() => []);
        for (const aiEntry of aiEntries) { const index = result.entries.findIndex((entry) => entry.transactionId === aiEntry.transactionId); if (index >= 0) result.entries[index] = aiEntry; }
        result.stats.autoClassified = result.entries.filter((entry) => !entry.needsReview).length;
        result.stats.needsReview = result.entries.filter((entry) => entry.needsReview).length;
      }
      res.json({ success: true, result, entries: result.entries, stats: result.stats });
    } catch (err: any) { res.status(500).json({ error: err?.message || "Failed to reconcile bank statement." }); }
  });

  app.post("/api/accounting/invoice-ocr", async (req, res) => {
    try { const parsed = invoiceOcrSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ error: parsed.error.issues.map((issue) => issue.message).join(", ") }); const result = await extractInvoiceFromImage(parsed.data.imageBase64, parsed.data.mimeType); res.json({ success: true, result }); }
    catch (err: any) { res.status(500).json({ error: err?.message || "Failed to OCR invoice." }); }
  });

  registerBrief3Routes(app);
}
