import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { healRobotActionSelector } from './robotVisionHealer.ts';

describe('Milestone 1: Robot Vision & OCR Self-Healing Engine', () => {
  it('heals broken selectors using OCR text vision matching', () => {
    const result = healRobotActionSelector({
      selector: '#broken-submit-btn-v1',
      targetLabel: 'Xuất Hóa Đơn PDF',
      pageContentText: 'Giao diện Quản lý Hóa đơn: [Xuất Hóa Đơn PDF] [Hủy Bỏ]',
    });

    assert.equal(result.originalSelector, '#broken-submit-btn-v1');
    assert.equal(result.targetLabel, 'Xuất Hóa Đơn PDF');
    assert.equal(result.method, 'vision_ocr_fuzzy');
    assert.ok(result.confidence >= 0.9);
  });
});
