/**
 * src/utils/glaciaWebAgentApi.ts
 * Frontend API client for Glacia Autonomous Web Agent & Competitor Spider
 */

export interface WebPageExtraction {
  url: string;
  title: string;
  description: string;
  headings: string[];
  mainText: string;
  tables: Array<{ headers: string[]; rows: string[][] }>;
  codeSnippets: string[];
  links: string[];
  extractedAt: string;
}

export interface WebResearchReport {
  id: string;
  topic: string;
  sourcesScraped: number;
  extractedPages: WebPageExtraction[];
  executiveSummary: string;
  keyFindings: string[];
  suggestedActions: string[];
  savedToMemory: boolean;
  createdAt: string;
}

export interface CompetitorChangeAlert {
  competitorName: string;
  url: string;
  changeType: 'pricing_shift' | 'feature_added' | 'positioning_change' | 'general';
  summary: string;
  details: string;
  detectedAt: string;
}

export async function runWebResearch(params: {
  topic: string;
  targetUrls?: string[];
  autoSaveToMemory?: boolean;
}): Promise<WebResearchReport> {
  const res = await fetch('/api/glacia/web-agent/research', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to run web research');
  }
  return data.report;
}

export async function fetchWebResearchReports(): Promise<WebResearchReport[]> {
  const res = await fetch('/api/glacia/web-agent/reports');
  const data = await res.json();
  return data.reports || [];
}

export async function fetchCompetitorAlerts(): Promise<CompetitorChangeAlert[]> {
  const res = await fetch('/api/glacia/web-agent/competitor-alerts');
  const data = await res.json();
  return data.alerts || [];
}

export async function trackCompetitorUrl(params: {
  competitorName: string;
  url: string;
  features?: string[];
  pricingSummary?: string;
}): Promise<{ snapshot: any; alert?: CompetitorChangeAlert }> {
  const res = await fetch('/api/glacia/web-agent/track-competitor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to track competitor');
  }
  return data.result;
}

// ── Gemini Deep Web & Grounding Types ──
export interface WebpageAnalysisResult {
  id: string;
  url: string;
  pageTitle: string;
  question: string;
  answer: string;
  answerWithCitations: string;
  sources: Array<{ title: string; url: string; snippet?: string }>;
  extractedHeadings: string[];
  extractedTables: Array<{ headers: string[]; rows: string[][] }>;
  charCountAnalyzed: number;
  modelUsed: string;
  mode: 'gemini_api_grounded' | 'gemini_webchat_stealth' | 'direct_extract';
  timestamp: string;
}

export interface StealthCadenceConfig {
  interactionMode: 'stealth_human' | 'voice_dictation' | 'fast_direct';
  baseWpm: number;
  typoRate: number;
  allowTypoCorrection: boolean;
  antiBotSafetyScore: number;
}

export async function inspectWebpageWithGemini(params: {
  url: string;
  question: string;
  enableSearchGrounding?: boolean;
  interactionMode?: 'stealth_human' | 'voice_dictation' | 'fast_direct';
  customInstructions?: string;
}): Promise<WebpageAnalysisResult> {
  const res = await fetch('/api/glacia/gemini/web-inspect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Không thể bóc tách trang web bằng Gemini');
  }
  return data.result;
}

export async function queryGeminiSearchGrounding(params: {
  query: string;
  domain?: string;
}): Promise<any> {
  const res = await fetch('/api/glacia/gemini/grounding-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Tra cứu Grounding thất bại');
  }
  return data.result;
}

export async function fetchStealthCadenceSettings(): Promise<StealthCadenceConfig> {
  const res = await fetch('/api/glacia/stealth-cadence/settings');
  const data = await res.json();
  return data.settings || {
    interactionMode: 'stealth_human',
    baseWpm: 60,
    typoRate: 0.018,
    allowTypoCorrection: true,
    antiBotSafetyScore: 99.8,
  };
}

export async function updateStealthCadenceSettings(
  config: Partial<StealthCadenceConfig>
): Promise<StealthCadenceConfig> {
  const res = await fetch('/api/glacia/stealth-cadence/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Cập nhật cài đặt gõ tàng hình thất bại');
  }
  return data.settings;
}

// ── Stealth Fingerprint Rotation API ─────────────────────────────────────

export async function getFingerprintRotationStats(): Promise<any> {
  const res = await fetch('/api/glacia/stealth/fingerprint/stats');
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Không lấy được stats fingerprint');
  return data;
}

export async function forceRotateFingerprint(platform?: string): Promise<any> {
  const res = await fetch('/api/glacia/stealth/fingerprint/rotate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platform }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Xoay fingerprint thất bại');
  return data.fingerprint;
}

export async function detectPlatformFromUrlApi(url: string): Promise<{ platform: string; profile: any }> {
  const res = await fetch(`/api/glacia/stealth/detect-platform?url=${encodeURIComponent(url)}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return { platform: data.platform, profile: data.profile };
}

// ── Glacia cross-system web automation control ────────────────────────────

async function readGlaciaResponse(res: Response): Promise<any> {
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Glacia web automation request failed');
  return data;
}

export async function fetchGlaciaWebEcosystemStatus(): Promise<any> {
  return readGlaciaResponse(await fetch('/api/glacia/ecosystem/status'));
}

export async function planGlaciaWebAutomation(params: {
  targetUrl: string;
  forceMode?: 'api_direct' | 'stealth_human' | 'voice_dictation' | 'fast_direct' | 'offline';
  preferVoiceDictation?: boolean;
}): Promise<any> {
  return readGlaciaResponse(await fetch('/api/glacia/ecosystem/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  }));
}

export async function prepareGlaciaStealthSession(url: string): Promise<any> {
  return readGlaciaResponse(await fetch('/api/glacia/ecosystem/prepare-stealth-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  }));
}

// ── Batch URL Inspector API ───────────────────────────────────────────────

export async function batchInspectUrls(params: {
  urls: string[];
  question: string;
  maxConcurrent?: number;
  includeComparison?: boolean;
}): Promise<any> {
  const res = await fetch('/api/glacia/batch-inspect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Batch inspect thất bại');
  return data.result;
}

// ── YouTube Transcript Bridge API ─────────────────────────────────────────

export async function analyzeYouTubeVideo(params: {
  url: string;
  question: string;
  customInstructions?: string;
}): Promise<any> {
  const res = await fetch('/api/glacia/youtube/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Phân tích YouTube thất bại');
  return data.result;
}

export async function fetchYouTubeTranscriptApi(url: string): Promise<any> {
  const res = await fetch('/api/glacia/youtube/transcript', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Lấy transcript YouTube thất bại');
  return data.meta;
}

// ── Web Monitor Scheduler API ─────────────────────────────────────────────

export async function listWebMonitorJobs(): Promise<any[]> {
  const res = await fetch('/api/glacia/web-monitor/jobs');
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.jobs;
}

export async function createWebMonitorJob(params: {
  url: string;
  label?: string;
  question: string;
  frequency?: 'hourly' | 'every_6h' | 'daily' | 'weekly';
  telegramChatId?: string;
}): Promise<any> {
  const res = await fetch('/api/glacia/web-monitor/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Tạo job monitor thất bại');
  return data.job;
}

export async function deleteWebMonitorJob(id: string): Promise<void> {
  await fetch(`/api/glacia/web-monitor/jobs/${id}`, { method: 'DELETE' });
}

export async function listWebMonitorAlerts(): Promise<any[]> {
  const res = await fetch('/api/glacia/web-monitor/alerts');
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.alerts;
}

export async function triggerWebMonitorTick(): Promise<any> {
  const res = await fetch('/api/glacia/web-monitor/tick', { method: 'POST' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.results;
}
