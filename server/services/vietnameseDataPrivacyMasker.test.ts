import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  maskSensitiveData,
  unmaskSensitiveData,
  auditPrivacyCompliance,
} from './vietnameseDataPrivacyMasker.ts';

describe('vietnameseDataPrivacyMasker - Decree 13/2023/ND-CP Privacy Protection', () => {
  it('masks CCCD, phone numbers, tax codes, and emails accurately', () => {
    const rawText =
      'Nhân viên Nguyễn Văn A, CCCD: 001092001234, SĐT: 0987654321, MST: 0102030405, Email: nguyenvana@company.vn.';

    const result = maskSensitiveData(rawText);

    assert.ok(result.maskedItemsCount >= 4);
    assert.ok(!result.maskedText.includes('001092001234'));
    assert.ok(!result.maskedText.includes('0987654321'));
    assert.ok(!result.maskedText.includes('0102030405'));
    assert.ok(!result.maskedText.includes('nguyenvana@company.vn'));

    // Unmask restoration
    const restored = unmaskSensitiveData(result.maskedText, result.tokensMap);
    assert.equal(restored, rawText);
  });

  it('audits privacy compliance properly', () => {
    const auditClean = auditPrivacyCompliance('Doanh thu phần mềm tháng 8 đạt 500 triệu đồng.');
    assert.equal(auditClean.isCompliant, true);
    assert.equal(auditClean.complianceScore, 100);

    const auditSensitive = auditPrivacyCompliance('Khách hàng CCCD 034098005678, SĐT 0912345678.');
    assert.equal(auditSensitive.isCompliant, false);
    assert.ok(auditSensitive.complianceScore < 100);
  });
});
