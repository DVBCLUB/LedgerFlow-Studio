import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateWithLlmJudge, DEFAULT_JUDGE_RUBRIC } from './aiEvalHarness.ts';

test('aiEvalHarness - evaluateWithLlmJudge returns multi-criteria score rubric', async () => {
  const result = await evaluateWithLlmJudge({
    prompt: 'Viết quy trình chốt sổ kế toán cuối tháng trong 3 bước.',
    response: 'Bước 1: Đối chiếu công nợ và sao kê ngân hàng.\nBước 2: Trích lập dự phòng và phân bổ chi phí.\nBước 3: Khóa sổ và lập báo cáo tài chính.',
    roleId: 'AI CFO',
    rubric: DEFAULT_JUDGE_RUBRIC,
  });

  assert.ok(typeof result.accuracy === 'number');
  assert.ok(typeof result.completeness === 'number');
  assert.ok(typeof result.format === 'number');
  assert.ok(typeof result.safety === 'number');
  assert.ok(typeof result.overallScore === 'number');
  assert.ok(result.overallScore >= 0 && result.overallScore <= 100);
  assert.ok(['EXCELLENT', 'PASS', 'NEEDS_IMPROVEMENT', 'FAIL'].includes(result.verdict));
  assert.ok(result.reasoning.length > 0);
  assert.ok(result.judgeProvider.length > 0);
});
