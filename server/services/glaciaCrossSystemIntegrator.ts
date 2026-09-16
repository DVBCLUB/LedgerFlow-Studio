/**
 * glaciaCrossSystemIntegrator.ts
 * ============================================================================
 * GLACIA CROSS-SYSTEM INTEGRATOR — LEVEL 3
 * ============================================================================
 * Nối tất cả các hệ thống của Glacia lại với nhau:
 *
 * 3.1 🔗 Kết nối với glaciaInfiniteAutonomousLoopEngine
 *     - resolveFullAutonomousExecutionPlan(): Build execution plan tự động
 *       cho mỗi task theo triết lý "API trực tiếp khi có thể, Stealth Human
 *       khi cần thiết"
 *     - Tự chọn account tốt nhất từ Multi-Account Orchestrator
 *     - Áp dụng cadence profile theo từng platform
 *
 * 3.2 📞 Telegram status helpers
 *     - fetchGlaciaSystemStatus(): Object tổng hợp cho dashboard
 *     - Các helper function định dạng text report (dùng trong routes hoặc
 *       Telegram commands)
 * ============================================================================
 */

import {
  listWebAIAccounts,
  selectBestAccount,
  getAccountOrchestratorHealth,
  markAccountUsed,
  getOrCreateStickyFingerprintForAccount,
  updateWebAIAccount,
  type AccountSelectionContext,
  type WebAIAccount,
} from './glaciaMultiAccountOrchestrator.ts';
import {
  detectPlatformFromUrl,
  type BrowserFingerprint,
  type PlatformCadenceProfile,
} from './glaciaStealthFingerprintRotator.ts';
import { getPlatformCadenceForUrl } from './webAiAutomator.ts';
import { getEnabledAIKeyEntries } from './aiKeyVault.ts';
import {
  listHitlTickets,
  resolveHitlTicketFromTelegram,
  getHitlBridgeStats,
} from './glaciaTelegramHitlBridge.ts';
import {
  getWebMonitorStats,
  listWebMonitorTasks,
} from './glaciaScheduledWebMonitor.ts';
import {
  listRecentBatchReports,
} from './glaciaBatchUrlInspector.ts';
import {
  startGlaciaVoiceSession,
  listGeminiLiveVoices,
} from './glaciaGeminiLiveApi.ts';

// ─── Level 3.1: Full Autonomous Execution Plan ──────────────────────────────

export type WebchatInteractionMode = 'api_direct' | 'stealth_human' | 'voice_dictation' | 'fast_direct' | 'offline';

export interface AutonomousExecutionPlan {
  mode: WebchatInteractionMode;
  reason: string;
  targetPlatformName: string;
  hasApiKey: boolean;
  apiProviderSuitable: string[];
  chosenAccount: WebAIAccount | null;
  chosenFingerprint: BrowserFingerprint | null;
  cadenceProfile: PlatformCadenceProfile | null;
  wpmRange: [number, number];
  typoRate: number;
  enableMicroScroll: boolean;
  enableChallengeDetection: boolean;
  enableAutoAccountRotate: boolean;
  estimatedRiskLevel: 'low' | 'medium' | 'high';
  recommendedVoiceForDictation?: string;
}

export interface AutonomousPlanOptions {
  hasApiKey?: boolean;
  targetUrl?: string;
  forceMode?: WebchatInteractionMode;
  minRemainingHourlyRequests?: number;
  preferVoiceDictation?: boolean;
  accountContext?: AccountSelectionContext;
}

/**
 * Heart of Level 3.1 — build execution plan tự động cho mỗi task
 * theo triết lý: "API trực tiếp khi có thể, Stealth Human khi cần thiết"
 */
export async function resolveFullAutonomousExecutionPlan(
  input: AutonomousPlanOptions = {}
): Promise<AutonomousExecutionPlan> {
  // 1. Platform detection
  const platformName = input.targetUrl ? detectPlatformFromUrl(input.targetUrl) : 'generic';
  const cadenceProfile: PlatformCadenceProfile | null = input.targetUrl ? getPlatformCadenceForUrl(input.targetUrl) : null;

  // 2. Kiểm tra API có sẵn và đủ quota không
  let apiProviderSuitable: string[] = [];
  let hasApiKey = !!input.hasApiKey;
  try {
    const keys = await getEnabledAIKeyEntries();
    const platformToProviders: Record<string, string[]> = {
      'chatgpt': ['openai', 'openrouter'],
      'gemini_web': ['gemini'],
      'claude': ['anthropic', 'openrouter'],
      'deepseek': ['deepseek'],
      'perplexity': [],
      'copilot': ['openai', 'openrouter'],
      'generic': ['gemini', 'anthropic', 'openai', 'openrouter', 'groq', 'deepseek'],
    };
    const want = platformToProviders[platformName] || platformToProviders.generic;
    const anyKey = keys as Array<{ provider: string; enabled?: boolean }>;
    apiProviderSuitable = anyKey.filter((k) => want.includes(k.provider) && k.enabled !== false).map((k) => k.provider);
    hasApiKey = hasApiKey || apiProviderSuitable.length > 0;
  } catch { /* ignore */ }

  // 3. Nếu force mode thì dùng
  if (input.forceMode) {
    const wpm: [number, number] = [cadenceProfile?.minWpm ?? 35, cadenceProfile?.maxWpm ?? 65];
    const acc: WebAIAccount | null = input.targetUrl
      ? selectBestAccount({
          targetUrl: input.targetUrl,
          minRemainingHourlyRequests: input.minRemainingHourlyRequests ?? 5,
          ...input.accountContext,
        })
      : null;
    let fp: BrowserFingerprint | null = null;
    if (acc) {
      const wrap = getOrCreateStickyFingerprintForAccount(acc);
      fp = wrap.fingerprint;
    }
    return {
      mode: input.forceMode,
      reason: `Force mode theo yêu cầu caller`,
      targetPlatformName: platformName,
      hasApiKey,
      apiProviderSuitable,
      chosenAccount: acc,
      chosenFingerprint: fp,
      cadenceProfile,
      wpmRange: wpm,
      typoRate: cadenceProfile?.typoRate ?? 0.02,
      enableMicroScroll: input.forceMode !== 'fast_direct',
      enableChallengeDetection: input.forceMode !== 'api_direct' && input.forceMode !== 'fast_direct',
      enableAutoAccountRotate: input.forceMode !== 'api_direct' && input.forceMode !== 'fast_direct',
      estimatedRiskLevel: riskLevelFor(input.forceMode, cadenceProfile),
    };
  }

  // 4. Ưu tiên API direct nếu đủ điều kiện
  const profileNotes = (cadenceProfile?.notes || '').toLowerCase();
  if (hasApiKey && apiProviderSuitable.length > 0 && (!input.targetUrl || platformName === 'generic' || !profileNotes.includes('high risk'))) {
    return {
      mode: 'api_direct',
      reason: `API provider ${apiProviderSuitable.join('/')} sẵn sàng → ưu tiên dùng API nhanh.`,
      targetPlatformName: platformName,
      hasApiKey: true,
      apiProviderSuitable,
      chosenAccount: null,
      chosenFingerprint: null,
      cadenceProfile,
      wpmRange: [0, 0],
      typoRate: 0,
      enableMicroScroll: false,
      enableChallengeDetection: false,
      enableAutoAccountRotate: false,
      estimatedRiskLevel: 'low',
    };
  }

  // 5. Cần dùng Web UI → chọn account + fingerprint
  const bestAccount: WebAIAccount | null = input.targetUrl
    ? selectBestAccount({
        targetUrl: input.targetUrl,
        minRemainingHourlyRequests: input.minRemainingHourlyRequests ?? 3,
        ...input.accountContext,
      })
    : null;

  // 6. Dựa vào platform recommended mode → chọn stealth_human hay voice_dictation
  let chosenMode: WebchatInteractionMode = bestAccount ? 'stealth_human' : 'offline';
  let voice: string | undefined;
  if (cadenceProfile?.recommendedMode === 'voice_dictation' || input.preferVoiceDictation) {
    chosenMode = bestAccount ? 'voice_dictation' : chosenMode;
    voice = 'Aoede';
  }
  if (cadenceProfile?.recommendedMode === 'fast_direct' && platformName !== 'perplexity') {
    chosenMode = bestAccount ? 'fast_direct' : chosenMode;
  }

  let fp: BrowserFingerprint | null = null;
  if (bestAccount) {
    const wrap = getOrCreateStickyFingerprintForAccount(bestAccount);
    fp = wrap.fingerprint;
    markAccountUsed(bestAccount.id, { incrementSession: true, newFingerprintId: wrap.fingerprint.fingerprintId });
  }

  return {
    mode: chosenMode,
    reason: bestAccount
      ? `Không dùng API. Chuyển sang Web UI mode=${chosenMode} với account=${bestAccount.label}(${bestAccount.platform}).`
      : `Không dùng API và KHÔNG CÓ account nào phù hợp → chuyển sang offline mode.`,
    targetPlatformName: platformName,
    hasApiKey,
    apiProviderSuitable,
    chosenAccount: bestAccount,
    chosenFingerprint: fp,
    cadenceProfile,
    wpmRange: [cadenceProfile?.minWpm ?? 38, cadenceProfile?.maxWpm ?? 62],
    typoRate: cadenceProfile?.typoRate ?? 0.025,
    enableMicroScroll: true,
    enableChallengeDetection: true,
    enableAutoAccountRotate: !!bestAccount,
    estimatedRiskLevel: riskLevelFor(chosenMode, cadenceProfile),
    recommendedVoiceForDictation: voice,
  };
}

function riskLevelFor(mode: WebchatInteractionMode, profile: PlatformCadenceProfile | null): 'low' | 'medium' | 'high' {
  if (mode === 'api_direct' || mode === 'fast_direct' || mode === 'offline') return 'low';
  if (mode === 'voice_dictation') return 'medium';
  const noteRisk = (profile?.notes || '').toLowerCase();
  if (noteRisk.includes('high risk') || noteRisk.includes('fingerprint pro')) return 'high';
  return 'medium';
}

// ─── Telegram-compatible Status Builders (pure functions, không side-effect) ─

export interface GlaciaEcosystemStatus {
  generatedAt: string;
  accounts: ReturnType<typeof getAccountOrchestratorHealth>;
  hitl: ReturnType<typeof getHitlBridgeStats>;
  monitors: ReturnType<typeof getWebMonitorStats>;
  recentBatches: ReturnType<typeof listRecentBatchReports>;
}

export function buildGlaciaSystemStatusText(s: GlaciaEcosystemStatus): string {
  const lines: string[] = [];
  lines.push('⚡ *GLACIA ECOSYSTEM STATUS* ⚡');
  lines.push('');
  lines.push('👥 *Multi-Account Orchestrator:*');
  lines.push(`   — Tổng account: ${s.accounts.totalAccounts}`);
  const agg = aggregateStatusFromHealth(s.accounts);
  lines.push(`   — Healthy: ${agg.healthy} | Cooldown: ${agg.cooldown} | Challenge: ${agg.challenges} | Banned: ${agg.banned}`);
  lines.push(`   — Platforms: ${Object.entries(s.accounts.byPlatform).map(([p, n]) => `${p}=${(n as any).total}`).join(', ') || '(none)'}`);
  lines.push('');
  lines.push('🚨 *HITL Tickets:*');
  lines.push(`   — Open: ${s.hitl.openTickets} | Đã giải quyết: ${s.hitl.totalResolved}/${s.hitl.totalEscalated} (rate ${s.hitl.resolveRate})`);
  lines.push(`   — Theo loại: ${Object.entries(s.hitl.byType).map(([k, v]) => `${k}=${v}`).join(', ') || '(none)'}`);
  lines.push('');
  lines.push(`🕵️ *Web Monitors:* ${s.monitors.activeTasks}/${s.monitors.totalTasks} active | Tổng checks: ${s.monitors.totalChecks} | Thay đổi: ${s.monitors.totalChanges}`);
  lines.push('');
  lines.push(`📚 *Recent Batch Inspections:* ${s.recentBatches.length} task(s) gần đây`);
  for (const b of s.recentBatches.slice(0, 3)) {
    lines.push(`   • ${(b as any).id?.slice(-8) || b} | ${(b as any).successCount || 0}/${(b as any).urlsCount || 0} OK`);
  }
  return lines.join('\n');
}

export function buildGlaciaAccountsText(platformFilter?: string): string {
  const accounts = listWebAIAccounts(platformFilter);
  const statusIcons: Record<string, string> = {
    healthy: '✅', cooldown: '⏸️', quota_hit: '🚫',
    challenge: '🔐', banned: '❌', needs_login: '👤', offline: '⬛',
  };
  const lines = accounts.slice(0, 40).map((a) => {
    const remHourly = Math.max(0, (a.maxRequestsPerHour || 0) - (a.currentHourlyRequestCount || 0));
    const remDaily = Math.max(0, (a.maxSessionsPerDay || 0) - (a.currentDailySessionCount || 0));
    return `${statusIcons[a.status] || '•'} ${a.label || a.accountIdentifier} [${a.platform}] — ${a.status} (giờ ${a.currentHourlyRequestCount ?? 0}/${a.maxRequestsPerHour} còn ${remHourly} | ngày ${a.currentDailySessionCount ?? 0}/${a.maxSessionsPerDay} còn ${remDaily})`;
  });
  return `👥 *ACCOUNTS (${accounts.length} total)*\n\n${lines.length ? lines.join('\n') : '(chưa có account nào — dùng registerWebAIAccount để thêm)'}`;
}

export function buildGlaciaHitlText(): string {
  const tickets = listHitlTickets();
  const open = tickets.filter((t) => t.status === 'open');
  return (
    `📨 *HITL Tickets (mở: ${open.length}/${tickets.length})*\n\n` +
    tickets.slice(0, 15).map((t) => {
      const ico = t.status === 'open' ? '🔴' : t.status === 'approved' ? '✅' : t.status === 'rejected' ? '❌' : '⚪';
      return `${ico} ${t.id.slice(-10)} | ${t.type} | ${t.title.slice(0, 40)} — ${t.status} ${t.accountId ? `[acc ${String(t.accountId).slice(-6)}]` : ''}`;
    }).join('\n') || '(chưa có ticket nào)'
  );
}

export function buildGlaciaMonitorsText(): string {
  const tasks = listWebMonitorTasks();
  return (
    `🕵️ *SCHEDULED WEB MONITORS (${tasks.length})*\n\n` +
    tasks.slice(0, 25).map((t) => {
      const ico = t.status === 'active' ? '🟢' : t.status === 'paused' ? '🟡' : t.status === 'error' ? '🔴' : '⚫';
      return `${ico} ${t.label} [${t.scheduleKind}] — ${String(t.url).slice(0, 50)} — check#${t.totalChecks}, changes#${t.totalChanges}`;
    }).join('\n') || '(chưa có monitor nào — dùng registerWebMonitorTask để thêm)'
  );
}

export async function buildGlaciaGeminiLiveStatusText(): Promise<string> {
  const voices = listGeminiLiveVoices();
  const start = await startGlaciaVoiceSession();
  return (
    `🎙️ *GEMINI LIVE API — VOICE*\n\n` +
    `Session: \`${start.sessionId}\`\n` +
    `Trạng thái: ${start.connected ? '✅ Đã kết nối' : `❌ Chưa kết nối (${start.error || 'unknown'})`}\n\n` +
    voices.map((v) => `*${v.id}* — ${v.personality} (${v.accent})`).join('\n')
  );
}

// ─── Helpers: Handle Telegram HITL inline callbacks (approve_hitl_ticket:...) ─

export async function handleGlaciaHitlCallback(callbackData: string): Promise<{ success: boolean; message: string }> {
  // Map legacy captcha prefix → new ticket pattern
  let normalized = callbackData;
  const legacy = callbackData.match(/^(approve|reject)_captcha:([^:]+)(?::(.+))?$/);
  if (legacy) {
    const [, act, accountId, maybeTicketId] = legacy;
    normalized = `${act}_hitl_ticket:${maybeTicketId || accountId}`;
  }
  const res = await resolveHitlTicketFromTelegram(normalized);
  return { success: res.success, message: res.message };
}

// ─── Aggregate helper ───────────────────────────────────────────────────────

function aggregateStatusFromHealth(
  health: ReturnType<typeof getAccountOrchestratorHealth>
): { healthy: number; cooldown: number; challenges: number; banned: number; quota_hit: number; needs_login: number } {
  const out = { healthy: 0, cooldown: 0, challenges: 0, banned: 0, quota_hit: 0, needs_login: 0 };
  for (const platform of Object.values(health.byPlatform)) {
    const p = platform as any;
    out.healthy += p.healthy || 0;
    out.cooldown += p.cooldown || 0;
    out.challenges += p.challenges || 0;
    out.quota_hit += p.quota_hit || 0;
    out.needs_login += p.needs_login || 0;
  }
  out.banned = (health.topActive || []).filter((a) => a.status === 'banned').length;
  return out;
}

// ─── Convenience: fetch full status in one call ─────────────────────────────

export function fetchGlaciaSystemStatus(): GlaciaEcosystemStatus {
  return {
    generatedAt: new Date().toISOString(),
    accounts: getAccountOrchestratorHealth(),
    hitl: getHitlBridgeStats(),
    monitors: getWebMonitorStats(),
    recentBatches: listRecentBatchReports(5),
  };
}

// Prevent unused warning on imports
void updateWebAIAccount;
