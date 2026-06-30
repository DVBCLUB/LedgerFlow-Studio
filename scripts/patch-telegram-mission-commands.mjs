#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const botFile = path.join(root, 'server/services/telegramBot.ts');
const source = fs.readFileSync(botFile, 'utf8');

const importLine = 'import { tryHandleTelegramMissionCommand } from "./telegramMissionCommands";';
let next = source;

function insertAfterFirstAnchor(anchors, insertion, label) {
  for (const anchor of anchors) {
    if (!next.includes(anchor)) continue;
    next = next.replace(anchor, `${anchor}\n${insertion}`);
    return;
  }
  throw new Error(`Cannot find ${label} in telegramBot.ts`);
}

if (!next.includes(importLine)) {
  insertAfterFirstAnchor([
    'import fs from "fs";',
    'import path from "path";',
    'import { diagnoseAIRouter } from "./aiRouter";',
  ], importLine, 'import anchor');
}

const hook = [
  '      if (await tryHandleTelegramMissionCommand(chatId, text, sendMessage)) {',
  '        return;',
  '      }',
].join('\n');

if (!next.includes('tryHandleTelegramMissionCommand(chatId, text, sendMessage)')) {
  const exactAnchor = [
    '    try {',
    '      switch (command.toLowerCase()) {',
  ].join('\n');
  if (next.includes(exactAnchor)) {
    next = next.replace(exactAnchor, [
      '    try {',
      hook,
      '      switch (command.toLowerCase()) {',
    ].join('\n'));
  } else if (next.includes('      switch (command.toLowerCase()) {')) {
    insertAfterFirstAnchor(['    try {'], hook, 'try block anchor');
  } else if (next.includes('const [command, ...args] = text.split(/\\s+/);')) {
    insertAfterFirstAnchor(['const [command, ...args] = text.split(/\\s+/);'], hook, 'command parse anchor');
  } else if (next.includes('const text = message.text.trim();')) {
    insertAfterFirstAnchor(['const text = message.text.trim();'], hook, 'text parse anchor');
  } else {
    throw new Error('Cannot find command switch anchor in telegramBot.ts');
  }
}

if (next === source) {
  console.log('telegramBot.ts already appears patched for mission commands.');
  process.exit(0);
}

fs.writeFileSync(botFile, next);
console.log('Patched telegramBot.ts with AI Workforce mission commands.');
console.log('Next: run npm run lint && npm run build');
