/**
 * sastSecurityHub.ts
 * ============================================================
 * SAST Security Hub — unified static analysis security
 * testing engine. Aggregates results from multiple scanners
 * and provides a single security posture dashboard.
 *
 * Built-in: regex scanning, file size/complexity checks
 * Extensible: plugin-based scanner architecture
 */
import { randomUUID } from 'node:crypto';
import { dispatchTextThroughFabric } from './aiFabric';
import { appendAuditEvent } from './auditLog';
import fs from 'fs';
import path from 'path';

// ─── Types ──────────────────────────────────────────────────────────
export interface SastRule {
  id: string;
  name: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  regex: RegExp;
  fileGlob: string;
  message: string;
  remediation: string;
  cwe: string;
}

export interface SastFinding {
  id: string;
  ruleId: string;
  ruleName: string;
  file: string;
  line: number;
  column: number;
  severity: string;
  category: string;
  message: string;
  snippet: string;
  remediation: string;
  cwe: string;
}

export interface SastScanReport {
  id: string;
  target: string;
  rulesApplied: number;
  filesScanned: number;
  findings: SastFinding[];
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  passRate: number;       // % files with 0 findings
  securityScore: number;  // 0-100
  summary: string;
  scannedAt: string;
  durationMs: number;
}

export interface SastHubConfig {
  id: string;
  name: string;
  rules: SastRule[];
  autoFixEnabled: boolean;
  scanOnCommit: boolean;
  targetPatterns: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Built-in SAST Rules ────────────────────────────────────────────
const BUILTIN_RULES: Omit<SastRule, 'id'>[] = [
  {
    name: 'no-eval', category: 'injection', severity: 'critical',
    description: 'Detects eval() usage which allows arbitrary code execution.',
    regex: /\beval\s*\(/g, fileGlob: '*.{ts,tsx,js,jsx,mjs}',
    message: 'eval() found — allows arbitrary code execution.',
    remediation: 'Remove eval(). Use JSON.parse() for data, Function() only with extreme caution.',
    cwe: 'CWE-95',
  },
  {
    name: 'no-innerHTML-assign', category: 'xss', severity: 'high',
    description: 'Detects .innerHTML assignment which can lead to XSS.',
    regex: /\.innerHTML\s*=/g, fileGlob: '*.{ts,tsx,js,jsx}',
    message: 'innerHTML assignment — potential XSS vector.',
    remediation: 'Use textContent or sanitize with DOMPurify before setting innerHTML.',
    cwe: 'CWE-79',
  },
  {
    name: 'no-dangerouslySetInnerHTML', category: 'xss', severity: 'high',
    description: 'Detects React dangerouslySetInnerHTML usage.',
    regex: /dangerouslySetInnerHTML/g, fileGlob: '*.{tsx,jsx}',
    message: 'dangerouslySetInnerHTML used — React XSS bypass.',
    remediation: 'Wrap content with DOMPurify.sanitize() before using this prop.',
    cwe: 'CWE-79',
  },
  {
    name: 'hardcoded-credentials', category: 'secrets', severity: 'critical',
    description: 'Detects hardcoded passwords, API keys, and tokens.',
    regex: /(?:password|secret|api[_-]?key|token|credential)\s*[:=]\s*['"]\w{6,}['"]/gi,
    fileGlob: '*.{ts,tsx,js,jsx,json,yaml,yml,env}',
    message: 'Hardcoded credential detected in source code.',
    remediation: 'Move to environment variables (process.env) or secure vault.',
    cwe: 'CWE-798',
  },
  {
    name: 'no-command-injection', category: 'injection', severity: 'high',
    description: 'Detects user-controlled input in shell command execution.',
    regex: /exec\s*\(.*(?:req\.|user|input|param)|spawn\s*\(.*(?:req\.|user|input|param)/gi,
    fileGlob: '*.{ts,tsx,js,jsx}',
    message: 'Potential command injection — user input in shell exec.',
    remediation: 'Use execFile() with fixed args, or validate input with whitelist.',
    cwe: 'CWE-78',
  },
  {
    name: 'no-sql-injection', category: 'injection', severity: 'high',
    description: 'Detects SQL query building with user input.',
    regex: /SELECT.*\+.*req\.|SELECT.*\${\s*req\./gi,
    fileGlob: '*.{ts,tsx,js,jsx}',
    message: 'Potential SQL injection — dynamic query with user input.',
    remediation: 'Use parameterized queries or ORM query builder.',
    cwe: 'CWE-89',
  },
  {
    name: 'no-path-traversal', category: 'filesystem', severity: 'high',
    description: 'Detects file path construction from user input.',
    regex: /path\.(?:join|resolve)\s*\([^)]*req\./g, fileGlob: '*.{ts,tsx,js,jsx}',
    message: 'Path constructed with user input — potential traversal.',
    remediation: 'Validate against base directory. Use path.resolve() with sanitized inputs.',
    cwe: 'CWE-22',
  },
  {
    name: 'no-http-urls', category: 'network', severity: 'low',
    description: 'Detects hardcoded HTTP URLs instead of HTTPS.',
    regex: /http:\/\/(?!localhost|127\.0\.0\.1)(?!.*\.local)(?!.*\.test)[^\s"'<>\{\}]+/gi,
    fileGlob: '*.{ts,tsx,js,jsx,json,yaml,yml}',
    message: 'HTTP URL detected — use HTTPS for external resources.',
    remediation: 'Change http:// to https:// for production endpoints.',
    cwe: 'CWE-319',
  },
  {
    name: 'no-console-log-secrets', category: 'secrets', severity: 'medium',
    description: 'Detects secrets being logged to console.',
    regex: /console\.(?:log|warn|error|info)\s*\([^)]*(?:password|secret|token|key|credential)/gi,
    fileGlob: '*.{ts,tsx,js,jsx}',
    message: 'Sensitive data potentially exposed in console log.',
    remediation: 'Remove or redact sensitive data from console output before production.',
    cwe: 'CWE-532',
  },
  {
    name: 'no-unsafe-regex', category: 'dos', severity: 'medium',
    description: 'Detects potentially catastrophic backtracking in regex.',
    regex: /\/(?:.*?)(?:\(\?:\.\*\))(?:.*?)\//g, fileGlob: '*.{ts,tsx,js,jsx}',
    message: 'Regex pattern may cause ReDoS via catastrophic backtracking.',
    remediation: 'Simplify pattern, use atomic groups, or add timeout wrapper.',
    cwe: 'CWE-1333',
  },
  {
    name: 'large-file-exports', category: 'architecture', severity: 'low',
    description: 'Flags files > 800 lines for architectural review.',
    regex: /^/, fileGlob: '*.{ts,tsx,js,jsx}',
    message: 'File exceeds 800 lines — consider splitting.',
    remediation: 'Split into smaller modules by responsibility or feature.',
    cwe: 'CWE-1041',
  },
  // Additional special check handled in scan logic
];

// ─── Storage ────────────────────────────────────────────────────────
const CONFIGS_FILE = path.join(process.cwd(), 'sast_configs.json');
const REPORTS_FILE = path.join(process.cwd(), 'sast_reports.json');

let configs: SastHubConfig[] = [];
let reports: SastScanReport[] = [];

async function init(): Promise<void> {
  try {
    if (fs.existsSync(CONFIGS_FILE)) configs = JSON.parse(await fs.promises.readFile(CONFIGS_FILE, 'utf8'));
    if (fs.existsSync(REPORTS_FILE)) reports = JSON.parse(await fs.promises.readFile(REPORTS_FILE, 'utf8'));
  } catch { }
}
init().catch(() => undefined);

async function saveConfigs(): Promise<void> { await fs.promises.writeFile(CONFIGS_FILE, JSON.stringify(configs, null, 2), 'utf8'); }
async function saveReports(): Promise<void> { await fs.promises.writeFile(REPORTS_FILE, JSON.stringify(reports.slice(-30), null, 2), 'utf8'); }

// ─── Core API ───────────────────────────────────────────────────────

export function getBuiltinRules(): Omit<SastRule, 'id'>[] { return [...BUILTIN_RULES]; }

export function createSastConfig(name: string, options?: { autoFixEnabled?: boolean; targetPatterns?: string[] }): SastHubConfig {
  const config: SastHubConfig = {
    id: `sast_${Date.now()}`,
    name,
    rules: BUILTIN_RULES.map(r => ({ ...r, id: `rule_${r.name}_${randomUUID().slice(0, 4)}` })),
    autoFixEnabled: options?.autoFixEnabled ?? false,
    scanOnCommit: true,
    targetPatterns: options?.targetPatterns || ['src/**/*.{ts,tsx,js,jsx}', 'server/**/*.{ts,tsx,js,jsx}'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  configs.push(config);
  saveConfigs().catch(() => undefined);
  return config;
}

export function getConfig(id: string): SastHubConfig | undefined { return configs.find(c => c.id === id); }
export function listConfigs(): SastHubConfig[] { return [...configs]; }

export async function runSastScan(
  targetPattern: string,
  maxFiles = 10,
): Promise<SastScanReport> {
  const reportId = `srep_${Date.now()}`;
  const started = Date.now();

  const activeConfig = configs[0];
  const rules = activeConfig?.rules || BUILTIN_RULES.map(r => ({ ...r, id: `rule_${r.name}_default` }));

  // Gather files matching pattern
  const files = gatherFiles(targetPattern, maxFiles);
  const findings: SastFinding[] = [];

  for (const filePath of files) {
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const ext = path.extname(filePath).toLowerCase();

    for (const rule of rules) {
      // Check if rule applies to this file type
      if (!matchesGlob(path.basename(filePath), rule.fileGlob)) continue;

      // Special: large-file check
      if (rule.name === 'large-file-exports' && lines.length > 800) {
        findings.push({
          id: `find_${randomUUID().slice(0, 8)}`,
          ruleId: rule.id, ruleName: rule.name,
          file: filePath, line: 1, column: 0,
          severity: rule.severity, category: rule.category,
          message: `File has ${lines.length} lines (threshold: 800).`,
          snippet: lines[0]?.slice(0, 80) || '',
          remediation: rule.remediation, cwe: rule.cwe,
        });
        continue;
      }

      // Regex scan
      const regex = new RegExp(rule.regex.source, rule.regex.flags);
      let match: RegExpExecArray | null;

      while ((match = regex.exec(content)) !== null) {
        const lineNum = content.slice(0, match.index).split('\n').length;
        const col = match.index - content.lastIndexOf('\n', match.index - 1);
        const snippet = lines[lineNum - 1]?.trim().slice(0, 120) || '';

        findings.push({
          id: `find_${randomUUID().slice(0, 8)}`,
          ruleId: rule.id, ruleName: rule.name,
          file: filePath, line: lineNum, column: col,
          severity: rule.severity, category: rule.category,
          message: rule.message,
          snippet,
          remediation: rule.remediation, cwe: rule.cwe,
        });

        if (!regex.global) break;
      }
    }
  }

  // AI summary if findings exist
  let summary = '';
  const criticalCount = findings.filter(f => f.severity === 'critical').length;
  const highCount = findings.filter(f => f.severity === 'high').length;
  const mediumCount = findings.filter(f => f.severity === 'medium').length;
  const lowCount = findings.filter(f => f.severity === 'low').length;

  if (findings.length > 0 && content.length > 0) {
    try {
      const aiPrompt = `Summarize this SAST scan in 2-3 sentences:

Target: ${targetPattern}
Files: ${files.length}
Findings: ${findings.length} (C:${criticalCount}, H:${highCount}, M:${mediumCount}, L:${lowCount})
Top issues: ${findings.slice(0, 5).map(f => `- ${f.severity}: ${f.ruleName} in ${path.basename(f.file)}`).join(', ')}`;

      const result = await dispatchTextThroughFabric(aiPrompt, undefined, { domain: 'general', localFallback: true });
      summary = result.winner?.contentPreview?.slice(0, 300) || '';
    } catch { }
  }

  if (!summary) {
    summary = findings.length === 0
      ? 'No security issues found. Code looks clean!'
      : `${findings.length} findings: ${criticalCount} critical, ${highCount} high, ${mediumCount} medium, ${lowCount} low.`;
  }

  // Pass rate: % files with 0 findings (unique files)
  const filesWithFindings = new Set(findings.map(f => f.file)).size;
  const passRate = files.length > 0 ? +(((files.length - filesWithFindings) / files.length) * 100).toFixed(1) : 100;

  // Security score
  const securityScore = Math.max(0, 100 - criticalCount * 15 - highCount * 8 - mediumCount * 4 - lowCount * 1);

  const report: SastScanReport = {
    id: reportId, target: targetPattern,
    rulesApplied: rules.length, filesScanned: files.length,
    findings, criticalCount, highCount, mediumCount, lowCount,
    passRate, securityScore, summary,
    scannedAt: new Date().toISOString(),
    durationMs: Date.now() - started,
  };

  reports.push(report);

  await appendAuditEvent({
    actor: 'system', workspace: 'SAST Hub', action: 'sast.scan',
    target: targetPattern, risk: criticalCount > 0 || highCount > 3 ? 'HIGH' : 'MEDIUM',
    status: 'executed',
    summary: `SAST: ${findings.length} findings, score ${securityScore}/100`,
    connectorId: 'sast-hub',
    evidence: { reportId, files: files.length, findings: findings.length, score: securityScore },
  }).catch(() => undefined);

  saveReports().catch(() => undefined);
  return report;
}

function gatherFiles(pattern: string, maxFiles: number): string[] {
  const baseDir = path.dirname(pattern.includes('*') ? path.join(process.cwd(), pattern.split('*')[0]) : process.cwd());
  const results: string[] = [];

  function walk(dir: string, depth: number) {
    if (results.length >= maxFiles || depth > 5) return;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (results.length >= maxFiles) return;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          walk(fullPath, depth + 1);
        } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/i.test(entry.name)) {
          results.push(fullPath);
        }
      }
    } catch { }
  }

  walk(fs.existsSync(baseDir) ? baseDir : process.cwd(), 0);
  return results;
}

function matchesGlob(filename: string, glob: string): boolean {
  // Support comma-separated globs
  const patterns = glob.split(',').map(g => g.trim());
  for (const pattern of patterns) {
    const regexStr = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\?/g, '.');
    if (new RegExp(`^${regexStr}$`, 'i').test(filename)) return true;
  }
  return false;
}

export function getReport(id: string): SastScanReport | undefined { return reports.find(r => r.id === id); }
export function listReports(): SastScanReport[] { return [...reports].reverse(); }
export function getSastStats(): { totalReports: number; avgScore: number; totalFindings: number; lastScanAt?: string } {
  return {
    totalReports: reports.length,
    avgScore: reports.length > 0 ? +(reports.reduce((s, r) => s + r.securityScore, 0) / reports.length).toFixed(1) : 0,
    totalFindings: reports.reduce((s, r) => s + r.findings.length, 0),
    lastScanAt: reports[reports.length - 1]?.scannedAt,
  };
}
