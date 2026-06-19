import fs from 'fs';
import path from 'path';

const root = process.cwd();

const requiredGroups = [
  {
    name: 'sql.js SQLite WASM runtime',
    docs: 'docs/OFFLINE_VENDOR_ASSETS_CHECKLIST.md#required-sqljs-assets',
    files: [
      'public/vendor/sql.js/sql-wasm.js',
      'public/vendor/sql.js/sql-wasm.wasm'
    ]
  },
  {
    name: 'Pyodide Python WASM runtime',
    docs: 'docs/OFFLINE_VENDOR_ASSETS_CHECKLIST.md#required-pyodide-assets',
    files: [
      'public/vendor/pyodide/v0.26.2/full/pyodide.js',
      'public/vendor/pyodide/v0.26.2/full/pyodide.asm.js',
      'public/vendor/pyodide/v0.26.2/full/pyodide.asm.wasm',
      'public/vendor/pyodide/v0.26.2/full/python_stdlib.zip',
      'public/vendor/pyodide/v0.26.2/full/pyodide-lock.json'
    ]
  }
];

const missing = [];

for (const group of requiredGroups) {
  for (const file of group.files) {
    if (!fs.existsSync(path.join(root, file))) {
      missing.push({ group: group.name, file, docs: group.docs });
    }
  }
}

if (missing.length > 0) {
  console.error('\nLedgerFlow fully-offline vendor asset check failed:\n');
  for (const item of missing) {
    console.error(`- Missing ${item.group}: ${item.file}`);
  }
  console.error('\nAdd the missing local assets before claiming the Windows desktop build is fully offline.');
  console.error('See docs/OFFLINE_VENDOR_ASSETS_CHECKLIST.md for the vendoring checklist.\n');
  process.exit(1);
}

console.log('LedgerFlow fully-offline vendor asset check passed: sql.js and Pyodide local runtime files are present.');
