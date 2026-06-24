/**
 * performanceOptimizationProfiler.ts
 * ============================================================
 * Performance Optimization Profiler — AI-driven code
 * performance analysis và optimization suggestions.
 *
 * Analyzes: bundle size, slow patterns, memory usage,
 * async bottlenecks, redundant operations.
 */
import { randomUUID } from 'node:crypto';
import { dispatchTextThroughFabric } from './aiFabric';
import { searchCodebase } from './localSearchService';
import fs from 'fs';
import path from 'path';

// ─── Types ──────────────────────────────────────────────────────────
export interface PerformanceIssue {
  id: string;
  file: string;
  line: number;
  category: 'sync_blocking' | 'memory_leak' | 'n_plus_1' | 'excessive_loops' | 'large_library' | 'redundant_compute' | 'unoptimized_query';
  severity: 'critical' | 'high' | 'medium' | 'low';
  pattern: string;
  description: string;
  impact: string;
  fix: string;
  estimatedGain: string;  // e.g. "~40% faster"
}

export interface BundleAnalysis {
  file: string;
  sizeBytes: number;
  lines: number;
  imports: number;
  largestImports: Array<{ name: string; size: number }>;
  suggestions: string[];
}

export interface PerformanceProfile {
  id: string;
  scanTarget: string;
  filesAnalyzed: number;
  issues: PerformanceIssue[];
  bundleAnalysis: BundleAnalysis[];
  overallScore: number;        // 0-100
  criticalCount: number;
  highCount: number;
  estimatedTotalGain: string;
  recommendations: string[];
  scannedAt: string;
  durationMs: number;
}

// ─── Storage ────────────────────────────────────────────────────────
const FILE = path.join(process.cwd(), 'perf_profiles.json');
let profiles: PerformanceProfile[] = [];

async function load(): Promise<void> {
  try { if (fs.existsSync(FILE)) profiles = JSON.parse(await fs.promises.readFile(FILE, 'utf8')); } catch { }
}
load().catch(() => undefined);

async function save(): Promise<void> {
  await fs.promises.writeFile(FILE, JSON.stringify(profiles.slice(-20), null, 2), 'utf8');
}

// ─── Heuristic Detectors ────────────────────────────────────────────

function detectPerformanceIssues(filePath: string, content: string): PerformanceIssue[] {
  const issues: PerformanceIssue[] = [];
  const lines = content.split('\n');
  const sid = () => `pi_${Date.now()}_${randomUUID().slice(0, 6)}`;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 1. Sync blocking: execSync in Node
    if (line.includes('execSync(') || line.includes('.execSync(')) {
      issues.push({
        id: sid(), file: filePath, line: i + 1, category: 'sync_blocking', severity: 'high',
        pattern: 'execSync',
        description: 'Synchronous shell execution blocks the event loop.',
        impact: 'Blocks entire Node.js process while command runs. High latency impact.',
        fix: 'Replace execSync() with exec() or spawn() for async execution.',
        estimatedGain: '~80% latency reduction',
      });
    }

    // 2. Memory leak: global event listeners without cleanup
    if (line.includes('process.on(') && !line.includes('removeListener') && !line.includes('once(')) {
      issues.push({
        id: sid(), file: filePath, line: i + 1, category: 'memory_leak', severity: 'medium',
        pattern: 'process event listener without cleanup',
        description: 'Global event listener on process may cause memory leak if not cleaned up.',
        impact: 'Memory accumulation over time, especially with hot-reload or restart cycles.',
        fix: 'Store listener reference and call removeListener() on cleanup, or use once().',
        estimatedGain: 'Prevent ~50MB memory creep per day',
      });
    }

    // 3. N+1 query pattern: loop containing await inside
    if (line.includes('for') && lines[i + 1]?.includes('await')) {
      const hasAsync = lines.slice(i, Math.min(i + 5, lines.length)).some(l => l.includes('await'));
      if (hasAsync) {
        issues.push({
          id: sid(), file: filePath, line: i + 1, category: 'n_plus_1', severity: 'high',
          pattern: 'N+1 async calls in loop',
          description: 'Sequential async operations in a loop (N+1 pattern).',
          impact: 'Linear time growth with dataset size — each iteration adds network/IO round-trip.',
          fix: 'Use Promise.all(), batch operations, or process in chunks with concurrency control.',
          estimatedGain: '~70% speedup with Promise.all',
        });
      }
    }

    // 4. Excessive loops: nested loops beyond 2 levels
    if (line.match(/for\s*\(/) && lines.slice(i, Math.min(i + 30, lines.length)).filter(l => l.match(/^\s+for\s*\(/)).length >= 2) {
      issues.push({
        id: sid(), file: filePath, line: i + 1, category: 'excessive_loops', severity: 'medium',
        pattern: 'Deeply nested loops (3+ levels)',
        description: 'Multiple nested loops indicate O(n³) complexity.',
        impact: 'Cubic time growth with dataset size.',
        fix: 'Flatten data structure, use Map/Set for O(1) lookups, or pre-process data.',
        estimatedGain: '~90% speedup on large datasets',
      });
    }

    // 5. Large library: importing entire lodash/moment
    if (line.match(/import\s+\*\s+as\s+\w+\s+from\s+['"](lodash|moment|underscore|ramda|rxjs)['"]/)) {
      issues.push({
        id: sid(), file: filePath, line: i + 1, category: 'large_library', severity: 'low',
        pattern: 'Wildcard import of large library',
        description: 'Importing entire library increases bundle size.',
        impact: 'Added 70-300KB to bundle size.',
        fix: 'Use tree-shakeable imports: `import { debounce } from "lodash/debounce"`',
        estimatedGain: 'Reduce bundle by 70-200KB',
      });
    }

    // 6. Redundant compute: repeated computation in render/loop
    if (line.includes('.map') && line.includes('.filter') && line.includes('.map')) {
      issues.push({
        id: sid(), file: filePath, line: i + 1, category: 'redundant_compute', severity: 'low',
        pattern: 'Multiple array iterations',
        description: 'Chain of .map().filter().map() creates multiple array passes.',
        impact: '3x memory allocation and 3x iteration.',
        fix: 'Combine into single .reduce() or use for-of loop with early exit.',
        estimatedGain: '~60% memory reduction',
      });
    }

    // 7. Unoptimized query: large file read in hot path
    if (line.includes('readFileSync(') || line.includes('readdirSync(')) {
      issues.push({
        id: sid(), file: filePath, line: i + 1, category: 'sync_blocking', severity: 'high',
        pattern: 'Synchronous file I/O',
        description: 'Synchronous file operations block the event loop.',
        impact: 'Disk I/O latency (1-10ms) blocks all concurrent operations.',
        fix: 'Use readFile() or readdir() with async/await.',
        estimatedGain: '~95% reduced blocking',
      });
    }
  }

  // 8. Detect files > 1000 lines with many imports — bundle analysis hint
  if (lines.length > 1000) {
    const importCount = content.match(/^(?:import|const\s+\w+\s*=\s*require)/gm)?.length || 0;
    if (importCount > 30) {
      issues.push({
        id: sid(), file: filePath, line: 1, category: 'large_library', severity: 'medium',
        pattern: 'Very large file with many imports',
        description: `File has ${lines.length} lines and ${importCount} imports. Consider splitting.`,
        impact: 'Hard to maintain, slow to lint/compile, large cognitive load.',
        fix: 'Split into smaller modules by responsibility.',
        estimatedGain: 'Better maintainability and faster CI',
      });
    }
  }

  return issues;
}

function analyzeBundle(filePath: string, content: string, lines: string[]): BundleAnalysis {
  const importLines = lines.filter(l => l.trim().startsWith('import ') || l.trim().startsWith('const ') && l.includes('require'));
  const importNames = importLines.map(l => {
    const match = l.match(/from\s+['"]([^'"]+)['"]/) || l.match(/require\s*\(\s*['"]([^'"]+)['"]/);
    return match ? match[1] : 'unknown';
  });

  const largestImports = [...new Set(importNames)]
    .map(name => ({ name, size: importNames.filter(n => n === name).length * 20 }))
    .sort((a, b) => b.size - a.size)
    .slice(0, 8);

  const suggestions: string[] = [];
  if (importNames.includes('lodash')) suggestions.push('Replace full lodash import with specific function imports.');
  if (importNames.some(n => n.includes('moment'))) suggestions.push('Consider replacing moment.js with date-fns or native Intl.DateTimeFormat.');
  if (importNames.filter(n => n.includes('.' + '.')).length > 5) suggestions.push('Too many external deps. Audit unnecessary dependencies with depcheck.');

  return {
    file: filePath,
    sizeBytes: content.length,
    lines: lines.length,
    imports: importNames.length,
    largestImports,
    suggestions: suggestions.length > 0 ? suggestions : ['No specific optimization needed.'],
  };
}

// ─── Core API ───────────────────────────────────────────────────────

export async function profilePerformance(targetPattern: string, maxFiles = 5): Promise<PerformanceProfile> {
  const profileId = `perf_${Date.now()}`;
  const started = Date.now();

  const files = await searchCodebase(targetPattern.split(/[/\\]/).pop() || '.ts', maxFiles * 2);
  const issues: PerformanceIssue[] = [];
  const bundleAnalyses: BundleAnalysis[] = [];

  for (const file of files.slice(0, maxFiles)) {
    try {
      const fullPath = path.join(process.cwd(), file.relativePath);
      const content = await fs.promises.readFile(fullPath, 'utf8');
      const lines = content.split('\n');

      const fileIssues = detectPerformanceIssues(file.relativePath, content);
      issues.push(...fileIssues);

      bundleAnalyses.push(analyzeBundle(file.relativePath, content, lines));
    } catch { }
  }

  // AI-powered recommendations
  let aiRecommendations: string[] = [];
  if (issues.length > 0) {
    try {
      const aiPrompt = `Analyze these performance issues and give 3-5 prioritized recommendations:

ISSUES:
${issues.slice(0, 8).map(iss => `- [${iss.severity}] ${iss.file}:L${iss.line} — ${iss.pattern}: ${iss.description}`).join('\n')}

Return recommendations as bullet points, most impactful first, one per line starting with -.`;

      const result = await dispatchTextThroughFabric(aiPrompt, undefined, { domain: 'general', localFallback: true });
      if (result.winner?.contentPreview) {
        aiRecommendations = result.winner.contentPreview.split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^-\s*/, '').trim()).slice(0, 6);
      }
    } catch { }
  }

  if (aiRecommendations.length === 0) {
    aiRecommendations = [
      `Fix ${issues.filter(i => i.severity === 'critical').length} critical issues first.`,
      `Replace sync I/O and shell exec with async alternatives.`,
      `Use Promise.all() for parallel async operations.`,
    ];
  }

  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const highCount = issues.filter(i => i.severity === 'high').length;
  const overallScore = Math.max(0, 100 - criticalCount * 15 - highCount * 8 - issues.filter(i => i.severity === 'medium').length * 3);

  const profile: PerformanceProfile = {
    id: profileId,
    scanTarget: targetPattern,
    filesAnalyzed: files.length,
    issues,
    bundleAnalysis: bundleAnalyses,
    overallScore,
    criticalCount,
    highCount,
    estimatedTotalGain: `Fix all issues for ~${Math.min(95, criticalCount * 20 + highCount * 10 + issues.length * 3)}% estimated improvement.`,
    recommendations: aiRecommendations,
    scannedAt: new Date().toISOString(),
    durationMs: Date.now() - started,
  };

  profiles.push(profile);
  if (profiles.length % 3 === 0) save().catch(() => undefined);

  return profile;
}

export function getProfile(id: string): PerformanceProfile | undefined { return profiles.find(p => p.id === id); }
export function listProfiles(): PerformanceProfile[] { return [...profiles].reverse(); }
