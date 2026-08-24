#!/usr/bin/env node
/**
 * scripts/check-wiring.mjs
 * ─────────────────────────────────────────────────────────────
 * CI gate thực thi "Mandatory Wiring Rule" (AGENTS.md).
 *
 * Dùng baseline (artifacts/wiring-baseline.json) làm cơ chế "ratchet":
 *   - KHÔNG chặn các file sleeping ĐÃ CÓ (tồn tại trong baseline).
 *   - CHẶN (exit 1) khi:
 *       1. Thêm file mới nhưng không được đấu nối (dead / test-only / script-only).
 *       2. File đang wired/dormant/daemon-only bị mất đấu nối (regression → dead/test-only/script-only).
 *
 * Cách dùng:
 *   node scripts/check-wiring.mjs                    # kiểm tra (CI)
 *   node scripts/check-wiring.mjs --update-baseline  # cập nhật baseline sau khi review
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeWiringGraph } from '../tools/wiring-graph.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const baselinePath = path.join(root, 'artifacts', 'wiring-baseline.json');

const graph = computeWiringGraph();
const files = graph.files;

const updateBaseline = process.argv.includes('--update-baseline');
if (updateBaseline) {
  fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
  fs.writeFileSync(
    baselinePath,
    JSON.stringify({ generatedAt: new Date().toISOString(), counts: graph.counts, files }, null, 2)
  );
  console.log(`✅ Baseline updated: ${Object.keys(files).length} files classified.`);
  console.log(`   wired=${graph.counts.wired} dormant=${graph.counts.dormant} daemon-only=${graph.counts['daemon-only']} test-only=${graph.counts['test-only']} dead=${graph.counts.dead}`);
  process.exit(0);
}

if (!fs.existsSync(baselinePath)) {
  console.log('⚠️  Chưa có wiring baseline (artifacts/wiring-baseline.json).');
  console.log('   Chạy `npm run wiring:baseline` để tạo baseline, sau đó chạy lại `npm run check:wiring`.');
  console.log('   (Gate tạm thời pass để không chặn CI lần đầu.)');
  process.exit(0);
}

const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8')).files || {};

const sleeping = new Set(['dead', 'test-only', 'script-only']);
const wiredSet = new Set(['wired', 'dormant', 'daemon-only']);

const violations = [];
for (const [file, curr] of Object.entries(files)) {
  const prev = baseline[file];
  if (prev === undefined) {
    // File mới
    if (sleeping.has(curr)) {
      violations.push(`NEW sleeping code: ${file} (${curr}) — phải đấu nối route → UI → service → test, hoặc review + wiring:baseline.`);
    }
  } else if (wiredSet.has(prev) && sleeping.has(curr)) {
    violations.push(`WIRING REGRESSION: ${file} (${prev} → ${curr}) — mất đấu nối so với baseline.`);
  }
}

if (violations.length > 0) {
  console.error(`❌ Wiring gate FAILED — ${violations.length} vi phạm:`);
  for (const v of violations) console.error('   - ' + v);
  console.error('');
  console.error('   Khắc phục: đấu nối module (route → UI → service → test).');
  console.error('   Nếu cố ý để không đấu nối: review rồi chạy `npm run wiring:baseline`.');
  process.exit(1);
}

console.log(
  `✅ Wiring gate passed — ${Object.keys(files).length} files: wired=${graph.counts.wired} dormant=${graph.counts.dormant} daemon-only=${graph.counts['daemon-only']} test-only=${graph.counts['test-only']} dead=${graph.counts.dead}`
);
