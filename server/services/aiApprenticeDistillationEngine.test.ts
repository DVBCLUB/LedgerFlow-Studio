import test from 'node:test';
import assert from 'node:assert/strict';
import {
  captureGoldenTrajectory,
  getDistillationStats,
  listGoldenTrajectories,
  exportDistillationDataset,
  clearDistillationDataset,
} from './aiApprenticeDistillationEngine.ts';

test('aiApprenticeDistillationEngine - captureGoldenTrajectory rejects low quality score', () => {
  const result = captureGoldenTrajectory({
    domain: 'coding',
    userPrompt: 'Viết hàm sort quicksort',
    goldOutput: 'function quicksort() {}',
    providerUsed: 'ollama',
    qualityScore: 60, // Điểm thấp
    evaluatedBy: 'auto_eval',
  });

  assert.equal(result.captured, false);
  assert.ok(result.reason?.includes('Chất lượng chưa đạt'));
});

test('aiApprenticeDistillationEngine - captureGoldenTrajectory ingests high-score samples and generates Alpaca/ShareGPT lines', () => {
  const samplePrompt = `Viết hàm tính thuế VAT và định khoản VAS 200 cho hóa đơn dịch vụ ${Date.now()}`;
  const sampleOutput = `export function calculateVATAudit(amount: number) {\n  const vat = amount * 0.1;\n  return { amount, vat, total: amount + vat, debit: '642', credit: '3331' };\n}`;

  const result = captureGoldenTrajectory({
    domain: 'finance',
    taskType: 'accounting_tax',
    systemPrompt: 'Bạn là Kế toán trưởng am hiểu chuẩn mực kế toán Việt Nam Thông tư 200.',
    userPrompt: samplePrompt,
    goldOutput: sampleOutput,
    rejectedOutput: 'const vat = amount * 0.08;',
    providerUsed: 'claude-3-5-sonnet',
    modelUsed: 'claude-3-5-sonnet-20241022',
    qualityScore: 98,
    evaluatedBy: 'ceo_approval',
    tags: ['vas200', 'tax_engine', 'golden_sample'],
  });

  assert.equal(result.captured, true);
  assert.ok(result.trajectory?.id);
  assert.equal(result.trajectory?.qualityScore, 98);

  const stats = getDistillationStats();
  assert.ok(stats.totalTrajectories >= 1);
  assert.ok(stats.byDomain.finance >= 1);
  assert.ok(stats.totalTokensEstimated > 0);

  const alpaca = exportDistillationDataset('alpaca');
  assert.ok(alpaca.includes('instruction'));
  assert.ok(alpaca.includes('calculateVATAudit'));

  const sharegpt = exportDistillationDataset('sharegpt');
  assert.ok(sharegpt.includes('conversations'));

  const dpo = exportDistillationDataset('dpo');
  assert.ok(dpo.includes('chosen'));
  assert.ok(dpo.includes('rejected'));
});

test('aiApprenticeDistillationEngine - listGoldenTrajectories filters by domain', () => {
  const financeList = listGoldenTrajectories({ domain: 'finance' });
  assert.ok(Array.isArray(financeList));
  assert.ok(financeList.every((t) => t.domain === 'finance'));
});
