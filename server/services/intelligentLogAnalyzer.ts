/**
 * intelligentLogAnalyzer.ts
 * ============================================================
 * Intelligent Log Analyzer — AI phân tích log files,
 * phát hiện anomalies, patterns, errors, và đề xuất fix.
 */
import { randomUUID } from 'node:crypto';
import { dispatchTextThroughFabric } from './aiFabric';
import { appendAuditEvent } from './auditLog';
import fs from 'fs';
import path from 'path';

// ─── Types ──────────────────────────────────────────────────────────
export interface LogAnomaly {
  timestamp: string;
  level: string;
  pattern: string;
  message: string;
  frequency: number;
  firstSeen: string;
  lastSeen: string;
  suggestedFix: string;
}

export interface LogPattern {
  name: string;
  regex: RegExp;
  severity: string;
  description: string;
}

export interface LogAnalysis {
  id: string;
  source: string;
  fileSize: number;
  totalLines: number;
  timeRange: { start?: string; end?: string };
  levelDistribution: Record<string, number>;
  topErrors: LogAnomaly[];
  anomalies: LogAnomaly[];
  patternsFound: string[];
  healthScore: number;
  recommendations: string[];
  summary: string;
  analyzedAt: string;
  durationMs: number;
}

// ─── Known patterns ─────────────────────────────────────────────────
const KNOWN_PATTERNS: LogPattern[] = [
  { name: 'out_of_memory', regex: /out\s+of\s+memory|heap\s+limit|allocation\s+failed/i, severity: 'critical', description: 'Memory exhaustion' },
  { name: 'connection_refused', regex: /connection\s+refused|ECONNREFUSED|cannot\s+connect/i, severity: 'high', description: 'Connection refused' },
  { name: 'timeout', regex: /timeout|timed?\s*out|ETIMEDOUT/i, severity: 'high', description: 'Operation timeout' },
  { name: 'rate_limit', regex: /rate\s+limit|too\s+many\s+requests|429|quota\s+exceeded/i, severity: 'high', description: 'Rate limiting' },
  { name: 'auth_failure', regex: /unauthorized|forbidden|auth.*fail|invalid.*(?:token|key|credential)/i, severity: 'high', description: 'Authentication failure' },
  { name: 'file_not_found', regex: /ENOENT|not\s+found|no\s+such\s+file/i, severity: 'medium', description: 'File not found' },
  { name: 'null_reference', regex: /null\s+reference|undefined\s+is\s+not|cannot\s+read\s+propert/i, severity: 'critical', description: 'Null/undefined access' },
  { name: 'disk_full', regex: /no\s+space|disk\s+full|ENOSPC/i, severity: 'critical', description: 'Disk full' },
  { name: 'circuit_breaker', regex: /circuit\s+(?:open|breaker)/i, severity: 'high', description: 'Circuit breaker tripped' },
  { name: 'deprecation', regex: /deprecat(?:ed|ion)/i, severity: 'low', description: 'Deprecated usage' },
];

// ─── Storage ────────────────────────────────────────────────────────
const FILE = path.join(process.cwd(), 'log_analyses.json');
let analyses: LogAnalysis[] = [];

async function load(): Promise<void> { try { if (fs.existsSync(FILE)) analyses = JSON.parse(await fs.promises.readFile(FILE, 'utf8')); } catch { } }
load().catch(() => undefined);
async function save(): Promise<void> { await fs.promises.writeFile(FILE, JSON.stringify(analyses.slice(-30), null, 2), 'utf8'); }

// ─── Core Heuristic Analysis ────────────────────────────────────────

function analyzeLogLines(lines: string[]): {
  levelDistribution: Record<string, number>;
  anomalies: LogAnomaly[];
  patternsFound: string[];
  timeRange: { start?: string; end?: string };
} {
  const levelDistribution: Record<string, number> = {};
  const patternCounts = new Map<string, number>();
  const anomalies: LogAnomaly[] = [];
  let timeStart: string | undefined;
  let timeEnd: string | undefined;

  // Parse each line
  for (const line of lines) {
    // Level detection
    const levelMatch = line.match(/\b(ERROR|WARN|WARNING|INFO|DEBUG|CRITICAL|FATAL|TRACE)\b/i);
    if (levelMatch) {
      const level = levelMatch[1].toUpperCase();
      levelDistribution[level] = (levelDistribution[level] || 0) + 1;
    }

    // Timestamp detection
    const tsMatch = line.match(/\[?(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?[\+\-Z]?\d*:?\d*)/);
    if (tsMatch && !timeStart) timeStart = tsMatch[1];
    if (tsMatch) timeEnd = tsMatch[1];

    // Pattern matching
    for (const pattern of KNOWN_PATTERNS) {
      if (pattern.regex.test(line)) {
        patternCounts.set(pattern.name, (patternCounts.get(pattern.name) || 0) + 1);
      }
    }
  }

  // Build anomalies from patterns found
  const patternsFound: string[] = [];
  for (const [name, count] of patternCounts) {
    const pattern = KNOWN_PATTERNS.find(p => p.name === name)!;
    patternsFound.push(name);

    if (pattern.severity === 'critical' || pattern.severity === 'high') {
      anomalies.push({
        timestamp: timeStart || new Date().toISOString(),
        level: pattern.severity.toUpperCase(),
        pattern: name,
        message: `${name}: found ${count} occurrence(s)`,
        frequency: count,
        firstSeen: timeStart || '',
        lastSeen: timeEnd || '',
        suggestedFix: getSuggestedFix(name),
      });
    }
  }

  // Sort anomalies by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  anomalies.sort((a, b) => (severityOrder[a.level as keyof typeof severityOrder] || 9) - (severityOrder[b.level as keyof typeof severityOrder] || 9));

  return { levelDistribution, anomalies, patternsFound, timeRange: { start: timeStart, end: timeEnd } };
}

function getSuggestedFix(patternName: string): string {
  const fixes: Record<string, string> = {
    out_of_memory: 'Increase Node.js heap size (--max-old-space-size), identify memory leaks, or scale horizontally.',
    connection_refused: 'Check if target service is running, verify network/firewall rules, check DNS resolution.',
    timeout: 'Increase timeout threshold, implement retries with backoff, check downstream service health.',
    rate_limit: 'Implement backoff/retry, increase rate limit quota, or add request queue.',
    auth_failure: 'Verify credentials/tokens, check expiry, ensure proper auth headers.',
    null_reference: 'Add null checks, use optional chaining (?.), or provide default values.',
    disk_full: 'Clean up old logs/artifacts, increase disk capacity, or implement log rotation.',
    circuit_breaker: 'Check downstream service health, review circuit threshold, implement gradual recovery.',
    deprecation: 'Update to latest API version, replace deprecated calls, check migration guides.',
  };
  return fixes[patternName] || 'Investigate the specific error and apply appropriate fix.';
}

// ─── Core API ───────────────────────────────────────────────────────

export async function analyzeLogs(
  filePath: string,
  options?: { maxLines?: number; useAI?: boolean },
): Promise<LogAnalysis> {
  const analysisId = `log_${Date.now()}`;
  const started = Date.now();

  let content = '';
  let fileSize = 0;
  try {
    const stat = fs.statSync(filePath);
    fileSize = stat.size;
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    content = `Cannot read: ${filePath}`;
    fileSize = 0;
  }

  const allLines = content.split('\n');
  const maxLines = options?.maxLines || 5000;
  const lines = allLines.slice(-maxLines); // Focus on recent logs
  const totalLines = allLines.length;

  // Heuristic analysis
  const heuristic = analyzeLogLines(lines);

  // AI-powered deeper analysis
  let summary = '';
  let topErrors: LogAnomaly[] = [];
  let recommendations: string[] = [];

  if (options?.useAI !== false && lines.length > 10) {
    try {
      const logSample = lines
        .filter(l => l.match(/(?:ERROR|WARN|CRITICAL|FATAL)/i))
        .slice(0, 50)
        .join('\n');

      const aiPrompt = `Analyze these log entries:

PATTERNS FOUND: ${heuristic.patternsFound.join(', ') || 'none'}
ERROR/WARN SAMPLE:
${logSample.slice(0, 5000)}

Total: ${totalLines} lines, ${heuristic.anomalies.length} anomalies detected.

Give:
SUMMARY: [2-3 sentence summary of the log health]
TOP_ERRORS: [3-5 most critical errors, comma separated]
RECOMMENDATIONS: [3-5 bullet points, most urgent first]`;

      const result = await dispatchTextThroughFabric(aiPrompt, undefined, { domain: 'general', localFallback: true });
      if (result.winner?.contentPreview) {
        const out = result.winner.contentPreview;
        const sumMatch = out.match(/SUMMARY:\s*([\s\S]*?)(?=\nTOP_ERRORS|$)/i);
        if (sumMatch) summary = sumMatch[1].trim();

        const errMatch = out.match(/TOP_ERRORS:\s*([\s\S]*?)(?=\nRECOMMENDATIONS|$)/i);
        if (errMatch) {
          topErrors = errMatch[1].split(',').map((e: string) => ({
            timestamp: new Date().toISOString(), level: 'ERROR',
            pattern: e.trim(), message: e.trim(), frequency: 1,
            firstSeen: '', lastSeen: '', suggestedFix: '',
          }));
        }

        const recMatch = out.match(/RECOMMENDATIONS:\s*([\s\S]*)$/i);
        if (recMatch) {
          recommendations = recMatch[1].split('\n')
            .filter((l: string) => l.trim().startsWith('-') || l.trim().startsWith('*'))
            .map((l: string) => l.replace(/^[-*]\s*/, '').trim())
            .slice(0, 6);
        }
      }
    } catch { }
  }

  if (!summary) {
    summary = heuristic.anomalies.length === 0
      ? `Logs look clean. ${totalLines} lines analyzed, no critical/high anomalies detected.`
      : `Found ${heuristic.anomalies.length} anomalies in ${totalLines} log lines. Health score: ${healthScore}/100.`;
  }

  const healthScore = Math.max(0, 100
    - heuristic.anomalies.filter(a => a.level === 'CRITICAL' || a.level === 'critical').length * 20
    - heuristic.anomalies.filter(a => a.level === 'HIGH' || a.level === 'high').length * 8
    - heuristic.anomalies.length * 2);

  const analysis: LogAnalysis = {
    id: analysisId, source: filePath, fileSize, totalLines,
    timeRange: heuristic.timeRange,
    levelDistribution: heuristic.levelDistribution,
    topErrors: topErrors.slice(0, 5),
    anomalies: heuristic.anomalies,
    patternsFound: heuristic.patternsFound,
    healthScore, recommendations,
    summary,
    analyzedAt: new Date().toISOString(),
    durationMs: Date.now() - started,
  };

  analyses.push(analysis);

  await appendAuditEvent({
    actor: 'system', workspace: 'Log Analyzer', action: 'log.analyze',
    target: filePath, risk: healthScore < 50 ? 'HIGH' : 'LOW', status: 'executed',
    summary: `Log analysis: ${heuristic.anomalies.length} anomalies, health ${healthScore}/100`,
    connectorId: 'log-analyzer',
    evidence: { analysisId, lines: totalLines, anomalies: heuristic.anomalies.length },
  }).catch(() => undefined);

  save().catch(() => undefined);
  return analysis;
}

export function getAnalysis(id: string): LogAnalysis | undefined { return analyses.find(a => a.id === id); }
export function listAnalyses(): LogAnalysis[] { return [...analyses].reverse(); }
export function getPatterns(): LogPattern[] { return [...KNOWN_PATTERNS]; }
export function getLogStats(): { total: number; avgHealth: number } {
  return { total: analyses.length, avgHealth: analyses.length > 0 ? +(analyses.reduce((s, a) => s + a.healthScore, 0) / analyses.length).toFixed(1) : 0 };
}
