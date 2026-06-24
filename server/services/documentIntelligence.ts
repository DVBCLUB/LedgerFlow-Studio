/**
 * documentIntelligence.ts
 * ============================================================
 * Document Intelligence — phân tích tài liệu, trích xuất
 * entities, summaries, và structured data tự động.
 *
 * Support: plain text, markdown, code files, JSON, CSV
 * AI-powered: summary, key points, entities, sentiment
 */
import { randomUUID } from 'node:crypto';
import { dispatchTextThroughFabric } from './aiFabric';
import fs from 'fs';
import path from 'path';

// ─── Types ──────────────────────────────────────────────────────────
export interface DocumentEntity {
  name: string;
  type: 'person' | 'organization' | 'date' | 'number' | 'code_symbol' | 'url' | 'email' | 'file_path';
  value: string;
  confidence: number;
  mentions: number;
}

export interface DocumentSection {
  title: string;
  content: string;
  startLine: number;
  endLine: number;
}

export interface DocumentIntelligence {
  id: string;
  fileName: string;
  fileType: string;
  summary: string;
  keyPoints: string[];
  entities: DocumentEntity[];
  sections: DocumentSection[];
  sentiment: 'positive' | 'neutral' | 'negative';
  complexity: 'simple' | 'moderate' | 'complex';
  wordCount: number;
  readingTimeMinutes: number;
  language: string;
  tags: string[];
  generatedAt: string;
  processingMs: number;
}

// ─── Core Analysis (heuristic, no AI) ───────────────────────────────

function analyzeDocumentHeuristic(filePath: string, content: string): Partial<DocumentIntelligence> {
  const lines = content.split('\n');
  const wordCount = content.split(/\s+/).filter(w => w.length > 1).length;
  const readingTimeMinutes = Math.ceil(wordCount / 200);

  // Language detection
  const viChars = content.match(/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g);
  const language = (viChars?.length || 0) > wordCount * 0.1 ? 'vi' : 'en';

  // Extract entities
  const entities: DocumentEntity[] = [];

  // URLs
  const urls = content.match(/https?:\/\/[^\s'"<>]+/g);
  if (urls) {
    for (const url of [...new Set(urls)].slice(0, 10)) {
      entities.push({ name: url.slice(0, 60), type: 'url', value: url, confidence: 0.95, mentions: urls.filter(u => u === url).length });
    }
  }

  // Emails
  const emails = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
  if (emails) {
    for (const email of [...new Set(emails)].slice(0, 5)) {
      entities.push({ name: email, type: 'email', value: email, confidence: 0.95, mentions: emails.filter(e => e === email).length });
    }
  }

  // Code symbols (function names, class names)
  const codeSymbols = content.match(/(?:function|class|const|interface|type|export)\s+(\w+)/g);
  if (codeSymbols) {
    const names = [...new Set(codeSymbols.map(s => s.split(/\s+/)[1]))].slice(0, 20);
    for (const name of names) {
      entities.push({ name, type: 'code_symbol', value: name, confidence: 0.8, mentions: content.split(name).length - 1 });
    }
  }

  // File paths
  const filePaths = content.match(/(?:\.{0,2}\/)?[\w-]+(?:\/[\w.-]+)*\.\w+/g);
  if (filePaths) {
    for (const fp of [...new Set(filePaths)].slice(0, 10)) {
      entities.push({ name: fp, type: 'file_path', value: fp, confidence: 0.7, mentions: filePaths.filter(f => f === fp).length });
    }
  }

  // Extract sections (markdown headings)
  const sections: DocumentSection[] = [];
  const headingRegex = /^#{1,3}\s+(.+)$/gm;
  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(content)) !== null) {
    sections.push({
      title: match[1].trim(),
      content: `Section starting at line ${content.slice(0, match.index).split('\n').length}`,
      startLine: content.slice(0, match.index).split('\n').length,
      endLine: 0,
    });
  }

  // Sentiment (simple heuristic)
  const positive = (content.match(/good|great|excellent|tốt|tuyệt|hiệu quả|thành công|thanks|cảm ơn/gi) || []).length;
  const negative = (content.match(/bad|error|bug|fail|lỗi|thất bại|kém|chậm|không hoạt động/gi) || []).length;
  const sentiment: 'positive' | 'neutral' | 'negative' =
    positive > negative * 2 ? 'positive' : negative > positive * 2 ? 'negative' : 'neutral';

  // Complexity
  const complexity = wordCount < 500 ? 'simple' : wordCount < 2000 ? 'moderate' : 'complex';

  // Tags
  const tags: string[] = [];
  if (content.includes('function') || content.includes('class')) tags.push('code');
  if (content.includes('README')) tags.push('documentation');
  if (content.includes('test')) tags.push('testing');
  if (content.includes('API') || content.includes('endpoint')) tags.push('api');
  if (wordCount > 1000) tags.push('long-form');

  return {
    fileName: path.basename(filePath),
    fileType: path.extname(filePath).slice(1) || 'txt',
    entities, sections, sentiment, complexity,
    wordCount, readingTimeMinutes, language,
    tags: tags.slice(0, 8),
  };
}

// ─── Core API ───────────────────────────────────────────────────────

export async function analyzeDocument(filePath: string): Promise<DocumentIntelligence> {
  const id = `doc_${Date.now()}`;
  const start = Date.now();

  let content = '';
  try {
    content = await fs.promises.readFile(filePath, 'utf8');
  } catch {
    content = `[Cannot read: ${filePath}]`;
  }

  // Heuristic analysis first
  const heuristic = analyzeDocumentHeuristic(filePath, content);

  // AI-powered summary and key points
  let summary = '';
  let keyPoints: string[] = [];

  if (content.length > 50 && content.length < 15000) {
    try {
      const aiPrompt = `Analyze this document and provide:
1. A 2-3 sentence summary
2. 3-5 key points

DOCUMENT (${heuristic.fileName}, ${heuristic.wordCount} words):
${content.slice(0, 8000)}

Return:
## SUMMARY
[summary]

## KEY_POINTS
- [point 1]
- [point 2]`;

      const result = await dispatchTextThroughFabric(aiPrompt, undefined, { domain: 'general', localFallback: true });
      if (result.winner?.contentPreview) {
        const out = result.winner.contentPreview;
        const sumMatch = out.match(/## SUMMARY\s*\n([\s\S]*?)(?=\n##|$)/i);
        summary = sumMatch ? sumMatch[1].trim() : '';
        const kpMatch = out.match(/## KEY_POINTS\s*\n([\s\S]*?)(?=\n##|$)/i);
        keyPoints = kpMatch ? kpMatch[1].split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^-\s*/, '').trim()) : [];
      }
    } catch { /* fallback */ }
  }

  // Fallback summary
  if (!summary) {
    summary = `${heuristic.fileName} — ${heuristic.wordCount} words, ${heuristic.readingTimeMinutes} min read. ${heuristic.complexity} complexity document.`;
  }

  return {
    id, ...heuristic,
    summary,
    keyPoints: keyPoints.length > 0 ? keyPoints : ['Document analysis complete.', `${heuristic.wordCount} words analyzed.`, `${heuristic.entities.length} entities detected.`],
    generatedAt: new Date().toISOString(),
    processingMs: Date.now() - start,
  };
}

export function getDocumentIntelligence(filePath: string): DocumentIntelligence | undefined {
  // Re-analyze if needed
  return undefined; // stateless — always call analyzeDocument
}

export function detectFileStructure(filePath: string): {
  type: string;
  lines: number;
  functions: number;
  classes: number;
  imports: number;
} {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    return {
      type: path.extname(filePath),
      lines: lines.length,
      functions: (content.match(/(?:function\s+\w+|=>\s*[{])/g) || []).length,
      classes: (content.match(/class\s+\w+/g) || []).length,
      imports: (content.match(/^(?:import|require)/gm) || []).length,
    };
  } catch {
    return { type: '', lines: 0, functions: 0, classes: 0, imports: 0 };
  }
}
