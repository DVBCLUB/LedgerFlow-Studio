#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const packageFile = path.join(root, 'package.json');

if (!fs.existsSync(packageFile)) {
  console.error('Missing package.json');
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
const scripts = pkg.scripts || {};
const expected = {
  'ai:openclaw-plus': 'node scripts/openclaw-plus-doctor.mjs',
  'ai:openclaw-plus:full': 'node scripts/openclaw-plus-doctor.mjs --full',
  'ai:openclaw-plus:check': 'node scripts/openclaw-plus-doctor.mjs --skip-patch',
};

let failed = false;
for (const [name, command] of Object.entries(expected)) {
  if (scripts[name] !== command) {
    console.error(`Missing or mismatched script ${name}: expected "${command}"`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log('OpenClaw+ package scripts check completed.');
