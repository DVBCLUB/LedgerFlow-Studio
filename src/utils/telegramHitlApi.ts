/**
 * telegramHitlApi.ts
 * ============================================================
 * Frontend API client for Telegram HITL (Human-in-the-loop) Decisions,
 * Bot Status, and Executive Morning Briefing Push.
 */

const API_BASE = 'http://127.0.0.1:3000';

export interface TelegramBotStatus {
  configured: boolean;
  botTokenConfigured: boolean;
  allowedChatsCount: number;
  mode: string;
}

export interface TelegramHitlPayload {
  id: string;
  title: string;
  subtitle?: string;
  assignedStaff?: string;
  type?: 'video_render' | 'game_build' | 'affiliate_campaign' | 'deploy' | 'financial' | string;
}

export interface TelegramBriefingPayload {
  script: string;
  title?: string;
  revenue24h?: string;
  readinessScore?: number;
}

export async function fetchTelegramBotStatus(): Promise<TelegramBotStatus | null> {
  try {
    const res = await fetch(`${API_BASE}/api/telegram/status`);
    const json = await res.json();
    return json?.success ? json.status : null;
  } catch {
    return null;
  }
}

export async function pushHitlToTelegram(item: TelegramHitlPayload): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/telegram/hitl/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi mạng khi bắn yêu cầu duyệt' };
  }
}

export async function pushExecutiveBriefingToTelegram(briefing: TelegramBriefingPayload): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/telegram/briefing/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(briefing),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi mạng khi gửi bản tin điều hành' };
  }
}

export async function sendTelegramPing(message?: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/telegram/test/ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi gửi tin nhắn ping' };
  }
}
