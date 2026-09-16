/**
 * glaciaWebAgent.ts
 * ============================================================
 * Glacia Autonomous Web Agent & Competitive Spider
 * ------------------------------------------------------------
 * Tác tử Web tự trị cho phép Glacia:
 * 1. Tự động thu thập và bóc tách dữ liệu từ nhiều trang web
 * 2. Theo dõi đối thủ cạnh tranh & biến động thị trường
 * 3. Tự động chuyển đổi kiến thức thu thập được vào Memory Vault
 * 4. Không phụ thuộc thư viện ngoài độc quyền
 * ============================================================
 */

import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

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

export interface CompetitorSnapshot {
  id: string;
  competitorName: string;
  url: string;
  title: string;
  pricingSummary?: string;
  features: string[];
  rawTextSnippet: string;
  snapshotAt: string;
}

export interface CompetitorChangeAlert {
  competitorName: string;
  url: string;
  changeType: 'pricing_shift' | 'feature_added' | 'positioning_change' | 'general';
  summary: string;
  details: string;
  detectedAt: string;
}

const RUNTIME_DIR = path.resolve(process.cwd(), 'runtime');
const WEB_AGENT_DATA_FILE = path.join(RUNTIME_DIR, 'glacia_web_agent_data.json');

interface WebAgentStore {
  reports: WebResearchReport[];
  competitorSnapshots: Record<string, CompetitorSnapshot[]>;
  changeAlerts: CompetitorChangeAlert[];
}

function ensureStore(): WebAgentStore {
  if (!fs.existsSync(RUNTIME_DIR)) {
    fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  }
  if (!fs.existsSync(WEB_AGENT_DATA_FILE)) {
    const init: WebAgentStore = {
      reports: [],
      competitorSnapshots: {},
      changeAlerts: [],
    };
    fs.writeFileSync(WEB_AGENT_DATA_FILE, JSON.stringify(init, null, 2), 'utf8');
    return init;
  }
  try {
    return JSON.parse(fs.readFileSync(WEB_AGENT_DATA_FILE, 'utf8'));
  } catch {
    return { reports: [], competitorSnapshots: {}, changeAlerts: [] };
  }
}

function saveStore(store: WebAgentStore): void {
  ensureStore();
  fs.writeFileSync(WEB_AGENT_DATA_FILE, JSON.stringify(store, null, 2), 'utf8');
}

/**
 * Bóc tách nội dung HTML thành dữ liệu có cấu trúc
 */
export function parseHtmlContent(url: string, html: string): WebPageExtraction {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : url;

  // Extract meta description
  const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const description = metaMatch ? metaMatch[1].trim() : '';

  // Extract headings (h1, h2, h3)
  const headings: string[] = [];
  const headingRegex = /<h[1-3][^>]*>([^<]+)<\/h[1-3]>/gi;
  let match;
  while ((match = headingRegex.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, '').trim();
    if (text && !headings.includes(text)) {
      headings.push(text);
    }
  }

  // Extract code snippets
  const codeSnippets: string[] = [];
  const codeRegex = /<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi;
  while ((match = codeRegex.exec(html)) !== null) {
    const cleanCode = match[1]
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/<[^>]+>/g, '')
      .trim();
    if (cleanCode) codeSnippets.push(cleanCode);
  }

  // Clean main text
  const cleanBody = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Extract links
  const links: string[] = [];
  const linkRegex = /href=["'](https?:\/\/[^"']+)["']/gi;
  while ((match = linkRegex.exec(html)) !== null) {
    if (!links.includes(match[1])) {
      links.push(match[1]);
    }
  }

  return {
    url,
    title,
    description,
    headings: headings.slice(0, 15),
    mainText: cleanBody.slice(0, 5000),
    tables: [],
    codeSnippets: codeSnippets.slice(0, 10),
    links: links.slice(0, 20),
    extractedAt: new Date().toISOString(),
  };
}

/**
 * Thu thập và trích xuất dữ liệu từ một URL
 */
export async function fetchAndExtractWebPage(url: string): Promise<WebPageExtraction> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) LedgerFlow-Glacia-Spider/2.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    return parseHtmlContent(url, html);
  } catch (err: any) {
    // Fallback graceful extraction
    return {
      url,
      title: `Page from ${url}`,
      description: `Glacia crawler fallback for ${url}: ${err.message}`,
      headings: ['Trang không thể tải trực tiếp'],
      mainText: `Khong the ket noi URL ${url}: ${err.message}. He thong se dung du lieu cache hoac mo phong.`,
      tables: [],
      codeSnippets: [],
      links: [],
      extractedAt: new Date().toISOString(),
    };
  }
}

/**
 * Thực hiện nghiên cứu tự trị theo chủ đề và tổng hợp báo cáo
 */
export async function runAutonomousWebResearch(params: {
  topic: string;
  targetUrls?: string[];
  autoSaveToMemory?: boolean;
}): Promise<WebResearchReport> {
  const store = ensureStore();
  const { topic, targetUrls = [], autoSaveToMemory = true } = params;

  const urlsToScrape = targetUrls.length > 0
    ? targetUrls
    : [
        `https://docs.ledgerflow.example/topics/${encodeURIComponent(topic)}`,
      ];

  const extractedPages: WebPageExtraction[] = [];
  for (const url of urlsToScrape) {
    const page = await fetchAndExtractWebPage(url);
    extractedPages.push(page);
  }

  // Synthesize findings
  const findings: string[] = [
    `Da thu thap thong tin tu ${extractedPages.length} nguon ve chu de: "${topic}".`,
    extractedPages[0]?.description || `Noi dung tong quan da duoc bop tach cho ${topic}.`,
    ...extractedPages.flatMap(p => p.headings.slice(0, 2).map(h => `Diem quan trong: ${h}`)),
  ];

  const report: WebResearchReport = {
    id: `rep_${Date.now()}_${randomUUID().slice(0, 6)}`,
    topic,
    sourcesScraped: extractedPages.length,
    extractedPages,
    executiveSummary: `Bao cao nghien cuu tu tri cua Glacia cho "${topic}". Tong hop ${findings.length} luan diem quan trong.`,
    keyFindings: findings,
    suggestedActions: [
      `Cap nhat tai lieu he thong voi cac thong tin moi ve "${topic}".`,
      `Kiem tra tinh tuong thich ma nguon theo huong dan trong cac code snippets thu thap duoc.`,
    ],
    savedToMemory: false,
    createdAt: new Date().toISOString(),
  };

  // Tự động lưu vào Memory Vault nếu được bật
  if (autoSaveToMemory) {
    try {
      const { addMemoryEntry } = await import('./glaciaMemoryVault.ts');
      addMemoryEntry({
        category: 'semantic',
        title: `Tri thức Web: ${topic}`,
        content: `Tri thức Web về [${topic}]: ${report.executiveSummary} - Các luận điểm: ${findings.slice(0, 3).join('; ')}`,
        importance: 'high',
        tags: ['web_research', topic, 'spider'],
      });
      report.savedToMemory = true;
    } catch {
      // Memory vault optional
    }
  }

  store.reports.unshift(report);
  while (store.reports.length > 50) store.reports.pop();
  saveStore(store);

  return report;
}

/**
 * Ghi lại snapshot đối thủ cạnh tranh để theo dõi biến động
 */
export async function trackCompetitor(params: {
  competitorName: string;
  url: string;
  features?: string[];
  pricingSummary?: string;
}): Promise<{ snapshot: CompetitorSnapshot; alert?: CompetitorChangeAlert }> {
  const store = ensureStore();
  const { competitorName, url, features = [], pricingSummary } = params;

  const page = await fetchAndExtractWebPage(url);

  const snapshot: CompetitorSnapshot = {
    id: `comp_${Date.now()}_${randomUUID().slice(0, 6)}`,
    competitorName,
    url,
    title: page.title,
    pricingSummary: pricingSummary || page.description,
    features: features.length > 0 ? features : page.headings.slice(0, 5),
    rawTextSnippet: page.mainText.slice(0, 500),
    snapshotAt: new Date().toISOString(),
  };

  if (!store.competitorSnapshots[competitorName]) {
    store.competitorSnapshots[competitorName] = [];
  }

  const prevSnapshots = store.competitorSnapshots[competitorName];
  let alert: CompetitorChangeAlert | undefined;

  if (prevSnapshots.length > 0) {
    const last = prevSnapshots[0];
    if (last.pricingSummary !== snapshot.pricingSummary) {
      alert = {
        competitorName,
        url,
        changeType: 'pricing_shift',
        summary: `Phat hien thay doi ve gia/mo ta cua doi thu ${competitorName}!`,
        details: `Cu: "${last.pricingSummary}" -> Moi: "${snapshot.pricingSummary}"`,
        detectedAt: new Date().toISOString(),
      };
      store.changeAlerts.unshift(alert);
    }
  }

  store.competitorSnapshots[competitorName].unshift(snapshot);
  while (store.competitorSnapshots[competitorName].length > 20) {
    store.competitorSnapshots[competitorName].pop();
  }

  saveStore(store);
  return { snapshot, alert };
}

export function getWebResearchReports(): WebResearchReport[] {
  return ensureStore().reports;
}

export function getCompetitorAlerts(): CompetitorChangeAlert[] {
  return ensureStore().changeAlerts;
}

export function getCompetitorSnapshots(name?: string): Record<string, CompetitorSnapshot[]> {
  const store = ensureStore();
  if (name) {
    return { [name]: store.competitorSnapshots[name] || [] };
  }
  return store.competitorSnapshots;
}
