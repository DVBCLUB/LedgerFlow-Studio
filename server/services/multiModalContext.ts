/**
 * multiModalContext.ts
 * ============================================================
 * Multi-Modal Context Support — hỗ trợ ảnh, screenshot,
 * và file đính kèm trong AI prompt.
 *
 * Khi user upload file, tự động trích xuất nội dung
 * và inject vào context một cách thông minh.
 */
import { randomUUID } from 'node:crypto';
import fs from 'fs';
import path from 'path';

// ─── Types ──────────────────────────────────────────────────────────
export type AttachmentType = 'image' | 'screenshot' | 'file' | 'code' | 'document' | 'data';

export interface Attachment {
  id: string;
  name: string;
  type: AttachmentType;
  mimeType: string;
  sizeBytes: number;
  filePath: string;
  uploadedAt: string;
}

export interface ExtractedContext {
  attachmentId: string;
  fileName: string;
  extractedText: string;
  summary: string;
  tokenEstimate: number;
  extractionMethod: 'read' | 'parsed' | 'ocr_hint' | 'binary_skip';
}

export interface MultiModalContext {
  id: string;
  attachments: Attachment[];
  extractions: ExtractedContext[];
  combinedContext: string;
  totalTokens: number;
  createdAt: string;
}

// ─── MIME type detection ────────────────────────────────────────────
const MIME_MAP: Record<string, { type: AttachmentType; mimeType: string }> = {
  '.png': { type: 'image', mimeType: 'image/png' },
  '.jpg': { type: 'image', mimeType: 'image/jpeg' },
  '.jpeg': { type: 'image', mimeType: 'image/jpeg' },
  '.gif': { type: 'image', mimeType: 'image/gif' },
  '.webp': { type: 'image', mimeType: 'image/webp' },
  '.svg': { type: 'image', mimeType: 'image/svg+xml' },
  '.bmp': { type: 'image', mimeType: 'image/bmp' },
  '.ts': { type: 'code', mimeType: 'text/typescript' },
  '.tsx': { type: 'code', mimeType: 'text/typescript' },
  '.js': { type: 'code', mimeType: 'text/javascript' },
  '.jsx': { type: 'code', mimeType: 'text/javascript' },
  '.py': { type: 'code', mimeType: 'text/python' },
  '.json': { type: 'data', mimeType: 'application/json' },
  '.csv': { type: 'data', mimeType: 'text/csv' },
  '.txt': { type: 'document', mimeType: 'text/plain' },
  '.md': { type: 'document', mimeType: 'text/markdown' },
  '.html': { type: 'document', mimeType: 'text/html' },
  '.css': { type: 'code', mimeType: 'text/css' },
  '.xml': { type: 'data', mimeType: 'text/xml' },
  '.yaml': { type: 'data', mimeType: 'text/yaml' },
  '.yml': { type: 'data', mimeType: 'text/yaml' },
  '.pdf': { type: 'document', mimeType: 'application/pdf' },
  '.docx': { type: 'document', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
};

// ─── Active contexts ────────────────────────────────────────────────
const activeContexts = new Map<string, MultiModalContext>();

// ─── Core API ───────────────────────────────────────────────────────

export function registerAttachment(filePath: string): Attachment | undefined {
  if (!fs.existsSync(filePath)) return undefined;

  const ext = path.extname(filePath).toLowerCase();
  const mimeInfo = MIME_MAP[ext] || { type: 'file' as AttachmentType, mimeType: 'application/octet-stream' };

  const stats = fs.statSync(filePath);
  const attachment: Attachment = {
    id: `att_${Date.now()}_${randomUUID().slice(0, 6)}`,
    name: path.basename(filePath),
    type: mimeInfo.type,
    mimeType: mimeInfo.mimeType,
    sizeBytes: stats.size,
    filePath,
    uploadedAt: new Date().toISOString(),
  };

  return attachment;
}

export function extractContext(attachment: Attachment, maxChars = 5000): ExtractedContext {
  let extractedText = '';
  let extractionMethod: ExtractedContext['extractionMethod'] = 'binary_skip';
  let summary = '';

  try {
    const textExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.json', '.csv', '.txt', '.md', '.html', '.css', '.xml', '.yaml', '.yml', '.env', '.sh', '.sql', '.toml'];

    const ext = path.extname(attachment.filePath).toLowerCase();

    if (textExtensions.includes(ext)) {
      // Text-based file - read directly
      const content = fs.readFileSync(attachment.filePath, 'utf8');
      extractedText = content.slice(0, maxChars);
      extractionMethod = 'read';
      summary = `File "${attachment.name}" (${attachment.sizeBytes} bytes, ${content.split('\n').length} lines)`;

      if (attachment.type === 'code') {
        // Extract function/class declarations for summary
        const declarations = content.match(/(?:export\s+)?(?:async\s+)?(?:function|class|const|interface|type)\s+\w+/g);
        if (declarations) {
          summary += ` | Declarations: ${declarations.slice(0, 10).join(', ')}${declarations.length > 10 ? '...' : ''}`;
        }
      }
    } else if (attachment.type === 'image') {
      // Image - provide descriptive context
      extractedText = `[IMAGE: ${attachment.name}]
Type: ${attachment.mimeType}
Size: ${(attachment.sizeBytes / 1024).toFixed(1)} KB
Path: ${attachment.filePath}
Note: Image content cannot be automatically extracted. Describe what you see in this image if needed.`;
      extractionMethod = 'ocr_hint';
      summary = `Image file: ${attachment.name} (${(attachment.sizeBytes / 1024).toFixed(1)} KB)`;
    } else if (attachment.type === 'data' && ext === '.json') {
      const content = fs.readFileSync(attachment.filePath, 'utf8');
      try {
        const parsed = JSON.parse(content);
        extractedText = JSON.stringify(parsed, null, 2).slice(0, maxChars);
        extractionMethod = 'parsed';
        summary = `JSON with ${Object.keys(parsed).length} top-level keys`;
      } catch {
        extractedText = content.slice(0, maxChars);
        extractionMethod = 'read';
        summary = `JSON file (unparseable, raw text)`;
      }
    } else {
      extractedText = `[BINARY: ${attachment.name}, ${attachment.mimeType}, ${(attachment.sizeBytes / 1024).toFixed(1)} KB]`;
      extractionMethod = 'binary_skip';
      summary = `Binary file: ${attachment.name}`;
    }
  } catch (err: any) {
    extractedText = `[Error reading ${attachment.name}: ${err.message}]`;
    extractionMethod = 'binary_skip';
  }

  return {
    attachmentId: attachment.id,
    fileName: attachment.name,
    extractedText,
    summary,
    tokenEstimate: Math.ceil(extractedText.length / 4),
    extractionMethod,
  };
}

export function buildMultiModalContext(
  task: string,
  attachmentPaths: string[],
): MultiModalContext {
  const id = `mmc_${Date.now()}_${randomUUID().slice(0, 6)}`;
  const attachments: Attachment[] = [];
  const extractions: ExtractedContext[] = [];

  for (const fp of attachmentPaths) {
    const att = registerAttachment(fp);
    if (!att) continue;
    attachments.push(att);
    const ext = extractContext(att);
    extractions.push(ext);
  }

  // Build combined context
  const parts: string[] = [`## User Task\n${task}`];
  if (extractions.length > 0) {
    parts.push(`\n## Attached Files (${extractions.length})`);
    for (const ext of extractions) {
      parts.push(`\n### ${ext.fileName}\n\`\`\`\n${ext.extractedText}\n\`\`\``);
    }
  }

  const combinedContext = parts.join('\n');
  const totalTokens = Math.ceil(combinedContext.length / 4) + extractions.reduce((s, e) => s + e.tokenEstimate, 0);

  const ctx: MultiModalContext = { id, attachments, extractions, combinedContext, totalTokens, createdAt: new Date().toISOString() };
  activeContexts.set(id, ctx);

  return ctx;
}

export function getContext(id: string): MultiModalContext | undefined {
  return activeContexts.get(id);
}

export function listAttachments(): Attachment[] {
  const all: Attachment[] = [];
  for (const ctx of activeContexts.values()) {
    all.push(...ctx.attachments);
  }
  return all;
}

export function getSupportedFormats(): Array<{ ext: string; type: AttachmentType; mimeType: string }> {
  return Object.entries(MIME_MAP).map(([ext, info]) => ({ ext, ...info }));
}

export function scanDirectoryForAttachments(dirPath: string, maxFiles = 20): Attachment[] {
  const attachments: Attachment[] = [];
  try {
    const files = fs.readdirSync(dirPath);
    for (const file of files.slice(0, maxFiles)) {
      const fullPath = path.join(dirPath, file);
      try {
        const stats = fs.statSync(fullPath);
        if (stats.isFile()) {
          const att = registerAttachment(fullPath);
          if (att) attachments.push(att);
        }
      } catch { }
    }
  } catch { }
  return attachments;
}
