/**
 * glaciaMultiAccountOrchestrator.ts
 * ============================================================================
 * GLACIA MULTI-ACCOUNT ORCHESTRATOR & ACCOUNT SWITCHING ENGINE
 * ============================================================================
 * Quản lý nhiều tài khoản đăng nhập trên từng nền tảng AI Webchat, tự động
 * xoay vòng tài khoản khi:
 * - Tài khoản hiện tại gặp lỗi quota / rate-limit
 * - Tài khoản bị challenge CAPTCHA / Cloudflare
 * - Đến số phiên tối đa (session cap) để tránh fingerprint dài hạn
 * - Người dùng yêu cầu chuyển tài khoản thủ công
 *
 * Tích hợp chặt chẽ với:
 * - glaciaStealthFingerprintRotator.ts (xoay vòng fingerprint khi đổi account)
 * - glaciaHumanCadenceEngine.ts (cadence profile per account)
 * - webAiSessionManager.ts (profile storage)
 * - telegramBot.ts (HITL khi cần xác minh 2FA hoặc CAPTCHA)
 * ============================================================================
 */

import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  detectPlatformFromUrl,
  forceRotateNow,
  getOrRotateFingerprint,
  type BrowserFingerprint,
} from './glaciaStealthFingerprintRotator.ts';
import { sendTelegramHitlScreenshotApproval } from './glaciaTelegramHitlBridge.ts';

// ─── Types ──────────────────────────────────────────────────────────────────

export type WebAIAccountStatus =
  | 'healthy'        // Sẵn sàng sử dụng
  | 'cooldown'       // Tạm thời nghỉ (quá nhiều request gần đây)
  | 'quota_hit'      // Đã hết hạn mức sử dụng miễn phí
  | 'challenge'      // Đang bị yêu cầu CAPTCHA / Xác minh người
  | 'banned'         // Bị khóa tài khoản vĩnh viễn
  | 'needs_login'    // Cookie hết hạn / Cần đăng nhập lại
  | 'offline';       // Tạm ngừng theo dõi

export interface WebAIAccount {
  id: string;
  platform: BrowserFingerprint['platform_name'];
  label: string;                    // Nhãn hiển thị: "Work Google 1", "Personal Claude"
  accountIdentifier: string;        // Email / Username đăng nhập
  profileDir: string;               // Thư mục Chrome profile
  maxSessionsPerDay: number;        // Giới hạn phiên / ngày (tránh ban)
  maxRequestsPerHour: number;       // Giới hạn request / giờ (rate limit safety)
  currentDailySessionCount: number; // Đếm phiên đã dùng hôm nay
  currentHourlyRequestCount: number;// Đếm request giờ hiện tại
  hourBucketStart?: string;         // Thời gian bắt đầu bucket giờ hiện tại (ISO)
  dayBucketStart?: string;          // Thời gian bắt đầu bucket ngày hiện tại (ISO)
  status: WebAIAccountStatus;
  lastUsedAt?: string;
  statusMessage?: string;
  /** Fingerprint id đã được gắn với tài khoản này (sticky fingerprint per account) */
  boundFingerprintId?: string;
  /** Lưu các token/session bổ sung nếu cần */
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AccountSelectionContext {
  targetUrl?: string;
  requireStatus?: WebAIAccountStatus[];
  minRemainingHourlyRequests?: number;
  minRemainingDailySessions?: number;
  excludeAccountIds?: string[];
  preferredPlatform?: BrowserFingerprint['platform_name'];
}

export interface AccountRotationTrigger {
  type: 'quota' | 'challenge' | 'rate_limit' | 'session_cap' | 'manual' | 'login_required' | 'error';
  reason: string;
  accountId: string;
  screenshotPath?: string;
}

// ─── Storage ────────────────────────────────────────────────────────────────

const ACCOUNTS_FILE = path.join(process.cwd(), 'runtime', 'glacia_web_ai_accounts.json');
const SELECTION_LOG_FILE = path.join(process.cwd(), 'runtime', 'glacia_account_selection_log.jsonl');

function ensureRuntime(): void {
  const dir = path.join(process.cwd(), 'runtime');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadAccountsStore(): WebAIAccount[] {
  ensureRuntime();
  if (fs.existsSync(ACCOUNTS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf-8'));
    } catch {
      // fallback
    }
  }
  return [];
}

function saveAccountsStore(accounts: WebAIAccount[]): void {
  ensureRuntime();
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), 'utf-8');
}

function appendSelectionLog(entry: Record<string, unknown>): void {
  ensureRuntime();
  try {
    fs.appendFileSync(
      SELECTION_LOG_FILE,
      JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n',
      'utf-8'
    );
  } catch {
    // non-fatal
  }
}

// ─── Bucket Resets (rate-limit resets by calendar time) ─────────────────────

function getHourBucketStart(): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  return d.toISOString();
}

function getDayBucketStart(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function resetBucketsIfNeeded(account: WebAIAccount): WebAIAccount {
  const next = { ...account };
  const hourBucket = getHourBucketStart();
  const dayBucket = getDayBucketStart();
  if (next.hourBucketStart !== hourBucket) {
    next.currentHourlyRequestCount = 0;
    next.hourBucketStart = hourBucket;
  }
  if (next.dayBucketStart !== dayBucket) {
    next.currentDailySessionCount = 0;
    next.dayBucketStart = dayBucket;
    // Quota ban lifting: nếu tài khoản bị cooldown / quota cũ, reset về healthy
    if (next.status === 'cooldown' || next.status === 'quota_hit') {
      next.status = 'healthy';
      next.statusMessage = `Auto-reset daily bucket at ${dayBucket}`;
    }
  }
  return next;
}

// ─── CRUD Operations ────────────────────────────────────────────────────────

export function listWebAIAccounts(platformFilter?: BrowserFingerprint['platform_name']): WebAIAccount[] {
  const accounts = loadAccountsStore().map(resetBucketsIfNeeded);
  saveAccountsStore(accounts);
  return platformFilter
    ? accounts.filter((a) => a.platform === platformFilter)
    : accounts;
}

export function getWebAIAccount(id: string): WebAIAccount | null {
  return listWebAIAccounts().find((a) => a.id === id) || null;
}

export function registerWebAIAccount(input: {
  platform: BrowserFingerprint['platform_name'];
  label: string;
  accountIdentifier: string;
  profileDir: string;
  maxSessionsPerDay?: number;
  maxRequestsPerHour?: number;
}): WebAIAccount {
  const accounts = loadAccountsStore();
  const now = new Date().toISOString();
  const account: WebAIAccount = {
    id: `acc_${randomUUID().slice(0, 10)}`,
    platform: input.platform,
    label: input.label,
    accountIdentifier: input.accountIdentifier,
    profileDir: input.profileDir,
    maxSessionsPerDay: input.maxSessionsPerDay ?? 50,
    maxRequestsPerHour: input.maxRequestsPerHour ?? 30,
    currentDailySessionCount: 0,
    currentHourlyRequestCount: 0,
    hourBucketStart: getHourBucketStart(),
    dayBucketStart: getDayBucketStart(),
    status: 'healthy',
    createdAt: now,
    updatedAt: now,
  };
  accounts.push(account);
  saveAccountsStore(accounts);
  appendSelectionLog({ action: 'register_account', accountId: account.id, platform: account.platform });
  return account;
}

export function updateWebAIAccount(id: string, patch: Partial<WebAIAccount>): WebAIAccount | null {
  const accounts = loadAccountsStore();
  const idx = accounts.findIndex((a) => a.id === id);
  if (idx < 0) return null;
  const next = { ...accounts[idx], ...patch, updatedAt: new Date().toISOString() };
  accounts[idx] = next;
  saveAccountsStore(accounts);
  appendSelectionLog({ action: 'update_account', accountId: id, patchKeys: Object.keys(patch) });
  return next;
}

export function removeWebAIAccount(id: string): boolean {
  const accounts = loadAccountsStore();
  const before = accounts.length;
  const next = accounts.filter((a) => a.id !== id);
  saveAccountsStore(next);
  appendSelectionLog({ action: 'remove_account', accountId: id, removed: before !== next.length });
  return before !== next.length;
}

// ─── Account Selection & Rotation Strategy ──────────────────────────────────

/**
 * Smart account picker: chọn account phù hợp nhất cho 1 nhiệm vụ.
 * Ưu tiên: account đang healthy, request/hour còn dư, session/day còn dư,
 *          dùng lâu nhất (least-recently-used healthy) để tránh lệch nhiệt.
 */
export function selectBestAccount(ctx: AccountSelectionContext = {}): WebAIAccount | null {
  const platformFromUrl = ctx.targetUrl
    ? detectPlatformFromUrl(ctx.targetUrl)
    : undefined;
  const platform = ctx.preferredPlatform ?? platformFromUrl;
  let pool = listWebAIAccounts(platform);

  // Exclude ids
  if (ctx.excludeAccountIds && ctx.excludeAccountIds.length > 0) {
    pool = pool.filter((a) => !ctx.excludeAccountIds!.includes(a.id));
  }
  // Status filter
  if (ctx.requireStatus && ctx.requireStatus.length > 0) {
    pool = pool.filter((a) => ctx.requireStatus!.includes(a.status));
  } else {
    pool = pool.filter((a) => a.status === 'healthy');
  }
  // Capacity filters
  if (ctx.minRemainingHourlyRequests) {
    pool = pool.filter(
      (a) => a.maxRequestsPerHour - a.currentHourlyRequestCount >= ctx.minRemainingHourlyRequests!
    );
  }
  if (ctx.minRemainingDailySessions) {
    pool = pool.filter(
      (a) => a.maxSessionsPerDay - a.currentDailySessionCount >= ctx.minRemainingDailySessions!
    );
  }

  if (pool.length === 0) {
    appendSelectionLog({ action: 'select_best_account', result: 'none_found', platform });
    return null;
  }

  // Sort by: remaining hourly cap DESC, last used ASC
  pool.sort((a, b) => {
    const remA = a.maxRequestsPerHour - a.currentHourlyRequestCount;
    const remB = b.maxRequestsPerHour - b.currentHourlyRequestCount;
    if (remA !== remB) return remB - remA;
    const atA = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
    const atB = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
    return atA - atB;
  });

  const chosen = pool[0];
  appendSelectionLog({
    action: 'select_best_account',
    accountId: chosen.id,
    label: chosen.label,
    platform: chosen.platform,
    remainingHourly: chosen.maxRequestsPerHour - chosen.currentHourlyRequestCount,
    remainingDaily: chosen.maxSessionsPerDay - chosen.currentDailySessionCount,
  });

  return chosen;
}

/**
 * Đánh dấu tài khoản đã sử dụng xong cho 1 request/session.
 * Tăng counters và đảm bảo fingerprint có sticky với tài khoản.
 */
export function markAccountUsed(
  accountId: string,
  opts: {
    incrementSession?: boolean;
    incrementRequest?: boolean;
    newFingerprintId?: string;
  } = {}
): WebAIAccount | null {
  const accounts = loadAccountsStore().map(resetBucketsIfNeeded);
  const idx = accounts.findIndex((a) => a.id === accountId);
  if (idx < 0) return null;
  const acc = accounts[idx];
  if (opts.incrementRequest) {
    acc.currentHourlyRequestCount = Math.min(
      acc.maxRequestsPerHour,
      acc.currentHourlyRequestCount + 1
    );
  }
  if (opts.incrementSession) {
    acc.currentDailySessionCount = Math.min(
      acc.maxSessionsPerDay,
      acc.currentDailySessionCount + 1
    );
  }
  if (opts.newFingerprintId) acc.boundFingerprintId = opts.newFingerprintId;
  acc.lastUsedAt = new Date().toISOString();
  acc.updatedAt = acc.lastUsedAt;
  accounts[idx] = acc;
  saveAccountsStore(accounts);
  return acc;
}

/**
 * Khi tài khoản gặp sự cố (quota, challenge, ...):
 * 1. Cập nhật status của tài khoản hiện tại
 * 2. Force rotate fingerprint để chuẩn bị cho account kế tiếp
 * 3. Nếu có screenshot challenge → gửi qua Telegram HITL để founder giải quyết
 * 4. Trả về một tài khoản thay thế (nếu có)
 */
export async function rotateAwayFromBadAccount(
  trigger: AccountRotationTrigger
): Promise<{
  nextAccount: WebAIAccount | null;
  newFingerprint: BrowserFingerprint;
  hitlRequested: boolean;
}> {
  const accounts = loadAccountsStore();
  const idx = accounts.findIndex((a) => a.id === trigger.accountId);
  if (idx >= 0) {
    const acc = accounts[idx];
    switch (trigger.type) {
      case 'quota':
        acc.status = 'quota_hit';
        break;
      case 'challenge':
        acc.status = 'challenge';
        break;
      case 'rate_limit':
      case 'session_cap':
        acc.status = 'cooldown';
        break;
      case 'login_required':
        acc.status = 'needs_login';
        break;
      case 'error':
        acc.status = 'cooldown';
        break;
    }
    acc.statusMessage = trigger.reason;
    acc.updatedAt = new Date().toISOString();
    accounts[idx] = acc;
    saveAccountsStore(accounts);
  }

  const badAcc = accounts.find((a) => a.id === trigger.accountId);
  const platform = badAcc?.platform ?? 'generic';

  // Force rotate fingerprint trước khi gắn với account mới
  const newFingerprint = forceRotateNow(platform);

  let hitlRequested = false;
  if (trigger.type === 'challenge' && trigger.screenshotPath) {
    try {
      hitlRequested = await sendTelegramHitlScreenshotApproval({
        title: `🚨 CAPTCHA / Challenge trên ${platform}`,
        subtitle: `${badAcc?.label || 'Account'} cần xác minh thủ công. Reason: ${trigger.reason}`,
        screenshotPath: trigger.screenshotPath,
        accountId: trigger.accountId,
      });
    } catch {
      hitlRequested = false;
    }
  }

  const nextAccount = selectBestAccount({
    preferredPlatform: platform,
    excludeAccountIds: [trigger.accountId],
  });

  appendSelectionLog({
    action: 'rotate_account',
    triggerType: trigger.type,
    reason: trigger.reason,
    fromAccount: trigger.accountId,
    toAccount: nextAccount?.id || null,
    newFingerprintId: newFingerprint.fingerprintId,
    hitlRequested,
  });

  return { nextAccount, newFingerprint, hitlRequested };
}

/**
 * Sticky fingerprint cho account:
 * Nếu account đã bind với fingerprint → dùng lại fingerprint cũ + tăng session count
 * Nếu chưa bind → lấy/rotate fingerprint mới và bind lại.
 * Đây là điểm tích hợp chính giữa Multi-Account và Fingerprint Rotation.
 */
export function getOrCreateStickyFingerprintForAccount(
  account: WebAIAccount
): { fingerprint: BrowserFingerprint; wasRotated: boolean } {
  if (account.boundFingerprintId) {
    // Sử dụng lại profile đã bind (giữ sticky fingerprint để account nhận diện thân thiện)
    // Nhưng vẫn rotate nhẹ mỗi 3 phiên (tránh quá tĩnh)
    const res = getOrRotateFingerprint(account.platform, 3);
    return res;
  }
  // First time → rotate hoàn toàn
  const res = getOrRotateFingerprint(account.platform, 1, true);
  updateWebAIAccount(account.id, { boundFingerprintId: res.fingerprint.fingerprintId });
  return res;
}

/**
 * Summary report: số lương account healthy / cooldown / challenge per platform
 */
export function getAccountOrchestratorHealth(): {
  totalAccounts: number;
  byPlatform: Record<string, { total: number; healthy: number; cooldown: number; challenges: number; quota_hit: number; needs_login: number }>;
  rotatedLast24h: number;
  topActive: Array<{ id: string; label: string; platform: string; status: string; remHourly: number; remDaily: number }>;
} {
  const accounts = listWebAIAccounts();
  const byPlatform: Record<string, any> = {};
  for (const a of accounts) {
    if (!byPlatform[a.platform]) {
      byPlatform[a.platform] = { total: 0, healthy: 0, cooldown: 0, challenges: 0, quota_hit: 0, needs_login: 0 };
    }
    byPlatform[a.platform].total += 1;
    switch (a.status) {
      case 'healthy': byPlatform[a.platform].healthy += 1; break;
      case 'cooldown': byPlatform[a.platform].cooldown += 1; break;
      case 'challenge': byPlatform[a.platform].challenges += 1; break;
      case 'quota_hit': byPlatform[a.platform].quota_hit += 1; break;
      case 'needs_login': byPlatform[a.platform].needs_login += 1; break;
    }
  }
  const rotatedLast24h = 0; // TODO: parse selection log JSONL
  const topActive = accounts
    .slice()
    .sort((a, b) => (b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0) - (a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0))
    .slice(0, 10)
    .map((a) => ({
      id: a.id,
      label: a.label,
      platform: a.platform,
      status: a.status,
      remHourly: a.maxRequestsPerHour - a.currentHourlyRequestCount,
      remDaily: a.maxSessionsPerDay - a.currentDailySessionCount,
    }));

  return {
    totalAccounts: accounts.length,
    byPlatform,
    rotatedLast24h,
    topActive,
  };
}
