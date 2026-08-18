import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateTextQuality } from './languageToolValidator.ts';

describe('languageToolValidator - $0 Spell & Grammar Validator', () => {
  it('validates clean text with high score and publish-ready status', () => {
    const report = validateTextQuality('Hệ thống phần mềm kế toán tự động LedgerFlow Studio hoạt động rất tốt.');

    assert.ok(report.reportId.startsWith('lt_'));
    assert.equal(report.qualityScore, 100);
    assert.equal(report.isPublishReady, true);
    assert.equal(report.issues.length, 0);
  });

  it('detects Vietnamese common spelling mistakes and suggests replacements', () => {
    const report = validateTextQuality('Công ty chuẩn đoán tình hình tài chính có sơ xuất nhỏ.');

    assert.ok(report.issues.length >= 2);
    assert.ok(report.qualityScore < 100);
    assert.ok(report.issues.some((i) => i.replacements.includes('chẩn đoán') || i.replacements.includes('sơ suất')));
  });
});
