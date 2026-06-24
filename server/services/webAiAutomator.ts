import puppeteer, { Browser, Page } from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { WebAiSessionManager, type WebAIProfileStatus } from './webAiSessionManager.ts';
import { classifyWebAIPageText, parseQuotaResetTime } from './webAiPolicy.ts';

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
}

// Selectors configuration for each platform
interface PlatformConfig {
  url: string;
  inputSelector: string;
  sendSelector?: string;
  messageSelector: string;
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


export const PLATFORMS: Record<string, PlatformConfig> = {
  chatgpt: {
    url: 'https://chatgpt.com/',
    inputSelector: '#prompt-textarea',
    sendSelector: '[data-testid="send-button"]',
    messageSelector: '[data-testid^="conversation-turn-"] .markdown',
    detectLoginSelector: 'a[href*="/login"], button[data-testid="login-button"]',
  },
  gemini: {
    url: 'https://gemini.google.com/',
    inputSelector: 'div[role="textbox"]',
    sendSelector: 'button[aria-label*="Gửi"], button[aria-label*="Send"]',
    messageSelector: '.model-response',
    detectLoginSelector: 'a[href*="accounts.google.com/ServiceLogin"]',
  },
  claude: {
    url: 'https://claude.ai/',
    inputSelector: 'div[contenteditable="true"], textarea',
    sendSelector: 'button[aria-label*="Send"], button[aria-label*="Gửi"]',
    messageSelector: '.font-claude-message, .markdown, .message-bubble',
    detectLoginSelector: 'input[type="email"]',
    loginText: ['sign in', 'continue with google'],
  },
  deepseek: {
    url: 'https://chat.deepseek.com/',
    inputSelector: '#chat-input, textarea',
    sendSelector: 'div[class*="sendButton"]',
    messageSelector: '.ds-markdown, .markdown',
    loginText: ['log in', 'sign in'],
  },
  grok: {
    url: 'https://grok.com/',
    inputSelector: 'textarea, [role="textbox"]',
    messageSelector: '.markdown, .grok-message-body',
    loginText: ['sign in'],
  },
  copilot: {
    url: 'https://copilot.microsoft.com/',
    inputSelector: 'textarea, [role="textbox"]',
    messageSelector: '.markdown, .reply-bubble',
    loginText: ['sign in'],
  },
};

/**
 * Extracts code blocks from raw text and matches them to suggested filenames.
 */
export function extractCodeBlocks(text: string, defaultTargetFile?: string): WebAICodeBlock[] {
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
 */
export async function applyStealthSettings(page: Page): Promise<void> {
  // Set User Agent resembling a real Chrome browser
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  );

  // Set default viewport to normal dimensions
  await page.setViewport({ width: 1280, height: 800 });

  // Add script to run on page load
  await page.evaluateOnNewDocument(() => {
    // 1. Hide webdriver property
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });

    // 2. Mock chrome runtime object
    (window as any).chrome = {
      app: {
        isInstalled: false,
        InstallState: {
          DISABLED: 'disabled',
          INSTALLED: 'installed',
          NOT_INSTALLED: 'not_installed',
        },
        RunningState: {
          CAN_RUN: 'can_run',
          CANNOT_RUN: 'cannot_run',
          RUNNING: 'running',
        },
      },
      runtime: {
        OnInstalledReason: {
          CHROME_UPDATE: 'chrome_update',
          INSTALL: 'install',
          SHARED_MODULE_UPDATE: 'shared_module_update',
          UPDATE: 'update',
        },
        OnRestartRequiredReason: {
          APP_UPDATE: 'app_update',
          OS_UPDATE: 'os_update',
          PERIODIC: 'periodic',
        },
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
          : originalQuery(parameters);
    }

    // 5. Mock navigator.plugins
    Object.defineProperty(navigator, 'plugins', {
      get: () => [
        { name: 'PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
        { name: 'Chrome PDF Viewer', filename: 'mhjcbomhhahjlnebmofoofbackdaibbo', description: 'Portable Document Format' },
        { name: 'Chromium PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
      ],
    });
  });

  // Set HTTP headers
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
    'sec-ch-ua': '"Not A(Brand";v="99", "Google Chrome";v="122", "Chromium";v="122"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
  });
}

/**
 * Execute prompt query on a web AI platform via Puppeteer
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
  }
): Promise<WebAIResult> {
  const config = PLATFORMS[platformName.toLowerCase()];
  if (!config) {
    throw new Error(`Nền tảng AI "${platformName}" chưa được hỗ trợ tự động hóa.`);
  }

  // Set up sandboxed Chrome Profile path inside the workspace
  let profileDir = path.join(process.cwd(), '.chrome_profile');
  let foundProfile: any = null;
  if (options?.profileId) {
    foundProfile = await WebAiSessionManager.getProfileForPlatform(options.profileId, platformName);
    profileDir = WebAiSessionManager.getProfilePath(foundProfile.profileDir);
    await WebAiSessionManager.updateProfileLastUsed(foundProfile.id);
    console.log(`[Web AI] Using profile: ${foundProfile.name} (Platform: ${foundProfile.platform}, Dir: ${foundProfile.profileDir})`);
  }

  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
  }

  const runHeadless = options?.headless === true;
  console.log(`[Web AI] Launching browser for platform: ${platformName} (headless: ${runHeadless})...`);
  let browser: Browser;
  try {
    browser = await puppeteer.launch({
      headless: runHeadless,
      userDataDir: profileDir,
      defaultViewport: null,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--window-size=1280,800',
        '--disable-blink-features=AutomationControlled',
      ],
    });
  } catch (launchErr: any) {
    console.error('[Web AI] Browser launch failed:', launchErr);
    if (launchErr.message?.includes('profile') || launchErr.message?.includes('lock') || launchErr.message?.includes('use')) {
      throw new Error(`Không thể khởi chạy trình duyệt: Tài khoản/Profile này hiện đang được mở và sử dụng bởi một cửa sổ trình duyệt khác. Vui lòng đóng cửa sổ đó trước khi thử lại.`);
    }
    throw new Error(`Lỗi khởi chạy trình duyệt tự động hóa: ${launchErr.message}`);
  }

  try {
    const pages = await browser.pages();
    const page = pages[0] || (await browser.newPage());
    
    // Apply stealth and anti-detection settings
    await applyStealthSettings(page);

    let targetUrl = config.url;
    if (foundProfile?.metadata?.lastConversationId) {
      const convId = foundProfile.metadata.lastConversationId;
      const lowerPlatform = platformName.toLowerCase();
      if (lowerPlatform === 'chatgpt') {
        targetUrl = `https://chatgpt.com/c/${convId}`;
      } else if (lowerPlatform === 'claude') {
        targetUrl = `https://claude.ai/chat/${convId}`;
      } else if (lowerPlatform === 'gemini') {
        targetUrl = `https://gemini.google.com/app/${convId}`;
      }
    }

    console.log(`[Web AI] Navigating to: ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });

    // Wait a brief moment
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 3000)));

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
          throw new WebAIError('Login was not completed within 3 minutes.', 'login_required');
        }
        console.log('[Web AI] Đăng nhập thành công, tiếp tục gửi prompt...');
      }
    }

    // Locate the prompt input box
    console.log(`[Web AI] Waiting for input textbox (${config.inputSelector})...`);
    await page.waitForSelector(config.inputSelector, { timeout: 15000 });

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

    // Set input content
    console.log('[Web AI] Typing prompt into AI chat web window...');
    await page.evaluate(
      (selector, text) => {
        const element = document.querySelector(selector) as any;
        if (!element) return;
        
        if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
          element.value = text;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          // contenteditable
          element.focus();
          element.innerText = text;
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
      },
      config.inputSelector,
      promptText
    );

    // Submit Prompt
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 800)));
    console.log('[Web AI] Submitting prompt...');
    
    let submitted = false;
    if (config.sendSelector) {
      submitted = await page.evaluate((selector) => {
        const btn = document.querySelector(selector) as HTMLButtonElement;
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      }, config.sendSelector);
    }

    // Fallback: If send button click failed or not configured, press Enter
    if (!submitted) {
      await page.focus(config.inputSelector);
      await page.keyboard.press('Enter');
    }

    // Wait for AI to finish generating response
    console.log('[Web AI] Waiting for response to compile...');
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 3000)));

    // Polling logic: monitor response element length stability
    let lastLength = 0;
    let stableCount = 0;
    const maxPolls = 180; // 3 minutes max

    for (let poll = 0; poll < maxPolls; poll++) {
      const visiblePageText = await page.evaluate(() => (document.body?.innerText || '').slice(-8000));
      const pageError = classifyWebAIPageText(visiblePageText);
      if (pageError) {
        const quotaResetAt = pageError === 'quota' ? parseQuotaResetTime(visiblePageText) : undefined;
        throw new WebAIError(
          pageError === 'quota'
            ? 'The selected Web AI profile has reached its usage limit.'
            : 'The Web AI platform reported a generation error.',
          pageError,
          true,
          quotaResetAt
        );
      }
      const currentLength = await page.evaluate((selector) => {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) return 0;
        const lastEl = elements[elements.length - 1];
        return lastEl ? (lastEl as HTMLElement).innerText.length : 0;
      }, config.messageSelector);

      console.log(`[Web AI] Polling generation progress... Length: ${currentLength}`);

      if (currentLength > 0 && currentLength === lastLength) {
        stableCount++;
        // If content length remains exactly identical for 4 consecutive seconds (4 polls), it's done
        if (stableCount >= 4) {
          console.log('[Web AI] Content generation stabilized. Finished.');
          break;
        }
      } else {
        stableCount = 0;
        lastLength = currentLength;
      }

      // Wait 1 second before next poll
      await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 1000)));
    }

    // Extract the final text response
    console.log('[Web AI] Extracting final response text...');
    const resultText = await page.evaluate((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        // Fallback: get all paragraph or div elements if standard selector fails
        const mdEl = document.querySelector('.markdown');
        return mdEl ? (mdEl as HTMLElement).innerText : '';
      }
      const lastEl = elements[elements.length - 1];
      return lastEl ? (lastEl as HTMLElement).innerText : '';
    }, config.messageSelector);

    if (!resultText) {
      throw new Error('Không thể đọc câu trả lời từ giao diện AI Chat.');
    }

    // Extract code blocks from the parsed text
    const blocks = extractCodeBlocks(resultText, defaultTargetFile);
    console.log(`[Web AI] Query completed. Parsed ${blocks.length} code blocks.`);

    // Wait a moment and close browser
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 1000)));

    try {
      const finalUrl = page.url();
      console.log(`[Web AI] Final page URL: ${finalUrl}`);
      let conversationId: string | undefined;

      const lowerPlatform = platformName.toLowerCase();
      if (lowerPlatform === 'chatgpt') {
        const match = finalUrl.match(/chatgpt\.com\/c\/([a-zA-Z0-9-]+)/);
        if (match) conversationId = match[1];
      } else if (lowerPlatform === 'claude') {
        const match = finalUrl.match(/claude\.ai\/chat\/([a-zA-Z0-9-]+)/);
        if (match) conversationId = match[1];
      } else if (lowerPlatform === 'gemini') {
        const match = finalUrl.match(/gemini\.google\.com\/app\/([a-zA-Z0-9]+)/);
        if (match) conversationId = match[1];
      }

      if (conversationId && foundProfile) {
        console.log(`[Web AI] Extracted conversation ID: ${conversationId}. Saving to profile ${foundProfile.id}`);
        await WebAiSessionManager.updateProfileConversation(foundProfile.id, conversationId);
      }
    } catch (urlErr) {
      console.error('[Web AI] Failed to parse or save conversation ID:', urlErr);
    }

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

    await browser.close();

    return {
      text: resultText,
      codeBlocks: blocks,
      modelUsed: `web-ai/${platformName}`,
      screenshotPath: capturedScreenshotPath,
    };
  } catch (err) {
    // Attempt error screenshot before closing browser
    if (options?.captureScreenshot || options?.screenshotPath) {
      try {
        const pages = await browser.pages().catch(() => []);
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
    // Make sure browser is closed on error
    await browser.close().catch(() => {});
    throw err;
  }
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
    throw new Error(`Nền tảng AI "${platformName}" chưa được hỗ trợ tự động hóa.`);
  }

  const profile = await WebAiSessionManager.getProfileForPlatform(profileId, platformName);
  const profileDir = WebAiSessionManager.getProfilePath(profile.profileDir);

  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
  }

  console.log(`[Web AI Check] Checking session for profile: ${profile.name} (Platform: ${platformName})...`);
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true, // Always headless for fast checking
      userDataDir: profileDir,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--window-size=1280,800',
        '--disable-blink-features=AutomationControlled',
      ],
    });
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

    await browser.close();

    if (needsLogin) {
      console.log(`[Web AI Check] Session expired or login required for ${profile.name}.`);
      return { ok: false, status: 'login_required', error: 'Yêu cầu đăng nhập tài khoản.' };
    }

    console.log(`[Web AI Check] Session is active and ready for ${profile.name}.`);
    return { ok: true, status: 'ready' };
  } catch (err: any) {
    await browser.close().catch(() => {});
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
    throw new Error(`Nền tảng AI "${platformName}" chưa được hỗ trợ tự động hóa.`);
  }

  const profile = await WebAiSessionManager.getProfileForPlatform(profileId, platformName);
  const profileDir = WebAiSessionManager.getProfilePath(profile.profileDir);

  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
  }

  console.log(`[Web AI Login] Opening browser window for profile: ${profile.name} (Platform: ${platformName})...`);
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false, // Non-headless so user can interact!
      userDataDir: profileDir,
      defaultViewport: null,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--window-size=1280,900',
        '--disable-blink-features=AutomationControlled',
      ],
    });
  } catch (launchErr: any) {
    console.error('[Web AI Login] Browser launch failed:', launchErr);
    if (launchErr.message?.includes('profile') || launchErr.message?.includes('lock') || launchErr.message?.includes('use')) {
      throw new Error(`Không thể mở trình duyệt: Tài khoản/Profile này hiện đang được mở ở một cửa sổ khác. Vui lòng đóng cửa sổ đó trước.`);
    }
    throw new Error(`Lỗi khởi chạy trình duyệt: ${launchErr.message}`);
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
    await browser.close().catch(() => {});
    console.error(`[Web AI Login] Error:`, err);
    throw err;
  }
}
