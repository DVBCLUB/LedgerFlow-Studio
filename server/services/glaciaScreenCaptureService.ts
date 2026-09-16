/**
 * glaciaScreenCaptureService.ts
 * ═══════════════════════════════════════════════════════════════
 * Glacia Screen Capture Service
 * ─────────────────────────────────────────────────────────────
 * Chụp ảnh màn hình Windows desktop phục vụ Computer Vision.
 * Dùng PowerShell native (không cần thêm thư viện) + fallback Puppeteer.
 * ═══════════════════════════════════════════════════════════════
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, unlinkSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

const SCREENSHOTS_DIR = join(process.cwd(), 'runtime', 'screenshots');

function ensureScreenshotsDir(): void {
  if (!existsSync(SCREENSHOTS_DIR)) {
    mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
}

export interface ScreenCaptureResult {
  success: boolean;
  imageBase64: string;
  path: string;
  width: number;
  height: number;
  timestamp: string;
  error?: string;
}

export interface ScreenAnalysisResult {
  success: boolean;
  description: string;
  elements: ScreenElement[];
  layout: string;
  suggestions: string[];
  error?: string;
  rawAIResponse?: string;
}

/**
 * Chụp màn hình Windows desktop bằng PowerShell native
 */
export async function captureScreen(): Promise<ScreenCaptureResult> {
  try {
    ensureScreenshotsDir();
    const filename = `screen_${Date.now()}_${randomUUID().slice(0, 8)}.png`;
    const filepath = join(SCREENSHOTS_DIR, filename);
    const escapedPath = filepath.replace(/\\/g, '\\\\');

    const psScript = `
Add-Type -AssemblyName System.Windows.Forms;
Add-Type -AssemblyName System.Drawing;
$screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds;
$bitmap = New-Object System.Drawing.Bitmap $screen.Width, $screen.Height;
$graphics = [System.Drawing.Graphics]::FromImage($bitmap);
$graphics.CopyFromScreen($screen.X, $screen.Y, 0, 0, $bitmap.Size);
$bitmap.Save('${escapedPath}', [System.Drawing.Imaging.ImageFormat]::Png);
$graphics.Dispose();
$bitmap.Dispose();
Write-Output "OK:$($screen.Width):$($screen.Height)";
`;

    const result = execSync(
      `powershell -NoProfile -NonInteractive -Command "${psScript.replace(/"/g, '\\"')}"`,
      { timeout: 15000, encoding: 'utf-8' }
    );

    if (!existsSync(filepath)) {
      return { success: false, imageBase64: '', path: '', width: 0, height: 0,
        timestamp: new Date().toISOString(), error: 'Không thể tạo file screenshot' };
    }

    const stats = result.trim().split(':');
    const width = parseInt(stats[1] || '1920', 10);
    const height = parseInt(stats[2] || '1080', 10);
    const buffer = readFileSync(filepath);
    const imageBase64 = buffer.toString('base64');
    try { unlinkSync(filepath); } catch {}

    return { success: true, imageBase64, path: filepath, width, height,
      timestamp: new Date().toISOString() };
  } catch (err: any) {
    try { return await captureScreenFallbackPuppeteer(); } catch (fallbackErr: any) {
      return { success: false, imageBase64: '', path: '', width: 0, height: 0,
        timestamp: new Date().toISOString(),
        error: `Lỗi chụp màn hình: ${err.message}. Fallback: ${fallbackErr.message}` };
    }
  }
}

/**
 * Fallback: Dùng Puppeteer screenshot
 */
async function captureScreenFallbackPuppeteer(): Promise<ScreenCaptureResult> {
  const puppeteer = await import('puppeteer');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle0', timeout: 10000 });
  const screenshotBuffer = await page.screenshot({ fullPage: false, type: 'png' });
  await browser.close();
  return { success: true, imageBase64: Buffer.from(screenshotBuffer).toString('base64'),
    path: 'puppeteer-capture', width: 1920, height: 1080,
    timestamp: new Date().toISOString() };
}

/**
 * Phân tích màn hình bằng AI Vision qua AI Gateway
 */
export async function analyzeScreenWithAI(
  imageBase64: string,
  prompt?: string
): Promise<ScreenAnalysisResult> {
  try {
    const { callAI } = await import('./aiClient.ts');
    const analysisPrompt = prompt || `Bạn là Glacia - Trợ lý AI có Computer Vision.
Phân tích ảnh chụp màn hình desktop Windows và trả về JSON:
{
  "description": "Mô tả tổng quan giao diện (ngôn ngữ, ứng dụng, layout)",
  "layout": "Kiểu bố cục (single-pane|split-pane|form|dashboard|dialog|blank)",
  "elements": [
    {
      "type": "button|input|text|image|icon|menu|dialog|other",
      "label": "Nhãn hoặc text gần nhất",
      "boundingBox": { "x": 0, "y": 0, "width": 100, "height": 30 },
      "confidence": 0.95,
      "interactionHint": "Gợi ý tương tác"
    }
  ],
  "suggestions": ["Hành động đề xuất 1"]
}
CHỈ trả về JSON hợp lệ, không markdown hay text thừa.`;

    const aiResult = await callAI([
      { role: 'system', content: 'Bạn là chuyên gia Computer Vision. Phân tích ảnh chụp màn hình và trả JSON thuần.' },
      { role: 'user', content: [
        { type: 'text', text: analysisPrompt },
        { type: 'image_url', image_url: { url: `data:image/png;base64,${imageBase64}` } },
      ] as any },
    ], { task: 'analytics', temperature: 0.1 });

    const rawText = aiResult.content || aiResult.text || '';
    let parsed: any;

    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(rawText);
    } catch {
      return { success: true, description: rawText.slice(0, 500), elements: [],
        layout: 'unknown', suggestions: [], rawAIResponse: rawText };
    }

    const result: ScreenAnalysisResult = {
      success: true,
      description: parsed.description || rawText.slice(0, 500),
      elements: Array.isArray(parsed.elements) ? parsed.elements.map((el: any) => ({
        type: el.type || 'other',
        label: el.label || '',
        boundingBox: {
          x: el.boundingBox?.x || 0, y: el.boundingBox?.y || 0,
          width: el.boundingBox?.width || 0, height: el.boundingBox?.height || 0,
        },
        confidence: el.confidence || 0.5,
        interactionHint: el.interactionHint,
      })) : [],
      layout: parsed.layout || 'unknown',
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      rawAIResponse: rawText,
    };

    analysisHistory.push({ timestamp: new Date().toISOString(),
      description: result.description.slice(0, 100),
      elementCount: result.elements.length });
    while (analysisHistory.length > 50) analysisHistory.shift();

    return result;
  } catch (err: any) {
    return { success: false, description: '', elements: [], layout: 'unknown',
      suggestions: [], error: `Lỗi phân tích màn hình: ${err.message}` };
  }
}

export function getScreenAnalysisHistory() { return [...analysisHistory]; }
export function clearScreenAnalysisHistory() { analysisHistory.length = 0; }


export interface ScreenElement {
  type: 'button' | 'input' | 'text' | 'image' | 'icon' | 'menu' | 'dialog' | 'other';
  label: string;
  boundingBox: { x: number; y: number; width: number; height: number; };
  confidence: number;
  interactionHint?: string;
}

const analysisHistory: Array<{ timestamp: string; description: string; elementCount: number; }> = [];