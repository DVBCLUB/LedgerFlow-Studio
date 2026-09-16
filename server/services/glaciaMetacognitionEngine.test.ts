import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  auditReasoningChain,
  calibrateConfidence,
  detectKnowledgeGaps,
  assessCognitiveLoad,
} from './glaciaMetacognitionEngine.ts';

describe('Glacia Metacognition Engine (Epoch 8)', () => {
  it('calibrates overconfident confidence down when evidence is missing', () => {
    const calibrated = calibrateConfidence(0.95, 0, 1);
    assert.ok(calibrated < 0.95);
    assert.ok(calibrated <= 0.6);
  });

  it('detects knowledge gaps for uncertain queries', () => {
    const gaps = detectKnowledgeGaps('Dự báo doanh thu đối thủ MISA năm sau');
    assert.ok(gaps.length >= 1);
    assert.ok(gaps.some(g => g.includes('tương lai') || g.includes('đối thủ')));
  });

  it('audits reasoning chain and catches overconfidence bias and circular reasoning', () => {
    const audit = auditReasoningChain('Chiến lược mở rộng thị phần', [
      {
        stepIndex: 1,
        claim: 'Thị phần chắc chắn sẽ tăng gấp đôi vì vậy thị phần sẽ tăng nhanh',
        evidence: [],
        assumptions: ['Thị phần chắc chắn sẽ tăng gấp đôi'],
        confidence: 0.98,
      },
      {
        stepIndex: 2,
        claim: 'Chi phí marketing sẽ giảm 50%',
        evidence: ['Báo cáo chi phí Q2'],
        assumptions: ['Tối ưu hóa SEO'],
        confidence: 0.85,
      },
    ]);

    assert.ok(audit.auditId.startsWith('metacog-'));
    assert.ok(audit.biasesDetected.length >= 1);
    assert.ok(audit.calibratedConfidence < audit.rawConfidence);
    assert.ok(audit.selfCritiqueNarrative.length > 10);
  });

  it('evaluates cognitive load accurately based on active tasks', () => {
    const load = assessCognitiveLoad(7, 350);
    assert.ok(load.loadPercent > 70);
    assert.equal(load.status, 'overloaded');
  });
});
