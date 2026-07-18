// @ts-nocheck
import type { Express } from "express";
import { createClient } from "@supabase/supabase-js";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { callAI } from "./aiClient";
import { getAgentRole, listAgentRoles } from "./agentRoles";
import { registerBrief3Routes } from "./brief3Routes";
import { cancelCronQueueJob, getCronQueueStatus, getCronStatus, pruneCronQueue, retryCronQueueJob, startCronScheduler, triggerJobNow } from "./cronScheduler";
import { getGitHubSummary } from "./githubConnector";
import { extractInvoiceFromImage } from "./invoiceOCR";
import { getPipelineById, listPipelineTypes, PIPELINE_TEMPLATES, resumePipeline, startPipeline, type PipelineType } from "./pipelineOrchestrator";
import { aiClassifyUnknown, reconcileStatement } from "./vietqrReconciler";
import { appendCompanyOsEvent, createCompanyOsTask, exportCompanyOsAuditLog, getCompanyOsContracts, listCompanyOsControlPlane, simulateOpenClawAction, updateCompanyOsTask, type OpenClawActionInput } from "./companyOsControlPlane";
import { startBrowserSandboxRun, getBrowserModeDiagnostics, getRun, stopRun } from "./browserSandboxConnector";
import { approveAgentToolExecution, consumeAgentToolExecution, createAgentToolExecutionPreview } from "./agentToolExecutionGate";
import { advanceAgentRun, approveAgentRunStep, createAgentRun, getAgentRun, getAgentRuntimeMetrics, importLegacyAgentRuns, listAgentRuns, replanAgentRun, setAgentRuntimeEmergencyStop, stopAgentRun } from "./agentRuntime";
import { createAgentMemory, reviewAgentMemory, searchAgentMemory } from "./agentMemoryStore";
import { getRobotSimulationState, setRobotEmergencyStop, simulateRobotCommand } from "./robotConnector";
import { readRequestPrincipal, requireRoles } from "./localAuth";
import { verifyAuditChain } from "./auditLog";
import { runAISystemReadiness } from "./aiSystemReadiness";
import { getLibraryStats as getPromptLibraryStats, getTemplates } from "./aiPromptLibrary";
import { getKBStats } from "./teamKnowledgeBase";
import { getSkillStats, listSkills } from "./skillRegistry";
import { listWorkflowTemplates } from "./agentWorkflowEngine";
import {
  createAutomationRule,
  deleteAutomationRule,
  getAutomationExecutionLog,
  listAutomationRules,
  toggleAutomationRule
} from "./automationRuleEngine";

let securityInstalled = false;

const transactionSchema = z.object({ id: z.string().optional(), date: z.string().min(1), description: z.string().default(""), amount: z.number(), balance: z.number().default(0), bank: z.string().optional(), accountNo: z.string().optional() });
const reconcileSchema = z.object({ transactions: z.array(transactionSchema).min(1, "transactions array required"), useAI: z.boolean().optional().default(true) });
const invoiceOcrSchema = z.object({ imageBase64: z.string().min(20, "imageBase64 required"), mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]).default("image/jpeg") });
const pipelineStartSchema = z.object({ pipelineType: z.string().min(1), input: z.record(z.string(), z.unknown()).optional().default({}), userId: z.string().optional().default("local") });
const pipelineApproveSchema = z.object({ userId: z.string().optional().default("local"), stepId: z.string().min(1), fingerprint: z.string().regex(/^[a-f0-9]{64}$/), phrase: z.literal("APPROVE PIPELINE STEP") });
const cronTriggerSchema = z.object({ jobName: z.enum(["daily_brief", "weekly_report", "monthly_close_reminder"]), userId: z.string().uuid() });
const cronQueueActionSchema = z.object({ action: z.enum(["retry", "cancel"]), note: z.string().max(500).optional() });
const notificationTestSchema = z.object({ userId: z.string().uuid(), message: z.string().optional() });
const companyOsEventSchema = z.object({ source: z.enum(["founder", "n8n", "telegram", "openclaw", "dashboard", "system"]).default("dashboard"), eventType: z.string().min(1), title: z.string().min(1), body: z.string().optional(), agentRole: z.string().optional(), taskId: z.string().optional(), risk: z.enum(["low", "medium", "high", "blocked"]).optional(), payload: z.record(z.string(), z.unknown()).optional(), userId: z.string().optional() });
const companyOsTaskSchema = z.object({ title: z.string().min(1), description: z.string().optional(), agentRole: z.string().optional(), source: z.enum(["founder", "n8n", "telegram", "openclaw", "dashboard", "system"]).default("dashboard"), risk: z.enum(["low", "medium", "high", "blocked"]).optional(), status: z.enum(["inbox", "planning", "waiting_approval", "ready", "done", "blocked"]).optional(), payload: z.record(z.string(), z.unknown()).optional(), userId: z.string().optional() });
const companyOsTaskUpdateSchema = z.object({ status: z.enum(["inbox", "planning", "waiting_approval", "ready", "done", "blocked"]), note: z.string().optional(), source: z.enum(["founder", "n8n", "telegram", "openclaw", "dashboard", "system"]).optional(), userId: z.string().optional() });
const openClawActionSchema = z.object({ action: z.enum(AGENT_TOOL_IDS), title: z.string().min(1), target: z.string().optional(), prompt: z.string().optional(), payload: z.record(z.string(), z.unknown()).optional(), simulate: z.boolean().optional().default(true), userId: z.string().optional() });
const toolExecutionInputSchema = z.object({ toolId: z.enum(AGENT_TOOL_IDS), title: z.string().min(1), target: z.string().optional(), payload: z.record(z.string(), z.unknown()).optional(), executionMode: z.literal("simulation") });
const toolExecutionApproveSchema = z.object({ previewId: z.string().min(1), fingerprint: z.string().regex(/^[a-f0-9]{64}$/) });
const toolExecutionConsumeSchema = toolExecutionInputSchema.extend({ previewId: z.string().min(1), approvalToken: z.string().optional() });
const agentRunCreateSchema = z.object({
  goal: z.string().min(3).max(4_000),
  requestedBy: z.string().max(100).optional(),
  requestedTools: z.array(z.enum(AGENT_TOOL_IDS)).max(8).optional(),
  toolInputs: z.record(z.string(), z.record(z.string(), z.unknown())).optional(),
  maxSteps: z.number().int().min(1).max(12).optional(),
  maxRuntimeMs: z.number().int().min(5_000).max(600_000).optional(),
  plannerMode: z.enum(["auto", "ai", "deterministic"]).optional(),
});
const agentRunApprovalSchema = z.object({ stepId: z.string().min(1), fingerprint: z.string().regex(/^[a-f0-9]{64}$/), signature: z.string().regex(/^[a-f0-9]{64}$/).optional(), phrase: z.literal("APPROVE AGENT STEP") });
const agentRunImportSchema = z.object({ items: z.array(z.object({ id: z.string().min(1), title: z.string().optional(), goal: z.string().optional(), request: z.string().optional(), prompt: z.string().optional(), tools: z.array(z.string()).optional(), sourceType: z.enum(["workboard", "pipeline"]) })).min(1).max(100) });
const stopSchema = z.object({ reason: z.string().min(3).max(500).default("Founder requested stop.") });
const emergencyStopSchema = z.object({ active: z.boolean(), reason: z.string().max(500).optional() });
const agentMemoryCreateSchema = z.object({ kind: z.enum(["company", "session", "procedure", "observation", "feedback"]), title: z.string().min(1).max(200), content: z.string().min(1).max(20_000), source: z.string().min(1).max(200), sourceRef: z.string().max(500).optional(), tags: z.array(z.string().max(50)).max(20).optional(), confidence: z.number().min(0).max(1).optional(), sourceQuality: z.number().min(0).max(1).optional(), supersedesId: z.string().optional(), reviewed: z.boolean().optional(), expiresAt: z.string().datetime().optional() });
const robotCommandSchema = z.object({
  command: z.enum(["inspect", "move", "stop", "home", "rotate", "grip", "release", "calibrate"]),
  position: z.object({
    x: z.number().optional(),
    y: z.number().optional(),
    z: z.number().optional(),
    roll: z.number().optional(),
    pitch: z.number().optional(),
    yaw: z.number().optional()
  }).optional(),
  velocity: z.number().optional(),
  gripAngle: z.number().optional(),
  approvalPhrase: z.string().optional()
});

const automationRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  enabled: z.boolean().default(true),
  triggerEvent: z.string().min(1),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.string(),
    value: z.any().optional()
  })).default([]),
  conditionLogic: z.enum(["AND", "OR"]).default("AND"),
  actions: z.array(z.object({
    type: z.string(),
    params: z.record(z.string(), z.any()),
    requiresApproval: z.boolean().default(false)
  })).min(1)
});
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
  app.get("/api/cron/queue", async (_req, res) => res.json({ success: true, ...(await getCronQueueStatus()) }));
  app.patch("/api/cron/queue/:id", async (req, res) => {
    try {
      const parsed = cronQueueActionSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map((issue) => issue.message).join(", ") });
      const job = parsed.data.action === "retry" ? await retryCronQueueJob(req.params.id) : await cancelCronQueueJob(req.params.id);
      await appendCompanyOsEvent({ source: "founder", eventType: `cron.job_${parsed.data.action}`, title: `${parsed.data.action} cron job ${job.id}`, body: parsed.data.note, risk: "medium", payload: { jobId: job.id, status: job.status, name: job.name } });
      res.json({ success: true, job });
    } catch (err: any) { res.status(400).json({ success: false, error: err?.message || "Failed to update cron queue job." }); }
  });
  app.post("/api/cron/queue/prune", async (req, res) => {
    try { const days = z.coerce.number().int().min(1).max(365).default(30).parse(req.body?.retentionDays); res.json({ success: true, ...(await pruneCronQueue(days)) }); }
    catch (err: any) { res.status(400).json({ success: false, error: err?.message || "Failed to prune cron queue." }); }
  });
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
  app.get("/api/agent-roles", (_req, res) => res.json({ success: true, roles: listAgentRoles() }));
  app.get("/api/workflows/templates", (_req, res) => res.json({ success: true, templates: listWorkflowTemplates() }));
  app.get("/api/ai/inventory", async (_req, res) => {
    try {
      const [readiness, controlPlane] = await Promise.all([
        runAISystemReadiness(),
        listCompanyOsControlPlane(25),
      ]);
      const skills = listSkills({ limit: 12 });
      const templates = getTemplates();
      res.json({
        success: true,
        checkedAt: new Date().toISOString(),
        readiness,
        stats: {
          prompts: getPromptLibraryStats(),
          knowledge: getKBStats(),
          skills: getSkillStats(),
          controlPlane: {
            storage: controlPlane.storage,
            tasks: controlPlane.tasks.length,
            events: controlPlane.events.length,
            toolRuns: controlPlane.toolRuns.length,
          },
          workflowTemplates: listWorkflowTemplates().length,
        },
        highlights: {
          skills: skills.slice(0, 6).map((skill) => ({
            id: skill.id,
            name: skill.name,
            category: skill.category,
            tags: skill.tags.slice(0, 5),
          })),
          promptTemplates: templates.slice(0, 6).map((template) => ({
            id: template.id,
            name: template.name,
            category: template.category,
            tags: template.tags.slice(0, 5),
          })),
          readinessChecks: readiness.checks.slice(0, 8),
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || "Failed to build AI inventory." });
    }
  });
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
  app.post("/api/company-os/tools/preview", (req, res) => {
    try { const parsed = toolExecutionInputSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map((issue) => issue.message).join(", ") }); res.json({ success: true, preview: createAgentToolExecutionPreview(parsed.data) }); }
    catch (err: any) { res.status(400).json({ success: false, error: err?.message || "Failed to create tool preview." }); }
  });
  app.post("/api/company-os/tools/approve", (req, res) => {
    try { const parsed = toolExecutionApproveSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map((issue) => issue.message).join(", ") }); res.json({ success: true, ...approveAgentToolExecution(parsed.data.previewId, parsed.data.fingerprint) }); }
    catch (err: any) { res.status(400).json({ success: false, error: err?.message || "Failed to approve tool preview." }); }
  });
  app.post("/api/company-os/tools/execute", async (req, res) => {
    try {
      const parsed = toolExecutionConsumeSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map((issue) => issue.message).join(", ") });
      const consumed = consumeAgentToolExecution(parsed.data);
      const result = await simulateOpenClawAction({ action: consumed.tool.id as OpenClawActionInput['action'], title: consumed.title, target: consumed.target, payload: consumed.payload, simulate: true });
      res.json({ success: true, execution: { mode: "simulation", consumedPreviewId: consumed.id }, ...result });
    } catch (err: any) { res.status(400).json({ success: false, error: err?.message || "Failed to execute tool simulation." }); }
  });
  app.get("/api/agent-runtime/runs", async (req, res) => {
    try { res.json({ success: true, ...(await listAgentRuns(Number(req.query.limit || 50))) }); }
    catch (err: any) { res.status(500).json({ success: false, error: err?.message || "Failed to list agent runs." }); }
  });
  app.get("/api/agent-runtime/metrics", async (_req, res) => {
    try { res.json({ success: true, metrics: await getAgentRuntimeMetrics(), audit: await verifyAuditChain(200) }); }
    catch (err: any) { res.status(500).json({ success: false, error: err?.message || "Failed to load runtime metrics." }); }
  });
  app.post("/api/agent-runtime/runs", async (req, res) => {
    try { const parsed = agentRunCreateSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map((issue) => issue.message).join(", ") }); const principal = readRequestPrincipal(req); res.json({ success: true, run: await createAgentRun({ ...parsed.data, requestedBy: principal?.id || parsed.data.requestedBy }) }); }
    catch (err: any) { res.status(400).json({ success: false, error: err?.message || "Failed to create agent run." }); }
  });
  app.post("/api/agent-runtime/import", requireRoles("owner", "operator"), async (req, res) => {
    try { const parsed = agentRunImportSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map((issue) => issue.message).join(", ") }); res.json({ success: true, ...(await importLegacyAgentRuns(parsed.data.items)) }); }
    catch (err: any) { res.status(400).json({ success: false, error: err?.message || "Failed to import legacy work." }); }
  });
  app.get("/api/agent-runtime/runs/:id", async (req, res) => {
    try { const run = await getAgentRun(req.params.id); if (!run) return res.status(404).json({ success: false, error: "Agent run not found." }); res.json({ success: true, run }); }
    catch (err: any) { res.status(500).json({ success: false, error: err?.message || "Failed to load agent run." }); }
  });
  app.post("/api/agent-runtime/runs/:id/advance", async (req, res) => {
    try { res.json({ success: true, run: await advanceAgentRun(req.params.id) }); }
    catch (err: any) { res.status(400).json({ success: false, error: err?.message || "Failed to advance agent run." }); }
  });
  app.post("/api/agent-runtime/runs/:id/replan", requireRoles("owner", "operator"), async (req, res) => {
    try { const parsed = z.object({ mode: z.enum(["auto", "ai", "deterministic"]).default("auto") }).safeParse(req.body || {}); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map((issue) => issue.message).join(", ") }); res.json({ success: true, run: await replanAgentRun(req.params.id, parsed.data.mode) }); }
    catch (err: any) { res.status(400).json({ success: false, error: err?.message || "Failed to re-plan agent run." }); }
  });
  app.post("/api/agent-runtime/runs/:id/approve", requireRoles("owner"), async (req, res) => {
    try { const parsed = agentRunApprovalSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map((issue) => issue.message).join(", ") }); res.json({ success: true, run: await approveAgentRunStep(req.params.id, parsed.data) }); }
    catch (err: any) { res.status(400).json({ success: false, error: err?.message || "Failed to approve agent step." }); }
  });
  app.post("/api/agent-runtime/runs/:id/stop", async (req, res) => {
    try { const parsed = stopSchema.safeParse(req.body || {}); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map((issue) => issue.message).join(", ") }); res.json({ success: true, run: await stopAgentRun(req.params.id, parsed.data.reason) }); }
    catch (err: any) { res.status(400).json({ success: false, error: err?.message || "Failed to stop agent run." }); }
  });
  app.post("/api/agent-runtime/emergency-stop", requireRoles("owner", "operator"), async (req, res) => {
    try { const parsed = emergencyStopSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map((issue) => issue.message).join(", ") }); res.json({ success: true, control: await setAgentRuntimeEmergencyStop(parsed.data.active, parsed.data.reason) }); }
    catch (err: any) { res.status(400).json({ success: false, error: err?.message || "Failed to update runtime stop." }); }
  });
  app.get("/api/agent-memory/search", async (req, res) => {
    try { const query = String(req.query.q || ""); res.json({ success: true, results: await searchAgentMemory(query, { limit: Number(req.query.limit || 8), includeDrafts: req.query.includeDrafts === "true" }) }); }
    catch (err: any) { res.status(400).json({ success: false, error: err?.message || "Failed to search memory." }); }
  });
  app.post("/api/agent-memory", async (req, res) => {
    try { const parsed = agentMemoryCreateSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map((issue) => issue.message).join(", ") }); res.json({ success: true, memory: await createAgentMemory(parsed.data) }); }
    catch (err: any) { res.status(400).json({ success: false, error: err?.message || "Failed to create memory." }); }
  });
  app.patch("/api/agent-memory/:id/review", requireRoles("owner"), async (req, res) => {
    try { const parsed = z.object({ status: z.enum(["reviewed", "rejected"]) }).safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map((issue) => issue.message).join(", ") }); res.json({ success: true, memory: await reviewAgentMemory(req.params.id, parsed.data.status) }); }
    catch (err: any) { res.status(400).json({ success: false, error: err?.message || "Failed to review memory." }); }
  });
  app.get("/api/robot-simulation/status", (_req, res) => res.json({ success: true, state: getRobotSimulationState() }));
  app.post("/api/robot-simulation/command", async (req, res) => {
    try { const parsed = robotCommandSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map((issue) => issue.message).join(", ") }); const result = simulateRobotCommand(parsed.data); await appendCompanyOsEvent({ source: "openclaw", eventType: "robot.simulation", title: `Robot simulation: ${parsed.data.command}`, risk: parsed.data.command === "move" ? "high" : "medium", payload: { commandId: result.commandId, mode: "simulation" } }); res.json({ success: true, result }); }
    catch (err: any) { res.status(400).json({ success: false, error: err?.message || "Robot simulation failed." }); }
  });
  app.post("/api/robot-simulation/emergency-stop", (req, res) => {
    try { const parsed = z.object({ active: z.boolean() }).safeParse(req.body); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map((issue) => issue.message).join(", ") }); res.json({ success: true, state: setRobotEmergencyStop(parsed.data.active) }); }
    catch (err: any) { res.status(400).json({ success: false, error: err?.message || "Robot emergency stop failed." }); }
  });

  app.get("/api/automation-rules", (_req, res) => {
    try { res.json(listAutomationRules()); }
    catch (err: any) { res.status(500).json({ error: err.message }); }
  });
  app.get("/api/automation-rules/logs", (req, res) => {
    try {
      const limit = Number(req.query.limit || 50);
      res.json(getAutomationExecutionLog(limit));
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });
  app.post("/api/automation-rules", (req, res) => {
    try {
      const parsed = automationRuleSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.issues.map(i => i.message).join(", ") });
      const rule = createAutomationRule(parsed.data);
      res.json(rule);
    } catch (err: any) { res.status(400).json({ error: err.message }); }
  });
  app.patch("/api/automation-rules/:id/toggle", (req, res) => {
    try {
      const parsed = z.object({ enabled: z.boolean() }).safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.issues.map(i => i.message).join(", ") });
      const rule = toggleAutomationRule(req.params.id, parsed.data.enabled);
      res.json(rule);
    } catch (err: any) { res.status(400).json({ error: err.message }); }
  });
  app.delete("/api/automation-rules/:id", (req, res) => {
    try {
      deleteAutomationRule(req.params.id);
      res.json({ success: true });
    } catch (err: any) { res.status(400).json({ error: err.message }); }
  });

  app.post("/api/company-os/browser-sandbox/run", async (req, res) => {
    try {
      const parsed = z.object({
        profileName: z.string().min(1),
        folder: z.string().min(1),
        actionUrl: z.string().url(),
        taskType: z.enum(["chatgpt-scrape", "gemini-scrape", "claude-scrape", "deepseek-scrape", "general"]),
        apiFallbackExhausted: z.boolean().optional().default(false),
      }).safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map((issue) => issue.message).join(", ") });
      const runId = await startBrowserSandboxRun(parsed.data.profileName, parsed.data.folder, parsed.data.actionUrl, parsed.data.taskType, { apiFallbackExhausted: parsed.data.apiFallbackExhausted });
      res.json({ success: true, runId });
    } catch (err: any) { res.status(500).json({ success: false, error: err?.message || "Failed to start browser sandbox run." }); }
  });

  app.get("/api/company-os/browser-sandbox/diagnostics", (_req, res) => {
    res.json({ success: true, diagnostics: getBrowserModeDiagnostics() });
  });

  app.get("/api/company-os/browser-sandbox/status/:runId", (req, res) => {
    const run = getRun(req.params.runId);
    if (!run) return res.status(404).json({ success: false, error: "Sandbox run not found." });
    res.json({ success: true, run });
  });

  app.post("/api/company-os/browser-sandbox/stop/:runId", async (req, res) => {
    try {
      await stopRun(req.params.runId);
      res.json({ success: true });
    } catch (err: any) { res.status(500).json({ success: false, error: err?.message || "Failed to stop sandbox run." }); }
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
      const linkedRun = await createAgentRun({ goal: `Track pipeline ${pipeline.name}`, requestedTools: [], plannerMode: "deterministic", sourceType: "pipeline", sourceId: pipeline.id }).catch(() => null);
      res.json({ success: true, pipeline, linkedRun });
    } catch (err: any) { res.status(500).json({ success: false, error: err?.message || "Failed to start pipeline." }); }
  });

  app.post("/api/pipelines/:id/approve", async (req, res) => {
    try { const parsed = pipelineApproveSchema.safeParse(req.body || {}); if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map((issue) => issue.message).join(", ") }); const pipeline = await resumePipeline(req.params.id, parsed.data.userId, parsed.data); res.json({ success: true, pipeline }); }
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
