import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  conductExecutiveBoardroomSession,
  generateDailyStandupExecutiveBriefing,
  getExecutiveBoardroomSession,
  listExecutiveBoardroomSessions,
} from './aiExecutiveBoardroom.ts';

describe('AI Executive Boardroom Digital Twin', () => {
  it('conducts a full boardroom session with resolutions and board minutes', async () => {
    const session = await conductExecutiveBoardroomSession('2026 Growth & AI Swarm Operations Strategy');

    assert.ok(session.id.startsWith('board_'));
    assert.equal(session.status, 'completed');
    assert.ok(session.resolutions.length >= 2);
    assert.ok(session.boardMinutesMarkdown.includes('AI Executive Boardroom Minutes'));

    const reloaded = getExecutiveBoardroomSession(session.id);
    assert.ok(reloaded);
    assert.equal(reloaded?.id, session.id);

    const list = listExecutiveBoardroomSessions();
    assert.ok(list.length >= 1);
  });

  it('generates daily standup executive briefing for Solo Founder', async () => {
    const standup = await generateDailyStandupExecutiveBriefing();
    assert.ok(standup.id.startsWith('standup_'));
    assert.equal(standup.overallReadinessScore, 95);
    assert.ok(standup.markdownSummary.includes('Daily Executive Standup'));
    assert.ok(standup.audioSpeechScript.length > 20);
  });
});
