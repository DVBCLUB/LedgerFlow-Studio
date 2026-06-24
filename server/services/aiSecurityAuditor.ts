/**
 * aiSecurityAuditor.ts
 * ============================================================
 * AI Security Audit Agent — agent chuyên biệt review code
 * về security. Tự động quét các file mới/chỉnh sửa để phát
 * hiện lỗ hổng bảo mật.
 */
import { randomUUID } from 'node:crypto';
import { dispatchTextThroughFabric } from './aiFabric';
import { appendAuditEvent } from './auditLog';
import { searchCodebase } from './localSearchService';
import fs from 'fs';
import path from 'path';

// ─── Types ──────────────────────────────────────────────────────────
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface SecurityFinding {
  id: string;
  file: string;
  line?: number;
  severity: Severity;
  category: string;
  title: string;
  description: string;
  recommendation: string;
  cwe?: string; // Common Weakness Enumeration
  confidence: number;
}

export interface SecurityAuditResult {
  id: string;
  file: string;
  findings: SecurityFinding[];
  totalFindings: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  score: number; // 0-100 security score
  summary: string;
  auditedAt: string;
  durationMs: number;
  sourceLength: number;
}

// ─── Security rules (heuristic pre-scan) ────────────────────────────

const SECURITY_PATTERNS: Array<{
  regex: RegExp;
  severity: Severity;
  category: string;
  title: string;
  description: string;
  recommendation: string;
  cwe: string;
}> = [
  {
    regex: /\.innerHTML\s*=/,
    severity: 'high',
    category: 'XSS',
    title: 'Potential XSS via innerHTML',
    description: 'innerHTML assignment can lead to Cross-Site Scripting if content is user-controlled.',
    recommendation: 'Use textContent or sanitize with DOMPurify.',
    cwe: 'CWE-79',
  },
  {
    regex: /eval\(/,
    severity: 'critical',
    category: 'Code Injection',
    title: 'Use of eval()',
    description: 'eval() executes arbitrary code and is extremely dangerous with user input.',
    recommendation: 'Avoid eval(). Use JSON.parse() for data, or Function() with caution.',
    cwe: 'CWE-95',
  },
  {
    regex: /execSync\(|exec\(|spawn\(.*user.*input|spawn\(.*req\.|spawn\(.*process\.argv/i,
    severity: 'high',
    category: 'Command Injection',
    title: 'Potential command injection',
    description: 'User-controlled input passed to shell command execution.',
    recommendation: 'Use execFile() with fixed args, or sanitize input with whitelist.',
    cwe: 'CWE-78',
  },
  {
    regex: /\.query\(\s*['"`].*\${\s*req\.|\.query\(\s*['"`].*\+\s*req\.|\bSELECT.*req\.(body|query|params)/i,
    severity: 'high',
    category: 'SQL Injection',
    title: 'Potential SQL injection',
    description: 'SQL query constructed with user input without parameterization.',
    recommendation: 'Use parameterized queries or ORM with safe query builder.',
    cwe: 'CWE-89',
  },
  {
    regex: /password\s*=\s*['"`][^'"`]{0,30}['"`]|secret\s*=\s*['"`][^'"`]{8,}['"`]|apiKey\s*=\s*['"`][^'"`]{8,}['"`]/i,
    severity: 'critical',
    category: 'Hardcoded Secret',
    title: 'Hardcoded credentials',
    description: 'Password, API key, or secret appears to be hardcoded in source.',
    recommendation: 'Move to environment variables or secure vault. Use process.env.',
    cwe: 'CWE-798',
  },
  {
    regex: /new Function\(|new Function\s*\(/,
    severity: 'critical',
    category: 'Code Injection',
    title: 'Use of new Function()',
    description: 'new Function() is similar to eval() and executes arbitrary code.',
    recommendation: 'Avoid dynamic code generation. Use safer alternatives.',
    cwe: 'CWE-95',
  },
  {
    regex: /\.dangerouslySetInnerHTML/,
    severity: 'high',
    category: 'XSS',
    title: 'React dangerouslySetInnerHTML used',
    description: 'React dangerouslySetInnerHTML bypasses XSS protection.',
    recommendation: 'Sanitize content with DOMPurify before using this prop.',
    cwe: 'CWE-79',
  },
  {
    regex: /http:\/\/[^/\s"']*\.(com|net|org)/i,
    severity: 'low',
    category: 'Insecure Transport',
    title: 'HTTP URL detected',
    description: 'Using HTTP instead of HTTPS for external resources.',
    recommendation: 'Use HTTPS URLs or upgrade to secure protocol.',
    cwe: 'CWE-319',
  },
  {
    regex: /console\.(log|warn|error)\s*\(\s*.*(password|secret|token|key|credential)/i,
    severity: 'medium',
    category: 'Information Leak',
    title: 'Sensitive data logged to console',
    description: 'Console log may expose passwords, tokens, or credentials.',
    recommendation: 'Remove or redact sensitive data from console logs.',
    cwe: 'CWE-532',
  },
  {
    regex: /fs\.writeFileSync\(\s*[^,]*req\.|fs\.writeFile\(\s*[^,]*req\./i,
    severity: 'high',
    category: 'Path Traversal',
    title: 'Potential path traversal in file write',
    description: 'User input used in file write path without sanitization.',
    recommendation: 'Sanitize file paths. Use path.resolve() and validate against base directory.',
    cwe: 'CWE-22',
  },
];

// ─── Core ───────────────────────────────────────────────────────────

export async function auditFile(filePath: string): Promise<SecurityAuditResult> {
  const id = `sec_${Date.now()}_${randomUUID().slice(0, 6)}`;
  const started = Date.now();

  let source = '';
  try {
    source = await fs.promises.readFile(filePath, 'utf8');
  } catch {
    source = `[Cannot read file: ${filePath}]`;
  }

  // Step 1: Heuristic pre-scan
  const heuristicFindings: SecurityFinding[] = [];
  const lines = source.split('\n');

  for (const pattern of SECURITY_PATTERNS) {
    let match: RegExpExecArray | null;
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    while ((match = regex.exec(source)) !== null) {
      const lineNum = source.slice(0, match.index).split('\n').length;
      heuristicFindings.push({
        id: `h_${randomUUID().slice(0, 8)}`,
        file: filePath,
        line: lineNum,
        severity: pattern.severity,
        category: pattern.category,
        title: pattern.title,
        description: pattern.description,
        recommendation: pattern.recommendation,
        cwe: pattern.cwe,
        confidence: 0.85,
      });
      if (!regex.global) break;
    }
  }

  // Step 2: AI deep review (nếu file không quá lớn)
  let aiFindings: SecurityFinding[] = [];
  if (source.length < 5000 && source.length > 50) {
    try {
      const auditPrompt = `Bạn là Security Auditor. Quét file sau để phát hiện lỗ hổng bảo mật.

FILE: ${filePath}

\`\`\`
${source.slice(0, 4000)}
\`\`\`

${heuristicFindings.length > 0 ? `PHÁT HIỆN HEURISTIC:\n${heuristicFindings.map(f => `- [${f.severity}] ${f.title} (line ${f.line})`).join('\n')}` : ''}

YÊU CẦU: Trả về danh sách findings bổ sung mà heuristic có thể bỏ sót. Mỗi finding 1 dòng:
FINDING: [severity] | [category] | [title] | [line] | [description] | [recommendation]

Nếu không có thêm gì, trả về: NO_ADDITIONAL_FINDINGS`;

      const result = await dispatchTextThroughFabric(
        auditPrompt,
        'Bạn là Security Auditor chuyên nghiệp. Chỉ báo cáo findings thực sự, không suy đoán.',
        { domain: 'coding', task: 'review', localFallback: true }
      );

      if (result.status === 'completed' && result.winner?.contentPreview) {
        const lines_found = result.winner.contentPreview.split('\n').filter(l => l.toUpperCase().startsWith('FINDING:'));
        for (const line of lines_found) {
          const parts = line.replace(/^FINDING:\s*/i, '').split('|').map(s => s.trim());
          if (parts.length >= 5) {
            aiFindings.push({
              id: `ai_${randomUUID().slice(0, 8)}`,
              file: filePath,
              line: parseInt(parts[3]) || undefined,
              severity: (parts[0] || 'medium') as Severity,
              category: parts[1] || 'other',
              title: parts[2] || 'AI-detected issue',
              description: parts[4] || '',
              recommendation: parts[5] || 'Review manually.',
              confidence: 0.7,
            });
          }
        }
      }
    } catch { /* AI scan optional, findings from heuristic still valid */ }
  }

  // Merge findings
  const allFindings = [...heuristicFindings, ...aiFindings];
  const criticalCount = allFindings.filter(f => f.severity === 'critical').length;
  const highCount = allFindings.filter(f => f.severity === 'high').length;
  const mediumCount = allFindings.filter(f => f.severity === 'medium').length;
  const lowCount = allFindings.filter(f => f.severity === 'low' || f.severity === 'info').length;

  // Security score: start at 100, deduct based on findings
  const deductions = criticalCount * 20 + highCount * 10 + mediumCount * 5 + lowCount * 2;
  const score = Math.max(0, Math.min(100, 100 - deductions));

  const result: SecurityAuditResult = {
    id,
    file: filePath,
    findings: allFindings,
    totalFindings: allFindings.length,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    score,
    summary: score >= 90 ? 'Good security posture' : score >= 70 ? 'Some issues, review recommended' : score >= 50 ? 'Multiple issues found' : 'Critical issues detected',
    auditedAt: new Date().toISOString(),
    durationMs: Date.now() - started,
    sourceLength: source.length,
  };

  await appendAuditEvent({
    actor: 'system',
    workspace: 'Security Auditor',
    action: 'security.audit',
    target: filePath,
    risk: criticalCount > 0 || highCount > 2 ? 'HIGH' : 'MEDIUM',
    status: 'executed',
    summary: `Security audit: ${allFindings.length} findings (${criticalCount}C/${highCount}H/${mediumCount}M) score=${score}`,
    connectorId: 'ai-security-auditor',
    evidence: { auditId: id, score, criticalCount, highCount },
  }).catch(() => undefined);

  return result;
}

export async function auditMultipleFiles(filePattern: string, maxFiles = 5): Promise<SecurityAuditResult[]> {
  const filePaths = await searchCodebase(filePattern.split(/[/\\]/).pop() || 'service', maxFiles);
  const results: SecurityAuditResult[] = [];

  for (const file of filePaths.slice(0, maxFiles)) {
    const fullPath = path.join(process.cwd(), file.relativePath);
    const result = await auditFile(fullPath);
    results.push(result);
  }

  return results;
}

export async function auditWithSummary(filePath: string): Promise<{ audit: SecurityAuditResult; summary: string }> {
  const audit = await auditFile(filePath);

  let summary = `## Security Audit: ${filePath}\n\n`;
  summary += `**Score:** ${audit.score}/100 | **Findings:** ${audit.totalFindings} (${audit.criticalCount} critical, ${audit.highCount} high, ${audit.mediumCount} medium)\n\n`;
  summary += `**Verdict:** ${audit.summary}\n\n`;

  if (audit.findings.length > 0) {
    summary += `### Findings\n\n`;
    for (const f of audit.findings) {
      const sevIcon = f.severity === 'critical' ? '🔴' : f.severity === 'high' ? '🟠' : f.severity === 'medium' ? '🟡' : '🔵';
      summary += `- ${sevIcon} **[${f.severity.toUpperCase()}] ${f.title}** ${f.line ? `(line ${f.line})` : ''}
  - Category: ${f.category}${f.cwe ? ` · ${f.cwe}` : ''}
  - ${f.description}
  - **Fix:** ${f.recommendation}\n\n`;
    }
  }

  return { audit, summary };
}

export function getSeverityColor(severity: Severity): string {
  switch (severity) {
    case 'critical': return '#ef4444';
    case 'high': return '#f97316';
    case 'medium': return '#eab308';
    case 'low': return '#3b82f6';
    case 'info': return '#6b7280';
  }
}
