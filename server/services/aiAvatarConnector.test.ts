import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateAvatarPresentationJob } from './aiAvatarConnector.ts';

describe('aiAvatarConnector - AI Talking Head Avatar Connector', () => {
  it('generates a full avatar presentation job with scene breakdown and emotions', () => {
    const job = generateAvatarPresentationJob({
      title: 'Báo Cáo Điều Hành Tuần Của CEO',
      scriptLines: [
        'Xin chào quý vị, đây là bản tin tóm tắt điều hành tuần của LedgerFlow Studio.',
        'Tuần qua chúng ta đã hoàn thành 100% các chỉ tiêu doanh số và tính năng phần mềm.',
        'Hẹn gặp lại quý vị trong bản tin tuần tới.',
      ],
      avatarEngine: 'LIVEPORTRAIT_LOCAL',
    });

    assert.ok(job.jobId.startsWith('avt_'));
    assert.equal(job.avatarEngine, 'LIVEPORTRAIT_LOCAL');
    assert.equal(job.scenes.length, 3);
    assert.ok(job.totalDurationSeconds >= 9);
    assert.equal(job.status, 'READY_TO_RENDER');
  });
});
