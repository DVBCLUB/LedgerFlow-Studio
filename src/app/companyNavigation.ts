/**
 * Company Navigation Registry
 * Central config for all workspaces, departments, and module metadata.
 * Used by the app sidebar and WorkspaceRenderer.
 */

// ─── Tab Types ────────────────────────────────────────────────────────────────
export type TabType =
  // Consolidated core tabs
  | 'ceo_command'
  | 'product_studio'
  | 'growth_sales'
  | 'finance_accounting'
  | 'ai_staff_sandbox'
  | 'system_settings'
  
  // Legacy tabs for compile compatibility
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
    label: 'Ban điều hành & Tri thức',
    color: 'text-purple-400',
    dotColor: 'bg-purple-500',
    chevronColor: 'text-purple-400',
    roles: ['all', 'ceo'],
    defaultExpanded: true,
  },
  {
    key: 'product',
    label: 'R&D & Sản phẩm',
    color: 'text-indigo-400',
    dotColor: 'bg-indigo-500',
    chevronColor: 'text-indigo-400',
    roles: ['all', 'dev'],
    defaultExpanded: true,
  },
  {
    key: 'growth',
    label: 'Growth & Sales',
    color: 'text-sky-400',
    dotColor: 'bg-sky-500',
    chevronColor: 'text-sky-400',
    roles: ['all', 'marketing'],
    defaultExpanded: true,
  },
  {
    key: 'finance',
    label: 'Tài chính & Kiểm soát',
    color: 'text-emerald-400',
    dotColor: 'bg-emerald-500',
    chevronColor: 'text-emerald-400',
    roles: ['all', 'ceo'],
    defaultExpanded: true,
  },
  {
    key: 'aiops',
    label: 'AI Workforce & Labs',
    color: 'text-violet-400',
    dotColor: 'bg-violet-500',
    chevronColor: 'text-violet-400',
    roles: ['all', 'dev', 'ceo'],
    defaultExpanded: true,
  },
  {
    key: 'control',
    label: 'Cấu hình & Hệ thống',
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
  { tab: 'ceo_command', dept: 'command', label: 'CEO Command Center', badge: 'ROOT', badgeColor: 'bg-purple-500/15 text-purple-300', desc: 'Bảng điều khiển trung tâm chiến lược và tri thức.' },
  { tab: 'product_studio', dept: 'product', label: 'Product Studio', badge: 'STUDIO', badgeColor: 'bg-emerald-500/15 text-emerald-400', desc: 'R&D, roadmap và bàn giao sản phẩm.' },
  { tab: 'growth_sales', dept: 'growth', label: 'Growth & Sales', badge: 'GROWTH', badgeColor: 'bg-sky-500/15 text-sky-400', desc: 'Marketing campaigns, phễu chuyển đổi và sales B2B.' },
  { tab: 'finance_accounting', dept: 'finance', label: 'Finance & Accounting', badge: 'FIN', badgeColor: 'bg-emerald-500/15 text-emerald-400', desc: 'Sổ cái, báo cáo tài chính và phê duyệt.' },
  { tab: 'ai_staff_sandbox', dept: 'aiops', label: 'AI Workforce & Labs', badge: 'AI', badgeColor: 'bg-violet-500/15 text-violet-300', desc: 'Nhân sự AI, prompts và sandbox phân tích.' },
  { tab: 'system_settings', dept: 'control', label: 'Cài đặt hệ thống', badge: 'CFG', badgeColor: 'bg-slate-700 text-slate-300', desc: 'Cài đặt và tích hợp.' },
];

export interface WorkspaceNavigationItem {
  tab: TabType;
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
  { tab: 'ceo_command', laneId: 'command-center', label: 'CEO Command Center', shortLabel: 'Điều hành', description: 'Chiến lược, standup và tri thức RAG', iconName: 'Building2', group: 'Operate', status: 'core', owner: 'Founder' },
  { tab: 'product_studio', laneId: 'product-studio', label: 'Product Studio', shortLabel: 'Sản phẩm', description: 'Ý tưởng, định giá, roadmap và delivery', iconName: 'PackageOpen', group: 'Build', status: 'core', owner: 'Product' },
  { tab: 'growth_sales', laneId: 'marketing-growth', label: 'Growth & Sales', shortLabel: 'Tăng trưởng', description: 'Marketing campaigns, CRM và sales B2B', iconName: 'BarChart3', group: 'Sell', status: 'core', owner: 'Growth' },
  { tab: 'finance_accounting', laneId: 'finance-accounting', label: 'Finance & Accounting', shortLabel: 'Tài chính', description: 'Sổ cái VAS, báo cáo và phê duyệt chứng từ', iconName: 'CircleDollarSign', group: 'Control', status: 'core', owner: 'Finance' },
  { tab: 'ai_staff_sandbox', laneId: 'ai-workforce', label: 'AI Workforce & Labs', shortLabel: 'AI & Labs', description: 'AI Staff, prompts và sandbox dữ liệu', iconName: 'Bot', group: 'Build', status: 'core', owner: 'AgentOps' },
  { tab: 'system_settings', laneId: 'system-settings', label: 'Cài đặt & Tích hợp', shortLabel: 'Hệ thống', description: 'AI Gateway, bảo mật và kết nối platform', iconName: 'Settings', group: 'Control', status: 'next', owner: 'Admin' },
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
