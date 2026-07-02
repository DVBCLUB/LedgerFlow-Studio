/**
 * Company Navigation Registry
 * Sidebar shows only the core workspaces. Old routes are kept only for redirects.
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
  | 'control_room'
  | 'growth_sales'
  | 'ai_staff_sandbox';

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
  'devops_hub',
  'control_room',
  'growth_sales',
  'ai_staff_sandbox',
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
  { key: 'operate', label: 'Vận hành', color: 'text-cyan-300', dotColor: 'bg-cyan-400', chevronColor: 'text-cyan-300', roles: ['all', 'founder', 'admin', 'viewer', 'operations', 'marketing'], defaultExpanded: true },
  { key: 'control', label: 'Kiểm soát', color: 'text-emerald-300', dotColor: 'bg-emerald-400', chevronColor: 'text-emerald-300', roles: ['all', 'founder', 'admin', 'finance', 'auditor', 'devops'], defaultExpanded: true },
  { key: 'tools', label: 'Công cụ', color: 'text-violet-300', dotColor: 'bg-violet-400', chevronColor: 'text-violet-300', roles: ['all', 'founder', 'admin', 'agentops', 'devops'], defaultExpanded: false },
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
  { tab: 'ceo_command', dept: 'operate', label: 'Command Center', badge: 'HOME', badgeColor: 'bg-cyan-500/15 text-cyan-300', desc: 'Việc hôm nay, cảnh báo và ưu tiên cần xử lý.' },
  { tab: 'product_studio', dept: 'operate', label: 'Product Studio', badge: 'BUILD', badgeColor: 'bg-sky-500/15 text-sky-300', desc: 'Sản phẩm, roadmap và release nội bộ.' },
  { tab: 'marketing_growth', dept: 'operate', label: 'Marketing', badge: 'MKT', badgeColor: 'bg-rose-500/15 text-rose-300', desc: 'Chiến dịch, nội dung và tín hiệu tăng trưởng.' },
  { tab: 'sales_crm', dept: 'operate', label: 'Sales & CRM', badge: 'CRM', badgeColor: 'bg-amber-500/15 text-amber-300', desc: 'Lead, pipeline, báo giá và follow-up.' },
  { tab: 'finance_accounting', dept: 'control', label: 'Tài chính - Kế toán', badge: 'FIN', badgeColor: 'bg-emerald-500/15 text-emerald-300', desc: 'Sổ cái, báo cáo, dòng tiền và phê duyệt.' },
  { tab: 'ai_factory', dept: 'tools', label: 'AI Operations', badge: 'AI', badgeColor: 'bg-violet-500/15 text-violet-300', desc: 'Trợ lý AI theo yêu cầu.' },
  { tab: 'analytics', dept: 'tools', label: 'Analytics', badge: 'DATA', badgeColor: 'bg-indigo-500/15 text-indigo-300', desc: 'Python sandbox và phân tích dữ liệu khi cần.' },
  { tab: 'system_settings', dept: 'tools', label: 'Cài đặt', badge: 'CFG', badgeColor: 'bg-slate-700 text-slate-300', desc: 'Cài đặt, tích hợp, DevOps và trạng thái hệ thống.' },
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
  | 'system-settings';

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
  { tab: 'ceo_command', laneId: 'command-center', label: 'Command Center', shortLabel: 'Command', description: 'Việc hôm nay và cảnh báo chính', iconName: 'Building2', group: 'Operate', status: 'core', owner: 'Founder' },
  { tab: 'product_studio', laneId: 'product-studio', label: 'Product Studio', shortLabel: 'Product', description: 'Sản phẩm và roadmap', iconName: 'FolderKanban', group: 'Build', status: 'core', owner: 'Product' },
  { tab: 'marketing_growth', laneId: 'marketing-growth', label: 'Marketing', shortLabel: 'Marketing', description: 'Chiến dịch và nội dung', iconName: 'Rocket', group: 'Sell', status: 'core', owner: 'Marketing' },
  { tab: 'sales_crm', laneId: 'sales-crm', label: 'Sales & CRM', shortLabel: 'Sales', description: 'Lead và follow-up', iconName: 'UsersRound', group: 'Sell', status: 'core', owner: 'Sales' },
  { tab: 'finance_accounting', laneId: 'finance-accounting', label: 'Tài chính - Kế toán', shortLabel: 'Tài chính', description: 'Sổ cái và báo cáo', iconName: 'CircleDollarSign', group: 'Control', status: 'core', owner: 'Finance' },
  { tab: 'ai_factory', laneId: 'ai-workforce', label: 'AI Operations', shortLabel: 'AI', description: 'Trợ lý AI khi cần', iconName: 'Bot', group: 'Build', status: 'core', owner: 'Founder' },
  { tab: 'analytics', laneId: 'analytics-sandbox', label: 'Analytics', shortLabel: 'Analytics', description: 'Python và dữ liệu', iconName: 'BarChart3', group: 'Extend', status: 'core', owner: 'Founder' },
  { tab: 'system_settings', laneId: 'system-settings', label: 'Cài đặt', shortLabel: 'Cài đặt', description: 'Tích hợp và DevOps', iconName: 'Settings', group: 'Control', status: 'core', owner: 'Admin' },
];

export const companyOSLanes: CompanyOSLane[] = COMPANY_WORKSPACES.map((workspace) => ({
  id: workspace.laneId,
  label: workspace.label,
  group: workspace.group,
  status: workspace.status,
  owner: workspace.owner,
  routeHint: `#/${workspace.tab}`,
}));

export function getCompanyOSLane(id: CompanyOSLaneId) {
  return companyOSLanes.find((lane) => lane.id === id);
}
