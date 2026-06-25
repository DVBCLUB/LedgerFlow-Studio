import assert from 'node:assert/strict';
import test from 'node:test';
import { COMPANY_WORKSPACES, companyOSLanes, CORE_TABS, LEGACY_TABS, isCoreTab } from './companyNavigation.ts';
import { resolveWorkspaceSubTab } from './workspaceSubtabAliases.ts';
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

test('legacy workspace subtab aliases resolve to streamlined subtabs', () => {
  assert.equal(resolveWorkspaceSubTab('ceo_command', 'overview', ['brief', 'daily_weekly', 'library', 'sop_rd']), 'brief');
  assert.equal(resolveWorkspaceSubTab('ceo_command', 'risk', ['brief', 'daily_weekly', 'library', 'sop_rd']), 'sop_rd');
  assert.equal(resolveWorkspaceSubTab('product_studio', 'pricing_lab', ['strategy', 'roadmap', 'offer_pricing', 'launch_readiness']), 'offer_pricing');
  assert.equal(resolveWorkspaceSubTab('growth_sales', 'leads_outreach', ['dashboard', 'content_studio', 'market_research', 'sales_crm', 'retention_partners']), 'sales_crm');
  assert.equal(resolveWorkspaceSubTab('ai_staff_sandbox', 'staff_assistants', ['overview', 'agents', 'automations', 'knowledge_prompts', 'quality', 'labs']), 'agents');
  assert.equal(resolveWorkspaceSubTab('ai_staff_sandbox', 'python_sql', ['overview', 'agents', 'automations', 'knowledge_prompts', 'quality', 'labs']), 'labs');
  assert.equal(resolveWorkspaceSubTab('system_settings', 'ci_doctor', ['general', 'ai_gateway', 'integrations', 'security', 'backup_data', 'developer_console']), 'developer_console');
});

test('workspace subtab resolver preserves valid ids and rejects unknown ids', () => {
  const validIds = ['overview', 'agents', 'automations', 'knowledge_prompts', 'quality', 'labs'] as const;

  assert.equal(resolveWorkspaceSubTab('ai_staff_sandbox', 'agents', validIds), 'agents');
  assert.equal(resolveWorkspaceSubTab('ai_staff_sandbox', 'not_real', validIds), undefined);
  assert.equal(resolveWorkspaceSubTab('unknown_workspace', 'agents', validIds), 'agents');
  assert.equal(resolveWorkspaceSubTab('unknown_workspace', 'staff_assistants', validIds), undefined);
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
