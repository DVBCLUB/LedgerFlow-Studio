/**
 * assetFoundryApi.ts
 * Typed frontend client for the Multi-Modal Asset Foundry endpoints.
 */

export interface AssetRecord {
  cid: string;
  kind: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  filePath?: string;
  remoteUrl?: string;
  dependsOn: string[];
  provenance: Record<string, unknown>;
  createdAt: string;
}

export interface ImageGenResult {
  ok: boolean;
  status: 'completed' | 'no_provider' | 'failed';
  cid?: string;
  remoteUrl?: string;
  filePath?: string;
  provider?: string;
  model?: string;
  error?: string;
}

export interface SpeechResult {
  ok: boolean;
  status: 'completed' | 'no_provider' | 'failed';
  cid?: string;
  filePath?: string;
  provider?: string;
  voice?: string;
  error?: string;
}

export interface VideoJob {
  jobId: string;
  provider: string;
  providerTaskId: string;
  status: 'submitted' | 'processing' | 'completed' | 'failed';
  prompt: string;
  videoUrl?: string;
  assetCid?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RenderResult {
  ok: boolean;
  status: 'completed' | 'ffmpeg_missing' | 'failed';
  cid?: string;
  filePath?: string;
  outputName?: string;
  error?: string;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'content-type': 'application/json' },
    ...options,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((json as any)?.error || `HTTP ${res.status}`);
  }
  return json as T;
}

export function getAssetFoundryStats() {
  return request<{ success: boolean; stats: { totalAssets: number; totalBytes: number; byKind: Record<string, number> } }>('/api/asset-foundry/stats');
}

export function listFoundryAssets(kind?: string) {
  const q = kind ? `?kind=${encodeURIComponent(kind)}` : '';
  return request<{ success: boolean; assets: AssetRecord[] }>(`/api/asset-foundry/assets${q}`);
}

export function getFfmpegStatus() {
  return request<{ success: boolean; ffmpeg: { available: boolean; path: string | null } }>('/api/asset-foundry/ffmpeg');
}

export function generateFoundryImage(payload: Record<string, unknown>) {
  return request<ImageGenResult>('/api/asset-foundry/image', { method: 'POST', body: JSON.stringify(payload) });
}

export function synthesizeFoundrySpeech(payload: Record<string, unknown>) {
  return request<SpeechResult>('/api/asset-foundry/tts', { method: 'POST', body: JSON.stringify(payload) });
}

export function submitFoundryVideo(payload: Record<string, unknown>) {
  return request<{ ok: boolean; status: string; job?: VideoJob; error?: string }>('/api/asset-foundry/video/submit', { method: 'POST', body: JSON.stringify(payload) });
}

export function pollFoundryVideo(jobId: string) {
  return request<{ ok: boolean; status: string; job?: VideoJob; error?: string }>('/api/asset-foundry/video/poll', { method: 'POST', body: JSON.stringify({ jobId }) });
}

export function renderFoundryVideo(payload: Record<string, unknown>) {
  return request<RenderResult>('/api/asset-foundry/render', { method: 'POST', body: JSON.stringify(payload) });
}

export function captureFoundryFrames(payload: Record<string, unknown>) {
  return request<{ ok: boolean; status: string; frameCids: string[]; count: number; error?: string }>('/api/asset-foundry/capture', { method: 'POST', body: JSON.stringify(payload) });
}

export interface PublishRecord {
  id: string;
  channel: string;
  assetCid: string;
  title: string;
  status: 'requested' | 'published' | 'failed';
  url?: string;
  error?: string;
  createdAt: string;
}

export function publishFoundryAsset(payload: Record<string, unknown>) {
  return request<{ ok: boolean; status: string; record?: PublishRecord; error?: string }>('/api/asset-foundry/publish', { method: 'POST', body: JSON.stringify(payload) });
}

export function listFoundryPublishes() {
  return request<{ success: boolean; publishes: PublishRecord[] }>('/api/asset-foundry/publishes');
}

export function generateFoundryVietQr(payload: Record<string, unknown>) {
  return request<{ ok: boolean; url: string; accountNo: string; bankCode: string }>('/api/asset-foundry/vietqr', { method: 'POST', body: JSON.stringify(payload) });
}

export function generateFoundryStripeLink(payload: Record<string, unknown>) {
  return request<{ ok: boolean; status: string; url?: string; error?: string }>('/api/asset-foundry/stripe-link', { method: 'POST', body: JSON.stringify(payload) });
}

export function issueFoundryLicense(payload: Record<string, unknown>) {
  return request<{ ok: boolean; licenseKey: string; assetCid: string }>('/api/asset-foundry/license', { method: 'POST', body: JSON.stringify(payload) });
}

export function buildFoundrySource(payload: Record<string, unknown>) {
  return request<{ ok: boolean; status: string; cid?: string; filePath?: string; bytes?: number; error?: string }>('/api/asset-foundry/build', { method: 'POST', body: JSON.stringify(payload) });
}

export function packageFoundryRelease(payload: Record<string, unknown>) {
  return request<{ ok: boolean; status: string; cid?: string; dirPath?: string; error?: string }>('/api/asset-foundry/build/package', { method: 'POST', body: JSON.stringify(payload) });
}

export function computeFoundryChecksum(cid: string) {
  return request<{ ok: boolean; checksum?: string; error?: string }>('/api/asset-foundry/checksum', { method: 'POST', body: JSON.stringify({ cid }) });
}

export function signFoundryAsset(cid: string) {
  return request<{ ok: boolean; signature?: string; error?: string }>('/api/asset-foundry/sign', { method: 'POST', body: JSON.stringify({ cid }) });
}

export function verifyFoundryAsset(cid: string, signature: string) {
  return request<{ ok: boolean; valid: boolean; error?: string }>('/api/asset-foundry/verify', { method: 'POST', body: JSON.stringify({ cid, signature }) });
}

export function assetFileUrl(cid: string): string {
  return `/api/asset-foundry/assets/${encodeURIComponent(cid)}/file`;
}
