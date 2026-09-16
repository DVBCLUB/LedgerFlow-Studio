/**
 * glaciaBatchUrlInspector.ts
 * ============================================================================
 * GLACIA BATCH URL INSPECTOR — LEVEL 2.1
 * ============================================================================
 * Công cụ nghiên cứu đa URL:
 * 1. Nhập 1 danh sách URL (3-50 URLs)
 * 2. Crawl song song với concurrency limit (mặc định 3)
 * 3. Extract nội dung mỗi trang (fetchCleanWebpage từ glaciaGeminiDeepWebBridge)
 * 4. Tổng hợp toàn bộ nội dung → gửi qua Gemini via callAIWithFallback
 * 5. Trả về 1 báo cáo DUY NHẤT có so sánh, phân loại, highlight
 * ============================================================================
 */

import path from 'node:path';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import {
  fetchCleanWebpage,
} from './glaciaGeminiDeepWebBridge.ts';
import type { WebPageExtraction } from './glaciaWebAgent.ts';
import { callAIWithFallback } from './aiRouter.ts';
import type { ChatMessage } from './aiClient.ts';

// ─── Types ──────────────────────────────────────────────────────────────────

export type BatchUrlStatus =
  | 'queued'
  | 'fetching'
  | 'success'
  | 'extract_failed'
  | 'fetch_error'
  | 'skipped_duplicate';

export interface BatchUrlEntry {
  id: string;
  url: string;
  userLabel?: string;
  status: BatchUrlStatus;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  page?: WebPageExtraction;
  error?: string;
  keywordsHit?: string[];
  summary?: string;
}

export interface BatchInspectionReport {
  id: string;
  createdAt: string;
  finishedAt?: string;
  urlsCount: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  totalPagesChars: number;
  overarchingQuestion: string;
  entries: BatchUrlEntry[];
  geminiSynthesis?: string;
  geminiKeyHighlights?: string[];
  geminiComparisonTable?: string;
  promptCharsEstimate?: number;
  outputCharsEstimate?: number;
  durationMs?: number;
}

export interface BatchInspectionOptions {
  concurrency?: number;
  perPageTimeoutMs?: number;
  keywordsToHighlight?: string[];
  summarizePerPage?: boolean;
  enableCache?: boolean;
}

// ─── Cache ──────────────────────────────────────────────────────────────────

interface FetchCacheEntry {
  url: string;
  cachedAt: string;
  page: WebPageExtraction;
}
const CACHE_DIR = path.join(process.cwd(), 'runtime', 'batch_inspect_cache');
const REPORT_DIR = path.join(process.cwd(), 'runtime', 'batch_inspect_reports');

function ensureDirs() {
  for (const d of [CACHE_DIR, REPORT_DIR]) if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function cachePathForUrl(url: string) {
  ensureDirs();
  const hash = Buffer.from(url, 'utf-8').toString('base64url');
  return path.join(CACHE_DIR, `${hash.slice(0, 24)}.json`);
}

function getCachedFetch(url: string, maxAgeMs = 24 * 60 * 60 * 1000): WebPageExtraction | null {
  try {
    const p = cachePathForUrl(url);
    if (!fs.existsSync(p)) return null;
    const raw = JSON.parse(fs.readFileSync(p, 'utf-8')) as FetchCacheEntry;
    if (Date.now() - new Date(raw.cachedAt).getTime() > maxAgeMs) return null;
    return raw.page;
  } catch {
    return null;
  }
}

function setCachedFetch(url: string, page: WebPageExtraction) {
  try {
    const p = cachePathForUrl(url);
    const entry: FetchCacheEntry = { url, cachedAt: new Date().toISOString(), page };
    fs.writeFileSync(p, JSON.stringify(entry), 'utf-8');
  } catch { /* ignore */ }
}

// ─── Helpers to use callAIWithFallback with prompt string ──────────────────

async function aiCall(prompt: string, opts: { task?: any; maxTokens?: number; temperature?: number } = {}): Promise<{ text: string; content: string }> {
  const messages: ChatMessage[] = [{ role: 'user', content: prompt }];
  const res = await callAIWithFallback(messages, {
    task: opts.task || 'analytics',
    maxTokens: opts.maxTokens,
    temperature: opts.temperature,
  });
  return { text: res.content || res.text || '', content: res.content || res.text || '' };
}

// ─── Per-page summary ──────────────────────────────────────────────────────

async function summarizeSinglePage(page: WebPageExtraction, keywords: string[]): Promise<string> {
  const text = page.mainText || '';
  const prompt = `Tóm tắt nội dung trang web này trong VỊTÍNH NHẤT CÓ THỂ (một đoạn 2-3 câu, tối đa 80 từ).
URL: ${page.url}
Title: ${page.title}
Nội dung trang: ${text.slice(0, 4000)}
${keywords.length > 0 ? `Keywords quan trọng cần nhấn mạnh nếu có: ${keywords.join(', ')}` : ''}
Chỉ trả về đoạn tóm tắt, KHÔNG thêm markdown hay intro.`;
  try {
    const r = await aiCall(prompt, { maxTokens: 180, temperature: 0.2 });
    return r.text.trim().slice(0, 300);
  } catch {
    return `${page.title || 'Page'} — ${text.slice(0, 200).replace(/\s+/g, ' ')}…`;
  }
}

// ─── Core: Single URL fetcher entry ─────────────────────────────────────────

async function processOneEntry(entry: BatchUrlEntry, opts: Required<BatchInspectionOptions>): Promise<BatchUrlEntry> {
  entry.startedAt = new Date().toISOString();
  entry.status = 'fetching';
  const t0 = Date.now();
  try {
    let page: WebPageExtraction | null = null;
    if (opts.enableCache) page = getCachedFetch(entry.url);

    if (!page) {
      // fetchCleanWebpage only takes url, no options; apply timeout via Promise.race
      page = await Promise.race<WebPageExtraction>([
        fetchCleanWebpage(entry.url),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Fetch timeout')), opts.perPageTimeoutMs)),
      ]);
      if (page && opts.enableCache) setCachedFetch(entry.url, page);
    }

    entry.page = page;
    const text = page.mainText || '';
    entry.status = text.length > 0 ? 'success' : 'extract_failed';
    const content = text.toLowerCase();
    entry.keywordsHit = opts.keywordsToHighlight.filter((k) => content.includes(k.toLowerCase()));

    if (opts.summarizePerPage && entry.status === 'success') {
      entry.summary = await summarizeSinglePage(page, opts.keywordsToHighlight);
    }
  } catch (e: any) {
    entry.status = 'fetch_error';
    entry.error = e.message || String(e);
  } finally {
    entry.finishedAt = new Date().toISOString();
    entry.durationMs = Date.now() - t0;
  }
  return entry;
}

// ─── Concurrency primitive (tự implement) ──────────────────────────────────

async function runWithConcurrencyLimit<T, U>(
  items: T[],
  worker: (item: T) => Promise<U>,
  concurrency: number
): Promise<U[]> {
  const results: U[] = new Array(items.length);
  let next = 0;
  const running = new Set<Promise<void>>();

  async function spawn() {
    while (next < items.length && running.size < concurrency) {
      const idx = next++;
      const item = items[idx];
      const p = (async () => {
        results[idx] = await worker(item);
      })().finally(() => { running.delete(p); });
      running.add(p);
    }
    if (running.size > 0) {
      await Promise.race(running);
      return spawn();
    }
  }
  await spawn();
  return results;
}

// ─── Report Synthesis (Gemini tổng hợp) ─────────────────────────────────────

async function synthesizeReportWithGemini(
  entries: BatchUrlEntry[],
  overarchingQuestion: string
): Promise<{ synthesis: string; highlights: string[]; table: string; outputChars: number }> {
  const success = entries.filter((e) => e.status === 'success');
  const sources = success.map((e, i) => {
    const body = e.summary || (e.page?.mainText || '').slice(0, 2200);
    return `[NGUỒN ${i + 1}] — URL: ${e.url}
Title: ${e.page?.title || '(no title)'}
Keywords hit: ${(e.keywordsHit || []).join(', ') || '(none)'}
--- TÓM TẮT / TRÍCH DẪN NỘI DUNG ---
${body}
--- KẾT THÚC NGUỒN ${i + 1} ---`;
  }).join('\n\n');

  const prompt = `Bạn là Glacia, nhà nghiên cứu chiến lược của LedgerFlow Studio.
Câu hỏi tổng quan của Founder:
"${overarchingQuestion}"

Dưới đây là ${success.length} nguồn dữ liệu đã được crawl. Hãy tổng hợp một báo cáo DUY NHẤT CHUẨN CEO-BRIEFING:

${sources.slice(0, 24000)}

⚠️ NGUYÊN TẮC BÁO CÁO:
1. **Synthesis (5-8 đoạn):** trả lời trực tiếp câu hỏi tổng quan, nối các nguồn, điểm giống & khác.
2. **10 Điểm nổi bật nhất (bullet list):** tóm gọn 10 thông tin quan trọng nhất.
3. **Bảng so sánh (markdown table):** columns = Nguồn | Tóm tắt chính | Điểm mạnh | Điểm yếu | Keywords trùng khớp.
Sử dụng dấu hiệu **[NGUỒN x]** trong text để trích dẫn nguồn.
Bằng tiếng Việt, chính xác, ngắn gọn, có trọng tâm.

Cấu trúc:
# SYNTHESIS
...đại cương trả lời câu hỏi...

# 10 ĐIỂM NỔI BẬT
- ...

# BẢNG SO SÁNH
| Nguồn | ... |
|---|---|
`;

  const r = await aiCall(prompt, { maxTokens: 4000, temperature: 0.3 });
  const synthesis = r.text;
  const lines = synthesis.split('\n');

  const highlights: string[] = [];
  let inHl = false;
  for (const l of lines) {
    if (/10\s*(điểm|points?)\s*(nổi bật|key|highlight)/i.test(l)) { inHl = true; continue; }
    if (inHl && /^#/.test(l)) { inHl = false; }
    if (inHl) {
      const bullet = l.replace(/^[-*•]\s*/, '').trim();
      if (bullet.length > 5) highlights.push(bullet);
    }
  }

  let table = '';
  let inTable = false;
  for (const l of lines) {
    if (/\bso sánh|comparison|table\b/i.test(l) && /^#/.test(l)) { inTable = true; continue; }
    if (inTable) {
      if (l.startsWith('|') || l.trim() === '') table += l + '\n';
      else if (l.trim() && !l.startsWith('|')) inTable = false;
    }
  }

  return {
    synthesis,
    highlights: highlights.slice(0, 15),
    table: table.trim(),
    outputChars: synthesis.length,
  };
}

// ─── Entry: Main API function ───────────────────────────────────────────────

export async function batchInspectUrls(
  urls: string[],
  overarchingQuestion = 'Tổng hợp và phân tích các nguồn này, highlight thông tin quan trọng.',
  options: BatchInspectionOptions = {}
): Promise<BatchInspectionReport> {
  const opts: Required<BatchInspectionOptions> = {
    concurrency: options.concurrency ?? 3,
    perPageTimeoutMs: options.perPageTimeoutMs ?? 20_000,
    keywordsToHighlight: options.keywordsToHighlight ?? [],
    summarizePerPage: options.summarizePerPage ?? true,
    enableCache: options.enableCache ?? true,
  };

  const report: BatchInspectionReport = {
    id: `batch_${Date.now().toString(36)}_${randomUUID().slice(0, 6)}`,
    createdAt: new Date().toISOString(),
    urlsCount: urls.length,
    successCount: 0,
    failedCount: 0,
    skippedCount: 0,
    totalPagesChars: 0,
    overarchingQuestion,
    entries: [],
  };

  const t0 = Date.now();

  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const u of urls) {
    const trimmed = u.trim();
    if (!trimmed || !/^https?:\/\//i.test(trimmed)) continue;
    if (seen.has(trimmed.toLowerCase())) {
      report.skippedCount += 1;
    } else {
      seen.add(trimmed.toLowerCase());
      deduped.push(trimmed);
    }
  }

  const entries: BatchUrlEntry[] = deduped.map((url) => ({
    id: `u_${randomUUID().slice(0, 8)}`,
    url,
    status: 'queued',
  }));
  report.entries = entries;

  await runWithConcurrencyLimit(
    entries,
    (entry) => processOneEntry(entry, opts),
    Math.max(1, Math.min(10, opts.concurrency))
  );

  for (const e of entries) {
    if (e.status === 'success') report.successCount += 1;
    else report.failedCount += 1;
    report.totalPagesChars += (e.page?.mainText || '').length;
  }

  if (report.successCount > 0) {
    try {
      const synth = await synthesizeReportWithGemini(entries, overarchingQuestion);
      report.geminiSynthesis = synth.synthesis;
      report.geminiKeyHighlights = synth.highlights;
      report.geminiComparisonTable = synth.table;
      report.outputCharsEstimate = synth.outputChars;
    } catch (e: any) {
      console.warn('[BatchInspect] Synthesis failed:', e.message);
      report.geminiSynthesis = `❌ Tổng hợp Gemini thất bại: ${e.message}`;
    }
  } else {
    report.geminiSynthesis = '⚠️ Không có URL nào crawl thành công, không thể tổng hợp.';
  }

  report.finishedAt = new Date().toISOString();
  report.durationMs = Date.now() - t0;
  report.promptCharsEstimate = report.totalPagesChars;

  ensureDirs();
  try {
    const fp = path.join(REPORT_DIR, `${report.id}.json`);
    fs.writeFileSync(fp, JSON.stringify(report, null, 2), 'utf-8');
  } catch { /* ignore */ }

  return report;
}

// ─── Helpers (dashboard) ────────────────────────────────────────────────────

export function listRecentBatchReports(limit = 15): Array<Partial<BatchInspectionReport>> {
  ensureDirs();
  try {
    const files = fs.readdirSync(REPORT_DIR)
      .filter((f) => f.startsWith('batch_') && f.endsWith('.json'))
      .sort()
      .reverse()
      .slice(0, limit);
    const out: Array<Partial<BatchInspectionReport>> = [];
    for (const f of files) {
      try {
        const raw = JSON.parse(fs.readFileSync(path.join(REPORT_DIR, f), 'utf-8'));
        out.push({
          id: raw.id,
          createdAt: raw.createdAt,
          finishedAt: raw.finishedAt,
          urlsCount: raw.urlsCount,
          successCount: raw.successCount,
          failedCount: raw.failedCount,
          skippedCount: raw.skippedCount,
          totalPagesChars: raw.totalPagesChars,
          overarchingQuestion: raw.overarchingQuestion,
          geminiKeyHighlights: raw.geminiKeyHighlights,
          durationMs: raw.durationMs,
        });
      } catch {}
    }
    return out;
  } catch { return []; }
}
