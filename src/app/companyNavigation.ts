/**
 * Company Navigation Registry
 * Central config for all workspaces, departments, and module metadata.
 * Used by the app sidebar and WorkspaceRenderer.
 */

// ─── Tab Types ────────────────────────────────────────────────────────────────
export type CoreTabType =
  | 'ceo_command'
  | 'product_studio'
  | 'growth_sales'
  | 'finance_accounting'
  | 'ai_staff_sandbox'
  | 'system_settings';

export type LegacyTabType =
  | 'dashboard'
  | 'knowledge'
  | 'advisory'
  | 'market_survey'
  | 'founder'
  | 'roadmap'
  | 'datascience'
  | 'prompts'
  | 'assistant'
  | 'ai_staff'
  | 'custom_data'
  | 'architecture'
  | 'game_ml'
  | 'guerrilla'
  | 'accounting_vn'
  | 'ml_applied'
  | 'deploy_business'
  | 'seo_strategy'
  | 'audit_workspace'
  | 'python_sandbox'
  | 'marketing_suite'
  | 'funnel_lab'
  | 'lead_scoring'
  | 'zalo_hub'
  | 'ltv_dashboard'
  | 'pricing_lab'
  | 'nps_manager'
  | 'affiliate_hub'
  | 'outbound_hub'
  | 'advanced_ai'
  | 'video_lab'
  | 'marketing_growth_v2'
  | 'approval_workflow'
  | 'financial_reports'
  | 'integration_hub';

export type TabType = CoreTabType | LegacyTabType;

export const CORE_TABS: readonly CoreTabType[] = [
  'ceo_command',
  'product_studio',
  'growth_sales',
  'finance_accounting',
  'ai_staff_sandbox',
  'system_settings',
] as const;

export const LEGACY_TABS: readonly LegacyTabType[] = [
  'dashboard',
  'knowledge',
  'advisory',
  'market_survey',
  'founder',
  'roadmap',
  'datascience',
  'prompts',
  'assistant',
  'ai_staff',
  'custom_data',
  'architecture',
  'game_ml',
  'guerrilla',
  'accounting_vn',
  'ml_applied',
  'deploy_business',
  'seo_strategy',
  'audit_workspace',
  'python_sandbox',
  'marketing_suite',
  'funnel_lab',
  'lead_scoring',
  'zalo_hub',
  'ltv_dashboard',
  'pricing_lab',
  'nps_manager',
  'affiliate_hub',
  'outbound_hub',
  'advanced_ai',
  'video_lab',
  'marketing_growth_v2',
  'approval_workflow',
  'financial_reports',
  'integration_hub',
] as const;

export function isCoreTab(tab: TabType): tab is CoreTabType {
  return (CORE_TABS as readonly string[]).includes(tab);
}

// ─── Role Types ───────────────────────────────────────────────────────────────
export type RoleType = 'all' | 'ceo' | 'dev' | 'marketing';

// ─── Department Config ────────────────────────────────────────────────────────
export interface DeptConfig {
  key: string;
  label: string;
  color: string;
  dotColor: string;
  chevronColor: string;
  roles: RoleType[];
  defaultExpanded: boolean;
}

export const DEPARTMENTS: DeptConfig[] = [
  {
    key: 'command',
    label: 'Command',
    color: 'text-purple-400',
    dotColor: 'bg-purple-500',
    chevronColor: 'text-purple-400',
    roles: ['all', 'ceo'],
    defaultExpanded: true,
  },
  {
    key: 'product',
    label: 'Build',
    color: 'text-indigo-400',
    dotColor: 'bg-indigo-500',
    chevronColor: 'text-indigo-400',
    roles: ['all', 'dev'],
    defaultExpanded: true,
  },
  {
    key: 'growth',
    label: 'Sell',
    color: 'text-sky-400',
    dotColor: 'bg-sky-500',
    chevronColor: 'text-sky-400',
    roles: ['all', 'marketing'],
    defaultExpanded: true,
  },
  {
    key: 'finance',
    label: 'Control',
    color: 'text-emerald-400',
    dotColor: 'bg-emerald-500',
    chevronColor: 'text-emerald-400',
    roles: ['all', 'ceo'],
    defaultExpanded: true,
  },
  {
    key: 'aiops',
    label: 'AI Factory',
    color: 'text-violet-400',
    dotColor: 'bg-violet-500',
    chevronColor: 'text-violet-400',
    roles: ['all', 'dev', 'ceo'],
    defaultExpanded: true,
  },
  {
    key: 'control',
    label: 'Settings',
    color: 'text-slate-300',
    dotColor: 'bg-slate-500',
    chevronColor: 'text-slate-400',
    roles: ['all', 'ceo', 'dev'],
    defaultExpanded: false,
  },
];

/** Lọc phòng ban theo vai trò người dùng */
export function isDepartmentVisible(deptKey: string, role: RoleType): boolean {
  if (role === 'all') return deptKey !== 'control';
  const dept = DEPARTMENTS.find((d) => d.key === deptKey);
  if (!dept) return false;
  return dept.roles.includes(role);
}

// ─── Module Registry ──────────────────────────────────────────────────────────
export interface ModuleEntry {
  tab: TabType;
  dept: string;
  label: string;
  badge?: string;
  badgeColor?: string;
  desc: string;
}

export const MODULES: ModuleEntry[] = [
  { tab: 'ceo_command', dept: 'command', label: 'Command Center', badge: 'ROOT', badgeColor: 'bg-purple-500/15 text-purple-300', desc: 'Điều hành, standup, tri thức, SOP và risk register.' },
  { tab: 'product_studio', dept: 'product', label: 'Build Studio', badge: 'BUILD', badgeColor: 'bg-emerald-500/15 text-emerald-400', desc: 'Chiến lược sản phẩm, roadmap, offer/pricing và launch readiness.' },
  { tab: 'growth_sales', dept: 'growth', label: 'Sell Engine', badge: 'SELL', badgeColor: 'bg-sky-500/15 text-sky-400', desc: 'Growth dashboard, content studio, market research, CRM và retention.' },
  { tab: 'finance_accounting', dept: 'finance', label: 'Control Room', badge: 'CTRL', badgeColor: 'bg-emerald-500/15 text-emerald-400', desc: 'Sổ cái, báo cáo, cashflow, approval và audit/control.' },
  { tab: 'ai_staff_sandbox', dept: 'aiops', label: 'AI Factory', badge: 'AI', badgeColor: 'bg-violet-500/15 text-violet-300', desc: 'Agents, automations, knowledge/prompts, quality và labs nâng cao.' },
  { tab: 'system_settings', dept: 'control', label: 'Settings', badge: 'CFG', badgeColor: 'bg-slate-700 text-slate-300', desc: 'AI Gateway, integrations, security, backup/data và Developer Console.' },
];

export interface WorkspaceNavigationItem {
  tab: CoreTabType;
  laneId: CompanyOSLaneId;
  label: string;
  shortLabel: string;
  description: string;
  iconName: string;
  group: CompanyOSLaneGroup;
  status: CompanyOSLaneStatus;
  owner: string;
}

export type CompanyOSLaneId =
  | 'command-center'
  | 'product-studio'
  | 'marketing-growth'
  | 'finance-accounting'
  | 'ai-workforce'
  | 'system-settings'
  | 'industry-templates';

export type CompanyOSLaneStatus = 'core' | 'next' | 'template';
export type CompanyOSLaneGroup = 'Operate' | 'Build' | 'Sell' | 'Control' | 'Extend';

export type CompanyOSLane = {
  id: CompanyOSLaneId;
  label: string;
  group: CompanyOSLaneGroup;
  status: CompanyOSLaneStatus;
  owner: string;
  routeHint: string;
};

export const COMPANY_WORKSPACES: WorkspaceNavigationItem[] = [
  { tab: 'ceo_command', laneId: 'command-center', label: 'Command Center', shortLabel: 'Command', description: 'Chiến lược, standup, tri thức, SOP và risk register', iconName: 'Building2', group: 'Operate', status: 'core', owner: 'Founder' },
  { tab: 'product_studio', laneId: 'product-studio', label: 'Build Studio', shortLabel: 'Build', description: 'Strategy, roadmap, offer/pricing và launch readiness', iconName: 'PackageOpen', group: 'Build', status: 'core', owner: 'Product' },
  { tab: 'growth_sales', laneId: 'marketing-growth', label: 'Sell Engine', shortLabel: 'Sell', description: 'Growth dashboard, content, research, CRM và retention', iconName: 'BarChart3', group: 'Sell', status: 'core', owner: 'Growth' },
  { tab: 'finance_accounting', laneId: 'finance-accounting', label: 'Control Room', shortLabel: 'Control', description: 'Ledger, reports, cashflow, approval và audit/control', iconName: 'CircleDollarSign', group: 'Control', status: 'core', owner: 'Finance' },
  { tab: 'ai_staff_sandbox', laneId: 'ai-workforce', label: 'AI Factory', shortLabel: 'AI Factory', description: 'Agents, automations, knowledge/prompts, quality và labs', iconName: 'Bot', group: 'Build', status: 'core', owner: 'AgentOps' },
  { tab: 'system_settings', laneId: 'system-settings', label: 'Settings', shortLabel: 'Settings', description: 'AI Gateway, integrations, security, backup/data và Developer Console', iconName: 'Settings', group: 'Control', status: 'next', owner: 'Admin' },
];

export const companyOSLanes: CompanyOSLane[] = [
  ...COMPANY_WORKSPACES.map((workspace) => ({
    id: workspace.laneId,
    label: workspace.label,
    group: workspace.group,
    status: workspace.status,
    owner: workspace.owner,
    routeHint: `#/${workspace.tab}`,
  })),
  { id: 'industry-templates', label: 'Industry Templates', group: 'Extend', status: 'template', owner: 'Templates', routeHint: '#/finance_accounting' },
];

export function getCompanyOSLane(id: CompanyOSLaneId) {
  return companyOSLanes.find((lane) => lane.id === id);
}
