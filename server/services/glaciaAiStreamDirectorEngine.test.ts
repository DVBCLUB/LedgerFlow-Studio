import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  loadStreamSession,
  triggerLiveStreamEvent,
} from './glaciaAiStreamDirectorEngine.ts';

describe('glaciaAiStreamDirectorEngine - Level 5 Autonomous Streamer & AI Director', () => {
  it('loads live stream session with viewers, chat, and AI director telemetry', () => {
    const session = loadStreamSession();
    assert.ok(session.id.startsWith('stream-'));
    assert.equal(session.status, 'live');
    assert.ok(session.currentViewerCount > 0);
    assert.ok(session.recentChat.length >= 3);
    assert.ok(session.highlights.length >= 2);
  });

  it('triggers viewer donation and calculates speech reaction', () => {
    const session = triggerLiveStreamEvent({
      eventType: 'donation',
      sender: 'ProGamerVN',
      amount: 25,
      text: 'Chúc em Glacia live stream vui vẻ!',
    });

    assert.ok(session.totalDonationsUsd >= 25);
    assert.ok(session.currentGlaciaSpeech.includes('ProGamerVN'));
    assert.equal(session.currentEmotion, 'celebrating');
  });

  it('adjusts AI director modifier and logs dynamic difficulty change', () => {
    const session = triggerLiveStreamEvent({
      eventType: 'director_modifier',
      modifier: 'boss_invasion',
    });

    assert.equal(session.aiDirectorState.activeModifier, 'boss_invasion');
    assert.ok(session.currentGlaciaSpeech.includes('BOSS_INVASION'));
  });

  it('captures an automated 15-second highlight reel recipe', () => {
    const session = triggerLiveStreamEvent({
      eventType: 'capture_highlight',
    });

    assert.ok(session.highlights.length >= 3);
    assert.ok(session.highlights[0].ffmpegClipCommand.includes('ffmpeg'));
  });
});
