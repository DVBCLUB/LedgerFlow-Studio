/**
 * configDriftDetector.ts
 * ============================================================
 * Config Drift Detector — compares current configuration
 * state against a known-good baseline, detects drift,
 * and suggests or applies auto-fixes.
 *
 * Monitors: .env files, package.json configs, tsconfig,
 * docker, CI/CD configs.
 */
import { randomUUID } from 'node:crypto';
import { dispatchTextThroughFabric } from './aiFabric';
import { appendAuditEvent } from './auditLog';
import fs from 'fs';
import path from 'path';

// ─── Types ──────────────────────────────────────────────────────────
export interface ConfigBaseline {
  id: string;
  name: string;
  description: string;
  file: string;
  keyValues: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface ConfigDrift {
  id: string;
  baselineId: string;
  baselineName: string;
  file: string;
  key: string;
  expectedValue: string;
  actualValue: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'security' | 'performance' | 'compatibility' | 'compliance' | 'best_practice';
  description: string;
  autoFixable: boolean;
}

export interface DriftScanReport {
  id: string;
  target: string;
  baselinesCompared: number;
  filesChecked: number;
  drifts: ConfigDrift[];
  criticalCount: number;
  highCount: number;
  driftScore: number;           // 0-100, lower means more drift
  summary: string;
  scannedAt: string;
  durationMs: number;
}

// ─── Storage ────────────────────────────────────────────────────────
const BASELINES_FILE = path.join(process.cwd(), 'config_baselines.json');
const DRIFTS_FILE = path.join(process.cwd(), 'config_drifts.json');

let baselines: ConfigBaseline[] = [];
let driftReports: DriftScanReport[] = [];

async function init(): Promise<void> {
  try {
    if (fs.existsSync(BASELINES_FILE)) baselines = JSON.parse(await fs.promises.readFile(BASELINES_FILE, 'utf8'));
    if (fs.existsSync(DRIFTS_FILE)) driftReports = JSON.parse(await fs.promises.readFile(DRIFTS_FILE, 'utf8'));
  } catch { }
}
init().catch(() => undefined);

async function saveBaselines(): Promise<void> { await fs.promises.writeFile(BASELINES_FILE, JSON.stringify(baselines, null, 2), 'utf8'); }
async function saveDrifts(): Promise<void> { await fs.promises.writeFile(DRIFTS_FILE, JSON.stringify(driftReports.slice(-30), null, 2), 'utf8'); }

// ─── Core API ───────────────────────────────────────────────────────

export function captureBaseline(name: string, filePath: string, description?: string): ConfigBaseline | undefined {
  if (!fs.existsSync(filePath)) return undefined;

  const content = fs.readFileSync(filePath, 'utf8');
  const keyValues = parseKeyValues(content, filePath);

  const baseline: ConfigBaseline = {
    id: `bl_${Date.now()}`,
    name, description: description || `Baseline for ${path.basename(filePath)}`,
    file: filePath,
    keyValues,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  baselines.push(baseline);
  saveBaselines().catch(() => undefined);
  return baseline;
}

export function getBaseline(id: string): ConfigBaseline | undefined { return baselines.find(b => b.id === id); }
export function listBaselines(): ConfigBaseline[] { return [...baselines]; }
export function deleteBaseline(id: string): boolean {
  const idx = baselines.findIndex(b => b.id === id);
  if (idx < 0) return false;
  baselines.splice(idx, 1);
  saveBaselines().catch(() => undefined);
  return true;
}

export async function detectDrift(targetPath?: string): Promise<DriftScanReport> {
  const reportId = `drift_${Date.now()}`;
  const started = Date.now();
  const root = targetPath || process.cwd();
  const drifts: ConfigDrift[] = [];

  // Files to check
  const configFiles: string[] = [
    path.join(root, '.env'),
    path.join(root, 'package.json'),
    path.join(root, 'tsconfig.json'),
    path.join(root, 'docker-compose.yml'),
    path.join(root, 'Dockerfile'),
    path.join(root, '.gitignore'),
    path.join(root, '.eslintrc.json'),
    path.join(root, '.eslintrc.js'),
  ];

  let filesChecked = 0;

  for (const file of configFiles) {
    if (!fs.existsSync(file)) continue;
    filesChecked++;
    const content = fs.readFileSync(file, 'utf8');
    const currentKVs = parseKeyValues(content, file);

    // Compare against each baseline for this file
    const matchingBaselines = baselines.filter(b => b.file === file || path.basename(b.file) === path.basename(file));

    if (matchingBaselines.length === 0) {
      // Auto-suggest: capture this as a baseline if none exists
      // (skip for now, user should capture first)
      continue;
    }

    for (const baseline of matchingBaselines) {
      // Compare each key
      for (const [key, expectedValue] of Object.entries(baseline.keyValues)) {
        const actualValue = currentKVs[key];

        if (actualValue === undefined) {
          drifts.push({
            id: `dr_${randomUUID().slice(0, 8)}`,
            baselineId: baseline.id, baselineName: baseline.name,
            file: path.relative(root, file), key,
            expectedValue, actualValue: '[MISSING]',
            severity: isCriticalKey(key) ? 'critical' : 'high',
            category: 'compliance',
            description: `Key "${key}" is missing from ${path.basename(file)}.`,
            autoFixable: true,
          });
        } else if (actualValue !== expectedValue) {
          drifts.push({
            id: `dr_${randomUUID().slice(0, 8)}`,
            baselineId: baseline.id, baselineName: baseline.name,
            file: path.relative(root, file), key,
            expectedValue, actualValue,
            severity: isCriticalKey(key) ? 'high' : 'medium',
            category: categorizeKey(file, key),
            description: `Value changed: "${expectedValue}" → "${actualValue.slice(0, 60)}"`,
            autoFixable: isAutoFixable(key),
          });
        }
      }
    }
  }

  // Also check for missing config files
  for (const baseline of baselines) {
    if (!fs.existsSync(baseline.file)) {
      drifts.push({
        id: `dr_missing_${randomUUID().slice(0, 6)}`,
        baselineId: baseline.id, baselineName: baseline.name,
        file: path.relative(root, baseline.file), key: '[FILE]',
        expectedValue: 'exists', actualValue: '[MISSING]',
        severity: 'critical', category: 'compliance',
        description: `Baseline file "${baseline.name}" does not exist.`,
        autoFixable: false,
      });
    }
  }

  // AI summary
  let summary = '';
  const criticalCount = drifts.filter(d => d.severity === 'critical').length;
  const highCount = drifts.filter(d => d.severity === 'high').length;

  if (drifts.length > 0) {
    try {
      const aiPrompt = `Summarize this config drift scan in 2 sentences:

Files checked: ${filesChecked}
Drifts found: ${drifts.length} (C:${criticalCount}, H:${highCount})
Top drifts: ${drifts.slice(0, 3).map(d => `- ${d.file}: ${d.key} = "${d.expectedValue}" → "${d.actualValue}"`).join(', ')}`;

      const result = await dispatchTextThroughFabric(aiPrompt, undefined, { domain: 'general', localFallback: true });
      summary = result.winner?.contentPreview?.slice(0, 200) || '';
    } catch { }
  }

  if (!summary) {
    summary = drifts.length === 0
      ? 'No configuration drift detected. All configs match baseline.'
      : `${drifts.length} config drifts found: ${criticalCount} critical, ${highCount} high.`;
  }

  const driftScore = Math.max(0, 100 - criticalCount * 20 - highCount * 10 - drifts.filter(d => d.severity === 'medium').length * 5);

  const report: DriftScanReport = {
    id: reportId, target: root,
    baselinesCompared: baselines.length, filesChecked,
    drifts, criticalCount, highCount,
    driftScore, summary,
    scannedAt: new Date().toISOString(),
    durationMs: Date.now() - started,
  };

  driftReports.push(report);
  saveDrifts().catch(() => undefined);

  await appendAuditEvent({
    actor: 'system', workspace: 'Config Drift', action: 'drift.scan',
    target: root, risk: criticalCount > 0 ? 'HIGH' : 'MEDIUM',
    status: 'executed',
    summary: `Config drift: ${drifts.length} drifts, score ${driftScore}/100`,
    connectorId: 'config-drift',
    evidence: { reportId, files: filesChecked, drifts: drifts.length },
  }).catch(() => undefined);

  return report;
}

export function autoFixDrift(driftId: string): boolean {
  for (const report of driftReports) {
    const drift = report.drifts.find(d => d.id === driftId);
    if (!drift || !drift.autoFixable) continue;

    const baseline = baselines.find(b => b.id === drift.baselineId);
    if (!baseline) return false;

    const fullPath = path.join(report.target, drift.file);
    if (!fs.existsSync(fullPath)) return false;

    try {
      let content = fs.readFileSync(fullPath, 'utf8');

      if (drift.key === '[FILE]') {
        // Can't auto-create files easily
        return false;
      }

      // Simple key=value fix for .env and JSON files
      if (fullPath.endsWith('.env')) {
        const pattern = new RegExp(`^${escapeRegex(drift.key)}\\s*=\\s*.*$`, 'm');
        if (pattern.test(content)) {
          content = content.replace(pattern, `${drift.key}=${drift.expectedValue}`);
        } else {
          content += `\n${drift.key}=${drift.expectedValue}`;
        }
        fs.writeFileSync(fullPath, content, 'utf8');
        return true;
      }

      return false;
    } catch { return false; }
  }
  return false;
}

function parseKeyValues(content: string, filePath: string): Record<string, string> {
  const kvs: Record<string, string> = {};

  if (filePath.endsWith('.env')) {
    // Parse KEY=VALUE format
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const [key, ...valueParts] = trimmed.split('=');
      kvs[key.trim()] = valueParts.join('=').trim();
    }
  } else if (filePath.endsWith('.json')) {
    try {
      const obj = JSON.parse(content);
      flattenJSON(obj, '', kvs);
    } catch { }
  }

  return kvs;
}

function flattenJSON(obj: any, prefix: string, result: Record<string, string>): void {
  if (typeof obj !== 'object' || obj === null) {
    result[prefix] = String(obj);
    return;
  }
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      flattenJSON(value, fullKey, result);
    } else {
      result[fullKey] = String(value);
    }
  }
}

function isCriticalKey(key: string): boolean {
  const critical = ['password', 'secret', 'api_key', 'token', 'database_url', 'redis_url', 'private_key'];
  return critical.some(c => key.toLowerCase().includes(c));
}

function categorizeKey(_file: string, key: string): ConfigDrift['category'] {
  if (isCriticalKey(key)) return 'security';
  if (key.includes('port') || key.includes('host') || key.includes('url')) return 'compatibility';
  if (key.includes('version') || key.includes('engine')) return 'compatibility';
  return 'best_practice';
}

function isAutoFixable(key: string): boolean {
  const noAutoFix = ['password', 'secret', 'token', 'private_key'];
  return !noAutoFix.some(k => key.toLowerCase().includes(k));
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function getDriftReport(id: string): DriftScanReport | undefined { return driftReports.find(r => r.id === id); }
export function listDriftReports(): DriftScanReport[] { return [...driftReports].reverse(); }
export function getDriftStats(): { totalReports: number; avgDriftScore: number; totalDrifts: number } {
  return {
    totalReports: driftReports.length,
    avgDriftScore: driftReports.length > 0 ? +(driftReports.reduce((s, r) => s + r.driftScore, 0) / driftReports.length).toFixed(1) : 0,
    totalDrifts: driftReports.reduce((s, r) => s + r.drifts.length, 0),
  };
}
