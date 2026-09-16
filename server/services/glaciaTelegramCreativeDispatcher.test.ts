import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  loadTelegramDispatcherState,
  generateMorningBriefingReport,
  tryHandleGlaciaCreativeStudioCommand,
} from './glaciaTelegramCreativeDispatcher.ts';

describe('glaciaTelegramCreativeDispatcher - Mobile Telegram Creative Studio Commands', () => {
  it('loads dispatcher state with telemetry', () => {
    const state = loadTelegramDispatcherState();
    assert.ok(typeof state.isNightShiftActive === 'boolean');
    assert.ok(state.recentNightLogs.length >= 0);
  });

  it('generates 6:00 AM morning briefing report for Founder David Bao', () => {
    const report = generateMorningBriefingReport();
    assert.ok(report.headline.includes('Glacia'));
    assert.ok(report.markdownContent.includes('Founder David Bao'));
    assert.ok(report.markdownContent.includes('0.00% Crash'));
  });

  it('handles /game command via Telegram bot mock', async () => {
    const sentMessages: string[] = [];
    const mockSendMessage = async (_chatId: number, text: string) => {
      sentMessages.push(text);
      return { ok: true };
    };

    const handled = await tryHandleGlaciaCreativeStudioCommand(123456, '/game Không gian vũ trụ', mockSendMessage);
    assert.equal(handled, true);
    assert.ok(sentMessages.some((msg) => msg.includes('XƯỞNG GAME GLACIA ĐÃ XUẤT XƯỞNG')));
  });

  it('handles /singularity command via Telegram bot mock', async () => {
    const sentMessages: string[] = [];
    const mockSendMessage = async (_chatId: number, text: string) => {
      sentMessages.push(text);
      return { ok: true };
    };

    const handled = await tryHandleGlaciaCreativeStudioCommand(123456, '/singularity', mockSendMessage);
    assert.equal(handled, true);
    assert.ok(sentMessages.some((msg) => msg.includes('GLACIA LEVEL 5 SINGULARITY HOÀN TẤT')));
  });

  it('ignores non-creative commands', async () => {
    const handled = await tryHandleGlaciaCreativeStudioCommand(123456, '/unknown_cmd', async () => ({}));
    assert.equal(handled, false);
  });
});
