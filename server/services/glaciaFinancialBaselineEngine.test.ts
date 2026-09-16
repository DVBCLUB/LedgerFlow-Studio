import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadFinancialBaseline, saveFinancialBaseline, updateBaselineWithTransaction } from './glaciaFinancialBaselineEngine.ts';

describe('Glacia Financial Baseline Engine', () => {
  it('returns financial baseline with categories', () => {
    const baseline = loadFinancialBaseline();
    assert.ok(baseline.id);
    assert.ok(baseline.currency);
    assert.ok(baseline.categories);
    assert.ok(Object.keys(baseline.categories).length >= 4);
  });

  it('includes known category baselines', () => {
    const baseline = loadFinancialBaseline();
    assert.ok(baseline.categories.office_supplies);
    assert.ok(baseline.categories.cloud_infrastructure);
    assert.ok(baseline.categories.payroll_bonus);
    assert.ok(baseline.categories.marketing_ads);
  });

  it('returns proper category baseline structure', () => {
    const baseline = loadFinancialBaseline();
    const office = baseline.categories.office_supplies;

    assert.equal(office.category, 'office_supplies');
    assert.ok(office.meanAmount > 0);
    assert.ok(office.stdDev >= 0);
    assert.ok(office.minAmount <= office.meanAmount);
    assert.ok(office.maxAmount >= office.meanAmount);
    assert.ok(office.typicalTxCountPerWeek > 0);
    assert.ok(office.sampleSize > 0);
  });

  it('updates baseline with a transaction', () => {
    updateBaselineWithTransaction('office_supplies', 5000000, 'VND-TEST-001', 'Test Vendor Co');

    const baseline = loadFinancialBaseline();
    const office = baseline.categories.office_supplies;
    assert.ok(office.meanAmount > 0);

    const vendor = baseline.knownVendors.find(v => v.vendorTaxId === 'VND-TEST-001');
    assert.ok(vendor);
    assert.equal(vendor?.vendorName, 'Test Vendor Co');
  });

  it('saves and reloads a modified baseline', () => {
    const original = loadFinancialBaseline();
    original.currency = 'USD';

    saveFinancialBaseline(original);
    const reloaded = loadFinancialBaseline();
    assert.equal(reloaded.currency, 'USD');
  });
});

