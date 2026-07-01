#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

function argValue(name, fallback = '') {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  return process.argv[index + 1] ?? fallback;
}

function toInt(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(1, Math.floor(num));
}

function ensureDirFor(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function listJsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listJsonFiles(full));
      continue;
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith('.json')) {
      results.push(full);
    }
  }
  return results;
}

function safeJsonRead(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function bump(map, key) {
  map.set(key, (map.get(key) || 0) + 1);
}

const cwd = process.cwd();
const days = toInt(argValue('--days', '7'), 7);
const inputDir = path.resolve(cwd, argValue('--input-dir', 'artifacts/pr-readiness/history'));
const outputJson = path.resolve(cwd, argValue('--output-json', 'artifacts/pr-readiness/weekly-summary.json'));
const outputMd = path.resolve(cwd, argValue('--output-md', 'artifacts/pr-readiness/weekly-summary.md'));
const ingestFile = argValue('--ingest-file', '');
const ingestId = argValue('--ingest-id', `${Date.now()}`);

if (ingestFile) {
  const ingestAbs = path.resolve(cwd, ingestFile);
  if (fs.existsSync(ingestAbs)) {
    fs.mkdirSync(inputDir, { recursive: true });
    const target = path.join(inputDir, `metrics-${ingestId}.json`);
    fs.copyFileSync(ingestAbs, target);
  }
}

const now = Date.now();
const windowStart = now - days * 24 * 60 * 60 * 1000;
const files = listJsonFiles(inputDir);
const records = [];
for (const filePath of files) {
  const data = safeJsonRead(filePath);
  if (!data || typeof data !== 'object') continue;
  const generatedAtMs = Date.parse(String(data.generatedAt || ''));
  if (!Number.isFinite(generatedAtMs)) continue;
  if (generatedAtMs < windowStart) continue;
  records.push({ filePath, data, generatedAtMs });
}

records.sort((a, b) => a.generatedAtMs - b.generatedAtMs);

const statusCounts = new Map();
const riskCounts = new Map();
const failureTypeCounts = new Map();
const failedCommandCounts = new Map();

for (const rec of records) {
  bump(statusCounts, String(rec.data.status || 'unknown'));
  bump(riskCounts, String(rec.data.riskLevel || 'unknown'));
  const failureType = String(rec.data.failure?.type || 'unknown');
  bump(failureTypeCounts, failureType);
  const failedCommand = rec.data.failure?.failedCommand;
  if (failedCommand) bump(failedCommandCounts, String(failedCommand));
}

const topFailedCommands = [...failedCommandCounts.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 8)
  .map(([command, count]) => ({ command, count }));

const summary = {
  generatedAt: new Date().toISOString(),
  window: {
    days,
    start: new Date(windowStart).toISOString(),
    end: new Date(now).toISOString(),
  },
  inputDir,
  filesScanned: files.length,
  runsInWindow: records.length,
  counts: {
    status: Object.fromEntries(statusCounts),
    riskLevel: Object.fromEntries(riskCounts),
    failureType: Object.fromEntries(failureTypeCounts),
  },
  topFailedCommands,
  latestRun: records.length ? records[records.length - 1].data : null,
};

const mdLines = [
  '# PR Readiness Weekly Trend',
  '',
  `- Generated at: ${summary.generatedAt}`,
  `- Window: last ${days} day(s)`,
  `- Runs in window: ${summary.runsInWindow}`,
  `- Files scanned: ${summary.filesScanned}`,
  '',
  '## Failure Type Counts',
];

const failureEntries = Object.entries(summary.counts.failureType);
if (failureEntries.length) {
  for (const [type, count] of failureEntries.sort((a, b) => b[1] - a[1])) {
    mdLines.push(`- ${type}: ${count}`);
  }
} else {
  mdLines.push('- (none)');
}

mdLines.push('', '## Status Counts');
const statusEntries = Object.entries(summary.counts.status);
if (statusEntries.length) {
  for (const [status, count] of statusEntries.sort((a, b) => b[1] - a[1])) {
    mdLines.push(`- ${status}: ${count}`);
  }
} else {
  mdLines.push('- (none)');
}

mdLines.push('', '## Risk Level Counts');
const riskEntries = Object.entries(summary.counts.riskLevel);
if (riskEntries.length) {
  for (const [risk, count] of riskEntries.sort((a, b) => b[1] - a[1])) {
    mdLines.push(`- ${risk}: ${count}`);
  }
} else {
  mdLines.push('- (none)');
}

mdLines.push('', '## Top Failed Commands');
if (topFailedCommands.length) {
  for (const item of topFailedCommands) {
    mdLines.push(`- ${item.command}: ${item.count}`);
  }
} else {
  mdLines.push('- (none)');
}

ensureDirFor(outputJson);
ensureDirFor(outputMd);
fs.writeFileSync(outputJson, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
fs.writeFileSync(outputMd, `${mdLines.join('\n')}\n`, 'utf8');

console.log(`[pr-readiness-trend] runs in window: ${summary.runsInWindow}`);
console.log(`[pr-readiness-trend] json: ${path.relative(cwd, outputJson)}`);
console.log(`[pr-readiness-trend] md: ${path.relative(cwd, outputMd)}`);
