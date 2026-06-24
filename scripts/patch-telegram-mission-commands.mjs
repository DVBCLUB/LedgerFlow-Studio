#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const botFile = path.join(root, 'server/services/telegramBot.ts');
const source = fs.readFileSync(botFile, 'utf8');

const importLine = 'import { tryHandleTelegramMissionCommand } from "./telegramMissionCommands";';
let next = source;

if (!next.includes(importLine)) {
  const anchor = 'import fs from "fs";';
  if (!next.includes(anchor)) throw new Error('Cannot find import anchor in telegramBot.ts');
  next = next.replace(anchor, `${anchor}\n${importLine}`);
}

const hook = `
      if (await tryHandleTelegramMissionCommand(chatId, text, sendMessage)) {
        return;
      }
`;

if (!next.includes('tryHandleTelegramMissionCommand(chatId, text, sendMessage)')) {
  const anchor = '    try {\n      switch (command.toLowerCase()) {';
  if (!next.includes(anchor)) throw new Error('Cannot find command switch anchor in telegramBot.ts');
  next = next.replace(anchor, `    try {${hook}\n      switch (command.toLowerCase()) {`);
}

const helpLine = '`/mission create "goal"` — Tạo AI Workforce mission';
if (!next.includes(helpLine)) {
  const anchor = '      \\`/status\\` — Xem trạng thái các AI provider';
  if (next.includes(anchor)) {
    next = next.replace(anchor, `      \\`/status\\` — Xem trạng thái các AI provider\n${helpLine}\n\\`/mission status latest\\` — Xem mission gần nhất\n\\`/mission approvals\\` — Xem approval đang chờ\n\\`/mission approve <runId> <stepId> <fingerprint>\\` — Duyệt step an toàn\n\\`/mission stop latest\\` — Dừng mission gần nhất\n\\`/ai emergency-stop on|off\\` — Khóa/mở AI Workforce`);
  }
}

if (next === source) {
  console.log('telegramBot.ts already appears patched for mission commands.');
  process.exit(0);
}

fs.writeFileSync(botFile, next);
console.log('Patched telegramBot.ts with AI Workforce mission commands.');
console.log('Next: run npm run lint && npm run build');
