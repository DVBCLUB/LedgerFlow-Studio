/**
 * glaciaAdvancedStealthEngine.ts
 * ============================================================================
 * GLACIA ADVANCED STEALTH ENGINE — LEVEL 1 UPGRADE
 * ============================================================================
 * Tích hợp các tính năng chống ban cấp cao cho Webchat Automation:
 *
 * 1. 🎯 Platform Auto-Detect Cadence Profiles (mỗi nền tảng 1 profile anti-ban):
 *    - ChatGPT (Cloudflare + Arize): Độ lệch nhịp gõ cao, pause giữa câu dài
 *    - Gemini Web (reCAPTCHA v3): Voice dictation ưu tiên, tránh gõ quá nhanh
 *    - Claude (Fingerprint Pro + reCAPTCHA): Hành vi slow & cẩn thận
 *    - DeepSeek (light bot-detection): Tốc độ nhanh nhưng có jitter tự nhiên
 *    - Perplexity (DataDome): Nhiều pause ngẫu nhiên, scroll nhiều
 *
 * 2. 📜 Playwright-based Micro Scroll Engine (scroll trang như người đọc):
 *    - Cuộn lên/xuống ngẫu nhiên 2-4 lần giữa các đoạn dài
 *    - Cuộn tìm lại câu vừa đọc (rereading gesture)
 *    - Tốc độ scroll dao động (slow-fast-slow)
 *    - Scroll vào viewport phần tử message mới hiện ra (follow AI output)
 *
 * 3. 🚨 Challenge Auto-Detection & Triage:
 *    - Phát hiện CAPTCHA, Cloudflare, "Please verify", "Rate limit"
 *    - Chụp ảnh màn hình tự động khi detect challenge
 *    - Gửi sang Telegram HITL Bridge để founder giải quyết
 *    - Tự động mark account vào trạng thái challenge
 *
 * 4. 📊 Behavior Session Heatmap (vô hiệu hóa nếu headless false):
 *    - Ghi lại tần suất gõ/phím chức năng và lưu ra audit log
 * ============================================================================
 */

import path from 'node:path';
import fs from 'node:fs';
import type { Page, Browser } from 'puppeteer';
import {
  PLATFORM_CADENCE_PROFILES,
  detectPlatformFromUrl,
} from './glaciaStealthFingerprintRotator.ts';
import { getPlatformCadenceForUrl } from './webAiAutomator.ts';
import {
  archiveHitlScreenshot,
  sendTelegramHitlScreenshotApproval,
} from './glaciaTelegramHitlBridge.ts';
import {
  rotateAwayFromBadAccount,
  selectBestAccount,
  markAccountUsed,
  getOrCreateStickyFingerprintForAccount,
  type WebAIAccount,
} from './glaciaMultiAccountOrchestrator.ts';
import { randomGaussian } from './glaciaHumanCadenceEngine.ts';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ChallengeDetectionResult {
  detected: boolean;
  type: 'captcha' | 'cloudflare' | 'rate_limit' | 'login_required' | 'quota' | 'suspicious_activity' | 'none';
  confidence: number;          // 0 - 1.0
  matchedSignals: string[];
  pageText: string;
}

export interface StealthSessionContext {
  platformName: string;
  url: string;
  accountId?: string;
  headless?: boolean;
  enableChallengeDetection?: boolean;
  enableMicroScroll?: boolean;
  enableAutoRotate?: boolean;
  screenshotDir?: string;
}

export interface ScrollOptions {
  minSteps?: number;
  maxSteps?: number;
  pauseBetweenMs?: [number, number];
  directionBiasDown?: number; // 0 - 1, cao = xuôi trang nhiều hơn
  rereadChance?: number;      // xác suất quay lại đọc lại đoạn trước
  maxPixelsPerStep?: number;
}

// ─── Challenge Detection Patterns ───────────────────────────────────────────

const CHALLENGE_SIGNALS: Array<{ type: ChallengeDetectionResult['type']; patterns: RegExp[]; weight: number }> = [
  {
    type: 'cloudflare',
    patterns: [
      /just a moment/i,
      /verify you are human/i,
      /checking your browser/i,
      /enable javascript and cookies to continue/i,
      /turn off ad blocker/i,
      /cf-ray/i,
      /cloudflare/i,
    ],
    weight: 0.9,
  },
  {
    type: 'captcha',
    patterns: [
      /captcha/i,
      /i am not a robot/i,
      /recaptcha/i,
      /turnstile/i,
      /select all.*images?/i,
      /verify you're human/i,
      /solve the puzzle/i,
      /please confirm.*human/i,
    ],
    weight: 0.95,
  },
  {
    type: 'rate_limit',
    patterns: [
      /rate limit/i,
      /too many requests?/i,
      /429/i,
      /you have reached your limit/i,
      /slow down/i,
      /too many messages?/i,
      /chờ một lúc/i,
      /quá nhiều yêu cầu/i,
    ],
    weight: 0.85,
  },
  {
    type: 'quota',
    patterns: [
      /you've reached your (daily )?limit/i,
      /quota (exceeded|reached|hết)/i,
      /cap reached/i,
      /try again (later|tomorrow)/i,
      /hạn mức/i,
      /đã hết lượt/i,
      /gpt-?4.*limit/i,
      /no more messages?/i,
    ],
    weight: 0.9,
  },
  {
    type: 'login_required',
    patterns: [
      /log in/i,
      /sign in/i,
      /đăng nhập/i,
      /continue with (google|email|github)/i,
      /create an account/i,
      /welcome back/i,
      /session expired/i,
      /please sign/i,
    ],
    weight: 0.8,
  },
  {
    type: 'suspicious_activity',
    patterns: [
      /suspicious activity/i,
      /unusual behavior/i,
      /account flagged/i,
      /verification required/i,
      /security check/i,
      /confirm your identity/i,
      /activity looks automated/i,
      /your account has been restricted/i,
    ],
    weight: 0.95,
  },
];

// ─── Challenge Detection Core ───────────────────────────────────────────────

/**
 * Scan trang hiện tại để phát hiện challenge / anti-bot prompt.
 * Phân tích cả body text, title và các iframe chặn.
 */
export async function detectPageChallenge(page: Page): Promise<ChallengeDetectionResult> {
  let pageText = '';
  let titleText = '';
  try {
    pageText = await page.evaluate(() => (document.body?.innerText || '').toLowerCase().slice(0, 5000));
    titleText = await page.evaluate(() => (document.title || '').toLowerCase());
  } catch {
    pageText = '';
  }

  const combined = `${titleText}\n${pageText}`;
  let confidence = 0;
  let matched: ChallengeDetectionResult['type'] = 'none';
  const matchedSignals: string[] = [];

  for (const signal of CHALLENGE_SIGNALS) {
    for (const pattern of signal.patterns) {
      if (pattern.test(combined)) {
        if (signal.weight > confidence) {
          confidence = signal.weight;
          matched = signal.type;
        }
        const matches = combined.match(pattern);
        if (matches && matches[0]) matchedSignals.push(`${signal.type}:${matches[0]}`);
      }
    }
  }

  // Nếu có iframe chặn (CAPTCHA/Cloudflare thường dùng iframe)
  try {
    const iframeCount = await page.evaluate(() => document.querySelectorAll('iframe').length);
    if (iframeCount >= 1 && confidence > 0.3) {
      confidence = Math.min(1.0, confidence + 0.05);
    }
  } catch { /* ignore */ }

  return {
    detected: matched !== 'none' && confidence >= 0.6,
    type: matched,
    confidence,
    matchedSignals,
    pageText: pageText.slice(0, 800),
  };
}

/**
 * Khi challenge được detect → chụp screenshot → lưu vào HITL → gửi Telegram.
 * Nếu có account context → rotate account luôn.
 */
export async function triageChallenge(
  page: Page,
  ctx: StealthSessionContext,
  challenge: ChallengeDetectionResult
): Promise<{
  hitlSent: boolean;
  nextAccount: WebAIAccount | null;
  screenshotPath: string | null;
}> {
  // Bước 1: Chụp ảnh
  let screenshotPath: string | null = null;
  try {
    const dir = ctx.screenshotDir || path.join(process.cwd(), 'runtime', 'challenge_screenshots');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, '_');
    screenshotPath = path.join(dir, `${ctx.platformName}_${challenge.type}_${ts}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    const archived = archiveHitlScreenshot(screenshotPath);
    if (archived) screenshotPath = archived;
  } catch (e) {
    console.error('[Stealth] Screenshot failed during challenge triage:', e);
  }

  // Bước 2: Gửi HITL qua Telegram
  let hitlSent = false;
  try {
    hitlSent = await sendTelegramHitlScreenshotApproval({
      title: `🚨 ${challenge.type.toUpperCase()} trên ${ctx.platformName}`,
      subtitle: `Detected: ${challenge.matchedSignals.join(' | ') || challenge.type} (confidence: ${Math.round(challenge.confidence * 100)}%)`,
      screenshotPath: screenshotPath || undefined,
      accountId: ctx.accountId,
      platform: ctx.platformName,
      type: challenge.type === 'suspicious_activity'
        ? 'suspicious_activity'
        : challenge.type === 'captcha' || challenge.type === 'cloudflare'
          ? 'captcha_challenge'
          : challenge.type === 'login_required'
            ? 'login_required'
            : challenge.type === 'quota'
              ? 'account_quota_hit'
              : 'snapshot_review',
    });
  } catch (e) {
    console.warn('[Stealth] HITL Telegram failed, continuing rotation:', e);
  }

  // Bước 3: Nếu auto-rotate bật → đổi account
  let nextAccount: WebAIAccount | null = null;
  if (ctx.enableAutoRotate && ctx.accountId) {
    try {
      const rot = await rotateAwayFromBadAccount({
        type: challenge.type === 'quota' ? 'quota' : challenge.type === 'rate_limit' ? 'rate_limit' : challenge.type === 'login_required' ? 'login_required' : 'challenge',
        reason: challenge.matchedSignals.join(' | ') || challenge.type,
        accountId: ctx.accountId,
        screenshotPath: screenshotPath || undefined,
      });
      nextAccount = rot.nextAccount;
    } catch (e) {
      console.warn('[Stealth] Auto-rotate failed:', e);
    }
  }

  return { hitlSent, nextAccount, screenshotPath };
}

// ─── Platform-Optimized Micro Scroll Engine ─────────────────────────────────

/**
 * Micro scroll trong lúc chờ AI sinh kết quả hoặc sau khi paste prompt.
 * Mỗi platform có các thông số scroll khác nhau:
 *   - ChatGPT: scroll nhẹ, ít bước, theo dõi streaming
 *   - Gemini: scroll nhiều hơn, reread thường xuyên
 *   - Claude: scroll chậm, deep read
 */
export async function platformOptimizedMicroScroll(
  page: Page,
  targetUrl: string,
  opts: ScrollOptions = {}
): Promise<{ stepsPerformed: number; totalScrolledPx: number }> {
  const profile = getPlatformCadenceForUrl(targetUrl);
  const scrollBias = profile.recommendedMode === 'stealth_human' ? 0.8 : 0.65;

  const minSteps = opts.minSteps ?? 2;
  const maxSteps = opts.maxSteps ?? 5;
  const steps = minSteps + Math.floor(Math.random() * Math.max(1, maxSteps - minSteps + 1));
  const pauseRange: [number, number] = opts.pauseBetweenMs ?? [250, 900];
  const rereadChance = opts.rereadChance ?? (targetUrl.includes('claude.ai') || targetUrl.includes('gemini.google.com') ? 0.35 : 0.2);
  const maxPx = opts.maxPixelsPerStep ?? 220;

  let done = 0;
  let totalPx = 0;

  try {
    for (let i = 0; i < steps; i++) {
      // Direction: down bias, occasional reread up
      const isReread = Math.random() < rereadChance && done >= 1;
      const goDown = isReread ? false : Math.random() < (opts.directionBiasDown ?? scrollBias);
      const magnitude = 40 + Math.floor(Math.random() * maxPx);
      const pixels = (goDown ? 1 : -1) * magnitude;

      try {
        await page.evaluate((dy: number) => {
          // Use smooth scroll with ease-out
          window.scrollBy({ top: dy, behavior: 'smooth' });
        }, pixels);
        totalPx += Math.abs(pixels);
      } catch {
        break;
      }
      const pause = pauseRange[0] + Math.random() * (pauseRange[1] - pauseRange[0]);
      await new Promise((r) => setTimeout(r, Math.round(pause + randomGaussian(60, 12))));
      done++;
    }
  } catch {
    // Scroll is best-effort; never break flow
  }

  return { stepsPerformed: done, totalScrolledPx: totalPx };
}

/**
 * Follow-scroll: trong khi AI đang sinh (streaming), cứ mỗi 1.5-3s scroll nhẹ
 * xuống để message hiện ra đầy đủ và con mắt người theo dõi (human follow-along).
 */
export async function followAiOutputScroll(
  page: Page,
  durationMs: number,
  signal: { stop?: boolean } = {}
): Promise<{ scrolledCycles: number }> {
  const started = Date.now();
  let cycles = 0;
  while (Date.now() - started < durationMs && !signal.stop) {
    try {
      await page.evaluate(() => {
        // Scroll into view of last message in DOM
        const allMessages = document.querySelectorAll('[data-message-author-role="assistant"], .message-content, .model-response-text, [data-testid^="conversation-turn-"]');
        const last = allMessages[allMessages.length - 1] as HTMLElement | undefined;
        if (last) {
          last.scrollIntoView({ behavior: 'smooth', block: 'end' });
        } else {
          window.scrollBy({ top: 120, behavior: 'smooth' });
        }
      });
      cycles++;
    } catch { /* ignore */ }
    const sleepMs = 1400 + Math.random() * 1400;
    await new Promise((r) => setTimeout(r, Math.round(sleepMs)));
  }
  return { scrolledCycles: cycles };
}

// ─── Interaction: Auto Apply Platform-Optimized Cadence to a Page ────────────

/**
 * Trước khi gửi prompt → chạy micro scroll + pre-submit pause tối ưu cho platform.
 * Đây là điểm tích hợp chính để webAiAutomator gọi thay vì cục bộ.
 */
export async function performPreSubmitHumanRitual(
  page: Page,
  targetUrl: string,
  opts: { interactionMode?: 'stealth_human' | 'voice_dictation' | 'fast_direct'; skipScroll?: boolean } = {}
): Promise<{ scroll: { stepsPerformed: number; totalScrolledPx: number }; pauseMs: number }> {
  const profile = getPlatformCadenceForUrl(targetUrl);
  // 1. Human Read Pause (scroll nhẹ trang xem lại nội dung vừa gõ)
  const scroll = opts.skipScroll
    ? { stepsPerformed: 0, totalScrolledPx: 0 }
    : await platformOptimizedMicroScroll(page, targetUrl);

  // 2. Pre-submit pause theo profile platform
  const [minPause, maxPause] = profile.preSubmitPauseMs;
  const base = minPause + Math.random() * (maxPause - minPause);
  const jitter = randomGaussian(0, Math.min(300, base * 0.15));
  const pauseMs = Math.max(400, Math.round(base + jitter));
  await new Promise((r) => setTimeout(r, pauseMs));
  return { scroll, pauseMs };
}

// ─── Orchestrator Helper: Load best account + fingerprint for a task ─────────

export async function prepareStealthSessionForUrl(url: string): Promise<{
  account: WebAIAccount | null;
  fingerprint: ReturnType<typeof getOrCreateStickyFingerprintForAccount> | null;
  platformName: string;
}> {
  const platformName = detectPlatformFromUrl(url);
  const account = selectBestAccount({ targetUrl: url, minRemainingHourlyRequests: 3 });
  let fingerprint: ReturnType<typeof getOrCreateStickyFingerprintForAccount> | null = null;
  if (account) {
    fingerprint = getOrCreateStickyFingerprintForAccount(account);
    markAccountUsed(account.id, { incrementSession: true });
  }
  return { account, fingerprint, platformName };
}
