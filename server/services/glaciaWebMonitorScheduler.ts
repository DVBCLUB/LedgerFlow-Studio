/**
 * glaciaWebMonitorScheduler.ts
 * ============================================================================
 * GLACIA SCHEDULED WEB MONITOR — Autonomous URL Change Detection
 * ============================================================================
 * Đặt lịch để Glacia tự động:
 * 1. Cào URL định kỳ (theo cron: mỗi giờ, mỗi ngày, v.v.).
 * 2. So sánh nội dung với lần crawl trước.
 * 3. Nếu phát hiện thay đổi đáng kể → gửi cảnh báo qua Telegram HITL.
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fetchCleanWebpage } from './glaciaGeminiDeepWebBridge.ts';
import { callAI, type ChatMessage } from './aiClient.ts';

export type MonitorFrequency = 'hourly' | 'every_6h' | 'daily' | 'weekly';

export interface WebMonitorJob {
  id: string;
  url: string;
  label: string;
  question: string;           // "Có thay đổi gì về giá cả không?" / "Sản phẩm mới nào?"
  frequency: MonitorFrequency;
  isActive: boolean;
  createdAt: string;
  lastCheckedAt: string | null;
  lastContentHash: string | null;
  lastContentSnippet: string | null;
  alertCount: number;
  telegramChatId?: string;
}

export interface MonitorAlert {
  id: string;
  jobId: string;
  url: string;
  label: string;
  detectedAt: string;
  previousSnippet: string;
  newSnippet: string;
  changeSummary: string;      // Gemini-generated summary of what changed
  changeSignificance: 'minor' | 'moderate' | 'major';
  sentToTelegram: boolean;
}

export interface WebMonitorState {
  jobs: WebMonitorJob[];
  alerts: MonitorAlert[];
  lastSchedulerRunAt: string | null;
}

// ── Storage ────────────────────────────────────────────────────────────────

const MONITOR_STATE_FILE = path.join(process.cwd(), 'runtime', 'glacia_web_monitor.json');

function ensureRuntime(): void {
  const dir = path.join(process.cwd(), 'runtime');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function loadMonitorState(): WebMonitorState {
  ensureRuntime();
  if (fs.existsSync(MONITOR_STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(MONITOR_STATE_FILE, 'utf-8'));
    } catch { /* fallback */ }
  }
  return { jobs: [], alerts: [], lastSchedulerRunAt: null };
}

function saveMonitorState(state: WebMonitorState): void {
  ensureRuntime();
  fs.writeFileSync(MONITOR_STATE_FILE, JSON.stringify(state, null, 2));
}

// ── Simple content hash (first 3000 chars normalized) ─────────────────────

function hashContent(text: string): string {
  const normalized = text.slice(0, 3000).replace(/\s+/g, ' ').trim();
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}

// ── Check if job is due based on frequency ────────────────────────────────

function isDue(job: WebMonitorJob): boolean {
  if (!job.lastCheckedAt) return true;
  const last = new Date(job.lastCheckedAt).getTime();
  const now = Date.now();
  const intervals: Record<MonitorFrequency, number> = {
    hourly: 60 * 60 * 1000,
    every_6h: 6 * 60 * 60 * 1000,
    daily: 24 * 60 * 60 * 1000,
    weekly: 7 * 24 * 60 * 60 * 1000,
  };
  return now - last >= intervals[job.frequency];
}

// ── Gemini change analysis ─────────────────────────────────────────────────

async function analyzeChange(
  url: string,
  previousSnippet: string,
  newSnippet: string,
  question: string
): Promise<{ changeSummary: string; significance: 'minor' | 'moderate' | 'major' }> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: 'Bạn là công cụ phân tích thay đổi nội dung web. Hãy so sánh hai phiên bản nội dung trang web và tóm tắt những thay đổi quan trọng.',
    },
    {
      role: 'user',
      content: `URL: ${url}
Câu hỏi theo dõi: "${question}"

PHIÊN BẢN CŨ:
${previousSnippet.slice(0, 1500)}

PHIÊN BẢN MỚI:
${newSnippet.slice(0, 1500)}

Trả lời JSON:
{
  "changeSummary": "Tóm tắt những gì đã thay đổi (tiếng Việt, 2-3 câu)",
  "significance": "minor|moderate|major"
}`,
    },
  ];

  try {
    const raw = await callAI(messages, { taskType: 'fast_chat', maxTokens: 512 });
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return {
        changeSummary: parsed.changeSummary ?? 'Nội dung trang đã thay đổi.',
        significance: (['minor', 'moderate', 'major'].includes(parsed.significance) ? parsed.significance : 'moderate') as any,
      };
    }
  } catch { /* fallback */ }

  return { changeSummary: 'Nội dung trang đã thay đổi so với lần kiểm tra trước.', significance: 'moderate' };
}

// ── Telegram alert sender ─────────────────────────────────────────────────

async function sendTelegramAlert(chatId: string, alert: MonitorAlert): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) return false;

  const significanceEmoji = { minor: '🟡', moderate: '🟠', major: '🔴' }[alert.changeSignificance];
  const text = `${significanceEmoji} *[Glacia Web Monitor] Phát hiện thay đổi!*

📌 *${alert.label}*
🔗 ${alert.url}
🕐 ${new Date(alert.detectedAt).toLocaleString('vi-VN')}

📝 *Tóm tắt thay đổi:*
${alert.changeSummary}

_Mức độ: ${alert.changeSignificance.toUpperCase()}_`;

  try {
    const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

// ── CRUD Operations ────────────────────────────────────────────────────────

export function createMonitorJob(
  params: Omit<WebMonitorJob, 'id' | 'createdAt' | 'lastCheckedAt' | 'lastContentHash' | 'lastContentSnippet' | 'alertCount'>
): WebMonitorJob {
  const state = loadMonitorState();
  const job: WebMonitorJob = {
    ...params,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    lastCheckedAt: null,
    lastContentHash: null,
    lastContentSnippet: null,
    alertCount: 0,
  };
  state.jobs.push(job);
  saveMonitorState(state);
  return job;
}

export function listMonitorJobs(): WebMonitorJob[] {
  return loadMonitorState().jobs;
}

export function deleteMonitorJob(id: string): boolean {
  const state = loadMonitorState();
  const before = state.jobs.length;
  state.jobs = state.jobs.filter(j => j.id !== id);
  saveMonitorState(state);
  return state.jobs.length < before;
}

export function listMonitorAlerts(limit = 50): MonitorAlert[] {
  const state = loadMonitorState();
  return state.alerts.slice(-limit).reverse();
}

// ── Main Scheduler Tick ────────────────────────────────────────────────────

export async function runWebMonitorTick(): Promise<{
  checked: number;
  alerts: MonitorAlert[];
  errors: Array<{ url: string; error: string }>;
}> {
  const state = loadMonitorState();
  const activeJobs = state.jobs.filter(j => j.isActive && isDue(j));

  const results = { checked: 0, alerts: [] as MonitorAlert[], errors: [] as Array<{ url: string; error: string }> };

  for (const job of activeJobs) {
    try {
      const extracted = await fetchCleanWebpage(job.url);
      const newHash = hashContent(extracted.cleanText);
      const newSnippet = extracted.cleanText.slice(0, 3000);

      job.lastCheckedAt = new Date().toISOString();
      results.checked++;

      if (job.lastContentHash && job.lastContentHash !== newHash) {
        // Content changed!
        const { changeSummary, significance } = await analyzeChange(
          job.url,
          job.lastContentSnippet ?? '',
          newSnippet,
          job.question
        );

        const alert: MonitorAlert = {
          id: randomUUID(),
          jobId: job.id,
          url: job.url,
          label: job.label,
          detectedAt: new Date().toISOString(),
          previousSnippet: job.lastContentSnippet ?? '',
          newSnippet,
          changeSummary,
          changeSignificance: significance,
          sentToTelegram: false,
        };

        // Send Telegram alert if configured
        if (job.telegramChatId) {
          alert.sentToTelegram = await sendTelegramAlert(job.telegramChatId, alert);
        }

        state.alerts.push(alert);
        state.alerts = state.alerts.slice(-200); // keep last 200 alerts
        job.alertCount++;
        results.alerts.push(alert);
      }

      job.lastContentHash = newHash;
      job.lastContentSnippet = newSnippet;
    } catch (err) {
      results.errors.push({ url: job.url, error: String(err) });
      // Update lastCheckedAt even on error to avoid hammering failing URLs
      const jobInState = state.jobs.find(j => j.id === job.id);
      if (jobInState) jobInState.lastCheckedAt = new Date().toISOString();
    }
  }

  state.lastSchedulerRunAt = new Date().toISOString();
  saveMonitorState(state);

  return results;
}
