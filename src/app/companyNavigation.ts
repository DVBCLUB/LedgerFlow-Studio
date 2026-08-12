/**
 * Company Navigation Registry
 * Sidebar shows only the core workspaces. Old routes are kept only for redirects.
 */

export type CoreTabType =
  | 'ceo_command'
  | 'knowledge_library'
  | 'product_studio'
  | 'marketing_growth'
  | 'sales_crm'
  | 'finance_accounting'
  | 'projects_delivery'
  | 'documents_approval'
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
  'knowledge_library',
  'product_studio',
  'marketing_growth',
  'sales_crm',
  'finance_accounting',
  'projects_delivery',
  'documents_approval',
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
  | 'cfo'
  | 'accountant'
  | 'finance'
  | 'operations'
  | 'agentops'
  | 'devops'
  | 'marketing'
  | 'product_owner'
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
  { key: 'operate', label: 'Điều hành', color: 'text-cyan-300', dotColor: 'bg-cyan-400', chevronColor: 'text-cyan-300', roles: ['all', 'founder', 'admin', 'viewer', 'operations', 'marketing'], defaultExpanded: true },
  { key: 'control', label: 'Kiểm soát', color: 'text-emerald-300', dotColor: 'bg-emerald-400', chevronColor: 'text-emerald-300', roles: ['all', 'founder', 'admin', 'finance', 'auditor', 'devops'], defaultExpanded: true },
  { key: 'tools', label: 'Nền tảng', color: 'text-violet-300', dotColor: 'bg-violet-400', chevronColor: 'text-violet-300', roles: ['all', 'founder', 'admin', 'agentops', 'devops'], defaultExpanded: false },
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
  { tab: 'ceo_command', dept: 'operate', label: 'Trung tâm Điều hành', badge: 'Hôm nay', badgeColor: 'bg-cyan-500/15 text-cyan-300', desc: 'Toàn cảnh hôm nay, việc cần quyết định, rủi ro và hiệu suất vận hành.' },
  { tab: 'knowledge_library', dept: 'operate', label: 'Thư viện Tri thức', badge: 'Tri thức', badgeColor: 'bg-indigo-500/15 text-indigo-300', desc: 'Nhập, duyệt, tìm kiếm và xuất context tri thức cho founder và đội ngũ AI.' },
  { tab: 'product_studio', dept: 'operate', label: 'Xưởng Sản phẩm', badge: 'Sản phẩm', badgeColor: 'bg-sky-500/15 text-sky-300', desc: 'Quản lý sản phẩm, lộ trình phát triển, lỗi, phản hồi và phát hành.' },
  { tab: 'marketing_growth', dept: 'operate', label: 'Tăng trưởng', badge: 'Tăng trưởng', badgeColor: 'bg-rose-500/15 text-rose-300', desc: 'Điều phối marketing, nội dung, thử nghiệm tăng trưởng và hiệu quả kênh.' },
  { tab: 'sales_crm', dept: 'operate', label: 'Bán hàng & Khách hàng', badge: 'Khách hàng', badgeColor: 'bg-amber-500/15 text-amber-300', desc: 'Theo dõi lead, cơ hội bán hàng, báo giá, chăm sóc và quan hệ khách hàng.' },
  { tab: 'finance_accounting', dept: 'control', label: 'Tài chính - Kế toán', badge: 'Tài chính', badgeColor: 'bg-emerald-500/15 text-emerald-300', desc: 'Quản lý sổ sách, dòng tiền, công nợ, báo cáo và kiểm soát chứng từ.' },
  { tab: 'projects_delivery', dept: 'operate', label: 'Dự án & Delivery', badge: 'Dự án', badgeColor: 'bg-blue-500/15 text-blue-300', desc: 'Theo dõi dự án sản phẩm, triển khai khách hàng, milestone, rủi ro và mẫu ngành.' },
  { tab: 'documents_approval', dept: 'control', label: 'Hồ sơ & Phê duyệt', badge: 'Hồ sơ', badgeColor: 'bg-teal-500/15 text-teal-300', desc: 'Quản lý chứng từ, yêu cầu phê duyệt, bằng chứng kiểm soát và hồ sơ phát hành.' },
  { tab: 'ai_factory', dept: 'tools', label: 'Đội ngũ AI', badge: 'AI', badgeColor: 'bg-violet-500/15 text-violet-300', desc: 'Giao việc, theo dõi và kiểm soát các agent AI vận hành doanh nghiệp.' },
  { tab: 'analytics', dept: 'tools', label: 'Analytics - Models - Sandbox', badge: 'Dữ liệu', badgeColor: 'bg-indigo-500/15 text-indigo-300', desc: 'Biểu đồ, mô phỏng, SQL/Python sandbox, dự báo, ML và thí nghiệm sản phẩm.' },
  { tab: 'system_settings', dept: 'tools', label: 'Quản trị hệ thống', badge: 'Quản trị', badgeColor: 'bg-slate-700 text-slate-300', desc: 'Cấu hình, tích hợp, bảo mật, nhật ký kiểm soát và quy trình phát hành.' },
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
  | 'knowledge-library'
  | 'product-studio'
  | 'marketing-growth'
  | 'sales-crm'
  | 'finance-accounting'
  | 'projects-delivery'
  | 'documents-approval'
  | 'ai-workforce'
  | 'analytics-models-sandbox'
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
  { tab: 'ceo_command', laneId: 'command-center', label: 'Trung tâm Điều hành', shortLabel: 'Điều hành', description: 'Toàn cảnh hôm nay, việc cần quyết định, rủi ro và hiệu suất vận hành.', iconName: 'Building2', group: 'Operate', status: 'core', owner: 'Founder' },
  { tab: 'knowledge_library', laneId: 'knowledge-library', label: 'Thư viện Tri thức', shortLabel: 'Tri thức', description: 'Nhập, duyệt, tìm kiếm và xuất context tri thức cho founder và đội ngũ AI.', iconName: 'BookOpen', group: 'Build', status: 'core', owner: 'Founder' },
  { tab: 'product_studio', laneId: 'product-studio', label: 'Xưởng Sản phẩm', shortLabel: 'Sản phẩm', description: 'Quản lý sản phẩm, lộ trình phát triển, lỗi, phản hồi và phát hành.', iconName: 'FolderKanban', group: 'Build', status: 'core', owner: 'Product' },
  { tab: 'marketing_growth', laneId: 'marketing-growth', label: 'Tăng trưởng', shortLabel: 'Tăng trưởng', description: 'Điều phối marketing, nội dung, thử nghiệm tăng trưởng và hiệu quả kênh.', iconName: 'Rocket', group: 'Sell', status: 'core', owner: 'Marketing' },
  { tab: 'sales_crm', laneId: 'sales-crm', label: 'Bán hàng & Khách hàng', shortLabel: 'Khách hàng', description: 'Theo dõi lead, cơ hội bán hàng, báo giá, chăm sóc và quan hệ khách hàng.', iconName: 'UsersRound', group: 'Sell', status: 'core', owner: 'Sales' },
  { tab: 'finance_accounting', laneId: 'finance-accounting', label: 'Tài chính - Kế toán', shortLabel: 'Tài chính', description: 'Quản lý sổ sách, dòng tiền, công nợ, báo cáo và kiểm soát chứng từ.', iconName: 'CircleDollarSign', group: 'Control', status: 'core', owner: 'Finance' },
  { tab: 'projects_delivery', laneId: 'projects-delivery', label: 'Dự án & Delivery', shortLabel: 'Dự án', description: 'Theo dõi dự án sản phẩm, triển khai khách hàng, milestone, rủi ro và mẫu ngành.', iconName: 'ClipboardList', group: 'Build', status: 'core', owner: 'Delivery' },
  { tab: 'documents_approval', laneId: 'documents-approval', label: 'Hồ sơ & Phê duyệt', shortLabel: 'Hồ sơ', description: 'Quản lý chứng từ, yêu cầu phê duyệt, bằng chứng kiểm soát và hồ sơ phát hành.', iconName: 'FileCheck2', group: 'Control', status: 'core', owner: 'Operations' },
  { tab: 'ai_factory', laneId: 'ai-workforce', label: 'Đội ngũ AI', shortLabel: 'Đội ngũ AI', description: 'Giao việc, theo dõi và kiểm soát các agent AI vận hành doanh nghiệp.', iconName: 'Bot', group: 'Build', status: 'core', owner: 'Founder' },
  { tab: 'analytics', laneId: 'analytics-models-sandbox', label: 'Analytics - Models - Sandbox', shortLabel: 'Sandbox', description: 'Biểu đồ, mô phỏng, SQL/Python sandbox, dự báo, ML và thí nghiệm sản phẩm.', iconName: 'BarChart3', group: 'Extend', status: 'core', owner: 'Founder' },
  { tab: 'system_settings', laneId: 'system-settings', label: 'Quản trị hệ thống', shortLabel: 'Quản trị', description: 'Cấu hình, tích hợp, bảo mật, nhật ký kiểm soát và quy trình phát hành.', iconName: 'Settings', group: 'Control', status: 'core', owner: 'Admin' },
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
