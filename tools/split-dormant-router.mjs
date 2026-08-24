import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcPath = path.join(root, 'server/services/dormantServicesRouter.ts');
const src = fs.readFileSync(srcPath, 'utf8');
const dryRun = process.argv.includes('--dry-run');

// Guard: chống chạy lại trên file đã là hub (gây mất route)
if (/import\s*\{\s*register\w+Routes\s*\}/.test(src)) {
  console.error('ABORT: dormantServicesRouter.ts is already a hub. Restore the pre-split file first (git checkout HEAD -- server/services/dormantServicesRouter.ts) then delete server/services/dormant/ before re-splitting.');
  process.exit(1);
}

// 1. Extract all import statements (with symbols + module)
const imports = [];
for (const m of src.matchAll(/import\s+type\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"];?|import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"];?/g)) {
  const isType = m[1] !== undefined;
  const symbols = (isType ? m[1] : m[3]).split(',').map((s) => s.trim()).filter(Boolean);
  const file = isType ? m[2] : m[4];
  imports.push({ statement: m[0], symbols, file, isType });
}

// 2. Extract route blocks inside the register function
const fnStart = src.indexOf('export function registerDormantServicesRoutes');
let body = src.slice(fnStart);
// cắt dấu đóng hàm gốc để block route cuối không dính `}`
body = body.slice(0, body.lastIndexOf('}')).trimEnd();
const routeRe = /app\.(?:get|post|put|patch|delete)\(\s*['"](\/api\/dormant\/[^'"?]+)['"]/g;
const starts = [];
for (const m of body.matchAll(routeRe)) starts.push({ path: m[1], index: m.index });
const routeBlocks = [];
for (let i = 0; i < starts.length; i++) {
  const s = starts[i].index;
  const e = i + 1 < starts.length ? starts[i + 1].index : body.length;
  routeBlocks.push({ path: starts[i].path, text: body.slice(s, e) });
}

// 3. Domain mapping by path prefix (first match wins)
const DOMAINS = [
  ['integrations', ['/integrations/', '/figma-bridge/', '/media-hybrid/']],
  ['finance-accounting', ['/accounting/', '/approval/', '/industry-templates/', '/tax/', '/einvoice/', '/reconciliation/', '/predictive-accounting/', '/treasury/', '/vendor/', '/vat/', '/localization/', '/revenue-recognition/', '/investors/', '/ma/', '/credit-scoring/', '/esg/', '/finance/', '/bank-webhook/', '/smart-escrow/', '/yield-sweep/', '/transfer-pricing/', '/crypto-treasury/', '/capital-allocation/', '/revenue-orchestrator/']],
  ['sales-marketing', ['/sales/', '/telegram/', '/market/', '/brand/', '/seo/', '/social/', '/marketing-bot/', '/video-studio/', '/affiliate/', '/sentiment/', '/pricing/', '/support/', '/customer-health/', '/loyalty/', '/revenue-flywheel/', '/vmaf-video/', '/hyper-personalization/', '/competitive-war-room/', '/b2b-marketplace/', '/success-academy/', '/partners/', '/plg/', '/customer-dna/', '/pricing-optimization/', '/vc-matcher/', '/voice-bridge/', '/helpdesk/', '/nps/']],
  ['ai-knowledge', ['/agent-memory/', '/knowledge/', '/learning/', '/search-grounding/', '/rag-search/', '/rbac/', '/knowledge-bridge/', '/knowledge-graph/', '/nl-to-sql/']],
  ['devops', ['/deploy/', '/system/', '/cloud-cost/', '/code-diff/', '/agent-scheduler/', '/sqlite-cache/', '/robot-session-guard/', '/circuit-breaker/', '/infra/', '/webhooks/', '/iac-architect/', '/tech-debt/', '/db-shards/', '/edge/', '/mesh/', '/soc/', '/security/', '/chaos/', '/firewall/', '/a11y-audit/', '/iso-quality/', '/open-source/', '/web-vitals/', '/self-healing/', '/status', '/cloud-backup/']],
];
function domainOf(p) {
  const q = p.replace(/^\/api\/dormant/, '');
  for (const [name, prefixes] of DOMAINS) {
    for (const pre of prefixes) if (q.startsWith(pre)) return name;
  }
  return 'enterprise-autonomy';
}

// 4. Group route blocks by domain
const groups = new Map();
for (const rb of routeBlocks) {
  const d = domainOf(rb.path);
  if (!groups.has(d)) groups.set(d, []);
  groups.get(d).push(rb);
}

// 5. Build helper text
const HELPER = `function successResponse(res: Response, data: any) {
  return res.json({ success: true, ...data });
}

function errorResponse(res: Response, err: unknown, status = 500) {
  const message = err instanceof Error ? err.message : String(err);
  return res.status(status).json({ success: false, error: message });
}
`;

function genRouter(domain, blocks) {
  const usedSymbols = new Set();
  for (const b of blocks) {
    for (const imp of imports) {
      for (const s of imp.symbols) {
        if (new RegExp(`\\b${s}\\b`).test(b.text)) usedSymbols.add(s);
      }
    }
  }
  // imports needed: type imports (Express) always; value imports whose symbols are used
  const lines = [];
  for (const imp of imports) {
    if (imp.isType) continue;
    const needed = imp.symbols.filter((s) => usedSymbols.has(s));
    if (needed.length === 0) continue;
    const short = needed.join(', ');
    const rel = imp.file.startsWith('./') ? '../' + imp.file.slice(2) : imp.file;
    lines.push(`import { ${short} } from '${rel}';`);
  }
  const routeText = blocks.map((b) => '  ' + b.text.replace(/^\s*\n/, '').trimEnd()).join('\n\n');
  return `import type { Express, Request, Response } from 'express';
${lines.join('\n')}

${HELPER}
export function register${cap(domain)}Routes(app: Express): void {
${routeText}
}
`;
}

function cap(s) {
  return s.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join('');
}

// 6. Generate files
const outDir = path.join(root, 'server/services/dormant');
const hubImports = [];
const hubCalls = [];
for (const [domain, blocks] of groups) {
  const file = `dormant/${domain}Router.ts`;
  const content = genRouter(domain, blocks);
  hubImports.push(`import { register${cap(domain)}Routes } from './${file.replace(/\.ts$/, '')}.ts';`);
  hubCalls.push(`  register${cap(domain)}Routes(app);`);
  if (dryRun) {
    console.log(`=== ${file} (${blocks.length} routes) ===`);
  } else {
    fs.mkdirSync(path.dirname(path.join(root, 'server/services', file)), { recursive: true });
    fs.writeFileSync(path.join(root, 'server/services', file), content);
  }
}

const hub = `/**
 * server/services/dormantServicesRouter.ts
 * ============================================================
 * Hub router — delegates to domain routers under ./dormant/.
 * Generated by tools/split-dormant-router.mjs (read-only split).
 */

import type { Express } from 'express';
${hubImports.join('\n')}

export function registerDormantServicesRoutes(app: Express): void {
${hubCalls.join('\n')}
}
`;

if (dryRun) {
  console.log('\n=== domain summary ===');
  for (const [d, b] of groups) console.log(`  ${d}: ${b.length} routes`);
  console.log('\n=== new hub ===');
  console.log(hub);
} else {
  fs.writeFileSync(srcPath, hub);
  console.log('Generated domain routers under server/services/dormant/');
  for (const [d, b] of groups) console.log(`  ${d}: ${b.length} routes`);
  console.log('Rewrote dormantServicesRouter.ts as hub.');
}
