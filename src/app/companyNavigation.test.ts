import assert from 'node:assert/strict';
import test from 'node:test';
import { COMPANY_WORKSPACES, companyOSLanes } from './companyNavigation.ts';

test('company workspace registry has unique tabs and lane ids', () => {
  assert.equal(new Set(COMPANY_WORKSPACES.map((item) => item.tab)).size, COMPANY_WORKSPACES.length);
  assert.equal(new Set(COMPANY_WORKSPACES.map((item) => item.laneId)).size, COMPANY_WORKSPACES.length);
  assert.equal(new Set(companyOSLanes.map((item) => item.id)).size, companyOSLanes.length);
});

test('mandatory Company OS workspaces remain visible', () => {
  const ids = new Set(COMPANY_WORKSPACES.map((item) => item.laneId));
  for (const required of [
    'command-center',
    'product-studio',
    'marketing-growth',
    'finance-accounting',
    'ai-workforce',
    'system-settings',
  ]) assert.ok(ids.has(required as never), `Missing mandatory workspace: ${required}`);
});

