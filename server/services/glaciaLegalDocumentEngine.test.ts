import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  draftVietnameseContract,
  reviewVietnameseContract,
} from './glaciaLegalDocumentEngine.ts';

describe('Glacia Legal Document AI (Frontier 7)', () => {
  it('drafts a complete Vietnamese NDA contract compliant with Decree 13 and VIAC dispute jurisdiction', () => {
    const draft = draftVietnameseContract({
      type: 'nda_confidentiality',
      partyAName: 'CÔNG TY TNHH CÔNG NGHỆ LEDGERFLOW VIỆT NAM',
      partyBName: 'TẬP ĐOÀN ĐẦU TƯ TÀI CHÍNH GLOBAL',
    });

    assert.ok(draft.id.startsWith('legal-doc-'));
    assert.equal(draft.type, 'nda_confidentiality');
    assert.ok(draft.clauses.length >= 4);
    assert.ok(draft.fullMarkdown.includes('BẢO MẬT THÔNG TIN VÀ DỮ LIỆU SỐ'));
    assert.ok(draft.fullMarkdown.includes('Nghị Định 13/2023/NĐ-CP'));
    assert.ok(draft.fullMarkdown.includes('VIAC'));
  });

  it('reviews contract text and detects missing Decree 13 and unlimited liability traps', () => {
    const dangerousContract = `
      Hợp đồng hợp tác kinh doanh.
      Bên B cam kết bồi thường toàn bộ thiệt hại không giới hạn cho Bên A trong mọi trường hợp.
    `;

    const review = reviewVietnameseContract(dangerousContract);
    assert.ok(review.overallRiskScore >= 60, 'Should detect critical risk');
    assert.equal(review.decree13Compliant, false);
    assert.ok(review.identifiedRisks.some((r) => r.severity === 'critical'));
  });

  it('confirms safe contract when all Vietnamese statutory clauses are present', () => {
    const safeContract = `
      Hợp đồng dịch vụ phần mềm.
      Các bên cam kết bảo vệ dữ liệu cá nhân theo Nghị Định 13/2023/NĐ-CP.
      Mọi tranh chấp giải quyết tại Trọng tài VIAC.
      Trách nhiệm bồi thường tối đa bằng 100% giá trị hợp đồng.
    `;

    const review = reviewVietnameseContract(safeContract);
    assert.equal(review.overallRiskScore, 0);
    assert.equal(review.decree13Compliant, true);
    assert.equal(review.identifiedRisks.length, 0);
  });
});
