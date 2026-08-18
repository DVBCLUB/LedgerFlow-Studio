import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { processVoiceCallTurn } from './ceoVoiceInteractiveBridge.ts';

describe('ceoVoiceInteractiveBridge - Hands-Free Voice Interaction', () => {
  it('identifies financial queries and returns spoken budget report', () => {
    const turn = processVoiceCallTurn({
      speakerRole: 'role_ai_cfo_director',
      spokenUserText: 'Em báo cáo nhanh ngân sách và dòng tiền hôm nay cho anh.',
    });

    assert.ok(turn.turnId.startsWith('vc_'));
    assert.equal(turn.recognizedIntent, 'STATUS_QUERY');
    assert.ok(turn.aiSpokenResponseVi.includes('dòng tiền'));
  });

  it('identifies task delegation intent and queues task', () => {
    const turn = processVoiceCallTurn({
      speakerRole: 'role_chief_of_staff',
      spokenUserText: 'Em giao việc cho AI Dev làm tính năng mới này nhé.',
    });

    assert.equal(turn.recognizedIntent, 'TASK_DELEGATION');
    assert.ok(turn.aiSpokenResponseVi.includes('Hàng Đợi Thông Minh'));
  });
});
