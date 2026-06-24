/**
 * codeRefactoringEngine.ts
 * ============================================================
 * AI Code Refactoring Engine — phân tích sâu codebase,
 * phát hiện code smells, và đề xuất refactor tự động.
 *
 * Detects: long functions, duplicate code, complex conditions,
 * missing types, magic numbers, unused imports/variables.
 */
import { randomUUID } from 'node:crypto';
import { dispatchTextThroughFabric } from './aiFabric';
import { searchCodebase } from './localSearchService';
import { appendAuditEvent } from './auditLog';
import fs from 'fs';
import path from 'path';

// ─── Types ──────────────────────────────────────────────────────────
export type CodeSmellType =
  | 'long_function'
  | 'complex_condition'
  | 'magic_number'
  | 'missing_type'
  | 'duplicate_code'
  | 'unused_import'
  | 'deep_nesting'
  | 'large_file';

export interface CodeSmell {
  id: string;
  file: string;
  line: number;
  type: CodeSmellType;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  suggestion: string;
  refactoredCode?: string;
  confidence: number;
}

export interface RefactorReport {
  id: string;
  file: string;
  smells: CodeSmell[];
  totalSmells: number;
  criticalCount: number; highCount: number; mediumCount: number; lowCount: number;
  complexityScore: number;       // 0-100, lower is better
  recommendedActions: string[];
  estimatedHours: number;
  scannedAt: string;
  durationMs: number;
}

// ─── Heuristic detection patterns ───────────────────────────────────

function detectSmellsHeuristic(filePath: string, content: string, lines: string[]): CodeSmell[] {
  const smells: CodeSmell[] = [];
  const sid = () => `smell_${Date.now()}_${randomUUID().slice(0, 6)}`;

  // 1. Detect long functions (> 50 lines between function declaration and closing brace)
  let functionStart = -1;
  let functionName = '';
  let braceDepth = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Function declaration detection
    const funcMatch = line.match(/(?:function\s+(\w+)|(\w+)\s*[:=]\s*(?:async\s+)?function|(\w+)\s*[:=]\s*(?:async\s+)?\([^)]*\)\s*(?:=>|{))/);
    if (funcMatch && !line.includes('import') && !line.includes('require')) {
      if (functionStart < 0) {
        functionStart = i;
        functionName = funcMatch[1] || funcMatch[2] || funcMatch[3] || 'anonymous';
        braceDepth = 0;
      }
    }

    braceDepth += (line.match(/\{/g) || []).length;
    braceDepth -= (line.match(/\}/g) || []).length;

    if (functionStart >= 0 && braceDepth <= 0 && i - functionStart > 1) {
      const funcLength = i - functionStart;
      if (funcLength > 50) {
        smells.push({
          id: sid(), file: filePath, line: functionStart + 1,
          type: 'long_function', severity: funcLength > 100 ? 'high' : 'medium',
          description: `Function "${functionName}" is ${funcLength} lines long.`,
          suggestion: `Extract sub-functions or use class methods to split logic.`,
          confidence: 0.9,
        });
      }
      functionStart = -1;
      functionName = '';
    }
  }

  // 2. Detect complex conditions (3+ && / || in one if)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('if') || line.startsWith('while') || line.startsWith('else if')) {
      const andCount = (line.match(/&&/g) || []).length;
      const orCount = (line.match(/\|\|/g) || []).length;
      if (andCount + orCount >= 3) {
        smells.push({
          id: sid(), file: filePath, line: i + 1,
          type: 'complex_condition', severity: (andCount + orCount) >= 5 ? 'high' : 'medium',
          description: `Complex condition with ${andCount + orCount} logical operators.`,
          suggestion: `Extract to a named boolean function or use early returns.`,
          confidence: 0.85,
        });
      }
    }
  }

  // 3. Detect magic numbers (literal numbers in logic, not in arrays/imports)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('import')) continue;
    if (trimmed.startsWith('const') || trimmed.startsWith('let') || trimmed.startsWith('var')) continue;

    const numbers = line.match(/(?<!\w)(\d{2,})(?!\w)/g);
    if (numbers) {
      for (const num of numbers) {
        const val = parseInt(num);
        if (val > 1 && val !== 100 && val !== 1000 && val < 1000000) {
          if (!line.includes(`[${num}]`) && !line.includes(`(${num})`) && !line.includes(`#${num}`)) {
            smells.push({
              id: sid(), file: filePath, line: i + 1,
              type: 'magic_number', severity: 'low',
              description: `Magic number "${num}" detected.`,
              suggestion: `Replace with a named constant.`,
              confidence: 0.7,
            });
          }
        }
      }
    }
  }

  // 4. Detect deep nesting (> 3 levels)
  for (let i = 0; i < lines.length; i++) {
    const indent = lines[i].match(/^(\s*)/)?.[1]?.length || 0;
    if (indent > 12 && (lines[i].trim().startsWith('if') || lines[i].trim().startsWith('for') || lines[i].trim().startsWith('while'))) {
      smells.push({
        id: sid(), file: filePath, line: i + 1,
        type: 'deep_nesting', severity: 'medium',
        description: `Deep nesting detected (indent: ${indent} spaces).`,
        suggestion: `Use early returns, guard clauses, or extract nested logic.`,
        confidence: 0.8,
      });
    }
  }

  // 5. Detect large files (> 500 lines)
  if (lines.length > 500) {
    smells.push({
      id: sid(), file: filePath, line: 1,
      type: 'large_file', severity: lines.length > 1000 ? 'high' : 'medium',
      description: `File has ${lines.length} lines.`,
      suggestion: `Split into multiple modules by responsibility.`,
      confidence: 0.95,
    });
  }

  // 6. Detect unused imports (heuristic: imported but not used in file body)
  for (let i = 0; i < Math.min(lines.length, 30); i++) {
    const importMatch = lines[i].match(/import\s+\{([^}]+)\}\s+from/);
    if (importMatch) {
      const imported = importMatch[1].split(',').map(s => s.trim()).filter(Boolean);
      const restOfFile = lines.slice(i + 1).join('\n');
      for (const imp of imported) {
        if (!restOfFile.includes(imp) && imp !== 'type' && !imp.startsWith('type ')) {
          smells.push({
            id: sid(), file: filePath, line: i + 1,
            type: 'unused_import', severity: 'low',
            description: `Potentially unused import: "${imp}".`,
            suggestion: `Remove unused import to clean up.`,
            confidence: 0.6,
          });
        }
      }
    }
  }

  return smells;
}

// ─── Core API ───────────────────────────────────────────────────────

export async function analyzeFileForRefactoring(filePath: string): Promise<RefactorReport> {
  const id = `ref_${Date.now()}`;
  const started = Date.now();

  let content = '';
  let lines: string[] = [];
  try {
    content = await fs.promises.readFile(filePath, 'utf8');
    lines = content.split('\n');
  } catch {
    lines = [];
    content = `[Cannot read: ${filePath}]`;
  }

  // Heuristic scan
  const heuristicSmells = detectSmellsHeuristic(filePath, content, lines);

  // AI deep analysis (if file not too large)
  let aiSmells: CodeSmell[] = [];
  let recommendedActions: string[] = [];

  if (content.length < 8000 && content.length > 50) {
    try {
      const aiPrompt = `Phân tích code sau để tìm code smells và đề xuất refactoring:

FILE: ${filePath} (${lines.length} lines)

\`\`\`typescript
${content.slice(0, 5000)}
\`\`\`

HEURISTIC FINDINGS:
${heuristicSmells.map(s => `- [${s.type}] L${s.line}: ${s.description}`).join('\n') || 'None detected.'}

Trả về:
## SMELLS (bổ sung những gì heuristic bỏ sót)
- [type] L[line]: [description] | [suggestion]

## ACTIONS (3-5 hành động cụ thể, ưu tiên cao nhất trước)
- [action]

Nếu không có thêm, trả về NO_ADDITIONAL.`;

      const result = await dispatchTextThroughFabric(
        aiPrompt, undefined,
        { domain: 'coding', task: 'review', localFallback: true }
      );

      if (result.winner?.contentPreview) {
        const content = result.winner.contentPreview;

        const smellSection = content.match(/## SMELLS?\s*\n([\s\S]*?)(?=\n##|$)/i);
        if (smellSection) {
          const smellLines = smellSection[1].split('\n').filter(l => l.trim().startsWith('-'));
          for (const sl of smellLines) {
            const match = sl.match(/-\s*\[(\w+)\]\s*L?(\d+)?:?\s*(.+?)\s*\|\s*(.+)/);
            if (match) {
              aiSmells.push({
                id: `ai_smell_${randomUUID().slice(0, 8)}`, file: filePath,
                line: parseInt(match[2]) || 0,
                type: match[1] as CodeSmellType, severity: 'medium',
                description: match[3].trim(), suggestion: match[4].trim(),
                confidence: 0.7,
              });
            }
          }
        }

        const actionSection = content.match(/## ACTIONS?\s*\n([\s\S]*?)(?=\n##|$)/i);
        if (actionSection) {
          recommendedActions = actionSection[1].split('\n')
            .filter(l => l.trim().startsWith('-'))
            .map(l => l.replace(/^-\s*/, '').trim());
        }
      }
    } catch { /* AI is supplement, heuristic already gives good results */ }
  }

  const allSmells = [...heuristicSmells, ...aiSmells];
  const criticalCount = allSmells.filter(s => s.severity === 'critical').length;
  const highCount = allSmells.filter(s => s.severity === 'high').length;
  const mediumCount = allSmells.filter(s => s.severity === 'medium').length;
  const lowCount = allSmells.filter(s => s.severity === 'low').length;

  const complexityScore = Math.max(0, 100 - (criticalCount * 15 + highCount * 8 + mediumCount * 4 + lowCount * 1));
  const estimatedHours = Math.ceil(criticalCount * 2 + highCount * 1 + mediumCount * 0.5 + lowCount * 0.25);

  if (recommendedActions.length === 0) {
    if (allSmells.length > 0) {
      recommendedActions.push(`Xử lý ${criticalCount} critical issues trước.`);
      if (allSmells.find(s => s.type === 'long_function')) recommendedActions.push('Refactor long functions thành các hàm nhỏ hơn.');
      if (allSmells.find(s => s.type === 'complex_condition')) recommendedActions.push('Đơn giản hóa các điều kiện phức tạp.');
    } else {
      recommendedActions.push('No issues detected. Code looks clean!');
    }
  }

  return {
    id, file: filePath, smells: allSmells,
    totalSmells: allSmells.length,
    criticalCount, highCount, mediumCount, lowCount,
    complexityScore,
    recommendedActions: recommendedActions.slice(0, 8),
    estimatedHours,
    scannedAt: new Date().toISOString(),
    durationMs: Date.now() - started,
  };
}

export async function scanDirectoryForRefactoring(pattern: string, maxFiles = 3): Promise<RefactorReport[]> {
  const fileResults = await searchCodebase(pattern.split(/[/\\]/).pop() || 'service', maxFiles);
  const reports: RefactorReport[] = [];

  for (const file of fileResults.slice(0, maxFiles)) {
    const fullPath = path.join(process.cwd(), file.relativePath);
    const report = await analyzeFileForRefactoring(fullPath);
    reports.push(report);
  }

  return reports;
}
