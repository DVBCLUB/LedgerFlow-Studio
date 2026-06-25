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
  next = next.replace(anchor, [anchor, importLine].join('\n'));
}

const hook = [
  '      if (await tryHandleTelegramMissionCommand(chatId, text, sendMessage)) {',
  '        return;',
  '      }',
].join('\n');

if (!next.includes('tryHandleTelegramMissionCommand(chatId, text, sendMessage)')) {
  const anchor = [
    '    try {',
    '      switch (command.toLowerCase()) {',
  ].join('\n');
  if (!next.includes(anchor)) throw new Error('Cannot find command switch anchor in telegramBot.ts');
  next = next.replace(anchor, [
    '    try {',
    hook,
    '      switch (command.toLowerCase()) {',
  ].join('\n'));
}

if (next === source) {
  console.log('telegramBot.ts already appears patched for mission commands.');
  process.exit(0);
}

fs.writeFileSync(botFile, next);
console.log('Patched telegramBot.ts with AI Workforce mission commands.');
console.log('Next: run npm run lint && npm run build');
