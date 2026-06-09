import fs from 'fs';
import path from 'path';
import os from 'os';

const root = process.cwd();
const releaseDir = path.join(root, 'release');
const platform = process.env.LEDGERFLOW_RELEASE_PLATFORM || os.platform();
const errors = [];
const warnings = [];

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(fullPath);
    return fullPath;
  });
}

if (!fs.existsSync(releaseDir)) {
  errors.push('Missing release directory. Electron Builder did not create release/.');
}

const files = listFiles(releaseDir).map((file) => path.relative(releaseDir, file).replaceAll(path.sep, '/'));

const expectations = {
  win32: {
    label: 'Windows',
    requiredExtensions: ['.exe'],
    optionalExtensions: ['.blockmap'],
    requiredNamePart: 'LedgerFlow-Hub'
  },
  darwin: {
    label: 'macOS',
    requiredExtensions: ['.dmg'],
    optionalExtensions: ['.blockmap'],
    requiredNamePart: 'LedgerFlow-Hub'
  },
  linux: {
    label: 'Linux',
    requiredExtensions: ['.AppImage'],
    optionalExtensions: ['.blockmap'],
    requiredNamePart: 'LedgerFlow-Hub'
  }
};

const expectation = expectations[platform] || expectations[os.platform()];

if (!expectation) {
  warnings.push(`No release artifact expectation configured for platform: ${platform}`);
} else {
  for (const extension of expectation.requiredExtensions) {
    const matches = files.filter((file) => file.endsWith(extension));
    if (matches.length === 0) {
      errors.push(`Missing ${expectation.label} release artifact with extension ${extension}.`);
    }

    const namedMatches = matches.filter((file) => file.includes(expectation.requiredNamePart));
    if (matches.length > 0 && namedMatches.length === 0) {
      errors.push(`${expectation.label} release artifact exists but does not include ${expectation.requiredNamePart} in file name.`);
    }
  }

  const optionalFound = expectation.optionalExtensions.some((extension) => files.some((file) => file.endsWith(extension)));
  if (!optionalFound) {
    warnings.push(`${expectation.label} build did not produce optional update metadata/blockmap files.`);
  }
}

const oversizedFiles = files
  .map((file) => {
    const size = fs.statSync(path.join(releaseDir, file)).size;
    return { file, size };
  })
  .filter((entry) => entry.size > 800 * 1024 * 1024);

for (const entry of oversizedFiles) {
  warnings.push(`${entry.file} is larger than 800MB. Check whether node_modules packaging is too heavy.`);
}

if (warnings.length > 0) {
  console.warn('\nLedgerFlow release artifact warnings:\n');
  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }
}

if (errors.length > 0) {
  console.error('\nLedgerFlow release artifact check failed:\n');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  console.error('\nFix Electron Builder output before uploading release artifacts.\n');
  process.exit(1);
}

console.log(`LedgerFlow release artifact check passed for ${expectation?.label || platform}: ${files.length} release files detected.`);
