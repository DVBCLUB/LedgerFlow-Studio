import fs from 'fs';
import path from 'path';

const root = process.cwd();
const failures = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function requireText(relativePath, needle, message) {
  if (!read(relativePath).includes(needle)) failures.push(`${relativePath}: ${message}`);
}

function forbidText(relativePath, needle, message) {
  if (read(relativePath).includes(needle)) failures.push(`${relativePath}: ${message}`);
}

const daemon = 'server/assistant-daemon.ts';
const telegram = 'server/services/telegramBot.ts';
const repair = 'server/services/autoRepairEngine.ts';
const files = 'server/services/safeFileManager.ts';

requireText(daemon, 'No reviewed AI suggestion', 'Apply must require a pending reviewed suggestion.');
requireText(daemon, 'hasPendingSuggestion: true', 'Create and IDE flows must return a pending preview.');
forbidText(daemon, 'await createFile(file, parsed.primaryCode.code)', 'Create must not write before explicit Apply.');
forbidText(telegram, 'await createFile(filePath, parsed.primaryCode.code)', 'Telegram create must not write before /apply.');
requireText(telegram, 'ctx.pendingSuggestions.set(absolutePath', 'Telegram create must store a pending preview.');
requireText(repair, 'execFile(', 'Validation commands must use execFile with fixed arguments.');
forbidText(repair, 'exec(command', 'Auto Repair must not execute shell command strings.');
requireText(files, 'if (strategy === "git-commit")', 'Git backup commits must be explicit opt-in.');
forbidText(files, 'strategy === "git-commit" || strategy === "auto"', 'Auto backup must not create Git commits.');

if (failures.length > 0) {
  console.error('\nAI Assistant safety check failed:\n');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('AI Assistant safety check passed: preview, approval, backup and command policies verified.');
