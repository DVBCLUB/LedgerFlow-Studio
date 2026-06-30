/**
 * Company Navigation Registry
 * Central config for all workspaces, departments, and module metadata.
 * Used by the app sidebar and WorkspaceRenderer.
 */

// ─── Tab Types ────────────────────────────────────────────────────────────────
export type CoreTabType =
  | 'ceo_command'
  | 'finance_accounting'
  | 'operations'
  | 'ai_factory'
  | 'analytics'
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
  | 'integration_hub'
  | 'devops_hub'
  | 'control_room';

export type TabType = CoreTabType | LegacyTabType;

export const CORE_TABS: readonly CoreTabType[] = [
  'ceo_command',
  'finance_accounting',
  'operations',
  'ai_factory',
  'analytics',
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
    roles: ['all', 'founder', 'admin', 'viewer'],
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
    key: 'operations',
    label: 'Product & Market',
    color: 'text-sky-400',
    dotColor: 'bg-sky-500',
    chevronColor: 'text-sky-400',
    roles: ['all', 'founder', 'admin', 'operations', 'marketing'],
    defaultExpanded: true,
  },
  {
    key: 'aiops',
    label: 'AI Workforce',
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

/** Lọc phòng ban theo vai trò người dùng */
export function isDepartmentVisible(deptKey: string, role: RoleType): boolean {
  if (role === 'all') return true;
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
  { tab: 'ceo_command', dept: 'command', label: 'Điều hành Center', badge: 'HQ', badgeColor: 'bg-purple-500/15 text-purple-300', desc: 'Ban điều hành, standup, tri thức doanh nghiệp, SOP và risk.' },
  { tab: 'finance_accounting', dept: 'finance', label: 'Tài chính - Kế toán', badge: 'FIN', badgeColor: 'bg-emerald-500/15 text-emerald-450', desc: 'Sổ cái, báo cáo tài chính, dòng tiền và kiểm toán nội bộ.' },
  { tab: 'operations', dept: 'operations', label: 'Sản phẩm & Thị trường', badge: 'OPS', badgeColor: 'bg-sky-500/15 text-sky-400', desc: 'Product build studio, marketing growth, sales CRM, và procurement.' },
  { tab: 'ai_factory', dept: 'aiops', label: 'AI Nhân sự (Agent)', badge: 'AI', badgeColor: 'bg-violet-500/15 text-violet-300', desc: 'Nhân sự AI, Mission Queue, Robot điều khiển và MCP Tools.' },
  { tab: 'analytics', dept: 'analytics', label: 'Analytics & Models', badge: 'DATA', badgeColor: 'bg-amber-500/15 text-amber-300', desc: 'Python/SQL sandbox, data science, game simulation và applied ML.' },
  { tab: 'system_settings', dept: 'settings', label: 'Cài đặt & DevOps', badge: 'CFG', badgeColor: 'bg-slate-700 text-slate-350', desc: 'AI Gateway, tích hợp hệ thống, PR control, CI Doctor và bảo mật.' },
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
  { tab: 'ceo_command', laneId: 'command-center', label: 'Điều hành Center', shortLabel: 'Điều hành', description: 'Ban điều hành, standup, tri thức doanh nghiệp, SOP và risk', iconName: 'Building2', group: 'Operate', status: 'core', owner: 'Founder' },
  { tab: 'finance_accounting', laneId: 'finance-accounting', label: 'Tài chính - Kế toán', shortLabel: 'Tài chính', description: 'Sổ cái, báo cáo tài chính, dòng tiền và kiểm toán nội bộ', iconName: 'CircleDollarSign', group: 'Control', status: 'core', owner: 'Finance' },
  { tab: 'operations', laneId: 'product-studio', label: 'Sản phẩm & Thị trường', shortLabel: 'Sản phẩm', description: 'Product Studio, Marketing & Growth, Sales CRM và logistics', iconName: 'FolderKanban', group: 'Sell', status: 'core', owner: 'Founder' },
  { tab: 'ai_factory', laneId: 'ai-workforce', label: 'AI Nhân sự (Agent)', shortLabel: 'AI Nhân sự', description: 'Hồ sơ AI staff, mission queue, robot control và tự động hóa', iconName: 'Bot', group: 'Build', status: 'core', owner: 'AgentOps' },
  { tab: 'analytics', laneId: 'analytics-sandbox', label: 'Analytics & Models', shortLabel: 'Analytics', description: 'Python, SQL sandbox, data science và game simulation', iconName: 'BarChart3', group: 'Extend', status: 'core', owner: 'Founder' },
  { tab: 'system_settings', laneId: 'system-settings', label: 'Cài đặt & DevOps', shortLabel: 'Cài đặt', description: 'AI Gateway, integration, PR control, CI Doctor và bảo mật', iconName: 'Settings', group: 'Control', status: 'next', owner: 'Admin' },
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

