import puppeteer, { Browser, Page } from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { WebAiSessionManager, type WebAIProfileStatus } from './webAiSessionManager.ts';
import { classifyWebAIPageText, parseQuotaResetTime } from './webAiPolicy.ts';
import { registerProfile, reportProfileSuccess, reportProfileError, isProfileAvailable } from './webAiReliability.ts';

// Polyfill for esbuild keepNames __name helper (tsx + esbuild 0.28 compat)
(globalThis as any).__name ??= function __name(target: any, value: string) {
  Object.defineProperty(target, "name", { value, configurable: true });
  return target;
};

export interface WebAICodeBlock {
  language: string;
  code: string;
  targetFile?: string;
}

export interface WebAIResult {
  text: string;
  codeBlocks: WebAICodeBlock[];
  modelUsed: string;
  screenshotPath?: string;
  // V3 enrichment fields
  durationMs: number;          // Total wall-clock time from submit to result
  pollCycles: number;          // Number of polling iterations
  charCount: number;           // Character count of response text
  platform: string;            // Platform name used
  profileId?: string;          // Profile ID used
  conversationId?: string;     // Extracted conversation ID (if available)
  retryAttempt: number;        // Which retry attempt succeeded (0 = first try)
  wasReusedSession: boolean;   // Whether a pooled browser session was reused
}

// Selectors configuration for each platform
interface PlatformConfig {
  url: string;
  inputSelector: string;
  sendSelector?: string;
  messageSelector: string;
  stopGenerationSelector?: string;
  loadingSelector?: string;
  detectLoginSelector?: string;
  loginText?: string[];
}

export type WebAIErrorCode = 'quota' | 'login_required' | 'platform_error' | 'automation_error';

export class WebAIError extends Error {
  public code: WebAIErrorCode;
  public retryable: boolean;
  public quotaResetAt?: string;

  constructor(message: string, code: WebAIErrorCode, retryable = false, quotaResetAt?: string) {
    super(message);
    this.name = 'WebAIError';
    this.code = code;
    this.retryable = retryable;
    this.quotaResetAt = quotaResetAt;
  }
}

async function forceKillBrowser(browser: Browser | undefined | null) {
  if (!browser) return;
  try {
    const proc = browser.process();
    const pid = proc?.pid;
    await browser.close().catch(() => {});
    if (pid) {
      try {
        process.kill(pid, 'SIGKILL');
      } catch (e) {
        // ignore if already dead
      }
    }
  } catch (e) {
    console.error('[Web AI] Error force killing browser:', e);
  }
}

export function getSystemChromeExecutablePath(): string | undefined {
  if (process.platform === 'win32') {
    const candidatePaths = [
      path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Google\\Chrome\\Application\\chrome.exe'),
      path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Google\\Chrome\\Application\\chrome.exe'),
      path.join(process.env.LOCALAPPDATA || 'C:\\Users\\Default\\AppData\\Local', 'Google\\Chrome\\Application\\chrome.exe'),
      path.join(process.env.USERPROFILE || 'C:\\Users\\Default', 'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'),
    ];
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) return p;
    }
  } else if (process.platform === 'darwin') {
    const candidatePaths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'
    ];
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) return p;
    }
  } else if (process.platform === 'linux') {
    const candidatePaths = [
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium'
    ];
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) return p;
    }
  }
  return undefined;
}

export const PLATFORMS: Record<string, PlatformConfig> = {
  chatgpt: {
    url: 'https://chatgpt.com/',
    inputSelector: '#prompt-textarea, div[contenteditable="true"][id="prompt-textarea"], div[contenteditable="true"], .ProseMirror, textarea[data-id="root"], textarea',
    sendSelector: '[data-testid="send-button"], [data-testid="composer-send-button"], #composer-submit-button, button[aria-label="Send prompt"], button[aria-label="Send message"], button[aria-label="Gửi tin nhắn"], button[data-testid="fruitjuice-send-button"]',
    messageSelector: '[data-testid^="conversation-turn-"] .markdown, article .markdown, .agent-turn .markdown, div.markdown, [data-message-author-role="assistant"] .markdown',
    stopGenerationSelector: '[data-testid="stop-button"], button[aria-label*="stop generating" i], button[aria-label*="dừng tạo" i], button[aria-label*="stop" i]',
    loadingSelector: '.result-streaming, [data-testid="stop-button"]',
    detectLoginSelector: 'a[href*="/login" i], button[data-testid="login-button"]',
    loginText: ['log in', 'sign in', 'đăng nhập', 'login', 'continue'],
  },
  gemini: {
    url: 'https://gemini.google.com/',
    inputSelector: 'rich-textarea div[contenteditable="true"], rich-textarea p, gem-chat-input div[contenteditable="true"], div[role="textbox" i], .ql-editor, textarea, div[contenteditable="true"]',
    sendSelector: 'button[aria-label*="gửi" i], button[aria-label*="send" i], button[aria-label*="submit" i], button[aria-label*="yêu cầu" i], button.send-button, .send-button-container button, button[aria-label*="Send message" i], button[aria-label*="Gửi tin nhắn" i], button.submit-button',
    messageSelector: '.model-response, message-content, .response-container-content, .message-content, .turn-content, .model-response-text, p.paragraph',
    stopGenerationSelector: 'button[aria-label*="stop generating" i], button[aria-label*="dừng tạo" i], button[aria-label*="đang tạo" i], button[aria-label*="cancel" i]',
    loadingSelector: 'loading-indicator, .loading-spinner, mat-progress-bar, .response-loading, message-content[is-loading]',
    detectLoginSelector: 'a[href*="accounts.google.com/ServiceLogin" i], a[href*="accounts.google.com/InteractiveLogin" i]',
    loginText: ['đăng nhập', 'sign in', 'login'],
  },
  claude: {
    url: 'https://claude.ai/',
    inputSelector: 'div[contenteditable="true" i], textarea, fieldset div[contenteditable="true"], p[data-placeholder], div[data-testid="chat-input"]',
    sendSelector: 'button[aria-label*="send" i], button[aria-label*="gửi" i], button[aria-label*="Send" i], button[data-testid="send-button"]',
    messageSelector: '.font-claude-message, .markdown, .prose, .message-bubble, div[data-is-streaming="false"]',
    stopGenerationSelector: 'button[aria-label*="stop generating" i], button[aria-label*="dừng" i], button[aria-label*="stop response" i]',
    loadingSelector: '.is-streaming, [data-is-streaming="true"], .streaming-indicator',
    detectLoginSelector: 'input[type="email" i]',
    loginText: ['sign in', 'continue with google', 'đăng nhập', 'login'],
  },
  deepseek: {
    url: 'https://chat.deepseek.com/',
    inputSelector: '#chat-input, #ds-chat-input, textarea, div[contenteditable="true" i]',
    sendSelector: 'div[class*="sendButton" i], button[class*="ds-icon-button" i], button[aria-label*="send" i]',
    messageSelector: '.ds-markdown, .markdown, .markdown-body, .text-message-content',
    stopGenerationSelector: 'button[class*="ds-button" i] svg circle, div[class*="stop" i], button[aria-label*="stop" i]',
    loadingSelector: '.is-thinking, .loading-more, .ds-loading',
    loginText: ['log in', 'sign in', 'đăng nhập'],
  },
  grok: {
    url: 'https://grok.com/',
    inputSelector: 'textarea, div[contenteditable="true" i], [role="textbox" i]',
    sendSelector: 'button[aria-label*="Send" i], button[aria-label*="gửi" i], button[type="submit"]',
    messageSelector: '.markdown, .grok-message-body, .grok-response',
    stopGenerationSelector: 'button[aria-label*="stop" i], button[aria-label*="dừng" i]',
    loadingSelector: '.generating, .loading-response',
    loginText: ['sign in', 'đăng nhập', 'login'],
  },
  copilot: {
    url: 'https://copilot.microsoft.com/',
    inputSelector: 'textarea, [role="textbox" i], div[contenteditable="true" i]',
    sendSelector: 'button[aria-label*="submit" i], button[aria-label*="send" i], button[type="submit"]',
    messageSelector: '.markdown, .reply-bubble, cib-message, .response-text',
    stopGenerationSelector: 'button[aria-label*="stop" i], button[aria-label*="dừng" i]',
    loadingSelector: '.typing-indicator, .loading-response',
    loginText: ['sign in', 'đăng nhập', 'login'],
  },
};

const XML_BLOCK_REGEX = /<code_block\s+file="([^"]+)"(?:\s+lang="([^"]+)")?\s*>([\s\S]*?)<\/code_block>/g;

export function inferLanguageFromPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const languageByExtension: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'tsx',
    '.js': 'javascript',
    '.jsx': 'jsx',
    '.mjs': 'javascript',
    '.cjs': 'javascript',
    '.json': 'json',
    '.css': 'css',
    '.scss': 'scss',
    '.html': 'html',
    '.md': 'markdown',
    '.py': 'python',
    '.sh': 'shell',
    '.bash': 'shell',
    '.yml': 'yaml',
    '.yaml': 'yaml',
    '.sql': 'sql',
    '.c': 'c',
    '.cpp': 'cpp',
    '.cs': 'csharp',
    '.go': 'go',
    '.rs': 'rust',
    '.java': 'java',
  };
  return languageByExtension[ext] || 'text';
}

export function extractXmlCodeBlocks(text: string): WebAICodeBlock[] {
  const blocks: WebAICodeBlock[] = [];
  let match;
  XML_BLOCK_REGEX.lastIndex = 0;

  while ((match = XML_BLOCK_REGEX.exec(text)) !== null) {
    const targetFile = match[1].trim();
    blocks.push({
      targetFile,
      language: (match[2] || inferLanguageFromPath(targetFile)).toLowerCase(),
      code: match[3].replace(/^\n/, '').replace(/\n$/, ''),
    });
  }

  return blocks;
}

/**
 * Extracts code blocks from raw text and matches them to suggested filenames.
 */
export function extractCodeBlocks(text: string, defaultTargetFile?: string): WebAICodeBlock[] {
  const xmlBlocks = extractXmlCodeBlocks(text);
  if (xmlBlocks.length > 0) return xmlBlocks;

  const codeBlocks: WebAICodeBlock[] = [];
  const regex = /```(\w*)\n([\s\S]*?)```/g;
  let match;

  // Let's find preceding lines for potential file paths (e.g. "// src/components/App.tsx" or "file: src/components/App.tsx")
  const lines = text.split('\n');

  while ((match = regex.exec(text)) !== null) {
    const language = match[1]?.toLowerCase() || 'typescript';
    const code = match[2];
    
    // Look backwards up to 5 lines from the code block start to see if a file name is mentioned
    const matchIndex = match.index;
    const precedingText = text.substring(Math.max(0, matchIndex - 150), matchIndex);
    const precedingLines = precedingText.split('\n').map(l => l.trim()).filter(Boolean);
    
    let targetFile = defaultTargetFile;
    
    // Simple regex to locate paths in preceding lines (e.g. src/App.tsx, server/server.ts, index.css)
    const pathRegex = /(?:[a-zA-Z0-9_\-\.\/]+)\.(?:tsx|ts|js|jsx|css|json|html|py|sh|yml|yaml|md)/;
    for (let i = precedingLines.length - 1; i >= 0; i--) {
      const line = precedingLines[i];
      const foundPath = line.match(pathRegex);
      if (foundPath && !line.toLowerCase().includes('example') && !line.toLowerCase().includes('ví dụ')) {
        targetFile = foundPath[0];
        break;
      }
    }

    codeBlocks.push({
      language,
      code,
      targetFile,
    });
  }

  return codeBlocks;
}

/**
 * Configure page with anti-detection (stealth) settings to evade bot detection
 * Stealth Engine V2 — industry-grade anti-fingerprinting
 */
export async function applyStealthSettings(page: Page): Promise<void> {
  const CHROME_VERSION = '131.0.0.0';
  const USER_AGENT = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROME_VERSION} Safari/537.36`;
  
  // Set User Agent
  await page.setUserAgent(USER_AGENT);

  // CDP-level UserAgent override — syncs UA across all DevTools APIs
  try {
    const client = await page.createCDPSession();
    await client.send('Network.setUserAgentOverride', {
      userAgent: USER_AGENT,
      acceptLanguage: 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
      platform: 'Win32',
      userAgentMetadata: {
        brands: [
          { brand: 'Google Chrome', version: '131' },
          { brand: 'Chromium', version: '131' },
          { brand: 'Not_A Brand', version: '24' },
        ],
        fullVersionList: [
          { brand: 'Google Chrome', version: CHROME_VERSION },
          { brand: 'Chromium', version: CHROME_VERSION },
        ],
        fullVersion: CHROME_VERSION,
        platform: 'Windows',
        platformVersion: '15.0.0',
        architecture: 'x86',
        model: '',
        mobile: false,
        bitness: '64',
        wow64: false,
      },
    });
    await client.detach();
  } catch {
    // CDP session may not be available in all environments
  }

  // Set default viewport to normal dimensions
  await page.setViewport({ width: 1280, height: 800 });

  // ── Critical: define __name in browser context via RAW STRING ──
  // Dùng string (không qua tsx transpile) để tránh vòng lặp __name
  await page.evaluateOnNewDocument(`
    window.__name = function(target, value) {
      Object.defineProperty(target, 'name', { value: value, configurable: true });
      return target;
    };
  `);

  // Add comprehensive stealth scripts
  await page.evaluateOnNewDocument(() => {
    // 1. Hide webdriver property
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });

    // 2. Mock chrome runtime object
    (window as any).chrome = {
      app: {
        isInstalled: false,
        InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' },
        RunningState: { CAN_RUN: 'can_run', CANNOT_RUN: 'cannot_run', RUNNING: 'running' },
      },
      runtime: {
        OnInstalledReason: { CHROME_UPDATE: 'chrome_update', INSTALL: 'install', SHARED_MODULE_UPDATE: 'shared_module_update', UPDATE: 'update' },
        OnRestartRequiredReason: { APP_UPDATE: 'app_update', OS_UPDATE: 'os_update', PERIODIC: 'periodic' },
        PlatformArch: { ARM: 'arm', ARM64: 'arm64', MIPS: 'mips', MIPS64: 'mips64', X86_32: 'x86-32', X86_64: 'x86-64' },
        PlatformNaclArch: { ARM: 'arm', MIPS: 'mips', MIPS64: 'mips64', X86_32: 'x86-32', X86_64: 'x86-64' },
        PlatformOs: { ANDROID: 'android', CROS: 'cros', LINUX: 'linux', MAC: 'mac', OPENBSD: 'openbsd', WIN: 'win' },
        RequestUpdateCheckStatus: { NO_UPDATE: 'no_update', THROTTLED: 'throttled', UPDATE_AVAILABLE: 'update_available' },
      },
    };

    // 3. Set languages
    Object.defineProperty(navigator, 'languages', {
      get: () => ['vi-VN', 'vi', 'en-US', 'en'],
    });

    // 4. Mock permissions query
    const originalQuery = (navigator as any).permissions?.query;
    if (originalQuery) {
      (navigator as any).permissions.query = (parameters: any) =>
        parameters.name === 'notifications'
          ? Promise.resolve({ state: Notification.permission })
          : originalQuery.call(navigator.permissions, parameters);
    }

    // 5. Mock navigator.plugins (realistic Chrome plugin list)
    Object.defineProperty(navigator, 'plugins', {
      get: () => [
        { name: 'PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
        { name: 'Chrome PDF Viewer', filename: 'mhjcbomhhahjlnebmofoofbackdaibbo', description: 'Portable Document Format' },
        { name: 'Chromium PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
        { name: 'Microsoft Edge PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
        { name: 'WebKit built-in PDF', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
      ],
    });

    // 6. Hardware fingerprint: realistic values for desktop Chrome
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
    Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 0 }); // Desktop = no touch

    // 7. Connection API mock
    Object.defineProperty(navigator, 'connection', {
      get: () => ({
        effectiveType: '4g',
        rtt: 50,
        downlink: 10,
        saveData: false,
      }),
    });

    // 8. WebGL GPU fingerprint — mock a real NVIDIA GPU
    const getParameterProto = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function (param: GLenum) {
      // UNMASKED_VENDOR_WEBGL
      if (param === 0x9245) return 'Google Inc. (NVIDIA)';
      // UNMASKED_RENDERER_WEBGL
      if (param === 0x9246) return 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1650 Direct3D11 vs_5_0 ps_5_0, D3D11)';
      return getParameterProto.call(this, param);
    };
    // Also patch WebGL2
    if (typeof WebGL2RenderingContext !== 'undefined') {
      const getParam2Proto = WebGL2RenderingContext.prototype.getParameter;
      WebGL2RenderingContext.prototype.getParameter = function (param: GLenum) {
        if (param === 0x9245) return 'Google Inc. (NVIDIA)';
        if (param === 0x9246) return 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1650 Direct3D11 vs_5_0 ps_5_0, D3D11)';
        return getParam2Proto.call(this, param);
      };
    }

    // 9. Canvas fingerprint noise injection — adds subtle per-session variation
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function (type?: string, quality?: number) {
      const context = this.getContext('2d');
      if (context && this.width > 0 && this.height > 0) {
        // Add invisible noise pixel to make fingerprint unique per session
        const imageData = context.getImageData(0, 0, 1, 1);
        imageData.data[0] = (imageData.data[0] + Math.floor(Math.random() * 3)) % 256;
        context.putImageData(imageData, 0, 0);
      }
      return originalToDataURL.call(this, type, quality);
    };
  });

  // Client Hints headers (Sec-CH-UA) — matches Chrome 131
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
    'Sec-CH-UA': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    'Sec-CH-UA-Mobile': '?0',
    'Sec-CH-UA-Platform': '"Windows"',
  });
}

/**
 * Remove Chrome singleton lock files left from crashed sessions to prevent
 * "profile is in use" errors on the next launch.
 */
function removeChromeProfileLocks(profileDir: string): void {
  const lockFiles = ['SingletonLock', 'SingletonCookie', 'SingletonSocket'];
  for (const lf of lockFiles) {
    const lockPath = path.join(profileDir, lf);
    if (fs.existsSync(lockPath)) {
      try { fs.rmSync(lockPath, { force: true }); } catch { /* ignore */ }
    }
  }
}

export interface PooledBrowserInstance {
  key: string;
  browser: Browser;
  page: Page;
  platform: string;
  profileDir: string;
  lastActiveAt: number;
}

export class BrowserPoolManager {
  private static pool = new Map<string, PooledBrowserInstance>();
  private static readonly MAX_POOL_SIZE = 3;
  private static readonly IDLE_EVICTION_MS = 10 * 60 * 1000; // 10 minutes
  private static evictionTimer: ReturnType<typeof setInterval> | null = null;

  /** Start the background idle-eviction sweep (runs every 60s) */
  private static ensureEvictionTimer(): void {
    if (this.evictionTimer) return;
    this.evictionTimer = setInterval(() => {
      this.evictStale();
    }, 60_000);
    // Don't prevent Node from exiting
    if (this.evictionTimer && typeof this.evictionTimer === 'object' && 'unref' in this.evictionTimer) {
      (this.evictionTimer as any).unref();
    }
  }

  /** Evict browser sessions idle longer than IDLE_EVICTION_MS */
  public static evictStale(): void {
    const now = Date.now();
    for (const [key, instance] of this.pool.entries()) {
      const idleMs = now - instance.lastActiveAt;
      if (idleMs > this.IDLE_EVICTION_MS) {
        console.log(`[Browser Pool] Auto-evicting idle session: ${key} (idle ${Math.round(idleMs / 1000)}s)`);
        this.pool.delete(key);
        forceKillBrowser(instance.browser).catch(() => {});
      } else {
        // Also check if browser disconnected unexpectedly
        try {
          if (!instance.browser.connected || instance.page.isClosed()) {
            console.log(`[Browser Pool] Cleaning up disconnected session: ${key}`);
            this.pool.delete(key);
            forceKillBrowser(instance.browser).catch(() => {});
          }
        } catch {
          this.pool.delete(key);
          forceKillBrowser(instance.browser).catch(() => {});
        }
      }
    }
  }

  /** Evict the oldest (LRU) session to make room for a new one */
  private static evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    for (const [key, instance] of this.pool.entries()) {
      if (instance.lastActiveAt < oldestTime) {
        oldestTime = instance.lastActiveAt;
        oldestKey = key;
      }
    }
    if (oldestKey) {
      console.log(`[Browser Pool] Pool full (max ${this.MAX_POOL_SIZE}). Evicting oldest: ${oldestKey}`);
      this.closeKey(oldestKey);
    }
  }

  public static async getOrCreate(
    key: string,
    platform: string,
    profileDir: string,
    launchFn: () => Promise<Browser>
  ): Promise<{ browser: Browser; page: Page; isReused: boolean }> {
    this.ensureEvictionTimer();

    const existing = this.pool.get(key);
    if (existing) {
      try {
        if (existing.browser.connected && !existing.page.isClosed()) {
          existing.lastActiveAt = Date.now();
          console.log(`[Browser Pool] Reusing active browser session for key: ${key}`);
          return { browser: existing.browser, page: existing.page, isReused: true };
        }
      } catch {
        // Disconnected or closed
      }
      this.closeKey(key);
    }

    // Enforce max pool size — evict oldest if at capacity
    if (this.pool.size >= this.MAX_POOL_SIZE) {
      this.evictOldest();
    }

    const browser = await launchFn();
    const pages = await browser.pages();
    const page = pages[0] || (await browser.newPage());
    for (let i = 1; i < pages.length; i++) {
      try { await pages[i].close(); } catch {}
    }

    const instance: PooledBrowserInstance = {
      key,
      browser,
      page,
      platform,
      profileDir,
      lastActiveAt: Date.now(),
    };
    this.pool.set(key, instance);
    console.log(`[Browser Pool] New session created: ${key} (pool size: ${this.pool.size}/${this.MAX_POOL_SIZE})`);
    return { browser, page, isReused: false };
  }

  public static closeKey(key: string): void {
    const instance = this.pool.get(key);
    if (instance) {
      this.pool.delete(key);
      forceKillBrowser(instance.browser).catch(() => {});
    }
  }

  public static closeAll(): void {
    for (const [key, instance] of this.pool.entries()) {
      this.pool.delete(key);
      forceKillBrowser(instance.browser).catch(() => {});
    }
    if (this.evictionTimer) {
      clearInterval(this.evictionTimer);
      this.evictionTimer = null;
    }
  }

  public static getActiveKeys(): string[] {
    return Array.from(this.pool.keys());
  }

  /** Get comprehensive pool statistics for monitoring */
  public static getPoolStats(): {
    activeCount: number;
    maxSize: number;
    sessions: Array<{ key: string; platform: string; idleSeconds: number; connected: boolean }>;
  } {
    const now = Date.now();
    const sessions = Array.from(this.pool.entries()).map(([key, inst]) => ({
      key,
      platform: inst.platform,
      idleSeconds: Math.round((now - inst.lastActiveAt) / 1000),
      connected: (() => { try { return inst.browser.connected && !inst.page.isClosed(); } catch { return false; } })(),
    }));
    return { activeCount: this.pool.size, maxSize: this.MAX_POOL_SIZE, sessions };
  }
}

/**
 * Patch the Chrome profile's Preferences JSON to disable session restore.
 * Chrome stores restore_on_startup in Default/Preferences:
 *   1 = restore previous session  (the cause of multiple tabs)
 *   5 = open New Tab Page         (what we want)
 * Command-line flags alone cannot reliably override this user pref.
 */
function patchChromeSessionPreferences(profileDir: string): void {
  const prefPaths = [
    path.join(profileDir, 'Default', 'Preferences'),
    path.join(profileDir, 'Preferences'),
  ];
  for (const prefPath of prefPaths) {
    if (!fs.existsSync(prefPath)) continue;
    try {
      const raw = fs.readFileSync(prefPath, 'utf-8');
      const prefs = JSON.parse(raw);
      // Disable session restore so Chrome opens a new tab instead
      if (!prefs.session) prefs.session = {};
      prefs.session.restore_on_startup = 5; // 5 = NTP (new tab)
      prefs.session.startup_urls = [];
      // Also clear the "exited cleanly = false" flag that triggers restore dialog
      if (!prefs.profile) prefs.profile = {};
      prefs.profile.exit_type = 'Normal';
      prefs.profile.exited_cleanly = true;
      fs.writeFileSync(prefPath, JSON.stringify(prefs), 'utf-8');
      console.log(`[Web AI] Patched Chrome Preferences at: ${prefPath}`);
    } catch (e: any) {
      // Non-fatal — if patching fails, we fall back to flag-based approach
      console.warn(`[Web AI] Could not patch Chrome Preferences at ${prefPath}: ${e.message}`);
    }
  }
}

/**
 * Core execution — internal, called by the retry wrapper below.
 */
async function _executeWebAIAutomationCore(
  platformName: string,
  promptText: string,
  defaultTargetFile?: string,
  options?: {
    profileId?: string;
    headless?: boolean;
    captureScreenshot?: boolean;
    screenshotPath?: string;
    filesToUpload?: string[];
    newConversation?: boolean;
  }
): Promise<WebAIResult> {
  const config = PLATFORMS[platformName.toLowerCase()];
  if (!config) {
    throw new WebAIError(`Nền tảng AI "${platformName}" chưa được hỗ trợ tự động hóa.`, 'platform_error', false);
  }

  let browser: Browser | undefined;
  let page: Page | undefined;
  let isReused = false;
  let poolKey = `${platformName.toLowerCase()}_${options?.profileId || 'default'}`;
  let foundProfile: any = null;

  try {
    const executionStartTime = Date.now();
    
    // Set up sandboxed Chrome Profile path inside the workspace
    let profileDir = path.join(process.cwd(), '.chrome_profile');
    const targetProfileId = options?.profileId || 'default';
    foundProfile = await WebAiSessionManager.getProfileForPlatform(targetProfileId, platformName).catch(() => null);
    if (foundProfile) {
      profileDir = WebAiSessionManager.getProfilePath(foundProfile.profileDir);
      await WebAiSessionManager.updateProfileLastUsed(foundProfile.id).catch(() => {});
      // Register profile for reliability tracking
      registerProfile(foundProfile.id, foundProfile.name, foundProfile.platform as any);
      console.log(`[Web AI] Using profile: ${foundProfile.name} (Platform: ${foundProfile.platform}, Dir: ${foundProfile.profileDir})`);
    }

    if (!fs.existsSync(profileDir)) {
      fs.mkdirSync(profileDir, { recursive: true });
    }

    // Remove lock files left from previous crashed sessions to prevent "profile in use" errors
    removeChromeProfileLocks(profileDir);
    // Patch Chrome Preferences JSON to disable session restore (restore_on_startup = 5)
    patchChromeSessionPreferences(profileDir);

    const runHeadless = options?.headless === true;
    const systemChrome = getSystemChromeExecutablePath();
    poolKey = `${platformName.toLowerCase()}_${options?.profileId || 'default'}`;
    console.log(`[Web AI] Executing platform: ${platformName} (headless: ${runHeadless}, poolKey: ${poolKey}, system Chrome: ${systemChrome || 'none'})...`);

    try {
      const pooled = await BrowserPoolManager.getOrCreate(
        poolKey,
        platformName,
        profileDir,
        async () => {
          const launchArgs = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--remote-debugging-port=0',
            '--window-size=1280,800',
            '--disable-blink-features=AutomationControlled',
            '--hide-crash-restore-bubble',
            '--disable-infobars',
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-session-crashed-bubble',
            '--restore-last-session=false',
            '--disable-save-password-bubble',
            '--disable-search-engine-choice-screen',
            '--disable-features=Translate,RestoreOnStartup,ChromeWhatsNew,BookmarkBar',
          ];
          const launchOptions: any = {
            headless: runHeadless,
            userDataDir: profileDir,
            defaultViewport: null,
            ignoreDefaultArgs: ['--enable-automation'],
            args: launchArgs,
          };
          if (systemChrome) launchOptions.executablePath = systemChrome;
          try {
            return await puppeteer.launch(launchOptions);
          } catch (firstErr: any) {
            if (systemChrome) {
              console.warn(`[Web AI] System Chrome launch failed (${firstErr.message}), falling back to bundled Puppeteer Chromium...`);
              delete launchOptions.executablePath;
              return await puppeteer.launch(launchOptions);
            }
            throw firstErr;
          }
        }
      );
      browser = pooled.browser;
      page = pooled.page;
      isReused = pooled.isReused;
    } catch (launchErr: any) {
      console.error('[Web AI] Browser launch failed:', launchErr);
      if (launchErr.message?.includes('profile') || launchErr.message?.includes('lock') || launchErr.message?.includes('use')) {
        throw new WebAIError(`Không thể khởi chạy trình duyệt: Tài khoản/Profile này hiện đang được sử dụng bởi một cửa sổ Chrome khác. Vui lòng đóng cửa sổ đó trước khi thử lại.`, 'automation_error', true);
      }
      throw new WebAIError(`Lỗi khởi chạy trình duyệt tự động hóa: ${launchErr.message}`, 'automation_error', true);
    }
    // Apply stealth and anti-detection settings
    await applyStealthSettings(page);

    let targetUrl = config.url;
    if (!options?.newConversation && foundProfile?.metadata?.lastConversationId) {
      const convId = foundProfile.metadata.lastConversationId;
      const lowerPlatform = platformName.toLowerCase();
      if (lowerPlatform === 'chatgpt') {
        targetUrl = `https://chatgpt.com/c/${convId}`;
      } else if (lowerPlatform === 'claude') {
        targetUrl = `https://claude.ai/chat/${convId}`;
      } else if (lowerPlatform === 'gemini') {
        targetUrl = `https://gemini.google.com/app/${convId}`;
      } else if (lowerPlatform === 'deepseek') {
        targetUrl = `https://chat.deepseek.com/a/${convId}`;
      }
      console.log(`[Web AI] Continuing conversation: ${convId}`);
    } else if (options?.newConversation) {
      console.log(`[Web AI] Forcing new conversation (newConversation=true).`);
    }

    const currentUrl = page.url();
    const needsNavigation = !isReused || !currentUrl.toLowerCase().includes(platformName.toLowerCase());

    if (needsNavigation) {
      console.log(`[Web AI] Navigating to: ${targetUrl}`);
      // Try networkidle2 first for full page load, fallback to domcontentloaded
      try {
        await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 45000 });
      } catch (navErr: any) {
        console.warn(`[Web AI] networkidle2 navigation timed out, retrying with domcontentloaded: ${navErr.message}`);
        try {
          await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        } catch {
          // Page may have partially loaded, continue anyway
        }
      }
      // Smart wait: wait for input selector to appear (up to 8s) instead of fixed delay
      try {
        await page.waitForSelector(config.inputSelector.split(',')[0].trim(), { timeout: 8000 });
      } catch {
        // Check if we got a 404 or "not found" page (stale conversation)
        const is404 = await page.evaluate(() => {
          const text = (document.body?.innerText || '').toLowerCase();
          return text.includes('not found') || text.includes('404') || 
            text.includes('doesn\'t exist') || text.includes('conversation not found') ||
            text.includes('page not found');
        });
        if (is404 && targetUrl !== config.url) {
          console.warn(`[Web AI] Conversation URL returned 404. Falling back to base URL: ${config.url}`);
          targetUrl = config.url;
          try {
            await page.goto(config.url, { waitUntil: 'networkidle2', timeout: 30000 });
            await page.waitForSelector(config.inputSelector.split(',')[0].trim(), { timeout: 8000 });
          } catch {
            await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 2500)));
          }
        } else {
          // Input not found yet — fallback to a short fixed wait
          await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 2500)));
        }
      }
    } else {
      console.log(`[Web AI] Reusing active tab session at URL: ${currentUrl}`);
    }

    // Cloudflare / Bot Protection Auto-Wait (V3: polls up to 30s instead of throwing immediately)
    const CF_MAX_WAIT_MS = 30000;
    const CF_POLL_INTERVAL_MS = 2000;
    let cfWaitedMs = 0;
    let isCloudflareBlocked = true;

    while (cfWaitedMs < CF_MAX_WAIT_MS) {
      isCloudflareBlocked = await page.evaluate(() => {
        const text = (document.body?.innerText || '').toLowerCase();
        return text.includes('just a moment...') ||
          text.includes('verify you are human') ||
          text.includes('checking your browser') ||
          text.includes('enable javascript and cookies to continue');
      });
      if (!isCloudflareBlocked) break;
      if (cfWaitedMs === 0) {
        console.warn(`[Web AI] Cloudflare/Turnstile challenge detected on ${platformName}. Auto-waiting up to ${CF_MAX_WAIT_MS / 1000}s...`);
      }
      await page.evaluate((ms) => new Promise((resolve) => setTimeout(resolve, ms)), CF_POLL_INTERVAL_MS);
      cfWaitedMs += CF_POLL_INTERVAL_MS;
    }

    if (isCloudflareBlocked) {
      console.error(`[Web AI] Cloudflare challenge not resolved after ${CF_MAX_WAIT_MS / 1000}s on ${platformName}.`);
      throw new WebAIError(
        `Nền tảng ${platformName} đang yêu cầu xác minh Cloudflare CAPTCHA và không thể tự giải sau ${CF_MAX_WAIT_MS / 1000}s. Vui lòng tắt headless hoặc hoàn tất xác minh thủ công.`,
        'automation_error',
        true
      );
    } else if (cfWaitedMs > 0) {
      console.log(`[Web AI] ✅ Cloudflare challenge resolved automatically after ${cfWaitedMs}ms.`);
    }

    // Login Check: If platform login elements are visible, wait for user login
    if (config.detectLoginSelector || config.loginText?.length) {
      const needsLogin = await page.evaluate((selector, loginText) => {
        let selectorMatched = false;
        if (selector) {
          try {
            if (selector.includes(':contains')) {
              const match = selector.match(/^([a-zA-Z0-9_-]+):contains\(['"]([^'"]+)['"]\)$/);
              if (match) {
                const tag = match[1];
                const text = match[2].toLowerCase();
                const elements = Array.from(document.querySelectorAll(tag));
                selectorMatched = elements.some(el => (el.textContent || '').toLowerCase().includes(text));
              }
            } else {
              selectorMatched = Boolean(document.querySelector(selector));
            }
          } catch (e) {
            selectorMatched = false;
          }
        }
        
        let textMatched = false;
        if (loginText && loginText.length > 0) {
          const elements = Array.from(document.querySelectorAll('button, a, div[role="button"], span, h1, h2, input[type="submit"]'));
          textMatched = elements.some(el => {
            const elText = (el.textContent || '').trim().toLowerCase();
            return loginText.some(text => elText === text.toLowerCase() || elText.includes(text.toLowerCase()));
          });
        }
        
        return selectorMatched || textMatched;
      }, config.detectLoginSelector, config.loginText ?? []);

      if (needsLogin) {
        console.log('[Web AI] Cần đăng nhập! Vui lòng hoàn tất đăng nhập trong cửa sổ Chrome...');
        // Wait up to 3 minutes for user to login
        try {
          await page.waitForSelector(config.inputSelector, { timeout: 180000 });
        } catch {
          throw new WebAIError(`Phiên đăng nhập trên ${platformName} hết hạn hoặc chưa đăng nhập. Vui lòng mở Chrome để đăng nhập.`, 'login_required', true);
        }
        console.log('[Web AI] Đăng nhập thành công, tiếp tục gửi prompt...');
      }
    }

    // Locate the prompt input box with an extended 35s timeout and fallback to generic text inputs if needed
    const inputSelectorFallbacks = ['textarea', 'div[contenteditable="true"]', '[role="textbox" i]', '.ProseMirror', 'rich-textarea'];
    async function resolveInputSelector(activePage: Page): Promise<string> {
      try {
        await activePage.waitForSelector(config.inputSelector, { timeout: 35000 });
        return config.inputSelector;
      } catch {
        for (const selector of inputSelectorFallbacks) {
          if (selector === config.inputSelector) continue;
          try {
            await activePage.waitForSelector(selector, { timeout: 5000 });
            console.log(`[Web AI] Fallback input selector matched: ${selector}`);
            return selector;
          } catch {
            // continue to next fallback
          }
        }
        throw new WebAIError(
          `Không thể tìm thấy ô nhập câu hỏi trên ${platformName}. Có thể giao diện đã thay đổi hoặc trang tải chậm.`,
          'automation_error',
          true
        );
      }
    }

    if (!page) throw new WebAIError('Page instance unexpectedly closed.', 'automation_error', true);
    const inputSelectorToUse = await resolveInputSelector(page);
    console.log(`[Web AI] Using input selector: ${inputSelectorToUse}`);

    const sendSelectorFallbacks = [
      'button[type="submit"]',
      'button[aria-label*="send" i]',
      'button[aria-label*="gửi" i]',
      'button[class*="send" i]',
      'div[role="button"][aria-label*="send" i]',
      'div[class*="send" i]',
      'button',
    ];

    const sendSelectors = config.sendSelector
      ? config.sendSelector.split(',').map(s => s.trim()).filter(Boolean).concat(sendSelectorFallbacks)
      : sendSelectorFallbacks;

    // Upload files if provided
    if (options?.filesToUpload && options.filesToUpload.length > 0) {
      console.log(`[Web AI] Attempting to upload ${options.filesToUpload.length} file(s)...`);
      try {
        const fileInputHandle = await page.waitForSelector('input[type="file"]', { timeout: 5000 });
        if (fileInputHandle) {
          const absolutePaths = options.filesToUpload.map(f => path.isAbsolute(f) ? f : path.resolve(process.cwd(), f));
          await fileInputHandle.uploadFile(...absolutePaths);
          console.log(`[Web AI] Files uploaded successfully:`, absolutePaths);
          // Wait 3 seconds for the preview thumbnail to load in the chat interface
          await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 3000)));
        } else {
          console.warn(`[Web AI] File input selector 'input[type="file"]' not found.`);
        }
      } catch (uploadErr: any) {
        console.error(`[Web AI] File upload failed:`, uploadErr.message);
      }
    }

    // Press Escape to dismiss any welcome modals or popups
    await page.keyboard.press('Escape');
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 500)));

    // 5-Tier Smart Input Insertion Engine V5 (insertText + React Fiber + Shadow DOM + Clipboard + Native + Keyboard)
    console.log('[Web AI] Typing prompt into AI chat web window via 5-Tier Smart Engine V5...');
    await page.evaluate(
      (selector, text) => {
        function queryDeep(root: any, sel: string): any {
          try {
            const direct = (root as Element).querySelector?.(sel);
            if (direct) return direct;
          } catch {}
          const elements = Array.from((root as Element).querySelectorAll?.('*') || []);
          for (const el of elements) {
            if ((el as any).shadowRoot) {
              const shadowMatch = queryDeep((el as any).shadowRoot, sel);
              if (shadowMatch) return shadowMatch;
            }
          }
          return null;
        }

        function getContent(el: any): string {
          return (el.value || el.innerText || el.textContent || '').trim();
        }

        const element = (queryDeep(document, selector) || document.querySelector(selector)) as any;
        if (!element) return;
        
        try { element.focus(); } catch {}
        // Select all existing text first so insertion replaces it
        try { document.execCommand('selectAll', false); } catch {}

        // Tier 0: document.execCommand('insertText') — triggers React onChange natively
        try {
          document.execCommand('insertText', false, text);
          if (getContent(element).includes(text.slice(0, 15))) {
            element.dispatchEvent(new Event('input', { bubbles: true }));
            return; // Success!
          }
        } catch {}

        // Tier 0b: React Fiber direct injection
        try {
          const fiberKey = Object.keys(element).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'));
          if (fiberKey) {
            const fiber = (element as any)[fiberKey];
            const props = fiber?.memoizedProps || fiber?.return?.memoizedProps;
            if (props?.onChange) {
              props.onChange({ target: { value: text }, currentTarget: { value: text } });
              if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
                const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
                if (nativeSetter) nativeSetter.call(element, text);
                else element.value = text;
              } else {
                element.innerText = text;
              }
              element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
              if (getContent(element).includes(text.slice(0, 15))) return; // Success!
            }
          }
        } catch {}

        // Tier 1: Clipboard Event Paste
        try {
          const dataTransfer = new DataTransfer();
          dataTransfer.setData('text/plain', text);
          const pasteEvent = new ClipboardEvent('paste', {
            clipboardData: dataTransfer,
            bubbles: true,
            cancelable: true
          });
          element.dispatchEvent(pasteEvent);
        } catch (e) {
          // Tier 1 non-fatal
        }

        if (getContent(element).includes(text.slice(0, 15))) {
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
          return;
        }

        // Tier 2: Native Input Value Setter + Event Dispatching
        if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
          const nativeSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            'value'
          )?.set || Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
          
          if (nativeSetter) {
            nativeSetter.call(element, text);
          } else {
            element.value = text;
          }
          element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          // Tier 3: ContentEditable InnerText
          element.innerText = text;
          element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        }
      },
      inputSelectorToUse,
      promptText
    );

    // Tier 4: Verify if text was inserted correctly (with Shadow DOM deep search)
    const isTextInserted = await page.evaluate((selector) => {
      function queryDeep(root: Document | Element | ShadowRoot, sel: string): Element | null {
        try {
          const direct = root.querySelector(sel);
          if (direct) return direct;
        } catch {}
        const elements = Array.from(root.querySelectorAll('*'));
        for (const el of elements) {
          if (el.shadowRoot) {
            const shadowMatch = queryDeep(el.shadowRoot, sel);
            if (shadowMatch) return shadowMatch;
          }
        }
        return null;
      }
      const el = (queryDeep(document, selector) || document.querySelector(selector)) as any;
      if (!el) return false;
      const content = el.value || el.innerText || el.textContent;
      return content && content.trim().length > 0;
    }, inputSelectorToUse);

    if (!isTextInserted) {
      console.log('[Web AI] Fast insertion tier failed. Falling back to Tier 4 native keyboard typing...');
      try {
        await page.focus(inputSelectorToUse);
        await page.keyboard.type(promptText, { delay: 0 });
      } catch (err: any) {
        console.warn(`[Web AI] Tier 4 typing warning: ${err.message}`);
      }
    }

    // Submit Prompt
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 800)));
    console.log('[Web AI] Submitting prompt...');
    
    let submitted = false;
    submitted = await page.evaluate((selectors) => {
      function queryDeep(root: Document | Element | ShadowRoot, sel: string): Element | null {
        try {
          const direct = root.querySelector(sel);
          if (direct) return direct;
        } catch {
          return null;
        }
        const elements = Array.from(root.querySelectorAll('*'));
        for (const el of elements) {
          if (el.shadowRoot) {
            const shadowMatch = queryDeep(el.shadowRoot, sel);
            if (shadowMatch) return shadowMatch;
          }
        }
        return null;
      }

      function queryDeepAll(root: Document | Element | ShadowRoot, sel: string): Element[] {
        const results: Element[] = [];
        try {
          results.push(...Array.from(root.querySelectorAll(sel)));
        } catch {}
        const elements = Array.from(root.querySelectorAll('*'));
        for (const el of elements) {
          if (el.shadowRoot) {
            results.push(...queryDeepAll(el.shadowRoot, sel));
          }
        }
        return results;
      }

      for (const s of selectors) {
        if (!s) continue;
        const btn = (queryDeep(document, s) || document.querySelector(s)) as HTMLElement;
        if (btn) {
          if (btn.hasAttribute('disabled') || btn.getAttribute('aria-disabled') === 'true') {
            btn.removeAttribute('disabled');
            btn.removeAttribute('aria-disabled');
          }
          try { btn.click(); } catch {}
          return true;
        }
      }

      const allButtons = queryDeepAll(document, 'button, div[role="button"], span[role="button"]');
      const sendBtn = allButtons.find(b => {
        const label = (b.getAttribute('aria-label') || b.textContent || '').toLowerCase();
        return (label.includes('gửi') || label.includes('send') || label.includes('submit') || label.includes('trả lời') || label.includes('yêu cầu'));
      }) as HTMLElement;

      if (sendBtn) {
        if (sendBtn.hasAttribute('disabled') || sendBtn.getAttribute('aria-disabled') === 'true') {
          sendBtn.removeAttribute('disabled');
          sendBtn.removeAttribute('aria-disabled');
        }
        try { sendBtn.click(); } catch {}
        return true;
      }

      return false;
    }, sendSelectors);

    if (!submitted) {
      console.log('[Web AI] Send button click failed or disabled. Trying Enter key fallback...');
      try { await page.focus(inputSelectorToUse); } catch {}
      await page.keyboard.press('Enter');
      await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 300)));
      await page.keyboard.down('Control');
      await page.keyboard.press('Enter');
      await page.keyboard.up('Control');
    }

    // Submit verification: confirm that the prompt was actually sent
    // by checking if the input was cleared or loading/generation indicators appeared
    console.log('[Web AI] Verifying prompt submission...');
    let submitVerified = false;
    for (let verifyAttempt = 0; verifyAttempt < 10; verifyAttempt++) {
      await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 1000)));
      
      const submitState = await page.evaluate((inputSel, stopSel, loadSel) => {
        function queryDeep(root: Document | Element | ShadowRoot, sel: string): Element | null {
          try { const d = root.querySelector(sel); if (d) return d; } catch {}
          const els = Array.from(root.querySelectorAll('*'));
          for (const el of els) {
            if (el.shadowRoot) { const m = queryDeep(el.shadowRoot, sel); if (m) return m; }
          }
          return null;
        }
        // Check if input has been cleared (prompt submitted)
        const inputEl = queryDeep(document, inputSel.split(',')[0].trim()) as any;
        const inputContent = inputEl ? (inputEl.value || inputEl.innerText || inputEl.textContent || '').trim() : '';
        const inputCleared = inputContent.length < 5;
        
        // Check if generation has started (stop button visible or loading indicator)
        let generationStarted = false;
        if (stopSel) {
          try { generationStarted = Boolean(document.querySelector(stopSel)); } catch {}
        }
        if (!generationStarted && loadSel) {
          try { generationStarted = Boolean(document.querySelector(loadSel)); } catch {}
        }
        
        return { inputCleared, generationStarted };
      }, inputSelectorToUse, config.stopGenerationSelector || null, config.loadingSelector || null);

      if (submitState.inputCleared || submitState.generationStarted) {
        submitVerified = true;
        console.log(`[Web AI] Submit verified (inputCleared: ${submitState.inputCleared}, generationStarted: ${submitState.generationStarted})`);
        break;
      }
    }
    
    if (!submitVerified) {
      console.warn('[Web AI] Submit verification timed out — retrying with Enter key...');
      try { await page.focus(inputSelectorToUse); } catch {}
      await page.keyboard.press('Enter');
      await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 1500)));
    }

    // Wait for AI to finish generating response
    console.log('[Web AI] Waiting for response to compile...');
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 2000)));

    // Polling logic: wait for generation to complete & stitch multi-part responses
    let lastLength = 0;
    let stableCount = 0;
    const maxPolls = 300; // 5 minutes max
    let pollState: 'waiting' | 'streaming' | 'stabilizing' = 'waiting';
    let totalPollCycles = 0;

    for (let poll = 0; poll < maxPolls; poll++) {
      totalPollCycles++;
      // Error detection — check for quota/platform errors in visible page text
      // Error detection: scan first 3000 + last 5000 chars to catch errors at top AND bottom of page
      const visiblePageText = await page.evaluate(() => {
        const txt = document.body?.innerText || '';
        if (txt.length <= 8000) return txt;
        return txt.slice(0, 3000) + '\n---\n' + txt.slice(-5000);
      });
      const pageError = classifyWebAIPageText(visiblePageText);
      if (pageError) {
        const quotaResetAt = pageError === 'quota' ? parseQuotaResetTime(visiblePageText) : undefined;
        const errorCode = pageError === 'session_expired' ? 'login_required' as WebAIErrorCode : pageError as WebAIErrorCode;
        throw new WebAIError(
          pageError === 'quota'
            ? 'Tài khoản Web AI đã hết lượt sử dụng (Rate limit / Quota).'
            : pageError === 'session_expired'
            ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
            : 'Nền tảng Web AI báo lỗi tạo câu trả lời.',
          errorCode,
          true,
          quotaResetAt
        );
      }

      // Check if "Continue generating" / "Tiếp tục tạo" button is present and click it automatically
      const autoContinueClicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const continueBtn = buttons.find(b => {
          const txt = (b.textContent || b.getAttribute('aria-label') || '').toLowerCase().trim();
          return txt.includes('continue generating') ||
            txt.includes('tiếp tục tạo') ||
            txt.includes('tiếp tục') ||
            txt.includes('generate more') ||
            txt === 'continue';
        });
        if (continueBtn && !continueBtn.disabled) {
          continueBtn.click();
          return true;
        }
        return false;
      });

      if (autoContinueClicked) {
        console.log('[Web AI] Auto-clicked "Continue generating" button to stitch response.');
        stableCount = 0;
        pollState = 'streaming';
        await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 2000)));
      }

      // 1. Check for Stop/Loading indicators (most reliable signal)
      const isGenerating = await page.evaluate((stopSel, loadSel) => {
        if (stopSel) {
          const selectors = stopSel.split(',').map(s => s.trim());
          for (const sel of selectors) {
            try { if (document.querySelector(sel)) return true; } catch {}
          }
        }
        if (loadSel) {
          const selectors = loadSel.split(',').map(s => s.trim());
          for (const sel of selectors) {
            try { if (document.querySelector(sel)) return true; } catch {}
          }
        }
        return false;
      }, config.stopGenerationSelector, config.loadingSelector);

      // 2. Check content length with Shadow DOM deep search
      const currentLength = await page.evaluate((selector) => {
        function queryDeepAll(root: Document | Element | ShadowRoot, sel: string): Element[] {
          const results: Element[] = [];
          try { results.push(...Array.from(root.querySelectorAll(sel))); } catch {}
          const elements = Array.from(root.querySelectorAll('*'));
          for (const el of elements) {
            if (el.shadowRoot) { results.push(...queryDeepAll(el.shadowRoot, sel)); }
          }
          return results;
        }
        const selectors = selector.split(',').map(s => s.trim());
        let allElements: Element[] = [];
        for (const sel of selectors) {
          const found = queryDeepAll(document, sel);
          if (found.length > 0) {
            allElements = found;
            break;
          }
        }
        if (allElements.length === 0) return 0;
        const lastEl = allElements[allElements.length - 1];
        return lastEl ? (lastEl as HTMLElement).innerText?.length || 0 : 0;
      }, config.messageSelector);

      if (isGenerating) {
        // AI is actively generating, reset stability
        stableCount = 0;
        lastLength = currentLength;
        pollState = 'streaming';
      } else if (currentLength > 0) {
        // AI might be done, or paused. Check stability.
        if (currentLength === lastLength) {
          stableCount++;
          // Adaptive stability threshold:
          // If the platform has a reliable stop indicator, 3 cycles is enough
          // Otherwise, 8 cycles (was 10, reduced since we now verify via multiple signals)
          const requiredStability = config.stopGenerationSelector ? 3 : 8;
          
          if (stableCount >= requiredStability) {
            console.log('[Web AI] Content generation stabilized and finished.');
            break;
          }
          pollState = 'stabilizing';
        } else {
          stableCount = 0;
          lastLength = currentLength;
          pollState = 'streaming';
        }
      }

      // Adaptive polling interval based on generation state
      const pollDelay = pollState === 'streaming' ? 500 
                      : pollState === 'stabilizing' ? 1500 
                      : 3000; // waiting
      
      if (poll % 10 === 0 || pollState !== 'streaming') {
        console.log(`[Web AI] Poll #${poll} | Length: ${currentLength} | State: ${pollState} | isGenerating: ${isGenerating} | NextDelay: ${pollDelay}ms`);
      }

      await page.evaluate((delay) => new Promise((resolve) => setTimeout(resolve, delay)), pollDelay);
    }

    // Extract the final text response with Shadow DOM Deep Search + Multi-level Fallback
    console.log('[Web AI] Extracting final response text with Shadow DOM deep search...');
    const messageSelectorFallbacks = [
      '.markdown',
      'article .markdown',
      'message-content',
      '.model-response',
      '.turn-content',
      '.font-claude-message',
      '.prose',
      '.ds-markdown',
      '.markdown-body',
      '[data-message-author-role="assistant"]',
      '.response-container-content',
      'div[class*="message" i]',
      '.assistant-message',
      '.chat-message',
      '.reply-bubble',
      '.grok-message-body',
      '.grok-response',
      '.message-text',
      '.assistant-response',
      '.bot-response',
      '.response-body',
      '.response-text',
      '.chat-line__message',
      '[role="log"]',
      '[aria-live="polite"]',
    ];
    let resultText = await page.evaluate((selector, fallbackSelectors) => {
      // Shadow DOM deep search — traverse all shadow boundaries
      function queryDeepAll(root: Document | Element | ShadowRoot, sel: string): Element[] {
        const results: Element[] = [];
        try { results.push(...Array.from(root.querySelectorAll(sel))); } catch {}
        const elements = Array.from(root.querySelectorAll('*'));
        for (const el of elements) {
          if (el.shadowRoot) {
            results.push(...queryDeepAll(el.shadowRoot, sel));
          }
        }
        return results;
      }

      // Try primary selectors first (with Shadow DOM search)
      // Join ALL matching elements so long multi-block responses are captured in full
      const primarySelectors = selector.split(',').map(s => s.trim()).filter(Boolean);
      for (const sel of primarySelectors) {
        const elements = queryDeepAll(document, sel);
        if (elements.length > 0) {
          // Join all elements — long AI responses span multiple <p>/<div> nodes
          const joined = elements
            .map(el => (el as HTMLElement)?.innerText?.trim())
            .filter(t => t && t.length > 0)
            .join('\n\n');
          if (joined && joined.length > 5) return joined;
        }
      }

      // Try fallback selectors (with Shadow DOM search)
      for (const fSel of fallbackSelectors) {
        const fElements = queryDeepAll(document, fSel);
        if (fElements.length > 0) {
          const joined = fElements
            .map(el => (el as HTMLElement)?.innerText?.trim())
            .filter(t => t && t.length > 0)
            .join('\n\n');
          if (joined && joined.length > 5) return joined;
        }
      }

      return '';
    }, config.messageSelector, messageSelectorFallbacks);

    if (!resultText) {
      // Secondary attempt: join ALL paragraphs to avoid truncation (same fix as primary path)
      resultText = await page.evaluate(() => {
        function queryDeepAll(root: Document | Element | ShadowRoot, sel: string): Element[] {
          const results: Element[] = [];
          try { results.push(...Array.from(root.querySelectorAll(sel))); } catch {}
          const elements = Array.from(root.querySelectorAll('*'));
          for (const el of elements) {
            if (el.shadowRoot) { results.push(...queryDeepAll(el.shadowRoot, sel)); }
          }
          return results;
        }
        const selectors = ['p, div.markdown, .model-response, .assistant-response, .bot-response, .turn-content, .prose'];
        for (const sel of selectors) {
          const paragraphs = queryDeepAll(document, sel);
          if (paragraphs.length > 0) {
            // Join ALL matching paragraphs to avoid truncation on multi-block responses
            const joined = paragraphs
              .map(el => (el as HTMLElement)?.innerText?.trim())
              .filter(t => t && t.length > 0)
              .join('\n\n');
            if (joined && joined.length > 5) return joined;
          }
        }
        return '';
      });
    }

    if (!resultText) {
      console.log('[Web AI] Fallback text scan active: reading last visible text blocks (with Shadow DOM).');
      resultText = await page.evaluate(() => {
        function queryDeepAll(root: Document | Element | ShadowRoot, sel: string): Element[] {
          const results: Element[] = [];
          try { results.push(...Array.from(root.querySelectorAll(sel))); } catch {}
          const elements = Array.from(root.querySelectorAll('*'));
          for (const el of elements) {
            if (el.shadowRoot) { results.push(...queryDeepAll(el.shadowRoot, sel)); }
          }
          return results;
        }
        const candidates: string[] = [];
        const nodes = queryDeepAll(document, 'div, span, p, article, section');
        for (const node of nodes) {
          if (!(node as HTMLElement).offsetParent) continue;
          const text = (node.textContent || '').trim();
          if (text.length > 50 && !/gửi|send|submit|login|đăng nhập/i.test(text)) {
            candidates.push(text);
          }
        }
        return candidates.length > 0 ? candidates[candidates.length - 1] : '';
      });
    }

    if (!resultText || resultText.length < 5) {
      throw new WebAIError(
        `Không thể đọc câu trả lời từ giao diện AI Chat (${platformName}). Hãy kiểm tra xem phản hồi đã phát xong chưa.`,
        'automation_error',
        true
      );
    }

    // Extract code blocks from the parsed text
    const blocks = extractCodeBlocks(resultText, defaultTargetFile);
    console.log(`[Web AI] Query completed. Parsed ${blocks.length} code blocks.`);

    // Wait a moment and close browser
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 1000)));

    try {
      const finalUrl = page.url();
      console.log(`[Web AI] Final page URL: ${finalUrl}`);
      let extractedConversationId: string | undefined;

      const lowerPlatform = platformName.toLowerCase();
      if (lowerPlatform === 'chatgpt') {
        const match = finalUrl.match(/chatgpt\.com\/c\/([a-zA-Z0-9-]+)/);
        if (match) extractedConversationId = match[1];
      } else if (lowerPlatform === 'claude') {
        const match = finalUrl.match(/claude\.ai\/chat\/([a-zA-Z0-9-]+)/);
        if (match) extractedConversationId = match[1];
      } else if (lowerPlatform === 'gemini') {
        const match = finalUrl.match(/gemini\.google\.com\/app\/([a-zA-Z0-9]+)/);
        if (match) extractedConversationId = match[1];
      } else if (lowerPlatform === 'deepseek') {
        const match = finalUrl.match(/chat\.deepseek\.com\/a\/([a-zA-Z0-9-]+)/);
        if (match) extractedConversationId = match[1];
      }

      if (extractedConversationId && foundProfile) {
        console.log(`[Web AI] Extracted conversation ID: ${extractedConversationId}. Saving to profile ${foundProfile.id}`);
        await WebAiSessionManager.updateProfileConversation(foundProfile.id, extractedConversationId);
      }
    } catch (urlErr) {
      console.error('[Web AI] Failed to parse or save conversation ID:', urlErr);
    }

    const extractedConvId = (() => { try { const u = page.url(); const m = u.match(/\/c\/([a-zA-Z0-9-]+)|chat\/([a-zA-Z0-9-]+)|app\/([a-zA-Z0-9]+)/); return m?.[1] || m?.[2] || m?.[3]; } catch { return undefined; } })();

    let capturedScreenshotPath: string | undefined;
    if (options?.captureScreenshot || options?.screenshotPath) {
      try {
        const spath = options.screenshotPath || path.join(process.cwd(), 'artifacts', 'screenshots', `screenshot_${Date.now()}.png`);
        const sdir = path.dirname(spath);
        if (!fs.existsSync(sdir)) {
          fs.mkdirSync(sdir, { recursive: true });
        }
        await page.screenshot({ path: spath });
        capturedScreenshotPath = spath;
        console.log(`[Web AI] Screenshot captured and saved to: ${spath}`);
      } catch (screenshotErr) {
        console.error('[Web AI] Failed to capture screenshot:', screenshotErr);
      }
    }

    // Browser remains alive in BrowserPoolManager for fast consecutive queries
    console.log(`[Web AI] Query completed successfully. Session kept alive in BrowserPoolManager (Key: ${poolKey}).`);

    const executionDurationMs = Date.now() - executionStartTime;
    console.log(`[Web AI] Execution completed in ${executionDurationMs}ms (${totalPollCycles} poll cycles, ${resultText.length} chars).`);

    // Report success to reliability system
    if (foundProfile) {
      reportProfileSuccess(foundProfile.id, executionDurationMs);
    }

    return {
      text: resultText,
      codeBlocks: blocks,
      modelUsed: `web-ai/${platformName}`,
      screenshotPath: capturedScreenshotPath,
      durationMs: executionDurationMs,
      pollCycles: totalPollCycles,
      charCount: resultText.length,
      platform: platformName.toLowerCase(),
      profileId: options?.profileId,
      conversationId: extractedConvId,
      retryAttempt: 0, // Will be overridden by retry wrapper
      wasReusedSession: isReused,
    };
  } catch (err: any) {
    const wrappedError = err instanceof WebAIError
      ? err
      : new WebAIError(`Tự động hóa Web AI thất bại: ${err?.message || String(err)}`, 'automation_error', true);

    // Attempt error screenshot before closing browser
    if (options?.captureScreenshot || options?.screenshotPath) {
      try {
        const pages = browser ? await browser.pages().catch(() => []) : [];
        const activePage = pages[0];
        if (activePage) {
          const spath = options.screenshotPath || path.join(process.cwd(), 'artifacts', 'screenshots', `screenshot_error_${Date.now()}.png`);
          const sdir = path.dirname(spath);
          if (!fs.existsSync(sdir)) {
            fs.mkdirSync(sdir, { recursive: true });
          }
          await activePage.screenshot({ path: spath });
          console.log(`[Web AI] Error screenshot captured and saved to: ${spath}`);
        }
      } catch (screenshotErr) {
        console.error('[Web AI] Failed to capture error screenshot:', screenshotErr);
      }
    }
    // Clean up browser from pool on error
    BrowserPoolManager.closeKey(poolKey);

    // Report failure to reliability system
    if (foundProfile) {
      const isQuota = wrappedError.code === 'quota';
      reportProfileError(foundProfile.id, wrappedError.message, isQuota);
    }

    throw wrappedError;
  }
}

/**
 * Execute prompt query on a web AI platform via Puppeteer.
 * Includes internal retry mechanism (max 2 retries with exponential backoff).
 * Only retries on retryable automation_error. Does NOT retry login_required or quota errors.
 */
export async function executeWebAIAutomation(
  platformName: string,
  promptText: string,
  defaultTargetFile?: string,
  options?: {
    profileId?: string;
    headless?: boolean;
    captureScreenshot?: boolean;
    screenshotPath?: string;
    filesToUpload?: string[];
    newConversation?: boolean;
  }
): Promise<WebAIResult> {
  const MAX_RETRIES = 2;
  const RETRY_DELAYS = [2000, 5000]; // Exponential backoff: 2s, 5s

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await _executeWebAIAutomationCore(platformName, promptText, defaultTargetFile, options);
      result.retryAttempt = attempt;
      if (attempt > 0) {
        console.log(`[Web AI] ✅ Succeeded on retry attempt #${attempt}`);
      }
      return result;
    } catch (err) {
      const isRetryable = err instanceof WebAIError && err.retryable && err.code === 'automation_error';
      const isLastAttempt = attempt >= MAX_RETRIES;

      if (!isRetryable || isLastAttempt) {
        // Non-retryable error (login_required, quota, platform_error) or all retries exhausted
        if (isLastAttempt && isRetryable) {
          console.error(`[Web AI] ❌ All ${MAX_RETRIES + 1} attempts failed for ${platformName}.`);
        }
        throw err;
      }

      const delay = RETRY_DELAYS[attempt] || 5000;
      console.warn(`[Web AI] ⚠️ Attempt #${attempt + 1} failed (${(err as WebAIError).message?.slice(0, 100)}). Retrying in ${delay}ms...`);

      // Force-kill the browser pool entry before retrying to get a clean slate
      const poolKey = `${platformName.toLowerCase()}_${options?.profileId || 'default'}`;
      BrowserPoolManager.closeKey(poolKey);

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // This line should never be reached, but TypeScript needs it
  throw new WebAIError(`Tự động hóa Web AI thất bại sau ${MAX_RETRIES + 1} lần thử.`, 'automation_error', false);
}

export function profileStatusForWebAIError(error: unknown): Exclude<WebAIProfileStatus, 'untested' | 'ready'> {
  if (error instanceof WebAIError && error.code === 'quota') return 'quota';
  if (error instanceof WebAIError && error.code === 'login_required') return 'login_required';
  return 'error';
}

export async function checkWebAISession(
  platformName: string,
  profileId: string
): Promise<{ ok: boolean; status: WebAIProfileStatus; error?: string }> {
  const config = PLATFORMS[platformName.toLowerCase()];
  if (!config) {
    throw new WebAIError(`Nền tảng AI "${platformName}" chưa được hỗ trợ tự động hóa.`, 'platform_error', false);
  }

  const profile = await WebAiSessionManager.getProfileForPlatform(profileId, platformName);
  const profileDir = WebAiSessionManager.getProfilePath(profile.profileDir);

  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
  }

  console.log(`[Web AI Check] Checking session for profile: ${profile.name} (Platform: ${platformName})...`);
  removeChromeProfileLocks(profileDir);
  patchChromeSessionPreferences(profileDir);
  let browser;
  try {
    const systemChrome = getSystemChromeExecutablePath();
    const checkOpts: any = {
      headless: true, // Always headless for fast checking
      userDataDir: profileDir,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--remote-debugging-port=0',
        '--window-size=1280,800',
        '--disable-blink-features=AutomationControlled',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-session-crashed-bubble',
        '--disable-features=Translate,RestoreOnStartup,ChromeWhatsNew',
      ],
    };
    if (systemChrome) checkOpts.executablePath = systemChrome;
    browser = await puppeteer.launch(checkOpts);
  } catch (launchErr: any) {
    console.error('[Web AI Check] Browser launch failed:', launchErr);
    return { ok: false, status: 'error', error: `Lỗi khởi chạy trình duyệt: ${launchErr.message}` };
  }

  try {
    const pages = await browser.pages();
    const page = pages[0] || (await browser.newPage());
    await applyStealthSettings(page);

    console.log(`[Web AI Check] Navigating to: ${config.url}`);
    await page.goto(config.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Wait 2 seconds
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 2000)));

    // Login Check
    const needsLogin = await page.evaluate((selector, loginText) => {
      let selectorMatched = false;
      if (selector) {
        try {
          if (selector.includes(':contains')) {
            const match = selector.match(/^([a-zA-Z0-9_-]+):contains\(['"]([^'"]+)['"]\)$/);
            if (match) {
              const tag = match[1];
              const text = match[2].toLowerCase();
              const elements = Array.from(document.querySelectorAll(tag));
              selectorMatched = elements.some(el => (el.textContent || '').toLowerCase().includes(text));
            }
          } else {
            selectorMatched = Boolean(document.querySelector(selector));
          }
        } catch (e) {
          selectorMatched = false;
        }
      }
      
      let textMatched = false;
      if (loginText && loginText.length > 0) {
        const elements = Array.from(document.querySelectorAll('button, a, div[role="button"], span, h1, h2, input[type="submit"]'));
        textMatched = elements.some(el => {
          const elText = (el.textContent || '').trim().toLowerCase();
          return loginText.some(text => elText === text.toLowerCase() || elText.includes(text.toLowerCase()));
        });
      }
      
      return selectorMatched || textMatched;
    }, config.detectLoginSelector, config.loginText ?? []);

    await forceKillBrowser(browser);

    if (needsLogin) {
      console.log(`[Web AI Check] Session expired or login required for ${profile.name}.`);
      return { ok: false, status: 'login_required', error: 'Yêu cầu đăng nhập tài khoản.' };
    }

    console.log(`[Web AI Check] Session is active and ready for ${profile.name}.`);
    return { ok: true, status: 'ready' };
  } catch (err: any) {
    await forceKillBrowser(browser);
    console.error(`[Web AI Check] Verification error:`, err);
    return { ok: false, status: 'error', error: err.message || String(err) };
  }
}

export async function openWebAISessionForLogin(
  platformName: string,
  profileId: string
): Promise<{ ok: boolean; status: WebAIProfileStatus; error?: string }> {
  const config = PLATFORMS[platformName.toLowerCase()];
  if (!config) {
    throw new WebAIError(`Nền tảng AI "${platformName}" chưa được hỗ trợ tự động hóa.`, 'platform_error', false);
  }

  const profile = await WebAiSessionManager.getProfileForPlatform(profileId, platformName);
  const profileDir = WebAiSessionManager.getProfilePath(profile.profileDir);

  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
  }

  console.log(`[Web AI Login] Opening browser window for profile: ${profile.name} (Platform: ${platformName})...`);
  removeChromeProfileLocks(profileDir);
  patchChromeSessionPreferences(profileDir);
  let browser;
  try {
    const systemChrome = getSystemChromeExecutablePath();
    const launchArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--remote-debugging-port=0',
      '--window-size=1280,900',
      '--disable-blink-features=AutomationControlled',
      '--hide-crash-restore-bubble',
      '--disable-infobars',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-session-crashed-bubble',
      '--disable-features=Translate,RestoreOnStartup,ChromeWhatsNew',
    ];
    const launchOpts: any = {
      headless: false, // Non-headless so user can interact!
      userDataDir: profileDir,
      defaultViewport: null,
      ignoreDefaultArgs: ['--enable-automation'],
      args: launchArgs,
    };
    if (systemChrome) {
      launchOpts.executablePath = systemChrome;
      console.log(`[Web AI Login] Using System Chrome binary: ${systemChrome}`);
    }
    browser = await puppeteer.launch(launchOpts);
  } catch (launchErr: any) {
    console.error('[Web AI Login] Browser launch failed:', launchErr);
    if (launchErr.message?.includes('profile') || launchErr.message?.includes('lock') || launchErr.message?.includes('use')) {
      throw new WebAIError(`Không thể mở trình duyệt: Tài khoản/Profile này hiện đang được mở ở một cửa sổ khác. Vui lòng đóng cửa sổ đó trước.`, 'automation_error', true);
    }
    throw new WebAIError(`Lỗi khởi chạy trình duyệt: ${launchErr.message}`, 'automation_error', true);
  }

  try {
    const pages = await browser.pages();
    const page = pages[0] || (await browser.newPage());
    await applyStealthSettings(page);

    console.log(`[Web AI Login] Navigating to: ${config.url}`);
    await page.goto(config.url, { waitUntil: 'domcontentloaded', timeout: 45000 });

    // Wait for user to close browser
    await new Promise<void>((resolve) => {
      browser.on('disconnected', () => {
        resolve();
      });
    });

    console.log(`[Web AI Login] Browser closed by user. Verifying session status...`);
    // Run the normal session check to verify if they logged in
    return await checkWebAISession(platformName, profileId);
  } catch (err: any) {
    await forceKillBrowser(browser);
    console.error(`[Web AI Login] Error:`, err);
    throw err;
  }
}
