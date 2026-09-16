/**
 * glaciaVisionApi.ts
 * ═══════════════════════════════════════════════════════════════
 * Frontend SDK cho Glacia Computer Vision Engine
 * ─────────────────────────────────────────────────────────────
 * Giao tiếp với Doubao Vision API qua AI Gateway
 * + Screen Capture & Analysis (Computer Use)
 * ═══════════════════════════════════════════════════════════════
 */

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`Glacia Vision API error: HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export interface VisionAnalysisResult {
  success: boolean;
  description: string;
  labels?: string[];
  confidence?: number;
  durationMs: number;
  modelUsed: string;
  tokensUsed: number;
  error?: string;
}

export interface VisionAnalysisRequest {
  imageBase64: string;
  prompt?: string;
  model?: string;
}

// ── Screen Capture Types ──────────────────────────────────────

export interface ScreenCaptureResult {
  success: boolean;
  imageBase64: string;
  path: string;
  width: number;
  height: number;
  timestamp: string;
  error?: string;
}

export interface ScreenElement {
  type: 'button' | 'input' | 'text' | 'image' | 'icon' | 'menu' | 'dialog' | 'other';
  label: string;
  boundingBox: { x: number; y: number; width: number; height: number; };
  confidence: number;
  interactionHint?: string;
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

export interface ScreenCaptureAndAnalysisResult {
  success: boolean;
  capture: ScreenCaptureResult;
  analysis: ScreenAnalysisResult;
  error?: string;
}

// ── Original Vision API ───────────────────────────────────────

/**
 * Analyze an image using Glacia Vision Engine (Doubao Vision)
 */
export async function analyzeImage(
  payload: VisionAnalysisRequest
): Promise<VisionAnalysisResult> {
  const res = await apiRequest<{ success: boolean; result: VisionAnalysisResult }>(
    '/api/glacia/vision/analyze',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
  return res.result;
}

/**
 * Get vision analysis history
 */
export async function fetchVisionHistory(): Promise<VisionAnalysisResult[]> {
  const res = await apiRequest<{ success: boolean; history: VisionAnalysisResult[] }>(
    '/api/glacia/vision/history'
  );
  return res.history;
}

/**
 * Convert a File/Blob to base64 string
 */
export function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data:image/xxx;base64, prefix
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// ── Screen Capture API ────────────────────────────────────────

/**
 * Chụp màn hình Windows desktop
 */
export async function captureScreen(): Promise<ScreenCaptureResult> {
  const res = await apiRequest<{ success: boolean; result: ScreenCaptureResult }>(
    '/api/glacia/screen/capture',
    { method: 'POST' }
  );
  return res.result;
}

/**
 * Phân tích ảnh màn hình bằng AI Vision
 */
export async function analyzeScreenImage(
  imageBase64: string,
  prompt?: string
): Promise<ScreenAnalysisResult> {
  const res = await apiRequest<{ success: boolean; result: ScreenAnalysisResult }>(
    '/api/glacia/screen/analyze',
    {
      method: 'POST',
      body: JSON.stringify({ imageBase64, prompt }),
    }
  );
  return res.result;
}

/**
 * Chụp + phân tích màn hình 1 bước
 */
export async function captureAndAnalyzeScreen(
  prompt?: string
): Promise<ScreenCaptureAndAnalysisResult> {
  const res = await apiRequest<{ success: boolean; result?: ScreenCaptureAndAnalysisResult }>(
    '/api/glacia/screen/capture-and-analyze',
    {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }
  );
  // API trả về capture+analysis ở top level
  return {
    success: res.success,
    capture: (res as any).capture || { success: false, imageBase64: '', path: '', width: 0, height: 0, timestamp: '' },
    analysis: (res as any).analysis || { success: false, description: '', elements: [], layout: '', suggestions: [] },
    error: (res as any).error || (res as any).analysis?.error,
  };
}

/**
 * Lấy lịch sử phân tích màn hình
 */
export async function fetchScreenAnalysisHistory(): Promise<Array<{
  timestamp: string;
  description: string;
  elementCount: number;
}>> {
  const res = await apiRequest<{ success: boolean; history: any[] }>(
    '/api/glacia/screen/history'
  );
  return res.history;
}

/**
 * Xoá lịch sử phân tích màn hình
 */
export async function clearScreenAnalysisHistory(): Promise<boolean> {
  const res = await apiRequest<{ success: boolean }>(
    '/api/glacia/screen/history',
    { method: 'DELETE' }
  );
  return res.success;
}

// -- Computer Use API -----------------------------------------

export interface MouseMoveRequest { x: number; y: number; absolute?: boolean; }
export interface MouseClickRequest { button?: 'left' | 'right' | 'middle'; double?: boolean; x?: number; y?: number; }
export interface KeyboardTypeRequest { text: string; delayMs?: number; }
export interface KeyPressRequest { key: string; modifiers?: string[]; }
export interface ScrollRequest { amount: number; x?: number; y?: number; }

export interface ComputerActionResult {
  success: boolean;
  action: string;
  details?: string;
  error?: string;
  timestamp: string;
}

export async function computerMouseMove(params: MouseMoveRequest): Promise<ComputerActionResult> {
  const res = await apiRequest<{ success: boolean; result: ComputerActionResult }>(
    '/api/glacia/computer/mouse-move', { method: 'POST', body: JSON.stringify(params) });
  return res.result;
}

export async function computerMouseClick(params: MouseClickRequest): Promise<ComputerActionResult> {
  const res = await apiRequest<{ success: boolean; result: ComputerActionResult }>(
    '/api/glacia/computer/mouse-click', { method: 'POST', body: JSON.stringify(params) });
  return res.result;
}

export async function computerKeyboardType(params: KeyboardTypeRequest): Promise<ComputerActionResult> {
  const res = await apiRequest<{ success: boolean; result: ComputerActionResult }>(
    '/api/glacia/computer/keyboard-type', { method: 'POST', body: JSON.stringify(params) });
  return res.result;
}

export async function computerKeyPress(params: KeyPressRequest): Promise<ComputerActionResult> {
  const res = await apiRequest<{ success: boolean; result: ComputerActionResult }>(
    '/api/glacia/computer/key-press', { method: 'POST', body: JSON.stringify(params) });
  return res.result;
}

export async function computerScroll(params: ScrollRequest): Promise<ComputerActionResult> {
  const res = await apiRequest<{ success: boolean; result: ComputerActionResult }>(
    '/api/glacia/computer/scroll', { method: 'POST', body: JSON.stringify(params) });
  return res.result;
}

export async function fetchComputerActionHistory(): Promise<ComputerActionResult[]> {
  const res = await apiRequest<{ success: boolean; history: ComputerActionResult[] }>(
    '/api/glacia/computer/history');
  return res.history;
}

export async function clearComputerActionHistory(): Promise<boolean> {
  const res = await apiRequest<{ success: boolean }>(
    '/api/glacia/computer/history', { method: 'DELETE' });
  return res.success;
}
