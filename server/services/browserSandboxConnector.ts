import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { appendCompanyOsEvent } from './companyOsControlPlane';
import { applyStealthSettings } from './webAiAutomator';

export interface SandboxRun {
  id: string;
  profileName: string;
  folder: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  logs: string[];
  output?: any;
  startTime: string;
  endTime?: string;
  lastScreenshot?: string;
}

const activeRuns = new Map<string, SandboxRun>();
const activeBrowsers = new Map<string, any>();
const hostFailureTracker = new Map<string, { failures: number; lastFailureAt: number; disabledUntil?: number; reason?: string }>();

function parseHost(urlText: string): string {
  return new URL(urlText).hostname.toLowerCase();
}

function markBrowserHostSuccess(host: string) {
  hostFailureTracker.delete(host);
}

function markBrowserHostFailure(host: string, reason: string) {
  const now = Date.now();
  const current = hostFailureTracker.get(host) || { failures: 0, lastFailureAt: now };
  const failures = current.failures + 1;
  const cooldownMs = Math.max(60_000, Number(process.env.BROWSER_MODE_COOLDOWN_MS || 300_000));
  const threshold = Math.max(2, Number(process.env.BROWSER_MODE_FAILURE_THRESHOLD || 3));
  hostFailureTracker.set(host, {
    failures,
    lastFailureAt: now,
    disabledUntil: failures >= threshold ? now + cooldownMs : current.disabledUntil,
    reason,
  });
}

export function getBrowserModeDiagnostics() {
  const now = Date.now();
  return Array.from(hostFailureTracker.entries()).map(([host, entry]) => ({
    host,
    failures: entry.failures,
    reason: entry.reason,
    cooldownActive: Boolean(entry.disabledUntil && entry.disabledUntil > now),
    disabledUntil: entry.disabledUntil ? new Date(entry.disabledUntil).toISOString() : undefined,
    lastFailureAt: new Date(entry.lastFailureAt).toISOString(),
  }));
}

function getChromeExecutablePath(): string | undefined {
  const paths = [
    path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(process.env.LOCALAPPDATA || 'C:\\Users\\Default\\AppData\\Local', 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(process.env.USERPROFILE || 'C:\\Users\\Default', 'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'),
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

function getUserDataDir(folder: string): string {
  if (!/^[a-zA-Z0-9 _.-]{1,80}$/.test(folder) || folder === '.' || folder === '..') throw new Error('Browser profile folder contains unsupported characters.');
  const basePath = path.join(
    process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || 'C:\\Users\\Default', 'AppData\\Local'),
    'Google', 'Chrome', 'User Data'
  );
  const resolvedBase = path.resolve(basePath);
  const resolved = path.resolve(resolvedBase, folder);
  if (!resolved.startsWith(`${resolvedBase}${path.sep}`)) throw new Error('Browser profile must remain inside the managed Chrome profile directory.');
  return resolved;
}

function validateActionUrl(actionUrl: string, taskType: 'chatgpt-scrape' | 'gemini-scrape' | 'claude-scrape' | 'deepseek-scrape' | 'general') {
  const url = new URL(actionUrl);
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Browser sandbox only accepts HTTP(S) URLs.');
  const hostname = url.hostname.toLowerCase();
  const taskHosts = taskType === 'chatgpt-scrape'
    ? ['chatgpt.com', 'chat.openai.com']
    : taskType === 'gemini-scrape'
      ? ['gemini.google.com']
      : taskType === 'claude-scrape'
        ? ['claude.ai']
        : taskType === 'deepseek-scrape'
          ? ['chat.deepseek.com']
      : [];
  const configuredHosts = String(process.env.BROWSER_SANDBOX_ALLOWED_HOSTS || '').split(',').map((host) => host.trim().toLowerCase()).filter(Boolean);
  const localHosts = ['127.0.0.1', 'localhost', '::1'];
  const allowedHosts = [...taskHosts, ...configuredHosts, ...localHosts];
  if (!allowedHosts.some((host) => hostname === host || hostname.endsWith(`.${host}`))) {
    throw new Error(`Browser target ${hostname} is not allowlisted for ${taskType}.`);
  }
  const hostState = hostFailureTracker.get(hostname);
  if (hostState?.disabledUntil && hostState.disabledUntil > Date.now()) {
    throw new Error(`Browser mode for ${hostname} is cooling down until ${new Date(hostState.disabledUntil).toISOString()} due to repeated failures.`);
  }
  return url.toString();
}

export function getRun(runId: string): SandboxRun | undefined {
  return activeRuns.get(runId);
}

export function logToRun(runId: string, message: string) {
  const run = activeRuns.get(runId);
  if (run) {
    const timestamp = new Date().toLocaleTimeString('vi-VN');
    run.logs.push(`[${timestamp}] ${message}`);
    console.log(`[Browser Sandbox - ${runId}] ${message}`);
  }
}

export async function stopRun(runId: string) {
  const browser = activeBrowsers.get(runId);
  if (browser) {
    try {
      logToRun(runId, 'Hủy bỏ tác vụ bởi người dùng. Đang đóng trình duyệt...');
      await browser.close();
    } catch (e) {
      console.error('Error closing browser:', e);
    }
    activeBrowsers.delete(runId);
  }
  const run = activeRuns.get(runId);
  if (run && run.status === 'running') {
    run.status = 'cancelled';
    run.endTime = new Date().toISOString();
  }
}

export async function startBrowserSandboxRun(
  profileName: string,
  folder: string,
  actionUrl: string,
  taskType: 'chatgpt-scrape' | 'gemini-scrape' | 'claude-scrape' | 'deepseek-scrape' | 'general',
  options?: { apiFallbackExhausted?: boolean }
): Promise<string> {
  const requireApiExhausted = String(process.env.BROWSER_MODE_REQUIRES_API_EXHAUSTION || 'true').toLowerCase() !== 'false';
  if (requireApiExhausted && !options?.apiFallbackExhausted) {
    throw new Error('Browser session mode is fallback-only and requires API fallback exhaustion proof.');
  }
  const validatedUrl = validateActionUrl(actionUrl, taskType);
  getUserDataDir(folder);
  const runId = `run_${Date.now()}`;
  const run: SandboxRun = {
    id: runId,
    profileName,
    folder,
    status: 'running',
    logs: [],
    startTime: new Date().toISOString(),
  };

  activeRuns.set(runId, run);
  
  // Launch run in background asynchronously
  void executeSandboxTask(runId, folder, validatedUrl, taskType);

  return runId;
}

async function executeSandboxTask(
  runId: string,
  folder: string,
  actionUrl: string,
  taskType: 'chatgpt-scrape' | 'gemini-scrape' | 'claude-scrape' | 'deepseek-scrape' | 'general'
) {
  logToRun(runId, `Khởi tạo Sandbox cho profile: ${folder}`);
  const executablePath = getChromeExecutablePath();
  const userDataDir = getUserDataDir(folder);

  logToRun(runId, `Thư mục cấu hình (Profile Path): ${userDataDir}`);
  if (executablePath) {
    logToRun(runId, `Sử dụng Google Chrome tại: ${executablePath}`);
  } else {
    logToRun(runId, 'Không tìm thấy Google Chrome cài đặt trên Windows. Sử dụng Chromium mặc định.');
  }

  let browser;
  let screenshotInterval: NodeJS.Timeout | undefined;
  try {
    browser = await puppeteer.launch({
      headless: false, // Visible visual window for sandbox
      executablePath,
      userDataDir,
      defaultViewport: null,
      args: [
        '--window-size=1280,800',
        '--disable-extensions'
      ],
    });

    activeBrowsers.set(runId, browser);
    logToRun(runId, 'Trình duyệt khởi chạy thành công.');

    // Start screenshot streaming interval every 1 second
    screenshotInterval = setInterval(async () => {
      try {
        if (!browser) return;
        const pages = await browser.pages();
        const activePage = pages[pages.length - 1] || pages[0];
        if (activePage && !activePage.isClosed()) {
          const screenshot = await activePage.screenshot({ encoding: 'base64', type: 'jpeg', quality: 50 });
          const run = activeRuns.get(runId);
          if (run) {
            run.lastScreenshot = `data:image/jpeg;base64,${screenshot}`;
          }
        }
      } catch (err) {
        // Ignore screenshot errors
      }
    }, 1000);

    const pages = await browser.pages();
    const page = pages[0] || (await browser.newPage());
    await applyStealthSettings(page);

    logToRun(runId, `Đang kết nối tới URL: ${actionUrl}`);
    await page.goto(actionUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    logToRun(runId, 'Đã tải xong trang web.');

    if (taskType === 'chatgpt-scrape') {
      logToRun(runId, 'Đang đợi kiểm tra đăng nhập ChatGPT (tối đa 30s)...');
      try {
        await page.waitForSelector('nav', { timeout: 30000 });
        logToRun(runId, 'Xác nhận đăng nhập thành công. Đang quét danh sách hội thoại...');

        // Extract conversations from ChatGPT sidebar
        const conversations = await page.evaluate(() => {
          const list: any[] = [];
          const elements = document.querySelectorAll('nav ol li a');
          elements.forEach((el, index) => {
            const titleText = el.textContent?.trim() || '';
            if (titleText) {
              list.push({
                id: `local_sync_${Date.now()}_${index}`,
                title: titleText,
                source: 'chatgpt',
                messages: [
                  { role: 'user', text: `Cuộc hội thoại đồng bộ: ${titleText}` },
                  { role: 'assistant', text: 'Để xem chi tiết cuộc hội thoại này, vui lòng sử dụng tính năng Export Data chính thức của ChatGPT hoặc tải extension.' }
                ],
                date: new Date().toLocaleDateString('vi-VN')
              });
            }
          });
          return list;
        });

        logToRun(runId, `Hoàn thành trích xuất. Tìm thấy ${conversations.length} cuộc hội thoại.`);
        const run = activeRuns.get(runId);
        if (run) {
          run.output = conversations;
        }

        // Add to Company OS audit trail
        await appendCompanyOsEvent({
          source: 'openclaw',
          eventType: 'openclaw.browser_sync',
          title: `Browser sync thành công từ profile ${folder}`,
          body: `Trích xuất thành công ${conversations.length} cuộc hội thoại từ ChatGPT.`,
          risk: 'medium',
          payload: { count: conversations.length, runId },
        });

      } catch (err) {
        logToRun(runId, 'Lỗi: Không tìm thấy giao diện đăng nhập (nav). Vui lòng đăng nhập tài khoản trên cửa sổ trình duyệt.');
        throw err;
      }
    } else if (taskType === 'gemini-scrape') {
      logToRun(runId, 'Đang đợi kiểm tra đăng nhập Google Gemini...');
      try {
        await page.waitForSelector('div[role="navigation"]', { timeout: 30000 });
        logToRun(runId, 'Xác nhận đăng nhập thành công. Đang quét danh sách...');
        const conversations = await page.evaluate(() => {
          const list: any[] = [];
          const elements = document.querySelectorAll('a[href*="/app/"]');
          elements.forEach((el, index) => {
            const titleText = el.textContent?.trim() || '';
            if (titleText && !list.some(item => item.title === titleText)) {
              list.push({
                id: `gemini_sync_${Date.now()}_${index}`,
                title: titleText,
                source: 'gemini',
                messages: [
                  { role: 'user', text: `Cuộc hội thoại đồng bộ Gemini: ${titleText}` },
                  { role: 'assistant', text: 'Chi tiết cuộc hội thoại đồng bộ từ Gemini Web.' }
                ],
                date: new Date().toLocaleDateString('vi-VN')
              });
            }
          });
          return list;
        });

        logToRun(runId, `Hoàn thành trích xuất. Tìm thấy ${conversations.length} cuộc hội thoại.`);
        const run = activeRuns.get(runId);
        if (run) {
          run.output = conversations;
        }

        await appendCompanyOsEvent({
          source: 'openclaw',
          eventType: 'openclaw.browser_sync',
          title: `Browser sync thành công từ profile ${folder} (Gemini)`,
          body: `Trích xuất thành công ${conversations.length} cuộc hội thoại từ Gemini.`,
          risk: 'medium',
          payload: { count: conversations.length, runId },
        });
      } catch (err) {
        logToRun(runId, 'Lỗi: Không tìm thấy giao diện Gemini đăng nhập.');
        throw err;
      }
    } else {
      logToRun(runId, 'Chế độ duyệt web tự do. Đợi thao tác thủ công trong 60 giây...');
      await new Promise(r => setTimeout(r, 60000));
      logToRun(runId, 'Hết thời gian duyệt web tự động.');
    }

    logToRun(runId, 'Đang đóng trình duyệt...');
    await browser.close();
    activeBrowsers.delete(runId);
    markBrowserHostSuccess(parseHost(actionUrl));

    const runObj = activeRuns.get(runId);
    if (runObj) {
      runObj.status = 'completed';
      runObj.endTime = new Date().toISOString();
    }
    logToRun(runId, 'Tác vụ hoàn thành xuất sắc.');

  } catch (err: any) {
    logToRun(runId, `Gặp lỗi trong quá trình thực thi: ${err?.message || err}`);
    const message = String(err?.message || err || '').toLowerCase();
    const failureReason = message.includes('captcha')
      ? 'captcha_detected'
      : message.includes('login') || message.includes('đăng nhập')
        ? 'login_challenge'
        : 'execution_error';
    markBrowserHostFailure(parseHost(actionUrl), failureReason);
    if (browser) {
      try {
        await browser.close();
      } catch (e) {}
      activeBrowsers.delete(runId);
    }
    const runObj = activeRuns.get(runId);
    if (runObj) {
      runObj.status = 'failed';
      runObj.endTime = new Date().toISOString();
    }
  } finally {
    if (screenshotInterval) {
      clearInterval(screenshotInterval);
      // Clean up reference in runs
      const runObj = activeRuns.get(runId);
      if (runObj) {
        delete runObj.lastScreenshot;
      }
    }
  }
}
