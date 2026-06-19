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
import { appendCompanyOsEvent, createCompanyOsTask, exportCompanyOsAuditLog, getCompanyOsContracts, listCompanyOsControlPlane, simulateOpenClawAction, updateCompanyOsTask } from "./companyOsControlPlane";

let securityInstalled = false;

const transactionSchema = z.object({ id: z.string().optional(), date: z.string().min(1), description: z.string().default(""), amount: z.number(), balance: z.number().default(0), bank: z.string().optional(), accountNo: z.string().optional() });
const reconcileSchema = z.object({ transactions: z.array(transactionSchema).min(1, "transactions array required"), useAI: z.boolean().optional().default(true) });
const invoiceOcrSchema = z.object({ imageBase64: z.string().min(20, "imageBase64 required"), mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]).default("image/jpeg") });
const pipelineStartSchema = z.object({ pipelineType: z.string().min(1), input: z.record(z.string(), z.unknown()).optional().default({}), userId: z.string().optional().default("local") });
const pipelineApproveSchema = z.object({ userId: z.string().optional().default("local") });
const cronTriggerSchema = z.object({ jobName: z.enum(["daily_brief", "weekly_report", "monthly_close_reminder"]), userId: z.string().uuid() });
const notificationTestSchema = z.object({ userId: z.string().uuid(), message: z.string().optional() });
const companyOsEventSchema = z.object({ source: z.enum(["founder", "n8n", "telegram", "openclaw", "dashboard", "system"]).default("dashboard"), eventType: z.string().min(1), title: z.string().min(1), body: z.string().optional(), agentRole: z.string().optional(), taskId: z.string().optional(), risk: z.enum(["low", "medium", "high", "blocked"]).optional(), payload: z.record(z.string(), z.unknown()).optional(), userId: z.string().optional() });
const companyOsTaskSchema = z.object({ title: z.string().min(1), description: z.string().optional(), agentRole: z.string().optional(), source: z.enum(["founder", "n8n", "telegram", "openclaw", "dashboard", "system"]).default("dashboard"), risk: z.enum(["low", "medium", "high", "blocked"]).optional(), status: z.enum(["inbox", "planning", "waiting_approval", "ready", "done", "blocked"]).optional(), payload: z.record(z.string(), z.unknown()).optional(), userId: z.string().optional() });
const companyOsTaskUpdateSchema = z.object({ status: z.enum(["inbox", "planning", "waiting_approval", "ready", "done", "blocked"]), note: z.string().optional(), source: z.enum(["founder", "n8n", "telegram", "openclaw", "dashboard", "system"]).optional(), userId: z.string().optional() });
const openClawActionSchema = z.object({ action: z.enum(["read_knowledge", "draft_plan", "draft_patch", "browser_check", "terminal_check", "external_connector"]), title: z.string().min(1), target: z.string().optional(), prompt: z.string().optional(), payload: z.record(z.string(), z.unknown()).optional(), simulate: z.boolean().optional().default(true), userId: z.string().optional() });
const n8nWebhookSchema = z.object({ workflowName: z.string().min(1), eventType: z.string().min(1), title: z.string().min(1), body: z.string().optional(), agentRole: z.string().optional(), createTask: z.boolean().optional().default(false), risk: z.enum(["low", "medium", "high", "blocked"]).optional(), payload: z.record(z.string(), z.unknown()).optional(), userId: z.string().optional() });
const telegramUpdateSchema = z.object({ message: z.object({ text: z.string().default(""), chat: z.object({ id: z.union([z.string(), z.number()]).optional() }).optional(), from: z.object({ id: z.union([z.string(), z.number()]).optional(), username: z.string().optional() }).optional() }).passthrough(), userId: z.string().optional() }).passthrough();

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) throw new Error("SUPABASE_URL và SUPABASE_SERVICE_KEY chưa cấu hình.");
  return createClient(url, key);
}

function installSecurityHardening(app: Express) {
  if (securityInstalled) return;
  securityInstalled = true;

  const isDev = process.env.NODE_ENV !== "production";
  const connectSrcDirectives = [
    "'self'",
    "https://*.supabase.co",
    "https://api.anthropic.com",
    "https://generativelanguage.googleapis.com",
    "https://api.github.com",
    ...(isDev ? ["ws://127.0.0.1:*", "ws://localhost:*", "http://127.0.0.1:*", "http://localhost:*"] : []),
  ];

  app.use(helmet({
    contentSecurityPolicy: isDev ? false : {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: connectSrcDirectives,
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
  app.get("/api/company-os/control-plane/status", async (req, res) => {
    try { const snapshot = await listCompanyOsControlPlane(Number(req.query.limit || 50)); res.json({ success: true, contracts: getCompanyOsContracts(), ...snapshot }); }
    catch (err: any) { res.status(500).json({ success: false, error: err?.message || "Failed to load Company OS control plane." }); }
  });
  app.get("/api/company-os/audit/export", async (req, res) => {
    try {
      const audit = await exportCompanyOsAuditLog(Number(req.query.limit || 500));
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename=\"ledgerflow-company-os-audit-${Date.now()}.json\"`);
      res.json({ success: true, audit });
    } catch (err: any) { res.status(500).json({ success: false, error: err?.message || "Failed to export Company OS audit log." }); }
  });
  app.post("/api/company-os/events", async (req, res) => {
    try { const parsed = companyOsEventSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map((issue) => issue.message).join(", ") }); const result = await appendCompanyOsEvent(parsed.data); res.json({ success: true, ...result }); }
    catch (err: any) { res.status(500).json({ success: false, error: err?.message || "Failed to append Company OS event." }); }
  });
  app.post("/api/company-os/tasks", async (req, res) => {
    try { const parsed = companyOsTaskSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map((issue) => issue.message).join(", ") }); const result = await createCompanyOsTask(parsed.data); res.json({ success: true, ...result }); }
    catch (err: any) { res.status(500).json({ success: false, error: err?.message || "Failed to create Company OS task." }); }
  });
  app.patch("/api/company-os/tasks/:id", async (req, res) => {
    try { const parsed = companyOsTaskUpdateSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map((issue) => issue.message).join(", ") }); const result = await updateCompanyOsTask({ taskId: req.params.id, ...parsed.data }); res.json({ success: true, ...result }); }
    catch (err: any) { res.status(500).json({ success: false, error: err?.message || "Failed to update Company OS task." }); }
  });
  app.post("/api/company-os/openclaw/simulate", async (req, res) => {
    try { const parsed = openClawActionSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map((issue) => issue.message).join(", ") }); const result = await simulateOpenClawAction(parsed.data); res.json({ success: true, ...result }); }
    catch (err: any) { res.status(500).json({ success: false, error: err?.message || "Failed to simulate OpenClaw action." }); }
  });
  app.post("/api/company-os/n8n/webhook", async (req, res) => {
    try {
      const parsed = n8nWebhookSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map((issue) => issue.message).join(", ") });
      const event = await appendCompanyOsEvent({ source: "n8n", eventType: parsed.data.eventType, title: parsed.data.title, body: parsed.data.body, agentRole: parsed.data.agentRole, risk: parsed.data.risk, payload: { workflowName: parsed.data.workflowName, ...(parsed.data.payload || {}) }, userId: parsed.data.userId });
      const task = parsed.data.createTask ? await createCompanyOsTask({ title: parsed.data.title, description: parsed.data.body, agentRole: parsed.data.agentRole, source: "n8n", risk: parsed.data.risk, payload: { workflowName: parsed.data.workflowName, ...(parsed.data.payload || {}) }, userId: parsed.data.userId }) : null;
      res.json({ success: true, event, task });
    } catch (err: any) { res.status(500).json({ success: false, error: err?.message || "Failed to process n8n webhook." }); }
  });
  app.post("/api/company-os/telegram/update", async (req, res) => {
    try {
      const parsed = telegramUpdateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map((issue) => issue.message).join(", ") });
      const text = parsed.data.message.text.trim();
      const command = text.split(/\s+/)[0]?.toLowerCase() || "message";
      const title = command === "/task" ? text.replace(/^\/task\s*/i, "").trim() || "Telegram task" : `Telegram ${command}`;
      const event = await appendCompanyOsEvent({ source: "telegram", eventType: `telegram.${command.replace("/", "") || "message"}`, title, body: text, risk: command === "/approve" ? "high" : "low", payload: { chat: parsed.data.message.chat, from: parsed.data.message.from }, userId: parsed.data.userId });
      const task = command === "/task" ? await createCompanyOsTask({ title, description: text, source: "telegram", agentRole: "Chief of Staff", risk: "low", payload: { chat: parsed.data.message.chat }, userId: parsed.data.userId }) : null;
      res.json({ success: true, event, task, reply: task ? "Task captured in LedgerFlow Workboard." : "Telegram update captured in LedgerFlow audit log." });
    } catch (err: any) { res.status(500).json({ success: false, error: err?.message || "Failed to process Telegram update." }); }
  });

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
