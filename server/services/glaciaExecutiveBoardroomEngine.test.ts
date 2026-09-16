import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  conveneBoardroomSession,
  listBoardroomSessions,
} from './glaciaExecutiveBoardroomEngine.ts';

describe('Glacia Multi-Agent Voice Executive Boardroom (Epoch 7)', () => {
  it('convenes a full boardroom session with 4 distinct C-Level AI Advisors (CTO, CFO, CMO, CLO)', () => {
    const session = conveneBoardroomSession('Triển khai gói Freemium $0 Token cho 10,000 công ty xây dựng');

    assert.ok(session.sessionId.startsWith('session-board-'));
    assert.equal(session.advisors.length, 4);
    assert.equal(session.debateTranscript.length, 4);
    assert.ok(session.debateTranscript.some((s) => s.advisorRole === 'CTO'));
    assert.ok(session.debateTranscript.some((s) => s.advisorRole === 'CFO'));
    assert.ok(session.debateTranscript.some((s) => s.advisorRole === 'CMO'));
    assert.ok(session.debateTranscript.some((s) => s.advisorRole === 'CLO_CSO'));
  });

  it('performs consensus voting and generates executive synthesis for CEO David Bao', () => {
    const session = conveneBoardroomSession('Tự động hóa toàn bộ đối soát VietQR và phát hành hóa đơn điện tử');

    assert.equal(session.consensusVoting.verdict, 'APPROVED');
    assert.ok(session.consensusVoting.inFavor >= 3);
    assert.ok(session.executiveSummaryForCEO.includes('đồng thuận'));
    assert.ok(session.suggestedActionItems.length >= 2);
  });

  it('persists and retrieves boardroom sessions history cleanly', () => {
    const list = listBoardroomSessions();
    assert.ok(list.length >= 1);
    assert.ok(list[0].strategicQuestion.length > 5);
  });
});
