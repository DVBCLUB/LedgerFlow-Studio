#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const serviceFile = path.join(root, 'server/services/telegramMissionCommands.ts');
const botFile = path.join(root, 'server/services/telegramBot.ts');
const patcherFile = path.join(root, 'scripts/patch-telegram-mission-commands.mjs');

function exists(file) {
  return fs.existsSync(file);
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

let failed = false;
if (!exists(serviceFile)) {
  console.error('Missing server/services/telegramMissionCommands.ts');
  failed = true;
}
if (!exists(patcherFile)) {
  console.error('Missing scripts/patch-telegram-mission-commands.mjs');
  failed = true;
}

if (!failed) {
  const service = read(serviceFile);
  const required = [
    'tryHandleTelegramMissionCommand',
    'createAgentRun',
    'advanceAgentRun',
    'approveAgentRunStep',
    'stopAgentRun',
    'setAgentRuntimeEmergencyStop',
    "'/mission create",
    "'/mission approve",
    "'/ai emergency-stop",
  ];
  for (const token of required) {
    if (!service.includes(token)) {
      console.error(`Telegram mission service missing token: ${token}`);
      failed = true;
    }
  }
}

if (exists(botFile)) {
  const bot = read(botFile);
  if (!bot.includes('tryHandleTelegramMissionCommand(chatId, text, sendMessage)')) {
    console.warn('Warning: telegramBot.ts is not patched yet. Run npm run ai:patch-telegram-missions locally.');
  }
}

if (failed) process.exit(1);
console.log('Telegram mission command service is present. If telegramBot.ts warning appears, run npm run ai:patch-telegram-missions.');
