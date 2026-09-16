/**
 * glaciaScheduledWebMonitor.ts
 * ============================================================================
 * GLACIA SCHEDULED WEB MONITOR — LEVEL 2.3
 * ============================================================================
 * Hệ thống theo dõi nội dung web định kỳ:
 * 1. Founder đăng ký task: URL + lịch (mỗi giờ / 6h / mỗi ngày / 15p) + selector (tùy chọn)
 * 2. Cron job mỗi 15 phút kiểm tra các task đến lịch
 * 3. Fetch trang → extract clean content → so sánh hash (hoặc diff text)
 * 4. Nếu phát hiện thay đổi đáng kể → gửi Telegram HITL alert + kèm summary
 * 5. Lưu lịch sử thay đổi
 * ============================================================================
 */

import path from 'node:path';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { fetchCleanWebpage } from './glaciaGeminiDeepWebBridge.ts';
import type { WebPageExtraction } from './glaciaWebAgent.ts';
import { sendTelegramNotification } from './telegramBot.ts';
import { callAIWithFallback } from './aiRouter.ts';
import type { ChatMessage } from './aiClient.ts';

// ─── Types ──────────────────────────────────────────────────────────────────

export type MonitorComparisonMode = 'content-hash' | 'text-diff' | 'selector-hash' | 'html-size';
export type MonitorStatus = 'active' | 'paused' | 'error' | 'disabled';
export type MonitorScheduleKind = '15m' | '1h' | '6h' | 'daily' | 'custom-cron';

export interface WebMonitorTask {
  id: string;
  label: string;
  url: string;
  owner: 'founder' | string;
  status: MonitorStatus;
  scheduleKind: MonitorScheduleKind;
  customCron?: string;
  selector?: string;
  comparisonMode: MonitorComparisonMode;
  minChangeChars: number;
  lastContentHash?: string;
  lastContentSample?: string;
  lastCheckedAt?: string;
  lastChangedAt?: string;
  totalChecks: number;
  totalChanges: number;
  totalErrors: number;
  consecutiveErrors: number;
  lastError?: string;
  notifyTelegram: boolean;
  onlyNotifyOnChange: boolean;
  summaryWithGemini: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WebMonitorChangeEvent {
  id: string;
  taskId: string;
  taskLabel: string;
  url: string;
  detectedAt: string;
  changeMode: MonitorComparisonMode;
  changeMagnitudeChars: number;
  oldHash?: string;
  newHash?: string;
  oldSample?: string;
  newSample?: string;
  geminiSummary?: string;
}

interface WebMonitorState {
  tasks: WebMonitorTask[];
  events: WebMonitorChangeEvent[];
  lastCronRunAt?: string;
}

// ─── Storage ────────────────────────────────────────────────────────────────

const STATE_FILE = path.join(process.cwd(), 'runtime', 'glacia_web_monitors.json');
const EVENTS_DIR = path.join(process.cwd(), 'runtime', 'web_monitor_events');

function ensureDirs() {
  for (const d of [path.join(process.cwd(), 'runtime'), EVENTS_DIR]) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  }
}

function loadState(): WebMonitorState {
  ensureDirs();
  if (fs.existsSync(STATE_FILE)) {
    try {
      const s = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      if (!s.tasks) s.tasks = [];
      if (!s.events) s.events = [];
      return s;
    } catch { /* fallthrough */ }
  }
  return { tasks: [], events: [] };
}

function saveState(s: WebMonitorState) {
  ensureDirs();
  fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2), 'utf-8');
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const SCHEDULE_INTERVALS_MS: Record<MonitorScheduleKind, number> = {
  '15m': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  'daily': 24 * 60 * 60 * 1000,
  'custom-cron': -1,
};

function isTaskDue(task: WebMonitorTask, now: number): boolean {
  if (task.status !== 'active') return false;
  if (!task.lastCheckedAt) return true;
  const interval = SCHEDULE_INTERVALS_MS[task.scheduleKind];
  if (interval === -1) return false;
  return (now - new Date(task.lastCheckedAt).getTime()) >= interval;
}

function hashText(text: string): string {
  const crypto = require('node:crypto');
  return crypto.createHash('sha1').update(text).digest('hex');
}

function approximateDiffChars(a: string, b: string): number {
  if (a === b) return 0;
  const maxDiff = Math.max(a.length, b.length);
  let p1 = 0;
  while (p1 < a.length && p1 < b.length && a[p1] === b[p1]) p1++;
  let p2 = 0;
  while (
    p2 < a.length - p1 &&
    p2 < b.length - p1 &&
    a[a.length - 1 - p2] === b[b.length - 1 - p2]
  ) p2++;
  return Math.max(0, maxDiff - p1 - p2);
}

function extractContentForComparison(page: WebPageExtraction, _task: WebMonitorTask): string {
  // selector-based extraction sẽ bổ sung sau; hiện tại dùng mainText
  return (page.mainText || '').replace(/\s+/g, ' ').trim();
}

async function aiCall(prompt: string, opts: { task?: any; maxTokens?: number; temperature?: number } = {}): Promise<{ text: string; content: string }> {
  const messages: ChatMessage[] = [{ role: 'user', content: prompt }];
  const res = await callAIWithFallback(messages, {
    task: opts.task || 'analytics',
    maxTokens: opts.maxTokens,
    temperature: opts.temperature,
  });
  return { text: res.content || res.text || '', content: res.content || res.text || '' };
}

// ─── CRUD Tasks ─────────────────────────────────────────────────────────────

export function listWebMonitorTasks(statusFilter?: MonitorStatus): WebMonitorTask[] {
  const s = loadState();
  return statusFilter ? s.tasks.filter((t) => t.status === statusFilter) : s.tasks;
}

export function getWebMonitorTask(id: string): WebMonitorTask | null {
  return listWebMonitorTasks().find((t) => t.id === id) || null;
}

export function registerWebMonitorTask(input: {
  label: string;
  url: string;
  scheduleKind?: MonitorScheduleKind;
  customCron?: string;
  selector?: string;
  comparisonMode?: MonitorComparisonMode;
  minChangeChars?: number;
  notifyTelegram?: boolean;
  onlyNotifyOnChange?: boolean;
  summaryWithGemini?: boolean;
  tags?: string[];
  owner?: string;
}): WebMonitorTask {
  const s = loadState();
  const id = `mon_${Date.now().toString(36)}_${randomUUID().slice(0, 6)}`;
  const now = new Date().toISOString();
  const task: WebMonitorTask = {
    id,
    label: input.label.trim(),
    url: input.url.trim(),
    owner: input.owner || 'founder',
    status: 'active',
    scheduleKind: input.scheduleKind || 'daily',
    customCron: input.customCron,
    selector: input.selector?.trim() || undefined,
    comparisonMode: input.comparisonMode || 'content-hash',
    minChangeChars: input.minChangeChars ?? 10,
    totalChecks: 0,
    totalChanges: 0,
    totalErrors: 0,
    consecutiveErrors: 0,
    notifyTelegram: input.notifyTelegram !== false,
    onlyNotifyOnChange: input.onlyNotifyOnChange !== false,
    summaryWithGemini: input.summaryWithGemini ?? true,
    tags: input.tags,
    createdAt: now,
    updatedAt: now,
  };
  s.tasks.unshift(task);
  saveState(s);
  return task;
}

export function updateWebMonitorTask(id: string, patch: Partial<WebMonitorTask>): WebMonitorTask | null {
  const s = loadState();
  const idx = s.tasks.findIndex((t) => t.id === id);
  if (idx < 0) return null;
  s.tasks[idx] = { ...s.tasks[idx], ...patch, updatedAt: new Date().toISOString() };
  saveState(s);
  return s.tasks[idx];
}

export function removeWebMonitorTask(id: string): boolean {
  const s = loadState();
  const before = s.tasks.length;
  s.tasks = s.tasks.filter((t) => t.id !== id);
  saveState(s);
  return s.tasks.length < before;
}

// ─── Core Check Single Task ─────────────────────────────────────────────────

interface CheckResult {
  changed: boolean;
  error?: string;
  event?: WebMonitorChangeEvent;
  page?: WebPageExtraction;
  magnitude: number;
}

export async function runSingleMonitorCheck(taskId: string): Promise<CheckResult> {
  const task = getWebMonitorTask(taskId);
  if (!task) return { changed: false, error: `Task ${taskId} không tồn tại`, magnitude: 0 };
  if (task.status === 'disabled') return { changed: false, magnitude: 0 };

  let page: WebPageExtraction | null = null;
  try {
    page = await fetchCleanWebpage(task.url);
  } catch (e: any) {
    updateWebMonitorTask(taskId, {
      status: task.consecutiveErrors >= 5 ? 'error' : 'active',
      lastError: e.message,
      consecutiveErrors: task.consecutiveErrors + 1,
      totalErrors: task.totalErrors + 1,
      lastCheckedAt: new Date().toISOString(),
      totalChecks: task.totalChecks + 1,
    });
    return { changed: false, error: e.message, magnitude: 0 };
  }

  const content = extractContentForComparison(page, task);
  const newHash = hashText(content);
  const oldHash = task.lastContentHash;
  const magnitude = oldHash && task.comparisonMode === 'text-diff'
    ? approximateDiffChars(task.lastContentSample || '', content)
    : oldHash && oldHash !== newHash
      ? Math.max(task.minChangeChars, 25)
      : 0;

  const isSignificantChange =
    (task.comparisonMode === 'content-hash' || task.comparisonMode === 'selector-hash')
      ? !!oldHash && oldHash !== newHash
      : task.comparisonMode === 'text-diff'
        ? magnitude >= task.minChangeChars
        : false;

  updateWebMonitorTask(taskId, {
    lastCheckedAt: new Date().toISOString(),
    totalChecks: task.totalChecks + 1,
    consecutiveErrors: 0,
    lastError: undefined,
  });

  if (!isSignificantChange) {
    if (!oldHash) {
      updateWebMonitorTask(taskId, {
        lastContentHash: newHash,
        lastContentSample: content.slice(0, 800),
      });
    }
    return { changed: false, page, magnitude: 0 };
  }

  const state = loadState();
  const ev: WebMonitorChangeEvent = {
    id: `ev_${randomUUID()}`,
    taskId: task.id,
    taskLabel: task.label,
    url: task.url,
    detectedAt: new Date().toISOString(),
    changeMode: task.comparisonMode,
    changeMagnitudeChars: magnitude,
    oldHash,
    newHash,
    oldSample: task.lastContentSample,
    newSample: content.slice(0, 800),
  };

  if (task.summaryWithGemini) {
    try {
      const prompt = `Trang web ${task.url} (task monitor: ${task.label}) vừa thay đổi nội dung.
OLD CONTENT SAMPLE:
---
${(ev.oldSample || '(không có dữ liệu cũ)').slice(0, 3000)}
---
NEW CONTENT SAMPLE:
---
${(ev.newSample || '').slice(0, 3000)}
---
Hãy tóm tắt Founder 3 điểm:
1. Thay đổi CỤ THỂ gì (so sánh trước/sau)?
2. Thay đổi này MẠNH / NHẸ đến mức nào?
3. Đề xuất Founder nên HÀNH ĐỘNG gì ngay?
Trả lời tiếng Việt, ngắn gọn (tối đa 8 câu).`;
      const r = await aiCall(prompt, { maxTokens: 500, temperature: 0.1 });
      ev.geminiSummary = r.text.trim();
    } catch { /* ignore */ }
  }

  state.events.unshift(ev);
  while (state.events.length > 500) state.events.pop();
  saveState(state);

  ensureDirs();
  try {
    fs.writeFileSync(path.join(EVENTS_DIR, `${ev.id}.json`), JSON.stringify(ev, null, 2), 'utf-8');
  } catch {}

  updateWebMonitorTask(taskId, {
    lastContentHash: newHash,
    lastContentSample: content.slice(0, 800),
    lastChangedAt: new Date().toISOString(),
    totalChanges: task.totalChanges + 1,
  });

  if (task.notifyTelegram) {
    try {
      const modeIcons: Record<MonitorComparisonMode, string> = {
        'content-hash': '#️⃣',
        'text-diff': '📝',
        'selector-hash': '🎯',
        'html-size': '📦',
      };
      const hostname = (() => { try { return new URL(task.url).hostname; } catch { return task.url; } })();
      const lines = [
        `🚨 *WEB MONITOR — CONTENT CHANGE DETECTED*`,
        '',
        `🏷️ *Task:* ${task.label}`,
        `🌐 *URL:* [${hostname}](${task.url})`,
        `${modeIcons[task.comparisonMode]} *Loại thay đổi:* ${task.comparisonMode}`,
        `📊 *Độ lớn (ước lượng):* ~${magnitude} ký tự`,
        '',
        ev.geminiSummary ? `🧠 *Tóm tắt AI:*\n${ev.geminiSummary}\n` : '',
        `⏱️ *Thời gian:* ${new Date(ev.detectedAt).toLocaleString('vi-VN')}`,
        `🔢 *Lần check:* ${task.totalChecks + 1} | Lần thay đổi thứ ${task.totalChanges + 1}`,
      ].filter(Boolean);
      await sendTelegramNotification(lines.join('\n'));
    } catch { /* ignore */ }
  }

  return { changed: true, event: ev, page, magnitude };
}

// ─── Cron Runner: check all due tasks ───────────────────────────────────────

export async function runAllDueWebMonitorChecks(): Promise<{
  processedTasks: number;
  tasksWithChanges: number;
  errors: number;
}> {
  const tasks = listWebMonitorTasks();
  const now = Date.now();
  const due = tasks.filter((t) => isTaskDue(t, now));
  let changes = 0;
  let errors = 0;

  for (const t of due) {
    try {
      const r = await runSingleMonitorCheck(t.id);
      if (r.changed) changes += 1;
      if (r.error) errors += 1;
    } catch (e: any) {
      errors += 1;
      updateWebMonitorTask(t.id, { lastError: String(e.message || e) });
    }
  }

  const s = loadState();
  s.lastCronRunAt = new Date().toISOString();
  saveState(s);

  return { processedTasks: due.length, tasksWithChanges: changes, errors };
}

// ─── Dashboard Stats ────────────────────────────────────────────────────────

export function getWebMonitorStats() {
  const s = loadState();
  const byStatus = s.tasks.reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});
  const bySchedule = s.tasks.reduce<Record<string, number>>((acc, t) => {
    acc[t.scheduleKind] = (acc[t.scheduleKind] || 0) + 1;
    return acc;
  }, {});
  return {
    totalTasks: s.tasks.length,
    activeTasks: s.tasks.filter((t) => t.status === 'active').length,
    totalChecks: s.tasks.reduce((n, t) => n + t.totalChecks, 0),
    totalChanges: s.tasks.reduce((n, t) => n + t.totalChanges, 0),
    totalEvents: s.events.length,
    byStatus,
    bySchedule,
    lastCronRunAt: s.lastCronRunAt,
    recentEvents: s.events.slice(0, 15),
  };
}
