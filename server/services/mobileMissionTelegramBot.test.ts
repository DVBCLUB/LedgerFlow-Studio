import { describe, it, expect } from 'vitest';
import {
  getTelegramBotConfig,
  executeTelegramCommand,
} from './mobileMissionTelegramBot.ts';

describe('mobileMissionTelegramBot', () => {
  it('loads telegram bot configuration', async () => {
    const config = await getTelegramBotConfig();
    expect(config.enabled).toBe(true);
    expect(config.totalCommandsProcessed).toBeGreaterThan(0);
  });

  it('executes mobile telegram commands and returns format reply', async () => {
    const res = await executeTelegramCommand('/status');
    expect(res.success).toBe(true);
    expect(res.replyText).toContain('Doanh thu');

    const res2 = await executeTelegramCommand('/render_tiktok');
    expect(res2.success).toBe(true);
    expect(res2.replyText).toContain('AI Media Director');
  });
});
