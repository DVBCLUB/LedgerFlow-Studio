#!/usr/bin/env node
/**
 * tools/wiring-graph.mjs
 * ─────────────────────────────────────────────────────────────
 * LedgerFlow Service & Module Wiring Graph.
 *
 * Phân loại từng file nguồn sản phẩm thành:
 *   wired        — chạm được từ server.ts hoặc src/main.tsx (không qua dormant router)
 *   dormant      — chỉ chạm được QUA dormantServicesRouter.ts (ngăn kéo rác)
 *   daemon-only  — chỉ chạm được từ assistant-daemon / software-factory-daemon
 *   test-only    — không được import bởi entry nào, chỉ được import bởi file *.test.ts
 *   script-only  — chỉ được import bởi scripts/ tools/ desktop/ (consumer filesystem)
 *   dead         — không được import bởi bất kỳ file nào (orphan thật sự)
 *
 * Cách chạy:
 *   node tools/wiring-graph.mjs                 # in báo cáo + ghi artifacts/wiring-graph.json
 *   node tools/wiring-graph.mjs --dead-only     # chỉ in danh sách file dead
 *
 * Dùng làm nền cho scripts/check-wiring.mjs (CI gate).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// ─── Cấu hình ────────────────────────────────────────────────────

// Các thư mục chứa file cần PHÂN LOẠI (product source).
const CLASSIFIED_DIRS = ['server', 'src', 'core', 'modules'];
// Các thư mục + file gốc được quét để tạo import edge (consumer).
const SCAN_DIRS = ['server', 'src', 'core', 'modules', 'scripts', 'tools', 'desktop'];
const ROOT_SCAN_FILES = ['server.ts', 'recover.cjs', 'vite.config.ts', 'capacitor.config.ts', 'postcss.config.cjs'];

const EXCLUDE_DIRS = new Set(['node_modules', 'dist', 'release', 'build', 'android', 'ios', 'artifacts', 'public', 'test_suites', 'exports', 'supabase', 'plugins', 'migrations', 'content_studio', 'runtime']);
const SOURCE_EXT = /\.(ts|tsx|mts|cts|mjs|cjs|js)$/;

// Entry points: nơi ứng dụng thực sự khởi động.
const SERVER_ENTRIES = ['server.ts', 'server/server-optimized.ts'];
const FRONTEND_ENTRIES = ['src/main.tsx'];
const DAEMON_ENTRIES = [
  'server/assistant-daemon.ts',
  'server/assistant-daemon-desktop.ts',
  'server/software-factory-daemon.ts',
];

// File được tiêu thụ ở mức FILESYSTEM bởi scripts (không qua import).
// Giữ lại theo repo memory: không bao giờ coi là dead dù không có import.
const FILESYSTEM_CONSUMED = [
  'src/data/simulationRegistry.ts',
  'src/modules/ai-nhan-su/AIOperationsCenter.tsx',
  'src/app/featureRegistry.ts',
];

// ─── Thu thập file ──────────────────────────────────────────────

const fileSet = new Map(); // lowerAbs -> { abs, rel }
function normKey(abs) {
  return path.resolve(abs).toLowerCase();
}

function addFile(abs) {
  const key = normKey(abs);
  if (!fileSet.has(key)) {
    const rel = path.relative(root, abs).replaceAll(path.sep, '/');
    fileSet.set(key, { abs, rel });
  }
}

function walk(dir, out) {
  if (!fs.existsSync(dir)) return out;
  const relDir = path.relative(root, dir).replaceAll(path.sep, '/');
  if (EXCLUDE_DIRS.has(relDir) || EXCLUDE_DIRS.has(relDir.split('/')[0])) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full).replaceAll(path.sep, '/');
    if (rel.split('/')[0] === '.git') continue;
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      walk(full, out);
    } else if (SOURCE_EXT.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const scanned = [];
for (const d of SCAN_DIRS) walk(path.join(root, d), scanned);
for (const f of ROOT_SCAN_FILES) {
  const abs = path.join(root, f);
  if (fs.existsSync(abs)) scanned.push(abs);
}
for (const abs of scanned) addFile(abs);

// ─── Trích xuất import ──────────────────────────────────────────

const importRe = /(?:import\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]|export\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)|require\(\s*['"]([^'"]+)['"]\s*\))/g;

function resolveImport(fromFile, spec) {
  if (!spec) return null;
  let base;
  if (spec.startsWith('@/')) {
    // Path alias: '@/x' → <root>/x (tsconfig paths + vite alias)
    base = path.resolve(root, spec.slice(2));
  } else if (spec.startsWith('.')) {
    base = path.resolve(path.dirname(fromFile), spec);
  } else {
    return null; // node_modules hoặc absolute
  }
  const candidates = [];

  const push = (p) => {
    const k = normKey(p);
    if (k !== normKey(fromFile)) candidates.push(p);
  };

  // Exact (already has extension)
  if (SOURCE_EXT.test(spec)) {
    push(base);
  } else {
    for (const e of ['.ts', '.tsx', '.mts', '.cts', '.mjs', '.cjs', '.js']) push(base + e);
    for (const e of ['.ts', '.tsx', '.js']) push(path.join(base, 'index' + e));
  }

  // NodeNext: './foo.js' → './foo.ts' (repo dùng .js extension cho import TS)
  if (spec.endsWith('.js')) {
    const tsBase = base.replace(/\.js$/, '');
    for (const e of ['.ts', '.tsx', '.mts', '.cts']) push(tsBase + e);
    for (const e of ['.ts', '.tsx']) push(path.join(tsBase, 'index' + e));
  }

  // Trả file đầu tiên tồn tại thật sự
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  // fallback: khớp trong fileSet (kể cả khác hoa thường)
  for (const c of candidates) {
    if (fileSet.has(normKey(c))) return fileSet.get(normKey(c)).abs;
  }
  return null;
}

// graph: lowerKey(from) -> Set(lowerKey(to))
const graph = new Map();
for (const { abs } of fileSet.values()) {
  let content;
  try {
    content = fs.readFileSync(abs, 'utf8');
  } catch {
    continue;
  }
  const edges = new Set();
  importRe.lastIndex = 0;
  let m;
  while ((m = importRe.exec(content)) !== null) {
    const spec = m[1] || m[2] || m[3] || m[4];
    const target = resolveImport(abs, spec);
    if (target) edges.add(normKey(target));
  }
  graph.set(normKey(abs), edges);
}

// ─── Reachability ───────────────────────────────────────────────

function reachableFrom(entryRels, skip) {
  const seen = new Set();
  const stack = [];
  for (const rel of entryRels) {
    const key = normKey(path.join(root, rel));
    if (fileSet.has(key) && !seen.has(key)) {
      seen.add(key);
      stack.push(key);
    }
  }
  while (stack.length) {
    const cur = stack.pop();
    const edges = graph.get(cur) || new Set();
    for (const to of edges) {
      if (skip && to === skip) continue;
      if (seen.has(to)) continue;
      if (!fileSet.has(to)) continue;
      seen.add(to);
      stack.push(to);
    }
  }
  return seen;
}

const dormantRouterKey = normKey(path.join(root, 'server/services/dormantServicesRouter.ts'));

const serverReach = reachableFrom(SERVER_ENTRIES, null);
const serverReachNoDormant = reachableFrom(SERVER_ENTRIES, dormantRouterKey);
const frontendReach = reachableFrom(FRONTEND_ENTRIES, null);
const daemonReach = reachableFrom(DAEMON_ENTRIES, null);

// Dynamic module loader: mỗi modules/*/module.ts (root) là một entry
const moduleEntries = [];
const rootModulesDir = path.join(root, 'modules');
if (fs.existsSync(rootModulesDir)) {
  for (const d of fs.readdirSync(rootModulesDir, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const manifest = path.join(rootModulesDir, d.name, 'module.ts');
    if (fs.existsSync(manifest)) moduleEntries.push(path.relative(root, manifest).replaceAll(path.sep, '/'));
  }
}
const moduleReach = reachableFrom(moduleEntries, null);

// Consumer: scripts / tools / desktop / root files
const consumerReach = new Set();
for (const { abs, rel } of fileSet.values()) {
  if (rel.startsWith('scripts/') || rel.startsWith('tools/') || rel.startsWith('desktop/') || ROOT_SCAN_FILES.includes(rel)) {
    const edges = graph.get(normKey(abs)) || new Set();
    for (const to of edges) consumerReach.add(to);
  }
}

// Test consumer
const testReach = new Set();
for (const { abs, rel } of fileSet.values()) {
  if (/\.test\.(ts|tsx)$/.test(rel)) {
    const edges = graph.get(normKey(abs)) || new Set();
    for (const to of edges) testReach.add(to);
  }
}

// ─── Phân loại ──────────────────────────────────────────────────

const CLASSIFIED_RE = /^(server|src|core|modules)\//;
const isClassified = (rel) => CLASSIFIED_RE.test(rel);
const isTest = (rel) => /\.test\.(ts|tsx)$/.test(rel);
const isAmbient = (rel) => /\.d\.ts$/.test(rel);

const results = [];
for (const { abs, rel } of fileSet.values()) {
  if (!isClassified(rel)) continue;
  if (isTest(rel)) continue;
  if (isAmbient(rel)) continue;
  const key = normKey(abs);
  let status;
  if (FILESYSTEM_CONSUMED.includes(rel)) {
    status = 'wired';
  } else if (serverReachNoDormant.has(key) || frontendReach.has(key)) {
    status = 'wired';
  } else if (serverReach.has(key)) {
    status = 'dormant'; // chỉ chạm được qua dormantServicesRouter
  } else if (daemonReach.has(key) || moduleReach.has(key)) {
    status = 'daemon-only';
  } else if (testReach.has(key)) {
    status = 'test-only';
  } else if (consumerReach.has(key)) {
    status = 'script-only';
  } else {
    status = 'dead';
  }
  results.push({ file: rel, status });
}

results.sort((a, b) => a.file.localeCompare(b.file));

const STATUSES = ['wired', 'dormant', 'daemon-only', 'test-only', 'script-only', 'dead'];
const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
for (const r of results) counts[r.status] += 1;

// ─── Xuất báo cáo ───────────────────────────────────────────────

function printReport(deadOnly) {
  if (!deadOnly) {
    console.log('LedgerFlow Wiring Graph — classification report');
    console.log('================================================');
    for (const [status, n] of Object.entries(counts).sort()) {
      console.log(`  ${status.padEnd(12)} ${n}`);
    }
    console.log('------------------------------------------------');
    console.log('  total (classified)'.padEnd(14), results.length);
    console.log('');
  }
  const dead = results.filter((r) => r.status === 'dead');
  const dormant = results.filter((r) => r.status === 'dormant');
  const testOnly = results.filter((r) => r.status === 'test-only');

  if (deadOnly) {
    for (const r of dead) console.log(r.file);
    return;
  }

  console.log(`\nDEAD files (${dead.length}) — không được import bởi bất kỳ đâu:`);
  for (const r of dead.slice(0, 400)) console.log('  ' + r.file);
  if (dead.length > 400) console.log(`  ... còn ${dead.length - 400} file nữa.`);

  console.log(`\nDORMANT files (${dormant.length}) — chỉ chạm được qua dormantServicesRouter:`);
  for (const r of dormant.slice(0, 200)) console.log('  ' + r.file);
  if (dormant.length > 200) console.log(`  ... còn ${dormant.length - 200} file nữa.`);

  console.log(`\nTEST-ONLY files (${testOnly.length}) — chỉ được import bởi file test:`);
  for (const r of testOnly.slice(0, 100)) console.log('  ' + r.file);
}

export function computeWiringGraph() {
  const byFile = {};
  for (const r of results) byFile[r.file] = r.status;
  return { generatedAt: new Date().toISOString(), counts, files: byFile, results };
}

/**
 * Trả về danh sách file (rel path) import một file nguồn, dùng cho việc
 * xác định "leaf" (chỉ được import bởi dormantServicesRouter) trước khi xoá.
 */
export function getImportersOf(relPath) {
  const key = normKey(path.join(root, relPath));
  const importers = new Set();
  for (const [from, edges] of graph) {
    if (edges.has(key)) importers.add(from);
  }
  const out = [];
  for (const imp of importers) {
    const f = fileSet.get(imp);
    if (f) out.push(f.rel);
  }
  return out;
}

// ─── CLI ────────────────────────────────────────────────────────

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const deadOnly = process.argv.includes('--dead-only');
  printReport(deadOnly);
  if (!deadOnly) {
    const outPath = path.join(root, 'artifacts', 'wiring-graph.json');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(computeWiringGraph(), null, 2));
    console.log(`\nWrote ${path.relative(root, outPath)}`);
  }
}
