import puppeteer, { Browser, Page } from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { WebAiSessionManager } from './webAiSessionManager';

export interface WebAICodeBlock {
  language: string;
  code: string;
  targetFile?: string;
}

export interface WebAIResult {
  text: string;
  codeBlocks: WebAICodeBlock[];
  modelUsed: string;
}

// Selectors configuration for each platform
interface PlatformConfig {
  url: string;
  inputSelector: string;
  sendSelector?: string;
  messageSelector: string;
  detectLoginSelector?: string; // Selector that indicates user needs to log in
}

const PLATFORMS: Record<string, PlatformConfig> = {
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
    detectLoginSelector: 'input[type="email"], button:contains("Sign in")',
  },
  deepseek: {
    url: 'https://chat.deepseek.com/',
    inputSelector: '#chat-input, textarea',
    sendSelector: 'div[class*="sendButton"]',
    messageSelector: '.ds-markdown, .markdown',
    detectLoginSelector: 'div:contains("Log In")',
  },
  grok: {
    url: 'https://grok.com/',
    inputSelector: 'textarea, [role="textbox"]',
    messageSelector: '.markdown, .grok-message-body',
  },
  copilot: {
    url: 'https://copilot.microsoft.com/',
    inputSelector: 'textarea, [role="textbox"]',
    messageSelector: '.markdown, .reply-bubble',
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
 * Execute prompt query on a web AI platform via Puppeteer
 */
export async function executeWebAIAutomation(
  platformName: string,
  promptText: string,
  defaultTargetFile?: string,
  options?: {
    profileId?: string;
    headless?: boolean;
  }
): Promise<WebAIResult> {
  const config = PLATFORMS[platformName.toLowerCase()];
  if (!config) {
    throw new Error(`Nền tảng AI "${platformName}" chưa được hỗ trợ tự động hóa.`);
  }

  // Set up sandboxed Chrome Profile path inside the workspace
  let profileDir = path.join(process.cwd(), '.chrome_profile');
  if (options?.profileId) {
    const profiles = await WebAiSessionManager.listProfiles();
    const foundProfile = profiles.find(p => p.id === options.profileId);
    if (foundProfile) {
      profileDir = WebAiSessionManager.getProfilePath(foundProfile.profileDir);
      await WebAiSessionManager.updateProfileLastUsed(foundProfile.id);
      console.log(`[Web AI] Using profile: ${foundProfile.name} (Platform: ${foundProfile.platform}, Dir: ${foundProfile.profileDir})`);
    } else {
      console.warn(`[Web AI] Profile "${options.profileId}" not found. Falling back to default workspace profile.`);
    }
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
    
    // Set custom User Agent to look like a normal browser
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    console.log(`[Web AI] Navigating to: ${config.url}`);
    await page.goto(config.url, { waitUntil: 'domcontentloaded', timeout: 45000 });

    // Wait a brief moment
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 3000)));

    // Login Check: If platform login elements are visible, wait for user login
    if (config.detectLoginSelector) {
      const needsLogin = await page.evaluate((selector) => {
        return !!document.querySelector(selector);
      }, config.detectLoginSelector);

      if (needsLogin) {
        console.log('[Web AI] Cần đăng nhập! Vui lòng hoàn tất đăng nhập trong cửa sổ Chrome...');
        // Wait up to 3 minutes for user to login
        await page.waitForSelector(config.inputSelector, { timeout: 180000 });
        console.log('[Web AI] Đăng nhập thành công, tiếp tục gửi prompt...');
      }
    }

    // Locate the prompt input box
    console.log(`[Web AI] Waiting for input textbox (${config.inputSelector})...`);
    await page.waitForSelector(config.inputSelector, { timeout: 15000 });

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
    await browser.close();

    return {
      text: resultText,
      codeBlocks: blocks,
      modelUsed: `web-ai/${platformName}`,
    };
  } catch (err) {
    // Make sure browser is closed on error
    await browser.close().catch(() => {});
    throw err;
  }
}
