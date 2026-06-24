import cron, { type ScheduledTask } from "node-cron";
import { createClient } from "@supabase/supabase-js";
import { callAIWithFallback } from "./aiRouter";
import { cancelDurableJob, claimDueJob, completeDurableJob, enqueueDurableJob, failDurableJob, getDurableQueueSummary, pruneDurableJobs, retryDeadLetterJob } from "./durableJobQueue";

type CronJobName = "daily_brief" | "weekly_report" | "monthly_close_reminder" | "competitor_scan" | "ai_health_check" | "auto_backup_memory" | "product_kpi_snapshot";
type CronJobStatus = "ok" | "error" | "skipped";
type DailyCard = { title?: string; status?: string; risk?: string; ai_staff?: string };
type AgentTaskRow = { agent_role?: string; status?: string; created_at?: string };
type ProductRow = { name?: string; status?: string; mrr_vnd?: number | string | null };

type RuntimeJobStatus = Pick<CronJobDefinition, "lastRun" | "lastStatus">;

export interface CronJobDefinition {
  name: CronJobName;
  schedule: string;
  description: string;
  enabled: boolean;
  lastRun?: string;
  lastStatus?: CronJobStatus;
}

export interface CronStatus extends CronJobDefinition {
  isRunning: boolean;
  timezone: "Asia/Ho_Chi_Minh";
}


type CronJobName = "daily_brief" | "weekly_report" | "monthly_close_reminder" | "competitor_scan" | "ai_health_check" | "auto_backup_memory" | "product_kpi_snapshot";
type CronJobStatus = "ok" | "error" | "skipped";
type DailyCard = { title?: string; status?: string; risk?: string; ai_staff?: string };
type AgentTaskRow = { agent_role?: string; status?: string; created_at?: string };
type ProductRow = { name?: string; status?: string; mrr_vnd?: number | string | null };

type RuntimeJobStatus = Pick<CronJobDefinition, "lastRun" | "lastStatus">;

export interface CronJobDefinition {
  name: CronJobName;
  schedule: string;
  description: string;
  enabled: boolean;
  lastRun?: string;
  lastStatus?: CronJobStatus;
}

export interface CronStatus extends CronJobDefinition {
  isRunning: boolean;
  timezone: "Asia/Ho_Chi_Minh";
}

const activeJobs = new Map<string, ScheduledTask>();
const runtimeStatus = new Map<string, RuntimeJobStatus>();
let schedulerStarted = false;
const workerId = `cron-worker-${process.pid}`;
let queueWorkerBusy = false;

export const JOB_REGISTRY: CronJobDefinition[] = [
  { name: "daily_brief", schedule: "0 8 * * *", description: "Chief of Staff gửi Daily Brief cho Founder", enabled: true },
  { name: "weekly_report", schedule: "0 9 * * 1", description: "Weekly Review: metrics, pipeline status, decisions cần làm", enabled: true },
  { name: "monthly_close_reminder", schedule: "0 8 25 * *", description: "Nhắc nhở đóng sổ cuối tháng, kê khai thuế", enabled: true },
  { name: "competitor_scan", schedule: "0 7 * * 1", description: "AI Research scan đối thủ mỗi tuần", enabled: false },
  // ── New automation jobs ──────────────────────────────────────────────────────
  { name: "ai_health_check", schedule: "*/30 * * * *", description: "Kiểm tra AI Gateway health và ghi observability metrics mỗi 30 phút", enabled: true },
  { name: "auto_backup_memory", schedule: "0 2 * * *", description: "Backup agent memory store lúc 2:00 SA mỗi ngày", enabled: true },
  { name: "product_kpi_snapshot", schedule: "0 9 * * 5", description: "AI Analyst chụp snapshot KPI sản phẩm mỗi thứ Sáu lúc 9:00 SA", enabled: true },
];

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) throw new Error("SUPABASE_URL và SUPABASE_SERVICE_KEY chưa cấu hình.");
  return createClient(url, key);
}

function isSupabaseConfigured() {
  return Boolean((process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) && (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));
}

async function getActiveUserIds(): Promise<string[]> {
  const { data, error } = await supabaseAdmin().from("profiles").select("id").eq("role", "owner");
  if (error) throw error;
  return (data || []).map((profile: { id?: string }) => profile.id).filter((id): id is string => Boolean(id));
}

export async function createNotification(userId: string, title: string, content: string, type: string, metadata: Record<string, unknown> = {}) {
  const { error } = await supabaseAdmin().from("notifications").insert({ user_id: userId, title, content, type, metadata, is_read: false });
  if (error) throw error;
}

async function runDailyBrief(userId: string): Promise<void> {
  const sb = supabaseAdmin();
  const [cardsResult, tasksResult, productsResult] = await Promise.all([
    sb.from("workboard_cards").select("title,status,risk,ai_staff").eq("user_id", userId).in("status", ["Planning", "Waiting Approval"]).limit(10),
    sb.from("agent_tasks").select("agent_role,status,created_at").eq("user_id", userId).eq("status", "waiting_review").limit(5),
    sb.from("products").select("name,status,mrr_vnd").eq("user_id", userId).in("status", ["building", "beta", "launched"]),
  ]);

  const cards = (cardsResult.data || []) as DailyCard[];
  const pendingApprovals = cards.filter((card) => card.status === "Waiting Approval");
  const activeCards = cards.filter((card) => card.status === "Planning");
  const pendingTasks = (tasksResult.data || []) as AgentTaskRow[];
  const activeProducts = (productsResult.data || []) as ProductRow[];
  const totalMRR = activeProducts.reduce((sum, product) => sum + Number(product.mrr_vnd || 0), 0);

  const prompt = `Tạo Daily Brief sáng hôm nay (${new Date().toLocaleDateString("vi-VN")}) cho Founder.\n\nCONTEXT THỰC TẾ:\n- Cards cần duyệt: ${pendingApprovals.length}\n${pendingApprovals.map((card) => `  · [${card.risk || "MED"}] ${card.title || "Untitled"} — ${card.ai_staff || "AI"}`).join("\n")}\n- Cards đang làm: ${activeCards.length}\n- Agent tasks cần review: ${pendingTasks.length}\n${pendingTasks.map((task) => `  · ${task.agent_role || "AI"} (${task.status || "unknown"})`).join("\n")}\n- Sản phẩm active: ${activeProducts.map((product) => product.name).filter(Boolean).join(", ") || "Chưa có"}\n- MRR hiện tại: ${totalMRR.toLocaleString("vi-VN")} ₫\n\nFormat ĐÚNG:\n## 🔴 Cần duyệt ngay\n## 🟡 Nên làm hôm nay (tối đa 3 việc)\n## 🟢 AI agents đang chạy\n## 📊 Số thực hôm nay\n## ⚠️ Rủi ro theo dõi\n\nNgắn gọn, đọc trong 3 phút.`;

  const result = await callAIWithFallback([
    { role: "system", content: "Bạn là Chief of Staff của một solo founder. Viết brief ngắn gọn, actionable." },
    { role: "user", content: prompt },
  ], { maxTokens: 800 });

  await createNotification(userId, `Daily Brief — ${new Date().toLocaleDateString("vi-VN")}`, result.content || result.text || "Daily brief generated.", "daily_brief");
}

async function runWeeklyReport(userId: string): Promise<void> {
  const prompt = `Tạo Weekly Review cho Founder — tuần kết thúc ${new Date().toLocaleDateString("vi-VN")}.\n\nBao gồm:\n## ✅ Tuần này đã làm được gì\n## 📈 Metrics tuần\n## 🎯 Ưu tiên tuần tới (top 3)\n## 🚧 Blockers cần giải quyết\n## 💡 Ý tưởng mới đáng xem xét\n\nNgắn gọn, 300 words max.`;
  const result = await callAIWithFallback([
    { role: "system", content: "Bạn là Chief of Staff viết weekly review cho solo founder." },
    { role: "user", content: prompt },
  ], { maxTokens: 600 });
  await createNotification(userId, "Weekly Review", result.content || result.text || "Weekly review generated.", "weekly_report");
}

async function runMonthlyCloseReminder(userId: string): Promise<void> {
  const month = new Date().toLocaleDateString("vi-VN", { month: "long", year: "numeric" });
  await createNotification(
    userId,
    `Nhắc nhở đóng sổ — ${month}`,
    "📋 Checklist đóng sổ cuối tháng:\n□ Đối chiếu sao kê ngân hàng (VietQR Reconciler)\n□ Kiểm tra công nợ phải thu/phải trả\n□ Tính khấu hao TSCĐ\n□ Rà soát hóa đơn chưa ghi nhận\n□ Tính lương + BHXH\n□ Tạm tính thuế TNDN\n□ Kê khai thuế GTGT nếu đến kỳ\n□ Chạy báo cáo tài chính sơ bộ\n\n→ Dùng VietQR Reconciler và Invoice OCR để tự động hóa bước 1-4.",
    "monthly_reminder",
  );
}

async function runAiHealthCheck(): Promise<void> {
  try {
    const { getAIMetricsSummary } = await import('./aiObservabilityService.ts');
    const summary = getAIMetricsSummary('hour');
    const errorRate = summary.totalCalls > 0 ? Math.round(((summary.totalCalls - summary.successCalls) / summary.totalCalls) * 100) : 0;
    const status = errorRate > 20 ? 'degraded' : 'healthy';
    console.log(`[Cron][ai_health_check] AI Gateway: ${status} | calls=${summary.totalCalls} errors=${errorRate}% avgLatency=${summary.avgLatencyMs}ms`);
  } catch (err) {
    console.error('[Cron][ai_health_check] Error:', err);
  }
}

async function runAutoBackupMemory(): Promise<void> {
  try {
    const { agentEventBus } = await import('./agentEventBus.ts');
    await agentEventBus.publish('memory.updated', { source: 'auto_backup', triggeredBy: 'cron' }, 'cron-scheduler');
    console.log('[Cron][auto_backup_memory] Agent memory backup event fired.');
  } catch (err) {
    console.error('[Cron][auto_backup_memory] Error:', err);
  }
}

async function runProductKpiSnapshot(userId: string): Promise<void> {
  try {
    const { getAIMetricsSummary } = await import('./aiObservabilityService.ts');
    const summary = getAIMetricsSummary('week');
    if (isSupabaseConfigured()) {
      await createNotification(
        userId,
        `📊 KPI Snapshot — Tuần ${new Date().toLocaleDateString('vi-VN')}`,
        `AI Usage tuần này:\n• Tổng calls: ${summary.totalCalls}\n• Success rate: ${summary.successRate}%\n• Avg latency: ${summary.avgLatencyMs}ms\n• Chi phí ước tính: ${summary.totalCostVnd.toLocaleString('vi-VN')} ₫\n• Tổng tokens: ${summary.totalTokens.toLocaleString('vi-VN')}\n\nTop model: ${summary.topModels[0]?.model || 'N/A'}`,
        'product_kpi',
      );
    }
    console.log('[Cron][product_kpi_snapshot] KPI snapshot sent.');
  } catch (err) {
    console.error('[Cron][product_kpi_snapshot] Error:', err);
  }
}

async function runJobForUser(jobName: CronJobName, userId: string) {
  if (jobName === "daily_brief") return runDailyBrief(userId);
  if (jobName === "weekly_report") return runWeeklyReport(userId);
  if (jobName === "monthly_close_reminder") return runMonthlyCloseReminder(userId);
  if (jobName === "ai_health_check") return runAiHealthCheck();
  if (jobName === "auto_backup_memory") return runAutoBackupMemory();
  if (jobName === "product_kpi_snapshot") return runProductKpiSnapshot(userId);
  throw new Error(`Unknown or disabled job: ${jobName}`);
}

export async function drainDurableCronQueue(limit = 10, targetJobId?: string) {
  if (queueWorkerBusy && !targetJobId) return [];
  queueWorkerBusy = true;
  const processed = [];
  try {
    for (let index = 0; index < limit; index += 1) {
      const job = await claimDueJob(workerId, { jobId: targetJobId });
      if (!job) break;
      const jobName = String(job.payload.jobName || '') as CronJobName;
      const userId = String(job.payload.userId || '');
      try {
        if (!isSupabaseConfigured()) throw new Error('Supabase service key is not configured.');
        if (!JOB_REGISTRY.some((item) => item.name === jobName && item.enabled)) throw new Error(`Unknown or disabled job: ${jobName}`);
        if (!userId) throw new Error('Cron job userId is missing.');
        await runJobForUser(jobName, userId);
        const completed = await completeDurableJob(job.id, workerId);
        runtimeStatus.set(jobName, { lastRun: completed.updatedAt, lastStatus: 'ok' });
        processed.push(completed);
      } catch (error) {
        const failed = await failDurableJob(job.id, workerId, error);
        runtimeStatus.set(jobName, { lastRun: failed.updatedAt, lastStatus: 'error' });
        processed.push(failed);
      }
      if (targetJobId) break;
    }
    return processed;
  } finally {
    queueWorkerBusy = false;
  }
}

export function startCronScheduler(): void {
  if (schedulerStarted) return;
  schedulerStarted = true;

  for (const job of JOB_REGISTRY) {
    if (!job.enabled) continue;
    const task = cron.schedule(job.schedule, async () => {
      runtimeStatus.set(job.name, { lastRun: new Date().toISOString(), lastStatus: "skipped" });
      if (!isSupabaseConfigured()) return;
      try {
        const userIds = await getActiveUserIds();
        const slot = new Date().toISOString().slice(0, 13);
        for (const userId of userIds) {
          await enqueueDurableJob({ name: `cron.${job.name}`, payload: { jobName: job.name, userId }, dedupeKey: `cron:${job.name}:${userId}:${slot}` });
        }
        await drainDurableCronQueue(Math.max(1, userIds.length));
      } catch (err) {
        console.error(`[Cron] Error in ${job.name}:`, err);
        runtimeStatus.set(job.name, { lastRun: new Date().toISOString(), lastStatus: "error" });
      }
    }, { timezone: "Asia/Ho_Chi_Minh" });
    activeJobs.set(job.name, task);
  }

  void drainDurableCronQueue();
  const workerTimer = setInterval(() => { void drainDurableCronQueue(); }, 15_000);
  workerTimer.unref?.();

  console.log(`[Cron] Scheduler started — ${activeJobs.size} jobs active`);
}

export async function triggerJobNow(jobName: string, userId: string): Promise<{ success: boolean; jobId?: string; status?: string; error?: string }> {
  try {
    const job = JOB_REGISTRY.find((item) => item.name === jobName && item.enabled);
    if (!job) return { success: false, error: `Unknown or disabled job: ${jobName}` };
    if (!isSupabaseConfigured()) return { success: false, error: "Supabase service key chưa cấu hình." };
    const queued = await enqueueDurableJob({ name: `manual.${job.name}`, payload: { jobName: job.name, userId } });
    const [result] = await drainDurableCronQueue(1, queued.id);
    if (!result) return { success: true, jobId: queued.id, status: queued.status };
    return { success: result.status === 'completed', jobId: result.id, status: result.status, error: result.lastError };
  } catch (err) {
    runtimeStatus.set(jobName, { lastRun: new Date().toISOString(), lastStatus: "error" });
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export function getCronStatus(): CronStatus[] {
  return JOB_REGISTRY.map((job) => ({ ...job, ...(runtimeStatus.get(job.name) || {}), isRunning: activeJobs.has(job.name), timezone: "Asia/Ho_Chi_Minh" }));
}

export async function getCronQueueStatus() {
  return getDurableQueueSummary();
}

export async function retryCronQueueJob(jobId: string) {
  const queued = await retryDeadLetterJob(jobId);
  const [processed] = await drainDurableCronQueue(1, queued.id);
  return processed || queued;
}

export function cancelCronQueueJob(jobId: string) {
  return cancelDurableJob(jobId);
}

export function pruneCronQueue(retentionDays = 30) {
  return pruneDurableJobs(retentionDays);
}
