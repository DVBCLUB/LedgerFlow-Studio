/**
 * autoDocGenerator.ts
 * ============================================================
 * Automated Doc Generator — agent đọc codebase và tự sinh
 * tài liệu markdown cho từng service/module.
 * 
 * Output: docs/auto-gemini/ directory với mỗi file mô tả
 * một service kèm architecture notes.
 */
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'node:crypto';
import { dispatchTextThroughFabric } from './aiFabric';
import { searchCodebase } from './localSearchService';
import { appendAuditEvent } from './auditLog';

// ─── Types ──────────────────────────────────────────────────────────
export interface DocTarget {
  relativePath: string;
  type: 'service' | 'component' | 'config' | 'api';
  priority: number;
  reason: string;
}

export interface GeneratedDoc {
  target: DocTarget;
  markdown: string;
  tokensUsed: number;
  generatedAt: string;
  quality: 'good' | 'draft' | 'needs_review';
}

export interface DocRun {
  id: string;
  startedAt: string;
  completedAt?: string;
  targets: DocTarget[];
  generated: GeneratedDoc[];
  skipped: number;
  errors: number;
  status: 'scanning' | 'generating' | 'completed' | 'failed';
  totalTokens: number;
  durationMs: number;
}

// ─── Output dirs ────────────────────────────────────────────────────
const OUT_DIR = path.join(process.cwd(), 'docs', 'auto-generated');
let lastRun: DocRun | null = null;

// ─── Core API ───────────────────────────────────────────────────────

export async function scanTargets(options: {
  pattern?: string;          // VD: "server/services/*.ts"
  maxFiles?: number;
  types?: string[];
} = {}): Promise<DocTarget[]> {
  const pattern = options.pattern || 'server/services/*.ts';
  const allResults = await searchCodebase(pattern.split('/').pop() || 'service', 30);

  const targets: DocTarget[] = [];
  const seen = new Set<string>();

  for (const r of allResults) {
    if (seen.has(r.relativePath)) continue;
    seen.add(r.relativePath);

    let type: DocTarget['type'] = 'service';
    if (r.relativePath.includes('component') || r.relativePath.endsWith('.tsx')) type = 'component';
    else if (r.relativePath.includes('config') || r.relativePath.includes('.json')) type = 'config';
    else if (r.relativePath.includes('api') || r.relativePath.includes('route')) type = 'api';

    targets.push({
      relativePath: r.relativePath,
      type,
      priority: type === 'service' ? 1 : type === 'component' ? 2 : 3,
      reason: `Auto-detected from codebase scan.`,
    });

    if (targets.length >= (options.maxFiles || 10)) break;
  }

  return targets.sort((a, b) => a.priority - b.priority);
}

export async function generateSingleDoc(target: DocTarget): Promise<GeneratedDoc> {
  const filePath = path.join(process.cwd(), target.relativePath);
  let source = '';

  try {
    source = await fs.promises.readFile(filePath, 'utf8');
  } catch {
    throw new Error(`Cannot read file: ${target.relativePath}`);
  }

  const prompt = `Bạn là một Technical Writer. Hãy tạo tài liệu markdown cho file TypeScript sau.

FILE: ${target.relativePath}
TYPE: ${target.type}

SOURCE CODE (tóm tắt 300 dòng đầu):
\`\`\`typescript
${source.slice(0, 3000)}
\`\`\`
${source.length > 3000 ? `...(file has ${source.length} total chars, ${source.split('\n').length} lines)` : ''}

YÊU CẦU:
1. Tiêu đề chính: tên module
2. Mô tả ngắn (1-2 câu)
3. Các exports chính (hàm, type, interface)
4. Cách sử dụng (code example nếu có)
5. Dependencies (import từ đâu)
6. Ghi chú kiến trúc (pattern, design decision)

Trả lời bằng markdown thuần. Không thêm lời dẫn.`;

  const result = await dispatchTextThroughFabric(prompt, undefined, {
    domain: 'coding',
    task: 'general',
    localFallback: true,
  });

  const markdown = result.status === 'completed'
    ? (result.winner?.contentPreview || '')
    : `> Failed to generate docs: ${result.status}`;

  return {
    target,
    markdown,
    tokensUsed: Math.ceil(markdown.length / 4),
    generatedAt: new Date().toISOString(),
    quality: result.status === 'completed' ? 'good' : 'needs_review',
  };
}

export async function generateAllDocs(options: {
  pattern?: string;
  maxFiles?: number;
  dryRun?: boolean;
} = {}): Promise<DocRun> {
  const runId = `doc_${Date.now()}`;
  const started = Date.now();
  const maxFiles = options.maxFiles || 5;

  const run: DocRun = {
    id: runId,
    startedAt: new Date().toISOString(),
    targets: [],
    generated: [],
    skipped: 0,
    errors: 0,
    status: 'scanning',
    totalTokens: 0,
    durationMs: 0,
  };

  // Step 1: Scan
  run.targets = await scanTargets({ pattern: options.pattern, maxFiles });

  // Step 2: Generate
  run.status = 'generating';

  if (!options.dryRun) {
    // Ensure output dir
    if (!fs.existsSync(OUT_DIR)) {
      await fs.promises.mkdir(OUT_DIR, { recursive: true });
    }

    for (const target of run.targets) {
      try {
        const doc = await generateSingleDoc(target);
        run.generated.push(doc);
        run.totalTokens += doc.tokensUsed;

        // Write to file
        const outPath = path.join(OUT_DIR, `${target.relativePath.replace(/[/\\]/g, '_')}.md`);
        await fs.promises.writeFile(outPath, doc.markdown, 'utf8');
      } catch (err: any) {
        run.errors++;
      }
    }
  }

  run.status = 'completed';
  run.completedAt = new Date().toISOString();
  run.durationMs = Date.now() - started;
  lastRun = run;

  await appendAuditEvent({
    actor: 'system',
    workspace: 'Auto Doc Generator',
    action: 'doc_generator.run',
    target: `${run.generated.length} docs generated`,
    risk: 'LOW',
    status: 'executed',
    summary: `Generated ${run.generated.length} docs (${run.errors} errors) in ${(run.durationMs / 1000).toFixed(1)}s`,
    connectorId: 'doc-generator',
    evidence: { runId, generated: run.generated.length, errors: run.errors, totalTokens: run.totalTokens },
  }).catch(() => undefined);

  return run;
}

export function getLastDocRun(): DocRun | null { return lastRun; }

export function listGeneratedDocs(): string[] {
  try {
    if (!fs.existsSync(OUT_DIR)) return [];
    return fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.md'));
  } catch { return []; }
}
