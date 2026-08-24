import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getTelegramBotConfig,
  executeTelegramCommand,
} from './mobileMissionTelegramBot.ts';

test('mobileMissionTelegramBot - loads telegram bot configuration', async () => {
  const config = await getTelegramBotConfig();
  assert.equal(config.enabled, true);
  assert.ok(config.totalCommandsProcessed > 0);
});

test('mobileMissionTelegramBot - executes mobile telegram commands and returns format reply', async () => {
  const res = await executeTelegramCommand('/status');
  assert.equal(res.success, true);
  assert.ok(res.replyText.includes('Doanh thu'));

  const res2 = await executeTelegramCommand('/render_tiktok');
  assert.equal(res2.success, true);
  assert.ok(res2.replyText.includes('AI Media Director'));
});

