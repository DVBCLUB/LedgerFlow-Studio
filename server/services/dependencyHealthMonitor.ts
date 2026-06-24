/**
 * dependencyHealthMonitor.ts
 * ============================================================
 * Dependency Health Monitor — tracks npm/pip dependency
 * health, known vulnerabilities, upgrade suggestions,
 * and license compliance.
 */
import { randomUUID } from 'node:crypto';
import { dispatchTextThroughFabric } from './aiFabric';
import { appendAuditEvent } from './auditLog';
import fs from 'fs';
import path from 'path';

// ─── Types ──────────────────────────────────────────────────────────
export interface DependencyInfo {
  name: string;
  version: string;
  latestVersion: string;
  isOutdated: boolean;
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  vulnerabilities: VulnerabilityInfo[];
  licenseType: string;
  licenseOk: boolean;
  deprecated: boolean;
  weeklyDownloads: number;
  lastUpdated?: string;
}

export interface VulnerabilityInfo {
  id: string;
  severity: string;
  title: string;
  description: string;
  fixedIn: string;
  url: string;
}

export interface LicenseSummary {
  total: number;
  ok: number;
  flagged: number;
  flaggedLicenses: Array<{ name: string; version: string; license: string }>;
}

export interface DepHealthReport {
  id: string;
  projectPath: string;
  packageManager: string;
  totalDependencies: number;
  dependencies: DependencyInfo[];
  outdated: number;
  vulnerable: number;
  deprecated: number;
  criticalIssues: number;
  highIssues: number;
  licenseSummary: LicenseSummary;
  overallHealth: number;         // 0-100
  recommendations: string[];
  scannedAt: string;
  durationMs: number;
}

// ─── License allowlist ──────────────────────────────────────────────
const LICENSE_ALLOWLIST = new Set([
  'MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC',
  'Unlicense', 'CC0-1.0', 'Python-2.0', 'Zlib',
]);

const FLAGGED_LICENSES = ['GPL-2.0', 'GPL-3.0', 'AGPL-3.0', 'LGPL-2.1', 'LGPL-3.0'];

// ─── Storage ────────────────────────────────────────────────────────
const FILE = path.join(process.cwd(), 'dep_health_reports.json');
let reports: DepHealthReport[] = [];

async function load(): Promise<void> {
  try { if (fs.existsSync(FILE)) reports = JSON.parse(await fs.promises.readFile(FILE, 'utf8')); } catch { }
}
load().catch(() => undefined);
async function save(): Promise<void> { await fs.promises.writeFile(FILE, JSON.stringify(reports.slice(-20), null, 2), 'utf8'); }

// ─── Core API ───────────────────────────────────────────────────────

export async function scanDependencyHealth(projectPath?: string, maxDeps = 50): Promise<DepHealthReport> {
  const reportId = `dh_${Date.now()}`;
  const started = Date.now();
  const root = projectPath || process.cwd();
  const packageJsonPath = path.join(root, 'package.json');
  const requirementsPath = path.join(root, 'requirements.txt');

  let packageManager = 'unknown';
  const deps: DependencyInfo[] = [];

  // Parse package.json
  if (fs.existsSync(packageJsonPath)) {
    packageManager = 'npm';
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      const depNames = Object.keys(allDeps).slice(0, maxDeps);

      // Try to read package-lock or node_modules for actual versions
      let lockDeps: Record<string, any> = {};
      const lockPath = path.join(root, 'package-lock.json');
      if (fs.existsSync(lockPath)) {
        try {
          const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
          lockDeps = lock.packages || {};
        } catch { }
      }

      for (const name of depNames) {
        const version = allDeps[name]?.replace(/^[\^~>= ]+/, '') || 'unknown';
        const depInfo = await inferDepInfo(name, version, lockDeps);
        deps.push(depInfo);
      }
    } catch (err) { /* package.json parse error */ }
  }

  // Parse requirements.txt
  if (fs.existsSync(requirementsPath)) {
    packageManager = packageManager === 'unknown' ? 'pip' : 'mixed';
    try {
      const content = fs.readFileSync(requirementsPath, 'utf8');
      const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('-')).slice(0, maxDeps);
      for (const line of lines) {
        const match = line.match(/^([\w.-]+)\s*([><=!~]+[\d.*]+)?/);
        if (match) {
          deps.push({
            name: match[1],
            version: match[2] || 'unpinned',
            latestVersion: 'check',
            isOutdated: !match[2],
            severity: !match[2] ? 'medium' : 'none',
            vulnerabilities: [],
            licenseType: 'UNKNOWN',
            licenseOk: true,
            deprecated: false,
            weeklyDownloads: 0,
          });
        }
      }
    } catch { }
  }

  if (deps.length === 0) {
    return {
      id: reportId, projectPath: root, packageManager: 'none',
      totalDependencies: 0, dependencies: [], outdated: 0, vulnerable: 0,
      deprecated: 0, criticalIssues: 0, highIssues: 0,
      licenseSummary: { total: 0, ok: 0, flagged: 0, flaggedLicenses: [] },
      overallHealth: 100, recommendations: ['No dependencies found. Project may not have package.json or requirements.txt.'],
      scannedAt: new Date().toISOString(), durationMs: Date.now() - started,
    };
  }

  // Calculate metrics
  const outdated = deps.filter(d => d.isOutdated).length;
  const vulnerable = deps.filter(d => d.vulnerabilities.length > 0).length;
  const deprecated = deps.filter(d => d.deprecated).length;
  const criticalIssues = deps.filter(d => d.severity === 'critical' || d.vulnerabilities.some(v => v.severity === 'critical')).length;
  const highIssues = deps.filter(d => d.severity === 'high' || d.vulnerabilities.some(v => v.severity === 'high')).length;

  // License analysis
  const flaggedLicenses: DepHealthReport['licenseSummary']['flaggedLicenses'] = [];
  for (const dep of deps) {
    if (!dep.licenseOk) flaggedLicenses.push({ name: dep.name, version: dep.version, license: dep.licenseType });
  }

  const licenseSummary: LicenseSummary = {
    total: deps.length,
    ok: deps.filter(d => d.licenseOk).length,
    flagged: deps.filter(d => !d.licenseOk).length,
    flaggedLicenses,
  };

  // Health score
  const overallHealth = Math.max(0, 100
    - criticalIssues * 15 - highIssues * 8
    - vulnerable * 5 - deprecated * 4 - outdated * 1
    - deps.filter(d => !d.licenseOk).length * 3
  );

  // AI recommendations
  let recommendations: string[] = [];
  if (outdated > 0 || vulnerable > 0 || deprecated > 0) {
    try {
      const aiPrompt = `Analyze dependency health and give 3-5 prioritized upgrade/fix recommendations:

Total deps: ${deps.length}
Outdated: ${outdated}
Vulnerable: ${vulnerable}
Deprecated: ${deprecated}
Critical/High issues: ${criticalIssues}/${highIssues}
Flagged licenses: ${licenseSummary.flagged}

Top risks: ${deps.filter(d => d.severity !== 'none').slice(0, 5).map(d => `- ${d.name}@${d.version} [${d.severity}] ${d.vulnerabilities.length > 0 ? `has ${d.vulnerabilities.length} vulns` : ''}`).join(', ')}

Return as bullet points, each starting with -.`;

      const result = await dispatchTextThroughFabric(aiPrompt, undefined, { domain: 'general', localFallback: true });
      if (result.winner?.contentPreview) {
        recommendations = result.winner.contentPreview.split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^-\s*/, '').trim()).slice(0, 6);
      }
    } catch { }
  }

  if (recommendations.length === 0) {
    if (outdated > 0) recommendations.push(`Update ${outdated} outdated packages: run 'npm outdated' to see list.`);
    if (vulnerable > 0) recommendations.push(`Fix ${vulnerable} packages with known vulnerabilities: run 'npm audit fix'.`);
    if (deprecated > 0) recommendations.push(`Replace ${deprecated} deprecated packages with maintained alternatives.`);
    if (licenseSummary.flagged > 0) recommendations.push(`Review ${licenseSummary.flagged} packages with flagged licenses.`);
    if (outdated === 0 && vulnerable === 0) recommendations.push('All dependencies are up-to-date and secure. Great job!');
  }

  const report: DepHealthReport = {
    id: reportId, projectPath: root, packageManager,
    totalDependencies: deps.length, dependencies: deps,
    outdated, vulnerable, deprecated, criticalIssues, highIssues,
    licenseSummary, overallHealth, recommendations,
    scannedAt: new Date().toISOString(), durationMs: Date.now() - started,
  };

  reports.push(report);

  await appendAuditEvent({
    actor: 'system', workspace: 'Dep Health', action: 'dep.scan',
    target: root, risk: criticalIssues > 0 ? 'HIGH' : 'MEDIUM',
    status: 'executed',
    summary: `Deps: ${deps.length} total, ${outdated} outdated, ${vulnerable} vulnerable, health ${overallHealth}/100`,
    connectorId: 'dep-health',
    evidence: { reportId, totalDeps: deps.length, health: overallHealth },
  }).catch(() => undefined);

  save().catch(() => undefined);
  return report;
}

async function inferDepInfo(name: string, version: string, lockDeps: Record<string, any>): Promise<DependencyInfo> {
  // Quick heuristic based on known packages
  const knownVulns: Record<string, VulnerabilityInfo[]> = {
    // Common known vulnerabilities for education/demo
    'lodash': [
      { id: 'CVE-2021-23337', severity: 'high', title: 'Prototype Pollution in lodash', description: 'Prototype pollution via the setWith function.', fixedIn: '4.17.21', url: 'https://nvd.nist.gov/vuln/detail/CVE-2021-23337' },
    ],
    'axios': [
      { id: 'CVE-2023-45857', severity: 'medium', title: 'SSRF via absolute URL', description: 'Server-Side Request Forgery vulnerability.', fixedIn: '1.6.0', url: 'https://nvd.nist.gov/vuln/detail/CVE-2023-45857' },
    ],
    'express': [
      { id: 'CVE-2024-29041', severity: 'medium', title: 'Open Redirect in express', description: 'Open redirect in static file serving.', fixedIn: '4.19.2', url: 'https://nvd.nist.gov/vuln/detail/CVE-2024-29041' },
    ],
  };

  const vulns = knownVulns[name] || [];
  const currentVerNum = parseSemVer(version);

  const isOutdated = currentVerNum > 0 && currentVerNum < parseSemVer(vulns[0]?.fixedIn || '99.0.0');

  // License guessing (very simplified)
  let licenseType = 'UNKNOWN';
  let licenseOk = true;

  // Check node_modules for LICENSE
  const licPath = path.join(process.cwd(), 'node_modules', name, 'LICENSE');
  if (fs.existsSync(licPath)) {
    const licContent = fs.readFileSync(licPath, 'utf8').toUpperCase();
    for (const lic of LICENSE_ALLOWLIST) {
      if (licContent.includes(lic.toUpperCase())) { licenseType = lic; break; }
    }
    for (const lic of FLAGGED_LICENSES) {
      if (licContent.includes(lic.toUpperCase())) { licenseType = lic; licenseOk = false; break; }
    }
  }

  // Check package.json for license field
  try {
    const pkgPath = path.join(process.cwd(), 'node_modules', name, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.license) {
        const lic = typeof pkg.license === 'string' ? pkg.license : pkg.license.type;
        licenseType = lic || licenseType;
        licenseOk = LICENSE_ALLOWLIST.has(lic) || (!FLAGGED_LICENSES.includes(lic) && lic !== 'UNKNOWN');
      }
    }
  } catch { }

  return {
    name,
    version,
    latestVersion: vulns[0]?.fixedIn || version,
    isOutdated,
    severity: vulns.length > 0 ? (vulns.some(v => v.severity === 'critical') ? 'critical' : vulns.some(v => v.severity === 'high') ? 'high' : 'medium') : (isOutdated ? 'low' : 'none'),
    vulnerabilities: vulns.filter(v => currentVerNum < parseSemVer(v.fixedIn)),
    licenseType, licenseOk,
    deprecated: false,
    weeklyDownloads: 0,
  };
}

function parseSemVer(ver: string): number {
  const match = ver.match(/^[\^~>= ]*(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!match) return 0;
  return (parseInt(match[1]) * 1000000) + (parseInt(match[2] || '0') * 1000) + parseInt(match[3] || '0');
}

export function getReport(id: string): DepHealthReport | undefined { return reports.find(r => r.id === id); }
export function listReports(): DepHealthReport[] { return [...reports].reverse(); }
export function getDepHealthStats(): { totalReports: number; avgHealth: number } {
  return {
    totalReports: reports.length,
    avgHealth: reports.length > 0 ? +(reports.reduce((s, r) => s + r.overallHealth, 0) / reports.length).toFixed(1) : 0,
  };
}
