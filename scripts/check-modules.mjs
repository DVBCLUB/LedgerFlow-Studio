/**
 * scripts/check-modules.mjs
 * Kiểm tra cấu trúc thư mục modules/ và tính sẵn sàng của module manifests.
 */
import { readdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const modulesDir = path.resolve('modules');

if (!existsSync(modulesDir)) {
  console.error(`❌ Không tìm thấy thư mục modules/ tại: ${modulesDir}`);
  process.exit(1);
}

const folders = readdirSync(modulesDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

console.log('╔══════════════════════════════════════════════════╗');
console.log('║  LedgerFlow Module Readiness Doctor              ║');
console.log('╚══════════════════════════════════════════════════╝\n');

let loadedCount = 0;
let missingCount = 0;

for (const folder of folders) {
  const manifestPath = path.join(modulesDir, folder, 'module.ts');
  const hasManifest = existsSync(manifestPath);

  if (hasManifest) {
    console.log(`  [OK]       ${folder.padEnd(20)} -> Co module.ts manifest`);
    loadedCount++;
  } else {
    console.warn(`  [WARNING]  ${folder.padEnd(20)} -> THIEU module.ts manifest!`);
    missingCount++;
  }
}

console.log('\n----------------------------------------------------');
console.log(`  Tong cong: ${loadedCount} module hop le, ${missingCount} module thieu manifest.`);
if (missingCount > 0) {
  console.log('  Goi y: Hay tao module.ts manifest cho cac module can thiet.');
}
console.log('----------------------------------------------------\n');
