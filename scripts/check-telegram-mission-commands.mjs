#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
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
  const patch = spawnSync(process.execPath, [patcherFile], { cwd: root, stdio: 'inherit' });
  if (patch.status !== 0) {
    console.error('Failed to patch telegramBot.ts before checking mission command wiring.');
    failed = true;
  }
}

if (!failed) {
  const service = read(serviceFile);
  const required = [
    'tryHandleTelegramMissionCommand',
    'createAgentRun',
    'advanceAgentRun',
    'approveAgentRunStep',
    'rejectAgentRunStep',
    'stopAgentRun',
    'setAgentRuntimeEmergencyStop',
    'listRobotCapabilities',
    'getRobotCapability',
    'getAutomationSchedulerStatus',
    'runAutomationSchedulerTick',
    'startAutomationScheduler',
    'stopAutomationScheduler',
    "'/mission create",
    "'/mission approve",
    "'/mission reject",
    "'/robot capabilities",
    "'/automation scheduler status",
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
    console.error('telegramBot.ts must call tryHandleTelegramMissionCommand(chatId, text, sendMessage). Run node scripts/patch-telegram-mission-commands.mjs first.');
    failed = true;
  }
} else {
  console.error('Missing server/services/telegramBot.ts');
  failed = true;
}

if (failed) process.exit(1);
console.log('Telegram mission, robot and automation command service is wired into telegramBot.ts.');
