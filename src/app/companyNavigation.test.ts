import assert from 'node:assert/strict';
import test from 'node:test';
import { COMPANY_WORKSPACES, companyOSLanes, CORE_TABS, LEGACY_TABS, isCoreTab } from './companyNavigation.ts';
import {
  AI_WORK_ORDER_LIBRARY,
  DECISION_LOG_TEMPLATES,
  LEDGERFLOW_BOUNDARY_STATEMENTS,
  OPERATING_CASE_BANK,
  VAS_KNOWLEDGE_PACKS,
} from '../data/operatingKnowledgeLayer.ts';

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

test('core and legacy tabs are separated for cleaner navigation', () => {
  assert.equal(CORE_TABS.length, COMPANY_WORKSPACES.length);
  assert.ok(CORE_TABS.every((tab) => isCoreTab(tab)));
  assert.ok(LEGACY_TABS.every((tab) => !isCoreTab(tab)));
});

test('operating knowledge layer has usable seeds and safety boundaries', () => {
  assert.ok(OPERATING_CASE_BANK.length >= 4, 'Expected multi-domain case bank seeds.');
  assert.ok(VAS_KNOWLEDGE_PACKS.length >= 3, 'Expected starter VAS knowledge packs.');
  assert.ok(AI_WORK_ORDER_LIBRARY.length >= 3, 'Expected AI work order templates.');
  assert.ok(DECISION_LOG_TEMPLATES.some((item) => item.decisionType === 'KILL'), 'Expected a kill decision template.');
  assert.ok(LEDGERFLOW_BOUNDARY_STATEMENTS.some((item) => item.includes('không định vị như ERP')), 'Expected ERP boundary statement.');

  for (const pack of VAS_KNOWLEDGE_PACKS) {
    assert.ok(pack.disclaimer.length > 20, `Knowledge pack ${pack.id} must include a clear disclaimer.`);
  }
});
