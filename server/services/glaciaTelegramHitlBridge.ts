/**
 * glaciaTelegramHitlBridge.ts
 * ============================================================================
 * GLACIA TELEGRAM HUMAN-IN-THE-LOOP (HITL) BRIDGE
 * ============================================================================
 * Điểm cầu nối giữa hệ thống tự động Glacia và con người (Founder) thông qua
 * Telegram với các workflow phê duyệt hình ảnh:
 *
 * 1. 🚨 CAPTCHA / Cloudflare Challenge Screenshot → Telegram inline buttons
 * 2. 🔄 Yêu cầu chuyển tài khoản khi hết quota → Telegram 1-click đổi account
 * 3. 🖼️ Xem trước ảnh chụp trạng thái trang Webchat khi bị dừng đột ngột
 * 4. ⚠️ Khi phát hiện hành vi đáng ngờ → cảnh báo + screenshot
 * 5. ✅ /cancel /resolve command để đóng ticket HITL
 *
 * Tích hợp với telegramBot.ts thông qua sendTelegramNotification và
 * callback_query handler (approve_hitl / reject_hitl pattern).
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  sendTelegramNotification,
  startTelegramPolling,
  type TelegramHandlerContext,
} from './telegramBot.ts';
import { createTelegramHandler } from './telegramBot.ts';
import {
  updateWebAIAccount,
  getWebAIAccount,
  rotateAwayFromBadAccount,
  selectBestAccount,
} from './glaciaMultiAccountOrchestrator.ts';

// ─── Types ──────────────────────────────────────────────────────────────────

export type HitlTicketStatus =
  | 'open'           // Đang chờ Founder hành động
  | 'approved'       // Founder đã duyệt xong (đã giải CAPTCHA / Đồng ý)
  | 'rejected'       // Founder từ chối (Hủy tác vụ / Dừng account này)
  | 'resolved'       // Đã được xử lý tự động hoặc qua cách khác
  | 'expired';       // Timeout không có phản hồi

export type HitlTicketType =
  | 'captcha_challenge'
  | 'login_required'
  | 'account_quota_hit'
  | 'suspicious_activity'
  | 'snapshot_review'
  | 'custom';

export interface HitlTicket {
  id: string;
  type: HitlTicketType;
  title: string;
  subtitle: string;
  accountId?: string;
  platform?: string;
  screenshotPath?: string;
  screenshotUrl?: string;     // Nếu lưu vào cloud (tương lai)
  createdBy: string;          // "glacia-automation" / "manual"
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;        // "founder_telegram" / "auto"
  status: HitlTicketStatus;
  resolutionNotes?: string;
  metadata?: Record<string, unknown>;
}

export interface HitlBridgeState {
  tickets: HitlTicket[];
  totalResolved: number;
  totalEscalated: number;
}

// ─── Storage ────────────────────────────────────────────────────────────────

const HITL_STATE_FILE = path.join(process.cwd(), 'runtime', 'glacia_hitl_tickets.json');
const SCREENSHOT_DIR = path.join(process.cwd(), 'runtime', 'hitl_screenshots');

function ensureRuntime(): void {
  const dirs = [path.join(process.cwd(), 'runtime'), SCREENSHOT_DIR];
  for (const d of dirs) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  }
}

function loadState(): HitlBridgeState {
  ensureRuntime();
  if (fs.existsSync(HITL_STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(HITL_STATE_FILE, 'utf-8'));
    } catch {
      // fallback
    }
  }
  return { tickets: [], totalResolved: 0, totalEscalated: 0 };
}

function saveState(state: HitlBridgeState): void {
  ensureRuntime();
  fs.writeFileSync(HITL_STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

// ─── Ticket Management ──────────────────────────────────────────────────────

function archiveOldTickets(tickets: HitlTicket[]): HitlTicket[] {
  const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
  return tickets.filter((t) => {
    if (['open', 'approved'].includes(t.status)) return true;
    const ts = t.resolvedAt ? new Date(t.resolvedAt).getTime() : new Date(t.createdAt).getTime();
    return ts > twoDaysAgo;
  });
}

export function listHitlTickets(statusFilter?: HitlTicketStatus): HitlTicket[] {
  const state = loadState();
  state.tickets = archiveOldTickets(state.tickets);
  saveState(state);
  return statusFilter
    ? state.tickets.filter((t) => t.status === statusFilter)
    : state.tickets;
}

export function getHitlTicket(id: string): HitlTicket | null {
  return listHitlTickets().find((t) => t.id === id) || null;
}

export function createHitlTicket(input: Omit<HitlTicket, 'id' | 'createdAt' | 'status'> & { status?: HitlTicketStatus }): HitlTicket {
  const state = loadState();
  const ticket: HitlTicket = {
    id: `hitl_${Date.now().toString(36)}_${randomUUID().slice(0, 6)}`,
    type: input.type,
    title: input.title,
    subtitle: input.subtitle,
    accountId: input.accountId,
    platform: input.platform,
    screenshotPath: input.screenshotPath,
    screenshotUrl: input.screenshotUrl,
    createdBy: input.createdBy || 'glacia-automation',
    createdAt: new Date().toISOString(),
    status: input.status || 'open',
    metadata: input.metadata,
  };
  state.tickets.unshift(ticket);
  state.totalEscalated += 1;
  saveState(state);
  return ticket;
}

export function updateHitlTicket(id: string, patch: Partial<HitlTicket>): HitlTicket | null {
  const state = loadState();
  const idx = state.tickets.findIndex((t) => t.id === id);
  if (idx < 0) return null;
  const before = state.tickets[idx];
  const wasOpen = before.status === 'open';
  const next: HitlTicket = { ...before, ...patch };
  if (wasOpen && ['approved', 'rejected', 'resolved'].includes(next.status)) {
    next.resolvedAt = new Date().toISOString();
    state.totalResolved += 1;
  }
  state.tickets[idx] = next;
  saveState(state);
  return next;
}

// ─── Telegram-Specific Helpers ──────────────────────────────────────────────

/**
 * Gửi screenshot + inline buttons về Telegram để Founder phê duyệt / từ chối.
 * Trả về true nếu có gửi đi (đã cấu hình Telegram).
 */
export async function sendTelegramHitlScreenshotApproval(input: {
  title: string;
  subtitle: string;
  screenshotPath?: string;
  accountId?: string;
  platform?: string;
  type?: HitlTicketType;
}): Promise<boolean> {
  const ticket = createHitlTicket({
    type: input.type || 'captcha_challenge',
    title: input.title,
    subtitle: input.subtitle,
    accountId: input.accountId,
    platform: input.platform,
    screenshotPath: input.screenshotPath,
    createdBy: 'glacia-telegram-hitl',
  });

  const typeIcons: Record<HitlTicketType, string> = {
    captcha_challenge: '🛡️',
    login_required: '🔐',
    account_quota_hit: '⏸️',
    suspicious_activity: '⚠️',
    snapshot_review: '📸',
    custom: '⚡',
  };
  const icon = typeIcons[ticket.type];

  const messageParts = [
    `${icon} *${ticket.title}*`,
    '',
    `📝 *Mô tả:* ${ticket.subtitle}`,
    ticket.platform ? `🌐 *Nền tảng:* ${ticket.platform}` : '',
    ticket.accountId ? `👤 *Account:* ${ticket.accountId}` : '',
    ticket.screenshotPath ? `📂 *Ảnh:* \`${path.basename(ticket.screenshotPath)}\`` : '',
    '',
    `🆔 Ticket ID: \`${ticket.id}\``,
    'Founder vui lòng chọn hành động:',
  ].filter(Boolean);

  await sendTelegramNotification(messageParts.join('\n'), {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Đã giải quyết xong', callback_data: `approve_hitl_ticket:${ticket.id}` },
          { text: '❌ Dừng tài khoản này', callback_data: `reject_hitl_ticket:${ticket.id}` },
        ],
        [
          { text: '🔄 Chuyển tài khoản khác', callback_data: `rotate_hitl_ticket:${ticket.id}` },
          { text: '📌 Chờ tôi xử lý sau', callback_data: `wait_hitl_ticket:${ticket.id}` },
        ],
      ],
    },
  });

  return true;
}

/**
 * Nhận kết quả callback từ Telegram và cập nhật ticket
 */
export async function resolveHitlTicketFromTelegram(callbackData: string): Promise<{ success: boolean; message: string; ticket?: HitlTicket }> {
  // Format: {action}_hitl_ticket:{ticket_id}
  const match = callbackData.match(/^(approve|reject|rotate|wait)_hitl_ticket:(.+)$/);
  if (!match) return { success: false, message: 'Invalid HITL callback format' };

  const [, action, ticketId] = match;
  const ticket = getHitlTicket(ticketId);
  if (!ticket) return { success: false, message: `Ticket ${ticketId} không tồn tại` };

  switch (action) {
    case 'approve':
      updateHitlTicket(ticketId, { status: 'approved', resolvedBy: 'founder_telegram', resolutionNotes: 'CAPTCHA / Login đã được Founder giải quyết thủ công' });
      if (ticket.accountId) updateWebAIAccount(ticket.accountId, { status: 'healthy', statusMessage: 'CAPTCHA đã được giải quyết qua HITL Telegram' });
      return { success: true, message: '✅ Founder đã duyệt xong. Account được đánh dấu healthy.', ticket };

    case 'reject':
      updateHitlTicket(ticketId, { status: 'rejected', resolvedBy: 'founder_telegram', resolutionNotes: 'Founder yêu cầu dừng tài khoản này' });
      if (ticket.accountId) updateWebAIAccount(ticket.accountId, { status: 'offline', statusMessage: 'Founder tạm dừng account qua HITL Telegram' });
      return { success: true, message: '❌ Founder đã từ chối. Account được đánh dấu offline.', ticket };

    case 'rotate':
      updateHitlTicket(ticketId, { status: 'resolved', resolvedBy: 'auto_rotation', resolutionNotes: 'Tự động đổi sang account khác theo yêu cầu Founder Telegram' });
      const rotRes = await rotateAwayFromBadAccount({
        type: 'challenge',
        reason: ticket.subtitle,
        accountId: ticket.accountId || '',
        screenshotPath: ticket.screenshotPath,
      });
      return { success: true, message: `🔄 Đã xoay sang account mới: ${rotRes.nextAccount?.label || 'Không tìm thấy account thay thế'}. Ticket đã đóng.`, ticket };

    case 'wait':
      return { success: true, message: '📌 Ticket đang chờ Founder giải quyết sau. Vẫn giữ trạng thái open.', ticket };
  }

  return { success: false, message: 'Unknown action' };
}

/**
 * Thông báo đến Telegram khi một account tự động được khôi phục (healthy trở lại)
 */
export async function notifyAccountHealthyTelegram(accountId: string): Promise<boolean> {
  const acc = getWebAIAccount(accountId);
  if (!acc) return false;
  await sendTelegramNotification(
    `✅ *TÀI KHOẢN KHÔI PHỤC*\n\n` +
    `👤 Label: ${acc.label}\n` +
    `🌐 Platform: ${acc.platform}\n` +
    `📧 Identifier: ${acc.accountIdentifier}\n` +
    `⚡ Status: healthy (đã quay lại hoạt động bình thường)\n` +
    `⏳ Last used: ${acc.lastUsedAt ? new Date(acc.lastUsedAt).toLocaleString('vi-VN') : 'Chưa dùng'}`
  );
  return true;
}

/**
 * Thông báo đến Telegram khi hệ thống tự xoay account (cảnh báo quota sắp đạt)
 */
export async function notifyAutoRotationTelegram(opts: {
  fromAccountLabel: string;
  toAccountLabel?: string;
  platform: string;
  reason: string;
}): Promise<boolean> {
  await sendTelegramNotification(
    `🔄 *AUTO ACCOUNT ROTATION*\n\n` +
    `🌐 Platform: ${opts.platform}\n` +
    `🚪 From: ${opts.fromAccountLabel}\n` +
    `➡️ To: ${opts.toAccountLabel || '(Không còn account thay thế — dừng)'}\n` +
    `📝 Reason: ${opts.reason}`
  );
  return true;
}

/**
 * Summary: HITL stats cho dashboard
 */
export function getHitlBridgeStats(): {
  openTickets: number;
  totalEscalated: number;
  totalResolved: number;
  resolveRate: string;
  recent: HitlTicket[];
  byType: Record<string, number>;
} {
  const state = loadState();
  const open = state.tickets.filter((t) => t.status === 'open');
  const byType: Record<string, number> = {};
  for (const t of state.tickets) {
    byType[t.type] = (byType[t.type] || 0) + 1;
  }
  const rate = state.totalEscalated > 0
    ? `${Math.round((state.totalResolved / state.totalEscalated) * 100)}%`
    : '0%';
  return {
    openTickets: open.length,
    totalEscalated: state.totalEscalated,
    totalResolved: state.totalResolved,
    resolveRate: rate,
    recent: state.tickets.slice(0, 10),
    byType,
  };
}

/**
 * Tiện ích: Copy screenshot vào thư mục HITL chuẩn hóa và trả về path mới
 */
export function archiveHitlScreenshot(sourcePath: string, ticketId?: string): string | null {
  ensureRuntime();
  if (!fs.existsSync(sourcePath)) return null;
  const base = ticketId
    ? `${ticketId}_${Date.now()}.png`
    : `screenshot_${Date.now()}_${randomUUID().slice(0, 4)}.png`;
  const target = path.join(SCREENSHOT_DIR, base);
  try {
    fs.copyFileSync(sourcePath, target);
    return target;
  } catch {
    return sourcePath; // fallback
  }
}
