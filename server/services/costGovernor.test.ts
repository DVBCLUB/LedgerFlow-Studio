import assert from 'node:assert/strict';
import test from 'node:test';
import { sanitizeGovernorConfig } from './costGovernor.ts';

test('sanitizeGovernorConfig clamps invalid values', () => {
  const base = { enabled: true, monthlyCapUsd: 10, alertThresholdPct: 80 };

  assert.deepEqual(sanitizeGovernorConfig({ monthlyCapUsd: -5 }, base), {
    enabled: true,
    monthlyCapUsd: 0,
    alertThresholdPct: 80,
  });

  assert.deepEqual(sanitizeGovernorConfig({ alertThresholdPct: 150 }, base), {
    enabled: true,
    monthlyCapUsd: 10,
    alertThresholdPct: 100,
  });

  assert.deepEqual(sanitizeGovernorConfig({ enabled: false, monthlyCapUsd: 25, alertThresholdPct: 50 }, base), {
    enabled: false,
    monthlyCapUsd: 25,
    alertThresholdPct: 50,
  });
});

test('sanitizeGovernorConfig keeps base when fields omitted', () => {
  const base = { enabled: false, monthlyCapUsd: 0, alertThresholdPct: 0 };
  assert.deepEqual(sanitizeGovernorConfig({}, base), base);
});
