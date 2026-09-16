/**
 * glaciaBatchWebInspector.ts
 * ============================================================================
 * GLACIA BATCH URL INSPECTOR — Parallel Multi-URL Research Engine
 * ============================================================================
 * Cho phép Glacia:
 * 1. Nhận danh sách nhiều URL cùng lúc (tối đa 20 URL/batch).
 * 2. Crawl song song, lấy dữ liệu sạch từng trang (dùng glaciaGeminiDeepWebBridge).
 * 3. Tổng hợp nội dung tất cả URL vào một báo cáo duy nhất qua Gemini.
 * 4. Xuất báo cáo dạng markdown với so sánh cross-URL, citations, bảng tổng hợp.
 * ============================================================================
 */

import { randomUUID } from 'node:crypto';
import { callAI, type ChatMessage } from './aiClient.ts';
import { fetchCleanWebpage } from './glaciaGeminiDeepWebBridge.ts';

export interface BatchInspectRequest {
  urls: string[];
  question: string;
  maxConcurrent?: number; // default 4
  includeComparison?: boolean; // generate cross-URL comparison table
  outputFormat?: 'markdown' | 'json' | 'summary';
}

export interface SingleUrlResult {
  url: string;
  pageTitle: string;
  status: 'success' | 'error';
  error?: string;
  contentPreview: string;   // First 2000 chars
  charCount: number;
  headings: string[];
}

export interface BatchInspectResult {
  id: string;
  question: string;
  urlCount: number;
  successCount: number;
  failCount: number;
  individualResults: SingleUrlResult[];
  synthesizedReport: string;      // Full Gemini synthesis
  keyFindingsPerUrl: Array<{ url: string; keyFinding: string }>;
  comparisonTable?: string;       // Markdown table comparing all URLs
  consensusAnswer: string;        // Common answer across all URLs
  contradictions: string[];       // Points where sources disagree
  timestamp: string;
  processingMs: number;
}

// ── Parallel Fetch with concurrency control ────────────────────────────────

async function fetchWithConcurrency<T>(
  items: string[],
  fn: (item: string) => Promise<T>,
  maxConcurrent: number
): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < items.length; i += maxConcurrent) {
    const batch = items.slice(i, i + maxConcurrent);
    const batchResults = await Promise.allSettled(batch.map(fn));
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push(result.reason as T);
      }
    }
  }
  return results;
}

// ── Individual URL fetch ───────────────────────────────────────────────────

async function fetchSingleUrl(url: string): Promise<SingleUrlResult> {
  try {
    const extracted = await fetchCleanWebpage(url);
    return {
      url,
      pageTitle: extracted.title,
      status: 'success',
      contentPreview: extracted.cleanText.slice(0, 2000),
      charCount: extracted.cleanText.length,
      headings: extracted.headings,
    };
  } catch (err) {
    return {
      url,
      pageTitle: 'Fetch failed',
      status: 'error',
      error: String(err),
      contentPreview: '',
      charCount: 0,
      headings: [],
    };
  }
}

// ── Multi-URL Gemini synthesis ─────────────────────────────────────────────

async function synthesizeMultipleUrls(
  urlResults: SingleUrlResult[],
  question: string,
  includeComparison: boolean
): Promise<{
  synthesizedReport: string;
  keyFindingsPerUrl: Array<{ url: string; keyFinding: string }>;
  comparisonTable?: string;
  consensusAnswer: string;
  contradictions: string[];
}> {
  const successfulResults = urlResults.filter(r => r.status === 'success');

  if (successfulResults.length === 0) {
    return {
      synthesizedReport: 'Không thể lấy dữ liệu từ bất kỳ URL nào.',
      keyFindingsPerUrl: [],
      consensusAnswer: 'Không có dữ liệu.',
      contradictions: [],
    };
  }

  // Build context block
  const contextBlocks = successfulResults.map((r, i) => `
## NGUỒN ${i + 1}: ${r.pageTitle}
URL: ${r.url}
Tiêu đề: ${r.headings.slice(0, 5).join(' | ')}
Nội dung (${r.charCount} ký tự):
${r.contentPreview}
`).join('\n---\n');

  const systemPrompt = `Bạn là Glacia — chuyên gia tổng hợp nghiên cứu đa nguồn. Bạn đọc nội dung từ ${successfulResults.length} trang web khác nhau và tổng hợp báo cáo toàn diện.

Nguyên tắc:
- Chỉ dùng thông tin từ các nguồn được cung cấp, không hallucinate.
- Trích dẫn tên trang/URL khi đề cập thông tin cụ thể.
- Xác định điểm đồng thuận và điểm mâu thuẫn giữa các nguồn.
- Tạo bảng so sánh (markdown table) nếu được yêu cầu.`;

  const userMsg = `DỮ LIỆU TỪ ${successfulResults.length} TRANG WEB:

${contextBlocks}

---
CÂU HỎI: ${question}

Trả lời theo JSON:
{
  "synthesizedReport": "Báo cáo tổng hợp đầy đủ dạng markdown",
  "keyFindingsPerUrl": [{"url": "...", "keyFinding": "Phát hiện chính từ nguồn này"}],
  "comparisonTable": "${includeComparison ? 'Bảng markdown so sánh các nguồn' : ''}",
  "consensusAnswer": "Câu trả lời đồng thuận từ tất cả nguồn",
  "contradictions": ["Điểm mâu thuẫn 1", "Điểm mâu thuẫn 2"]
}`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMsg },
  ];

  try {
    const raw = await callAI(messages, { taskType: 'analysis', maxTokens: 6000 });
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        synthesizedReport: parsed.synthesizedReport ?? raw,
        keyFindingsPerUrl: parsed.keyFindingsPerUrl ?? [],
        comparisonTable: parsed.comparisonTable,
        consensusAnswer: parsed.consensusAnswer ?? '',
        contradictions: parsed.contradictions ?? [],
      };
    }
    return {
      synthesizedReport: raw,
      keyFindingsPerUrl: [],
      consensusAnswer: raw.slice(0, 500),
      contradictions: [],
    };
  } catch (err) {
    return {
      synthesizedReport: `Lỗi tổng hợp: ${String(err)}`,
      keyFindingsPerUrl: [],
      consensusAnswer: '',
      contradictions: [],
    };
  }
}

// ── Main Export ────────────────────────────────────────────────────────────

export async function batchInspectUrls(request: BatchInspectRequest): Promise<BatchInspectResult> {
  const {
    urls,
    question,
    maxConcurrent = 4,
    includeComparison = true,
    outputFormat = 'markdown',
  } = request;

  if (urls.length === 0) throw new Error('Phải cung cấp ít nhất 1 URL');
  if (urls.length > 20) throw new Error('Tối đa 20 URL mỗi batch');

  const startMs = Date.now();

  // Fetch all URLs in parallel (with concurrency limit)
  const fetchResults = await fetchWithConcurrency(
    urls,
    fetchSingleUrl,
    maxConcurrent
  );

  const successCount = fetchResults.filter(r => r.status === 'success').length;
  const failCount = fetchResults.filter(r => r.status === 'error').length;

  // Synthesize with Gemini
  const synthesis = await synthesizeMultipleUrls(fetchResults, question, includeComparison);

  return {
    id: randomUUID(),
    question,
    urlCount: urls.length,
    successCount,
    failCount,
    individualResults: fetchResults,
    synthesizedReport: synthesis.synthesizedReport,
    keyFindingsPerUrl: synthesis.keyFindingsPerUrl,
    comparisonTable: synthesis.comparisonTable,
    consensusAnswer: synthesis.consensusAnswer,
    contradictions: synthesis.contradictions,
    timestamp: new Date().toISOString(),
    processingMs: Date.now() - startMs,
  };
}
