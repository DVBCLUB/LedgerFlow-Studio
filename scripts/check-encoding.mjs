import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Only flag EXACT mojibake matches to avoid false positives with valid Vietnamese
const badPatterns = [
  'Trung tĂ¢m',
  'Äiá»u hĂ nh',
  'Há»“ sÆ¡',
  'nhĂ¢n sá»±',
  'NhĂ¢n sá»±',
  'CĂ´ng trĂ¬nh',
  'cĂ´ng trĂ¬nh',
  'Sáº£n pháº©m',
  'sáº£n pháº©m',
  'Dá»± Ă¡n',
  'dá»± Ă¡n',
  'KhĂ¡ch hĂ ng',
  'khĂ¡ch hĂ ng',
  'Chi phĂ\xad',
  'chi phĂ\xad',
  'TĂ i khoáº£n',
  'tĂ i khoáº£n',
  'Quáº£n lĂ½',
  'quáº£n lĂ½',
  'Ä\x90Ă¡nh giĂ¡',
  'đĂ¡nh giĂ¡',
  'Ä‘Ă¡nh giĂ¡'
];

const directoriesToScan = ['src', 'docs'];
const extensions = ['.ts', '.tsx', '.md', '.json', '.html', '.mdx'];
let errorsFound = 0;

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, callback);
    } else {
      callback(filePath);
    }
  }
}

function processFile(filePath) {
  const ext = path.extname(filePath);
  if (!extensions.includes(ext)) return;

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    for (const pattern of badPatterns) {
      if (content.includes(pattern)) {
        console.error(`[ERROR] Mojibake detected in ${filePath}: Found "${pattern}"`);
        errorsFound++;
      }
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
}

console.log('Checking for mojibake encoding errors...');
for (const dir of directoriesToScan) {
  const fullPath = path.join(rootDir, dir);
  walkDir(fullPath, processFile);
}

if (errorsFound > 0) {
  console.error(`\nCheck failed: Found ${errorsFound} encoding errors. Please fix them using standard UTF-8 Vietnamese characters.`);
  process.exit(1);
} else {
  console.log('Check passed: No mojibake found.');
  process.exit(0);
}
