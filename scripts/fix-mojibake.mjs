import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Common Mojibake mappings (UTF-8 bytes interpreted as Latin-1/Windows-1252)
// This is a partial map targeting the most common Vietnamese mojibake.
const replacements = {
  'Trung tĂ¢m': 'Trung tâm',
  'Äiá»u hĂ nh': 'Điều hành',
  'Há»“ sÆ¡': 'Hồ sơ',
  'nhĂ¢n sá»±': 'nhân sự',
  'NhĂ¢n sá»±': 'Nhân sự',
  'CĂ´ng trĂ¬nh': 'Công trình',
  'cĂ´ng trĂ¬nh': 'công trình',
  'Sáº£n pháº©m': 'Sản phẩm',
  'sáº£n pháº©m': 'sản phẩm',
  'Dá»± Ă¡n': 'Dự án',
  'dá»± Ă¡n': 'dự án',
  'KhĂ¡ch hĂ ng': 'Khách hàng',
  'khĂ¡ch hĂ ng': 'khách hàng',
  'Chi phĂ\xad': 'Chi phí',
  'chi phĂ\xad': 'chi phí',
  'TĂ i khoáº£n': 'Tài khoản',
  'tĂ i khoáº£n': 'tài khoản',
  'Quáº£n lĂ½': 'Quản lý',
  'quáº£n lĂ½': 'quản lý',
  'Ä\x90Ă¡nh giĂ¡': 'Đánh giá',
  'đĂ¡nh giĂ¡': 'đánh giá',
  'Ä‘Ă¡nh giĂ¡': 'đánh giá',
};

const directoriesToScan = ['src', 'docs'];
const extensions = ['.ts', '.tsx', '.md', '.json', '.html', '.mdx'];
let filesFixed = 0;
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
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fileHasMojibake = false;

    // Direct string replace for known mojibake
    for (const [mojibake, correct] of Object.entries(replacements)) {
      if (content.includes(mojibake)) {
        content = content.split(mojibake).join(correct);
        fileHasMojibake = true;
      }
    }

    // Generic character fallback regex for anything not in the dictionary
    const genericMojibakeRegex = /(Ă¢|Äi|á»|Há»|Æ¡|Ă¡|Ă³|Ă¬|Ăº|Ă½|Ăª|Ă´|Ă|Ä\x90|Ä‘|áº|áº¡|áº£|áº¥|áº§|áº©|áº«|áº|áº¯|áº±|áº³|áºµ|áº·|Ă¨|Ă©|áº»|áº½|áº¹|á»|á»\x81|á»\x83|á»\x85|á»\x87|Ă¬|Ă\xad|á»\x89|Ä©|á»\x8b|Ă²|Ă³|á»\x8f|Ăµ|á»\x8d|Ă´|á»\x93|á»\x95|á»\x97|á»\x99|Æ¡|á»\x9d|á»\x9f|á»\xa1|á»£|Ă¹|Ăº|á»§|Å©|á»¥|Æ°|á»«|á»\xad|á»¯|á»±|á»³|Ă½|á»·|á»¹|á»µ)/g;
    
    if (genericMojibakeRegex.test(content) || fileHasMojibake) {
      if (content !== originalContent) {
         fs.writeFileSync(filePath, content, 'utf8');
         console.log(`[FIXED] ${filePath}`);
         filesFixed++;
      } else {
         console.log(`[WARNING] Mojibake characters detected but not in exact dictionary: ${filePath}`);
         errorsFound++;
      }
    }

  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
}

console.log('Scanning for mojibake...');
for (const dir of directoriesToScan) {
  const fullPath = path.join(rootDir, dir);
  walkDir(fullPath, processFile);
}

console.log(`\nScan complete. Fixed ${filesFixed} files. Found ${errorsFound} warnings.`);
