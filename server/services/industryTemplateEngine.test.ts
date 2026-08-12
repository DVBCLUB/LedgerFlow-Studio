import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  listIndustryTemplates,
  getIndustryTemplate,
  calculateBOMCost,
  calculateProgressBilling,
} from './industryTemplateEngine.ts';

describe('Industry Template Engine Service', () => {
  it('lists all industry templates with SaaS as default', () => {
    const templates = listIndustryTemplates();
    assert.strictEqual(templates.length, 5);

    const defaultTpl = templates.find((t) => t.isDefault);
    assert.ok(defaultTpl);
    assert.strictEqual(defaultTpl.id, 'saas_software');
  });

  it('retrieves specific industry template configs', () => {
    const saas = getIndustryTemplate('saas_software');
    assert.ok(saas);
    assert.strictEqual(saas.primaryAccounts[0].code, '5111');

    const mfg = getIndustryTemplate('manufacturing');
    assert.ok(mfg);
    assert.strictEqual(mfg.primaryAccounts[0].code, '152');
  });

  it('calculates BOM material costs accurately', () => {
    const res = calculateBOMCost([
      { itemId: 'chip_m1', itemName: 'Vi xử lý AI Chip', quantityRequired: 2, unitCostVnd: 500000 },
      { itemId: 'case_aluminum', itemName: 'Vỏ Nhôm Nguyên Khối', quantityRequired: 1, unitCostVnd: 300000 },
    ]);

    assert.strictEqual(res.totalMaterialCostVnd, 1300000);
    assert.strictEqual(res.breakdown.length, 2);
    assert.strictEqual(res.breakdown[0].subtotalVnd, 1000000);
    assert.strictEqual(res.breakdown[1].subtotalVnd, 300000);
  });

  it('calculates progress billing accurately', () => {
    const billing = calculateProgressBilling(100000000, 45);
    assert.strictEqual(billing.billedAmountVnd, 45000000);
    assert.strictEqual(billing.remainingAmountVnd, 55000000);
    assert.strictEqual(billing.progressPercent, 45);
  });
});
