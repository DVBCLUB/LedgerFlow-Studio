/**
 * glaciaHumanCadenceEngine.ts
 * ============================================================================
 * GLACIA STEALTH HUMAN CADENCE & ANTI-BAN INTERACTION ENGINE
 * ============================================================================
 * Mô phỏng toàn diện hành vi thao tác của con người trên các nền tảng Webchat AI
 * (ChatGPT, Google Gemini Web, Claude, DeepSeek):
 *
 * 1. Tốc độ gõ phím sinh học (Human Typing Cadence):
 *    - Dao động ngẫu nhiên theo phân phối Gaussian (45 - 80 WPM ~ 220 - 400 CPM).
 *    - Khoảng nghỉ ngắt câu (dấu chấm, phẩy, chấm hỏi, chấm cảm).
 *    - Khoảng nghỉ tư duy giữa các đoạn văn (newline/paragraphs).
 * 2. Lỗi gõ phím tự nhiên & Tự sửa (Typo Simulation & Auto-Correction):
 *    - Tỉ lệ 1.5% - 2.5% vô tình gõ nhầm phím QWERTY lân cận.
 *    - Dừng ngỡ ngàng (150ms - 350ms) như người thật phát hiện lỗi.
 *    - Bấm Backspace và gõ lại ký tự chính xác.
 * 3. Quỹ đạo chuột đường cong Bézier (Bézier Curve Mouse Trajectory):
 *    - Di chuyển chuột mượt mà với gia tốc biến thiên thay vì click tức thời.
 *    - Dừng rê chuột (hover) trước khi bấm nút Gửi (Send).
 *    - Độ trễ tự nhiên giữa mousedown và mouseup (60ms - 120ms).
 * 4. Chế độ Mô phỏng Giọng nói (Voice Dictation Streaming Modality):
 *    - Nhập văn bản theo từng cụm âm thanh (2-5 từ) kèm nhịp thở tự nhiên (600-1200ms).
 *    - Mô phỏng chính xác luồng dữ liệu của Web Speech API / Google Voice Typing.
 *    - Né 100% hệ thống giám sát bàn phím (keystroke telemetry) của các nền tảng AI.
 * ============================================================================
 */

import type { Page } from 'puppeteer';

export interface HumanTypingOptions {
  baseWpm?: number;           // Words per minute (mặc định: 58 WPM)
  varianceRatio?: number;     // Độ lệch chuẩn Gaussian (0.2 = 20%)
  typoRate?: number;          // Tỉ lệ lỗi gõ nhầm (0.02 = 2%)
  allowTypoCorrection?: boolean;
  preSubmitDelayMs?: number;  // Thời gian dừng đọc lại trước khi bấm gửi (1500 - 3000ms)
}

export interface VoiceDictationOptions {
  wordsPerChunkMin?: number;  // Số từ tối thiểu mỗi nhịp thở (2)
  wordsPerChunkMax?: number;  // Số từ tối đa mỗi nhịp thở (5)
  pauseBetweenChunksMs?: number; // Khoảng dừng giữa các cụm từ (700ms)
  isContinuous?: boolean;
}

export interface BezierPoint {
  x: number;
  y: number;
}

// Bảng ánh xạ các phím lân cận trên bàn phím QWERTY tiêu chuẩn
const ADJACENT_KEYS_MAP: Record<string, string[]> = {
  a: ['q', 'w', 's', 'z'],
  b: ['v', 'g', 'h', 'n'],
  c: ['x', 'd', 'f', 'v'],
  d: ['s', 'e', 'r', 'f', 'c', 'x'],
  e: ['w', 's', 'd', 'r', '3', '4'],
  f: ['d', 'r', 't', 'g', 'v', 'c'],
  g: ['f', 't', 'y', 'h', 'b', 'v'],
  h: ['g', 'y', 'u', 'j', 'n', 'b'],
  i: ['u', 'j', 'k', 'o', '8', '9'],
  j: ['h', 'u', 'i', 'k', 'm', 'n'],
  k: ['j', 'i', 'o', 'l', 'm'],
  l: ['k', 'o', 'p'],
  m: ['n', 'j', 'k'],
  n: ['b', 'h', 'j', 'm'],
  o: ['i', 'k', 'l', 'p', '9', '0'],
  p: ['o', 'l', '0', '-'],
  q: ['1', '2', 'w', 'a'],
  r: ['e', 'd', 'f', 't', '4', '5'],
  s: ['a', 'w', 'e', 'd', 'x', 'z'],
  t: ['r', 'f', 'g', 'y', '5', '6'],
  u: ['y', 'h', 'j', 'i', '7', '8'],
  v: ['c', 'f', 'g', 'b'],
  w: ['q', 'a', 's', 'e', '2', '3'],
  x: ['z', 's', 'd', 'c'],
  y: ['t', 'g', 'h', 'u', '6', '7'],
  z: ['a', 's', 'x'],
};

/**
 * Sinh số ngẫu nhiên theo phân phối chuẩn Gaussian (Box-Muller transform)
 */
export function randomGaussian(mean = 0, stdDev = 1): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + z0 * stdDev;
}

/**
 * Tính toán độ trễ nhấn phím thực tế của con người theo ngữ cảnh ký tự
 */
export function calculateKeystrokeDelay(
  char: string,
  _prevChar?: string,
  baseWpm = 58,
  varianceRatio = 0.25
): number {
  // 58 WPM ~= 290 ký tự/phút ~= ~206ms/ký tự cơ bản
  const meanDelay = 60_000 / (baseWpm * 5);
  const stdDev = meanDelay * varianceRatio;

  let delay = randomGaussian(meanDelay, stdDev);
  delay = Math.max(45, Math.min(320, delay));

  // Dấu kết thúc câu (. ! ?): Khoảng dừng tư duy dài hơn
  if (['.', '!', '?'].includes(char)) {
    delay += randomGaussian(450, 80);
  }
  // Dấu ngắt câu (, ; : -): Khoảng dừng ngắn
  else if ([',', ';', ':', '—', '-'].includes(char)) {
    delay += randomGaussian(220, 50);
  }
  // Phím cách: Ngắt giữa 2 từ
  else if (char === ' ') {
    delay += randomGaussian(110, 30);
  }
  // Ký tự xuống dòng: Chuyển đoạn văn bản
  else if (char === '\n') {
    delay += randomGaussian(750, 150);
  }
  // Chữ hoa: Thao tác bấm giữ Shift
  else if (char !== char.toLowerCase() && char.toUpperCase() === char) {
    delay += randomGaussian(70, 20);
  }

  return Math.round(Math.max(35, delay));
}

/**
 * Lấy một phím lân cận ngẫu nhiên để mô phỏng lỗi gõ nhầm (typo)
 */
export function getAdjacentTypoChar(char: string): string | null {
  const lower = char.toLowerCase();
  const adjacent = ADJACENT_KEYS_MAP[lower];
  if (!adjacent || adjacent.length === 0) return null;
  const picked = adjacent[Math.floor(Math.random() * adjacent.length)];
  return char === char.toUpperCase() ? picked.toUpperCase() : picked;
}

/**
 * Sinh chuỗi tọa độ cong Bézier bậc 3 mô phỏng di chuyển chuột con người
 */
export function generateBezierCurve(
  start: BezierPoint,
  end: BezierPoint,
  steps = 20
): BezierPoint[] {
  // Tạo 2 điểm kiểm soát ngẫu nhiên lệch khỏi đường thẳng
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  const deviation = Math.min(120, dist * 0.35);
  const cp1: BezierPoint = {
    x: start.x + dx * 0.25 + (Math.random() - 0.5) * deviation,
    y: start.y + dy * 0.25 + (Math.random() - 0.5) * deviation,
  };
  const cp2: BezierPoint = {
    x: start.x + dx * 0.75 + (Math.random() - 0.5) * deviation,
    y: start.y + dy * 0.75 + (Math.random() - 0.5) * deviation,
  };

  const points: BezierPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Cubic Bézier formula: (1-t)^3*P0 + 3(1-t)^2*t*P1 + 3(1-t)*t^2*P2 + t^3*P3
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;

    const x = mt3 * start.x + 3 * mt2 * t * cp1.x + 3 * mt * t2 * cp2.x + t3 * end.x;
    const y = mt3 * start.y + 3 * mt2 * t * cp1.y + 3 * mt * t2 * cp2.y + t3 * end.y;

    // Thêm vi rung động (micro-jitter) cho các điểm trung gian, giữ chính xác điểm đầu và điểm đích
    const isEndpoint = i === 0 || i === steps;
    const jitterX = isEndpoint ? 0 : (Math.random() - 0.5) * 1.5;
    const jitterY = isEndpoint ? 0 : (Math.random() - 0.5) * 1.5;

    points.push({ x: Math.round(x + jitterX), y: Math.round(y + jitterY) });
  }

  return points;
}

/**
 * ĐỘNG CƠ THỰC THI CHÍNH: Gõ phím theo nhịp độ con người vào trang Puppeteer
 */
export async function typeWithHumanCadence(
  page: Page,
  selector: string,
  text: string,
  options: HumanTypingOptions = {}
): Promise<{ typedLength: number; durationMs: number; typosCount: number }> {
  const baseWpm = options.baseWpm ?? 58;
  const varianceRatio = options.varianceRatio ?? 0.25;
  const typoRate = options.typoRate ?? 0.02;
  const allowTypoCorrection = options.allowTypoCorrection ?? true;

  const startTime = Date.now();
  let typosCount = 0;

  // 1. Tìm và focus vào phần tử mục tiêu
  try {
    await page.focus(selector);
  } catch {
    // Thử click để focus nếu focus selector trực tiếp không được
    await page.click(selector).catch(() => {});
  }

  // Đợi nhẹ sau khi focus (100 - 250ms)
  await new Promise((r) => setTimeout(r, Math.round(randomGaussian(180, 35))));

  let prevChar = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    // Kiểm tra tỉ lệ gõ nhầm (typo) nếu là chữ cái và cho phép sửa
    const shouldTypo = allowTypoCorrection && /[a-zA-Z]/.test(char) && Math.random() < typoRate;

    if (shouldTypo) {
      const typoChar = getAdjacentTypoChar(char);
      if (typoChar) {
        typosCount++;
        // Gõ ký tự sai
        await page.keyboard.type(typoChar, { delay: 0 });

        // Con người mất một khoảng nhận thức (160ms - 320ms) để nhận ra đã gõ sai
        const hesitationDelay = Math.round(randomGaussian(220, 45));
        await new Promise((r) => setTimeout(r, Math.max(100, hesitationDelay)));

        // Bấm Backspace xóa ký tự sai
        await page.keyboard.press('Backspace');

        // Dừng nhẹ trước khi gõ phím đúng (80ms - 180ms)
        const recoveryDelay = Math.round(randomGaussian(120, 25));
        await new Promise((r) => setTimeout(r, Math.max(50, recoveryDelay)));
      }
    }

    // Gõ ký tự chính xác
    if (char === '\n') {
      await page.keyboard.down('Shift');
      await page.keyboard.press('Enter');
      await page.keyboard.up('Shift');
    } else {
      await page.keyboard.type(char, { delay: 0 });
    }

    // Tính toán độ trễ trước ký tự tiếp theo
    const delay = calculateKeystrokeDelay(char, prevChar, baseWpm, varianceRatio);
    await new Promise((r) => setTimeout(r, delay));

    prevChar = char;
  }

  const durationMs = Date.now() - startTime;
  return { typedLength: text.length, durationMs, typosCount };
}

/**
 * CHẾ ĐỘ MÔ PHỎNG GIỌNG NÓI: Chèn văn bản theo cụm từ như Speech-to-Text
 */
export async function streamVoiceDictation(
  page: Page,
  selector: string,
  text: string,
  options: VoiceDictationOptions = {}
): Promise<{ chunksCount: number; durationMs: number }> {
  const wordsPerChunkMin = options.wordsPerChunkMin ?? 2;
  const wordsPerChunkMax = options.wordsPerChunkMax ?? 5;
  const pauseBetweenChunksMs = options.pauseBetweenChunksMs ?? 750;

  const startTime = Date.now();
  const words = text.split(/\s+/).filter(Boolean);
  let wordIndex = 0;
  let chunksCount = 0;

  try {
    await page.focus(selector);
  } catch {
    await page.click(selector).catch(() => {});
  }

  while (wordIndex < words.length) {
    // Lấy số từ ngẫu nhiên cho nhịp nói này (2 đến 5 từ)
    const chunkSize = Math.floor(
      Math.random() * (wordsPerChunkMax - wordsPerChunkMin + 1)
    ) + wordsPerChunkMin;

    const chunkWords = words.slice(wordIndex, wordIndex + chunkSize);
    const chunkText = (wordIndex > 0 ? ' ' : '') + chunkWords.join(' ');
    wordIndex += chunkSize;
    chunksCount++;

    // Bơm cụm từ vào input với sự kiện giả lập giọng nói
    await page.evaluate(
      (sel, chunk) => {
        const el = document.querySelector(sel) as HTMLElement;
        if (!el) return;

        // Giả lập sự kiện InputEvent dạng voice dictation
        if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
          const inputEl = el as HTMLInputElement | HTMLTextAreaElement;
          inputEl.value = (inputEl.value || '') + chunk;
          inputEl.dispatchEvent(
            new InputEvent('input', {
              bubbles: true,
              cancelable: true,
              inputType: 'insertText',
              data: chunk,
              isComposing: false,
            })
          );
          inputEl.dispatchEvent(new Event('change', { bubbles: true }));
        } else if (el.isContentEditable) {
          // ContentEditable (Gemini, ChatGPT)
          const textNode = document.createTextNode(chunk);
          el.appendChild(textNode);
          el.dispatchEvent(
            new InputEvent('input', {
              bubbles: true,
              cancelable: true,
              inputType: 'insertText',
              data: chunk,
              isComposing: false,
            })
          );
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      },
      selector,
      chunkText
    );

    // Dừng giữa các nhịp thở đàm thoại (550ms - 1100ms)
    const breathPause = Math.round(randomGaussian(pauseBetweenChunksMs, 120));
    await new Promise((r) => setTimeout(r, Math.max(350, breathPause)));
  }

  const durationMs = Date.now() - startTime;
  return { chunksCount, durationMs };
}

/**
 * Di chuyển chuột theo đường cong Bézier và click tự nhiên vào phần tử
 */
export async function humanMoveAndClick(
  page: Page,
  selector: string,
  options: { hoverWaitMs?: number } = {}
): Promise<boolean> {
  const hoverWait = options.hoverWaitMs ?? Math.round(randomGaussian(220, 45));

  try {
    const el = await page.$(selector);
    if (!el) return false;

    const box = await el.boundingBox();
    if (!box) return false;

    // Tọa độ mục tiêu ngẫu nhiên trong vùng nút bấm (tránh tâm 100%)
    const targetX = box.x + box.width * (0.3 + Math.random() * 0.4);
    const targetY = box.y + box.height * (0.3 + Math.random() * 0.4);

    // Tọa độ chuột hiện tại hoặc ngẫu nhiên ở góc
    const startPoint: BezierPoint = {
      x: Math.round(Math.random() * 400 + 100),
      y: Math.round(Math.random() * 300 + 100),
    };
    const endPoint: BezierPoint = { x: targetX, y: targetY };

    // Sinh các bước di chuyển đường cong
    const steps = 18;
    const curvePoints = generateBezierCurve(startPoint, endPoint, steps);

    for (const pt of curvePoints) {
      await page.mouse.move(pt.x, pt.y);
      await new Promise((r) => setTimeout(r, Math.round(randomGaussian(12, 3))));
    }

    // Dừng rê chuột (hover) trước khi bấm
    await new Promise((r) => setTimeout(r, Math.max(80, hoverWait)));

    // Bấm chuột xuống (mousedown)
    await page.mouse.down();

    // Độ trễ nhấn giữ chuột (60ms - 110ms)
    const pressDuration = Math.round(randomGaussian(85, 15));
    await new Promise((r) => setTimeout(r, Math.max(45, pressDuration)));

    // Nhả chuột (mouseup)
    await page.mouse.up();

    return true;
  } catch (_err) {
    // Fallback nếu không tính được bounding box
    try {
      await page.click(selector);
      return true;
    } catch {
      return false;
    }
  }
}
