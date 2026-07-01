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
    'sales-crm',
    'finance-accounting',
    'ai-workforce',
    'analytics-sandbox',
    'system-settings',
  ]) assert.ok(ids.has(required as never), `Missing mandatory workspace: ${required}`);
});

test('core and legacy tabs are separated for cleaner navigation', () => {
  assert.equal(CORE_TABS.length, COMPANY_WORKSPACES.length);
  assert.ok(!CORE_TABS.includes('devops_hub' as never));
  assert.ok(!CORE_TABS.includes('control_room' as never));
  assert.ok(!CORE_TABS.includes('operations' as never));
  assert.ok(LEGACY_TABS.includes('operations'));
  assert.ok(CORE_TABS.every((tab) => isCoreTab(tab)));
  assert.ok(LEGACY_TABS.every((tab) => !isCoreTab(tab)));
});

test('legacy workspace subtab aliases resolve to streamlined subtabs', () => {
  assert.equal(resolveWorkspaceSubTab('ceo_command', 'overview', ['brief', 'daily_weekly', 'library', 'sop_rd']), 'brief');
  assert.equal(resolveWorkspaceSubTab('ceo_command', 'risk', ['brief', 'daily_weekly', 'library', 'sop_rd']), 'sop_rd');
  assert.equal(resolveWorkspaceSubTab('product_studio', 'roadmap', ['portfolio', 'delivery']), 'portfolio');
  assert.equal(resolveWorkspaceSubTab('product_studio', 'deploy', ['portfolio', 'delivery']), 'delivery');
  assert.equal(resolveWorkspaceSubTab('marketing_growth', 'content_zalo', ['campaigns', 'content']), 'content');
  assert.equal(resolveWorkspaceSubTab('marketing_growth', 'market_research', ['campaigns', 'content']), 'campaigns');
  assert.equal(resolveWorkspaceSubTab('sales_crm', 'lead_scoring', ['pipeline', 'pricing_retention']), 'pipeline');
  assert.equal(resolveWorkspaceSubTab('sales_crm', 'pricing_lab', ['pipeline', 'pricing_retention']), 'pricing_retention');
  assert.equal(resolveWorkspaceSubTab('ai_factory', 'overview', ['command', 'missions', 'robot_auto', 'advanced']), 'command');
  assert.equal(resolveWorkspaceSubTab('ai_factory', 'staff_assistants', ['command', 'missions', 'robot_auto', 'advanced']), 'advanced');
  assert.equal(resolveWorkspaceSubTab('ai_factory', 'automation_rules', ['command', 'missions', 'robot_auto', 'advanced']), 'robot_auto');
  assert.equal(resolveWorkspaceSubTab('ai_factory', 'tool_catalog', ['command', 'missions', 'robot_auto', 'advanced']), 'advanced');
  assert.equal(resolveWorkspaceSubTab('ai_factory', 'software_factory', ['command', 'missions', 'robot_auto', 'advanced']), 'advanced');
  assert.equal(resolveWorkspaceSubTab('system_settings', 'ci_doctor', ['general', 'devops', 'control', 'safety_gates', 'emergency']), 'devops');
});

test('workspace subtab resolver preserves valid ids and rejects unknown ids', () => {
  const validIds = ['command', 'missions', 'robot_auto', 'advanced'] as const;

  assert.equal(resolveWorkspaceSubTab('ai_factory', 'staff_roles', validIds), 'advanced');
  assert.equal(resolveWorkspaceSubTab('ai_factory', 'not_real', validIds), undefined);
  assert.equal(resolveWorkspaceSubTab('unknown_workspace', 'command', validIds), 'command');
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
