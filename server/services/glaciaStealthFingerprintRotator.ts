/**
 * glaciaStealthFingerprintRotator.ts
 * ============================================================================
 * GLACIA STEALTH FINGERPRINT ROTATION ENGINE
 * ============================================================================
 * Luân chuyển ngẫu nhiên Browser Fingerprint giữa các phiên Webchat để tránh
 * bị phát hiện là bot theo dõi dài hạn (long-term session fingerprinting).
 *
 * Các vector fingerprint được xoay vòng:
 * - User-Agent (browser, OS, version)
 * - Viewport kích thước (width x height)
 * - Timezone (múi giờ theo khu vực địa lý)
 * - Accept-Language (ngôn ngữ HTTP header)
 * - Screen resolution metadata
 * - Hardware concurrency (số lõi CPU giả lập)
 * - Device memory (RAM giả lập)
 * ============================================================================
 */

import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export interface BrowserFingerprint {
  fingerprintId: string;
  userAgent: string;
  viewport: { width: number; height: number };
  timezone: string;
  acceptLanguage: string;
  screenResolution: { width: number; height: number };
  hardwareConcurrency: number;
  deviceMemoryGB: number;
  platform: string;
  colorDepth: number;
  // Platform-specific cadence profile
  platform_name: 'chatgpt' | 'gemini_web' | 'claude' | 'deepseek' | 'perplexity' | 'generic';
  generatedAt: string;
}

export interface FingerprintRotationState {
  currentFingerprintId: string | null;
  sessionCount: number;
  rotationCount: number;
  lastRotatedAt: string;
  usedFingerprints: string[];
}

// ── Fingerprint pools ──────────────────────────────────────────────────────

const USER_AGENTS = [
  // Chrome on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.6533.72 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.176 Safari/537.36',
  // Edge on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36 Edg/127.0.0.0',
  // Firefox on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  // Chrome on macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.6533.72 Safari/537.36',
  // Safari on macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
];

const VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1536, height: 864 },
  { width: 1280, height: 800 },
  { width: 2560, height: 1440 },
  { width: 1600, height: 900 },
];

const TIMEZONES = [
  'Asia/Ho_Chi_Minh',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Shanghai',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'America/Chicago',
];

const LANGUAGES = [
  'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
  'en-US,en;q=0.9,vi;q=0.8',
  'en-US,en;q=0.9',
  'th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7',
  'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
  'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
  'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
];

const SCREEN_RESOLUTIONS = [
  { width: 1920, height: 1080 },
  { width: 2560, height: 1440 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 3840, height: 2160 },
];

const HARDWARE_CONCURRENCY = [4, 6, 8, 10, 12, 16];
const DEVICE_MEMORY = [4, 8, 16, 32];
const COLOR_DEPTHS = [24, 30, 32];

const PLATFORMS = [
  { ua_keyword: 'Macintosh', platform: 'MacIntel' },
  { ua_keyword: 'Windows', platform: 'Win32' },
];

// ── Storage ────────────────────────────────────────────────────────────────

const ROTATION_STATE_FILE = path.join(process.cwd(), 'runtime', 'glacia_fingerprint_rotation.json');

function ensureRuntime(): void {
  const dir = path.join(process.cwd(), 'runtime');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function loadRotationState(): FingerprintRotationState {
  ensureRuntime();
  if (fs.existsSync(ROTATION_STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(ROTATION_STATE_FILE, 'utf-8'));
    } catch { /* fallback */ }
  }
  return {
    currentFingerprintId: null,
    sessionCount: 0,
    rotationCount: 0,
    lastRotatedAt: new Date().toISOString(),
    usedFingerprints: [],
  };
}

function saveRotationState(state: FingerprintRotationState): void {
  ensureRuntime();
  fs.writeFileSync(ROTATION_STATE_FILE, JSON.stringify(state, null, 2));
}

// ── Core Generator ─────────────────────────────────────────────────────────

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate a brand new browser fingerprint profile.
 * Each call produces a unique, plausible human fingerprint.
 */
export function generateFingerprint(
  targetPlatform: BrowserFingerprint['platform_name'] = 'generic'
): BrowserFingerprint {
  const ua = pickRandom(USER_AGENTS);
  const viewport = pickRandom(VIEWPORTS);
  const screen = pickRandom(SCREEN_RESOLUTIONS);
  const platformEntry = PLATFORMS.find(p => ua.includes(p.ua_keyword)) ?? PLATFORMS[0];

  // Make screen >= viewport (realistic)
  const safeScreen = {
    width: Math.max(screen.width, viewport.width),
    height: Math.max(screen.height, viewport.height),
  };

  return {
    fingerprintId: randomUUID(),
    userAgent: ua,
    viewport,
    timezone: pickRandom(TIMEZONES),
    acceptLanguage: pickRandom(LANGUAGES),
    screenResolution: safeScreen,
    hardwareConcurrency: pickRandom(HARDWARE_CONCURRENCY),
    deviceMemoryGB: pickRandom(DEVICE_MEMORY),
    platform: platformEntry.platform,
    colorDepth: pickRandom(COLOR_DEPTHS),
    platform_name: targetPlatform,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Get the active fingerprint for a session, rotating if needed.
 * Rotation criteria:
 *   - sessionCount reaches rotateEvery (default 3 sessions)
 *   - forceRotate = true
 */
export function getOrRotateFingerprint(
  targetPlatform: BrowserFingerprint['platform_name'] = 'generic',
  rotateEvery = 3,
  forceRotate = false
): { fingerprint: BrowserFingerprint; wasRotated: boolean } {
  const state = loadRotationState();
  state.sessionCount = (state.sessionCount || 0) + 1;

  const shouldRotate =
    forceRotate ||
    !state.currentFingerprintId ||
    state.sessionCount % rotateEvery === 0;

  let fingerprint: BrowserFingerprint;
  let wasRotated = false;

  if (shouldRotate) {
    fingerprint = generateFingerprint(targetPlatform);
    state.currentFingerprintId = fingerprint.fingerprintId;
    state.rotationCount = (state.rotationCount || 0) + 1;
    state.lastRotatedAt = new Date().toISOString();
    state.usedFingerprints = [
      ...(state.usedFingerprints || []).slice(-20), // keep last 20
      fingerprint.fingerprintId,
    ];
    wasRotated = true;
  } else {
    // Regenerate same-ish fingerprint deterministically from stored ID
    // (in practice we just generate a fresh one since we store state not the FP itself)
    fingerprint = generateFingerprint(targetPlatform);
    fingerprint.fingerprintId = state.currentFingerprintId!;
  }

  saveRotationState(state);
  return { fingerprint, wasRotated };
}

/**
 * Platform-specific cadence tuning — each platform has different bot heuristics.
 */
export interface PlatformCadenceProfile {
  platform: BrowserFingerprint['platform_name'];
  minWpm: number;
  maxWpm: number;
  typoRate: number;
  preSubmitPauseMs: [number, number];  // [min, max]
  interCharJitterMultiplier: number;
  mouseMoveDurationMs: [number, number];
  recommendedMode: 'stealth_human' | 'voice_dictation';
  notes: string;
}

export const PLATFORM_CADENCE_PROFILES: Record<string, PlatformCadenceProfile> = {
  chatgpt: {
    platform: 'chatgpt',
    minWpm: 42,
    maxWpm: 68,
    typoRate: 0.020,
    preSubmitPauseMs: [1800, 3200],
    interCharJitterMultiplier: 1.2,
    mouseMoveDurationMs: [800, 1600],
    recommendedMode: 'stealth_human',
    notes: 'ChatGPT uses Cloudflare + OpenAI Arize telemetry. Keystroke interval variance is critical.',
  },
  gemini_web: {
    platform: 'gemini_web',
    minWpm: 50,
    maxWpm: 75,
    typoRate: 0.015,
    preSubmitPauseMs: [1200, 2500],
    interCharJitterMultiplier: 1.0,
    mouseMoveDurationMs: [600, 1200],
    recommendedMode: 'voice_dictation',
    notes: 'Gemini Web has a native mic button — Voice Dictation mode bypasses keyboard telemetry entirely.',
  },
  claude: {
    platform: 'claude',
    minWpm: 45,
    maxWpm: 70,
    typoRate: 0.018,
    preSubmitPauseMs: [2000, 3500],
    interCharJitterMultiplier: 1.1,
    mouseMoveDurationMs: [700, 1400],
    recommendedMode: 'stealth_human',
    notes: 'Claude (Anthropic) uses reCAPTCHA v3 + Fingerprint Pro on suspicious accounts.',
  },
  deepseek: {
    platform: 'deepseek',
    minWpm: 55,
    maxWpm: 80,
    typoRate: 0.012,
    preSubmitPauseMs: [1000, 2000],
    interCharJitterMultiplier: 0.9,
    mouseMoveDurationMs: [500, 1000],
    recommendedMode: 'stealth_human',
    notes: 'DeepSeek has lighter bot detection. Moderate stealth is sufficient.',
  },
  perplexity: {
    platform: 'perplexity',
    minWpm: 48,
    maxWpm: 72,
    typoRate: 0.016,
    preSubmitPauseMs: [1500, 2800],
    interCharJitterMultiplier: 1.0,
    mouseMoveDurationMs: [650, 1300],
    recommendedMode: 'stealth_human',
    notes: 'Perplexity uses DataDome bot protection on heavy usage.',
  },
  generic: {
    platform: 'generic',
    minWpm: 50,
    maxWpm: 70,
    typoRate: 0.018,
    preSubmitPauseMs: [1500, 2500],
    interCharJitterMultiplier: 1.0,
    mouseMoveDurationMs: [600, 1200],
    recommendedMode: 'stealth_human',
    notes: 'Generic profile for unknown platforms.',
  },
};

/**
 * Detect which platform we are on from URL.
 */
export function detectPlatformFromUrl(url: string): BrowserFingerprint['platform_name'] {
  const lower = url.toLowerCase();
  if (lower.includes('chatgpt.com') || lower.includes('chat.openai.com')) return 'chatgpt';
  if (lower.includes('gemini.google.com')) return 'gemini_web';
  if (lower.includes('claude.ai')) return 'claude';
  if (lower.includes('deepseek.com')) return 'deepseek';
  if (lower.includes('perplexity.ai')) return 'perplexity';
  return 'generic';
}

/**
 * Apply fingerprint to a Puppeteer page object.
 * Injects navigator overrides via page.evaluateOnNewDocument.
 */
export async function applyFingerprintToPage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any,
  fingerprint: BrowserFingerprint
): Promise<void> {
  await page.setUserAgent(fingerprint.userAgent);
  await page.setViewport({ ...fingerprint.viewport, deviceScaleFactor: 1 });
  await page.setExtraHTTPHeaders({ 'Accept-Language': fingerprint.acceptLanguage });

  // Override navigator properties to match fingerprint
  await page.evaluateOnNewDocument((fp: BrowserFingerprint) => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => fp.hardwareConcurrency });
    Object.defineProperty(navigator, 'deviceMemory', { get: () => fp.deviceMemoryGB });
    Object.defineProperty(navigator, 'platform', { get: () => fp.platform });
    Object.defineProperty(navigator, 'language', { get: () => fp.acceptLanguage.split(',')[0] });
    Object.defineProperty(screen, 'width', { get: () => fp.screenResolution.width });
    Object.defineProperty(screen, 'height', { get: () => fp.screenResolution.height });
    Object.defineProperty(screen, 'colorDepth', { get: () => fp.colorDepth });
    // Block WebDriver detection
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  }, fingerprint);
}

export function getRotationStats(): FingerprintRotationState & { totalFingerprintsUsed: number } {
  const state = loadRotationState();
  return { ...state, totalFingerprintsUsed: (state.usedFingerprints || []).length };
}

export function forceRotateNow(
  targetPlatform: BrowserFingerprint['platform_name'] = 'generic'
): BrowserFingerprint {
  const { fingerprint } = getOrRotateFingerprint(targetPlatform, 1, true);
  return fingerprint;
}
