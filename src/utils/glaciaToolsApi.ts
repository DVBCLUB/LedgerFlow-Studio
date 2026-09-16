/**
 * src/utils/glaciaToolsApi.ts
 * Frontend Client SDK cho Glacia Software Tools (Blender, Video Factory, Design Engine).
 * Giao tiếp an toàn qua Backend API.
 */

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`Glacia Tools API error: HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

// ── Blender 3D Types & API ──
export interface BlenderStatus {
  available: boolean;
  executablePath: string | null;
  version: string | null;
  capabilities: string[];
}

export interface BlenderRenderResult {
  success: boolean;
  outputPath?: string;
  publicUrl?: string;
  exportPath?: string;
  pythonScriptUsed: string;
  renderDurationMs: number;
  message: string;
}

export async function fetchBlenderStatus(): Promise<BlenderStatus> {
  const res = await apiRequest<{ success: boolean; status: BlenderStatus }>('/api/glacia/tools/blender/status');
  return res.status;
}

export async function triggerBlenderRender(payload: {
  prompt: string;
  sceneType?: string;
  renderEngine?: 'EEVEE' | 'CYCLES';
  resolution?: { width: number; height: number };
  enableExport?: boolean;
}): Promise<BlenderRenderResult> {
  const res = await apiRequest<{ success: boolean; result: BlenderRenderResult }>('/api/glacia/tools/blender/render', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.result;
}

// ── Video Factory Types & API ──
export interface VideoFactoryStatus {
  available: boolean;
  ffmpegPath: string | null;
  version: string | null;
  features: string[];
}

export interface VideoRenderResult {
  success: boolean;
  outputPath?: string;
  publicUrl?: string;
  durationSeconds: number;
  renderDurationMs: number;
  storyboard?: Array<{
    sceneNumber: number;
    visualPrompt: string;
    voiceoverText: string;
    durationSeconds: number;
    cameraMovement?: string;
  }>;
  message: string;
}

export async function fetchVideoFactoryStatus(): Promise<VideoFactoryStatus> {
  const res = await apiRequest<{ success: boolean; status: VideoFactoryStatus }>('/api/glacia/tools/video/status');
  return res.status;
}

export async function triggerVideoGenerate(payload: {
  title: string;
  script: string;
  aspectRatio?: '9:16' | '16:9' | '1:1';
  theme?: string;
  durationSeconds?: number;
  backgroundMusicStyle?: string;
}): Promise<VideoRenderResult> {
  const res = await apiRequest<{ success: boolean; result: VideoRenderResult }>('/api/glacia/tools/video/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.result;
}

// ── Design Engine Types & API ──
export interface BannerDesignResult {
  success: boolean;
  svgContent: string;
  outputPath: string;
  publicUrl?: string;
  dimensions: { width: number; height: number };
  message: string;
}

export async function triggerBannerGenerate(payload: {
  headline: string;
  subheadline?: string;
  theme?: string;
  size?: string;
  badge?: string;
  metrics?: Array<{ label: string; value: string }>;
}): Promise<BannerDesignResult> {
  const res = await apiRequest<{ success: boolean; result: BannerDesignResult }>('/api/glacia/tools/design/banner', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.result;
}
