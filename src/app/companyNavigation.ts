/**
 * Company Navigation Registry
 * Central config for all workspaces, departments, and module metadata.
 * Used by the app sidebar and WorkspaceRenderer.
 */

export type CoreTabType =
  | 'ceo_command'
  | 'product_studio'
  | 'marketing_growth'
  | 'sales_crm'
  | 'finance_accounting'
  | 'ai_factory'
  | 'analytics'
  | 'system_settings';

export type LegacyTabType =
  | 'operations'
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
  | 'integration_hub'
  | 'devops_hub'
  | 'control_room';

export type TabType = CoreTabType | LegacyTabType;

export const CORE_TABS: readonly CoreTabType[] = [
  'ceo_command',
  'product_studio',
  'marketing_growth',
  'sales_crm',
  'finance_accounting',
  'ai_factory',
  'analytics',
  'system_settings',
] as const;

export const LEGACY_TABS: readonly LegacyTabType[] = [
  'operations',
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

export type RoleType =
  | 'all'
  | 'founder'
  | 'admin'
  | 'finance'
  | 'operations'
  | 'agentops'
  | 'devops'
  | 'marketing'
  | 'auditor'
  | 'viewer';

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
    roles: ['all', 'founder', 'admin', 'viewer'],
    defaultExpanded: true,
  },
  {
    key: 'operations',
    label: 'Product, Growth & Sales',
    color: 'text-sky-400',
    dotColor: 'bg-sky-500',
    chevronColor: 'text-sky-400',
    roles: ['all', 'founder', 'admin', 'operations', 'marketing'],
    defaultExpanded: true,
  },
  {
    key: 'finance',
    label: 'Finance',
    color: 'text-emerald-400',
    dotColor: 'bg-emerald-500',
    chevronColor: 'text-emerald-400',
    roles: ['all', 'founder', 'admin', 'finance', 'auditor'],
    defaultExpanded: true,
  },
  {
    key: 'aiops',
    label: 'AI Operations',
    color: 'text-violet-400',
    dotColor: 'bg-violet-500',
    chevronColor: 'text-violet-400',
    roles: ['all', 'founder', 'admin', 'agentops'],
    defaultExpanded: true,
  },
  {
    key: 'analytics',
    label: 'Analytics',
    color: 'text-amber-400',
    dotColor: 'bg-amber-500',
    chevronColor: 'text-amber-400',
    roles: ['all', 'founder', 'admin', 'finance', 'devops'],
    defaultExpanded: false,
  },
  {
    key: 'settings',
    label: 'Settings',
    color: 'text-slate-300',
    dotColor: 'bg-slate-500',
    chevronColor: 'text-slate-400',
    roles: ['all', 'founder', 'admin'],
    defaultExpanded: false,
  },
];

export function isDepartmentVisible(deptKey: string, role: RoleType): boolean {
  if (role === 'all') return true;
  const dept = DEPARTMENTS.find((d) => d.key === deptKey);
  if (!dept) return false;
  return dept.roles.includes(role);
}

export interface ModuleEntry {
  tab: TabType;
  dept: string;
  label: string;
  badge?: string;
  badgeColor?: string;
  desc: string;
}

export const MODULES: ModuleEntry[] = [
  { tab: 'ceo_command', dept: 'command', label: 'Command Center', badge: 'HQ', badgeColor: 'bg-purple-500/15 text-purple-300', desc: 'Việc hôm nay, dòng tiền, pipeline, sản phẩm, AI mission và cảnh báo cần duyệt.' },
  { tab: 'product_studio', dept: 'operations', label: 'Product Studio', badge: 'PROD', badgeColor: 'bg-sky-500/15 text-sky-400', desc: 'Danh mục sản phẩm, roadmap, release, game và accounting templates.' },
  { tab: 'marketing_growth', dept: 'operations', label: 'Marketing & Growth', badge: 'MKT', badgeColor: 'bg-rose-500/15 text-rose-300', desc: 'Định vị, chiến dịch, nội dung, khảo sát và tạo lead.' },
  { tab: 'sales_crm', dept: 'operations', label: 'Sales & CRM', badge: 'CRM', badgeColor: 'bg-amber-500/15 text-amber-300', desc: 'Leads, khách hàng, demo, báo giá, follow-up và pipeline.' },
  { tab: 'finance_accounting', dept: 'finance', label: 'Tài chính - Kế toán', badge: 'FIN', badgeColor: 'bg-emerald-500/15 text-emerald-450', desc: 'Sổ cái, báo cáo tài chính, dòng tiền và kiểm soát nội bộ.' },
  { tab: 'ai_factory', dept: 'aiops', label: 'AI Operations', badge: 'AI', badgeColor: 'bg-violet-500/15 text-violet-300', desc: 'Ra lệnh cho AI staff, robot, tự động hóa và kiểm soát an toàn.' },
  { tab: 'analytics', dept: 'analytics', label: 'Analytics & Models', badge: 'DATA', badgeColor: 'bg-amber-500/15 text-amber-300', desc: 'Python/SQL sandbox, data science, game simulation và applied ML.' },
  { tab: 'system_settings', dept: 'settings', label: 'Cài đặt & DevOps', badge: 'CFG', badgeColor: 'bg-slate-700 text-slate-350', desc: 'AI Gateway, tích hợp hệ thống, CI Doctor, bảo mật và cấu hình nâng cao.' },
  { tab: 'operations', dept: 'operations', label: 'Sản phẩm & Thị trường', badge: 'LEGACY', badgeColor: 'bg-slate-700 text-slate-300', desc: 'Route cũ cho Product Studio, Marketing & Growth và Sales CRM.' },
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
  | 'sales-crm'
  | 'finance-accounting'
  | 'ai-workforce'
  | 'analytics-sandbox'
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
  { tab: 'ceo_command', laneId: 'command-center', label: 'Command Center', shortLabel: 'Command', description: 'Việc hôm nay, tài chính, pipeline, sản phẩm và AI mission', iconName: 'Building2', group: 'Operate', status: 'core', owner: 'Founder' },
  { tab: 'product_studio', laneId: 'product-studio', label: 'Product Studio', shortLabel: 'Product', description: 'Sản phẩm phần mềm, game, roadmap, release và template ngành', iconName: 'FolderKanban', group: 'Build', status: 'core', owner: 'Product' },
  { tab: 'marketing_growth', laneId: 'marketing-growth', label: 'Marketing & Growth', shortLabel: 'Growth', description: 'Định vị, chiến dịch, nội dung, khảo sát và tạo lead', iconName: 'Rocket', group: 'Sell', status: 'core', owner: 'Marketing' },
  { tab: 'sales_crm', laneId: 'sales-crm', label: 'Sales & CRM', shortLabel: 'Sales', description: 'Leads, khách hàng, demo, báo giá và follow-up', iconName: 'UsersRound', group: 'Sell', status: 'core', owner: 'Sales' },
  { tab: 'finance_accounting', laneId: 'finance-accounting', label: 'Tài chính - Kế toán', shortLabel: 'Tài chính', description: 'Sổ cái, báo cáo tài chính, dòng tiền và kiểm soát nội bộ', iconName: 'CircleDollarSign', group: 'Control', status: 'core', owner: 'Finance' },
  { tab: 'ai_factory', laneId: 'ai-workforce', label: 'AI Operations', shortLabel: 'AI', description: 'Ra lệnh, giao mission, robot và tự động hóa có kiểm soát', iconName: 'Bot', group: 'Build', status: 'core', owner: 'AgentOps' },
  { tab: 'analytics', laneId: 'analytics-sandbox', label: 'Analytics & Models', shortLabel: 'Analytics', description: 'Python, SQL sandbox, data science và game simulation', iconName: 'BarChart3', group: 'Extend', status: 'core', owner: 'Founder' },
  { tab: 'system_settings', laneId: 'system-settings', label: 'Cài đặt & DevOps', shortLabel: 'Cài đặt', description: 'AI Gateway, tích hợp, CI Doctor, bảo mật và cấu hình nâng cao', iconName: 'Settings', group: 'Control', status: 'next', owner: 'Admin' },
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
  { id: 'industry-templates', label: 'Industry Templates', group: 'Extend', status: 'template', owner: 'Templates', routeHint: '#/product_studio' },
];

export function getCompanyOSLane(id: CompanyOSLaneId) {
  return companyOSLanes.find((lane) => lane.id === id);
}
