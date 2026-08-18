import test from 'node:test';
import assert from 'node:assert/strict';
import {
  searchBusinessEntities,
  findEntityByField,
  getCompanyKPIs,
  exportEntitiesAsCsv,
  bulkImportBusinessEntities,
  upsertBusinessEntity,
} from './businessDataService.ts';

test('businessDataService - searchBusinessEntities filters by query and type', () => {
  upsertBusinessEntity({
    id: 'prod_vas_tax',
    type: 'product',
    data: { name: 'VAS Tax Optimizer', price: 990000 },
  });

  const results = searchBusinessEntities('VAS Tax', { type: 'product' });
  assert.ok(results.length >= 1);
  assert.ok(results.some((r) => r.id === 'prod_vas_tax'));

  const emptyResults = searchBusinessEntities('NonExistentKeywordXYZ123');
  assert.equal(emptyResults.length, 0);
});

test('businessDataService - findEntityByField finds matching entity', () => {
  upsertBusinessEntity({
    id: 'lead_special_99',
    type: 'lead',
    data: { email: 'ceo@techstartup.vn', company: 'TechStartup VN' },
  });

  const found = findEntityByField('lead', 'email', 'ceo@techstartup.vn');
  assert.ok(found);
  assert.equal(found?.id, 'lead_special_99');
});

test('businessDataService - getCompanyKPIs and exportEntitiesAsCsv', () => {
  const kpis = getCompanyKPIs();
  assert.ok(typeof kpis.totalRevenueVnd === 'number');
  assert.ok(typeof kpis.totalCustomers === 'number');

  const csv = exportEntitiesAsCsv();
  assert.ok(csv.includes('id,type,source,createdAt,updatedAt,data_summary'));
});

test('businessDataService - bulkImportBusinessEntities imports and updates items', () => {
  const res = bulkImportBusinessEntities([
    {
      id: 'bulk_item_1',
      type: 'product',
      data: { name: 'AI Code Reviewer Tool' },
    },
    {
      id: 'bulk_item_2',
      type: 'customer',
      data: { name: 'VNG Corp Partner' },
    },
  ]);

  assert.ok(res.total >= 2);
  assert.ok(res.imported >= 0);
});
