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
  | 'ai_staff_sandbox'
  | 'analytics_models_sandbox'
  | 'ai_nhan_su';

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
  ceoVisible?: boolean;
}

export const MODULES: ModuleEntry[] = [
  { tab: 'ceo_command', dept: 'operate', label: 'Trung tâm Điều hành', badge: 'Hôm nay', badgeColor: 'bg-cyan-500/15 text-cyan-300', desc: 'Toàn cảnh điều hành hôm nay, việc cần quyết định và hiệu suất vận hành.', ceoVisible: true },
  { tab: 'knowledge_library', dept: 'operate', label: 'Thư viện Tri thức', badge: 'Tri thức', badgeColor: 'bg-indigo-500/15 text-indigo-300', desc: 'Kho tài liệu, tri thức doanh nghiệp và tra cứu thông minh RAG.', ceoVisible: true },
  { tab: 'product_studio', dept: 'operate', label: 'Xưởng Sản phẩm', badge: 'Sản phẩm', badgeColor: 'bg-sky-500/15 text-sky-300', desc: 'Quản lý danh mục sản phẩm, ý tưởng và bản đồ phù hợp thị trường.', ceoVisible: true },
  { tab: 'marketing_growth', dept: 'operate', label: 'Tăng trưởng & Tiếp thị', badge: 'Tăng trưởng', badgeColor: 'bg-rose-500/15 text-rose-300', desc: 'Chiến dịch tăng trưởng, nội dung, radar đối thủ và tiếp thị đa kênh.', ceoVisible: true },
  { tab: 'sales_crm', dept: 'operate', label: 'Bán hàng & CRM', badge: 'Khách hàng', badgeColor: 'bg-amber-500/15 text-amber-300', desc: 'Phễu chuyển đổi khách hàng, sức khỏe khách hàng, định giá và chăm sóc.', ceoVisible: true },
  { tab: 'finance_accounting', dept: 'control', label: 'Tài chính - Kế toán', badge: 'Tài chính', badgeColor: 'bg-emerald-500/15 text-emerald-300', desc: 'Quản lý dòng tiền, sổ cái VAS/IFRS, dự báo và phê duyệt chi phí.', ceoVisible: true },
  { tab: 'projects_delivery', dept: 'operate', label: 'Dự án & Delivery', badge: 'Dự án', badgeColor: 'bg-blue-500/15 text-blue-300', desc: 'Danh mục dự án, tiến độ triển khai khách hàng và mẫu ngành.', ceoVisible: true },
  { tab: 'documents_approval', dept: 'control', label: 'Hồ sơ & Phê duyệt', badge: 'Hồ sơ', badgeColor: 'bg-teal-500/15 text-teal-300', desc: 'Trung tâm phê duyệt chi phí, chứng từ điện tử và kiểm soát.', ceoVisible: true },
  { tab: 'ai_factory', dept: 'tools', label: 'Đội ngũ AI & Tự động hóa', badge: 'AI', badgeColor: 'bg-violet-500/15 text-violet-300', desc: 'Trợ lý CEO, điều phối đội ngũ AI và vòng lặp tự vận hành.', ceoVisible: false },
  { tab: 'analytics', dept: 'tools', label: 'Phân tích & Sandbox', badge: 'Dữ liệu', badgeColor: 'bg-indigo-500/15 text-indigo-300', desc: 'Dự báo doanh thu 90 ngày, mô phỏng doanh nghiệp và phân tích dữ liệu.', ceoVisible: false },
  { tab: 'system_settings', dept: 'tools', label: 'Cài đặt & Quản trị', badge: 'Cài đặt', badgeColor: 'bg-slate-700 text-slate-300', desc: 'Cấu hình tài khoản, bảo mật kho khóa AI Vault và tích hợp hệ thống.', ceoVisible: false },
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
  { tab: 'ceo_command', laneId: 'command-center', label: 'Trung tâm Điều hành', shortLabel: 'Điều hành', description: 'Toàn cảnh điều hành hôm nay, việc cần quyết định và hiệu suất vận hành.', iconName: 'Building2', group: 'Operate', status: 'core', owner: 'Founder' },
  { tab: 'knowledge_library', laneId: 'knowledge-library', label: 'Thư viện Tri thức', shortLabel: 'Tri thức', description: 'Kho tài liệu, tri thức doanh nghiệp và tra cứu thông minh RAG.', iconName: 'BookOpen', group: 'Build', status: 'core', owner: 'Founder' },
  { tab: 'product_studio', laneId: 'product-studio', label: 'Xưởng Sản phẩm', shortLabel: 'Sản phẩm', description: 'Quản lý danh mục sản phẩm, ý tưởng và bản đồ phù hợp thị trường.', iconName: 'FolderKanban', group: 'Build', status: 'core', owner: 'Product' },
  { tab: 'marketing_growth', laneId: 'marketing-growth', label: 'Tăng trưởng & Tiếp thị', shortLabel: 'Tăng trưởng', description: 'Chiến dịch tăng trưởng, nội dung, radar đối thủ và tiếp thị đa kênh.', iconName: 'Rocket', group: 'Sell', status: 'core', owner: 'Marketing' },
  { tab: 'sales_crm', laneId: 'sales-crm', label: 'Bán hàng & CRM', shortLabel: 'Khách hàng', description: 'Phễu chuyển đổi khách hàng, sức khỏe khách hàng, định giá và chăm sóc.', iconName: 'UsersRound', group: 'Sell', status: 'core', owner: 'Sales' },
  { tab: 'finance_accounting', laneId: 'finance-accounting', label: 'Tài chính - Kế toán', shortLabel: 'Tài chính', description: 'Quản lý dòng tiền, sổ cái VAS/IFRS, dự báo và phê duyệt chi phí.', iconName: 'CircleDollarSign', group: 'Control', status: 'core', owner: 'Finance' },
  { tab: 'projects_delivery', laneId: 'projects-delivery', label: 'Dự án & Delivery', shortLabel: 'Dự án', description: 'Danh mục dự án, tiến độ triển khai khách hàng và mẫu ngành.', iconName: 'ClipboardList', group: 'Build', status: 'core', owner: 'Delivery' },
  { tab: 'documents_approval', laneId: 'documents-approval', label: 'Hồ sơ & Phê duyệt', shortLabel: 'Hồ sơ', description: 'Trung tâm phê duyệt chi phí, chứng từ điện tử và kiểm soát.', iconName: 'FileCheck2', group: 'Control', status: 'core', owner: 'Operations' },
  { tab: 'ai_factory', laneId: 'ai-workforce', label: 'Đội ngũ AI & Tự động hóa', shortLabel: 'AI Lab', description: 'Trợ lý CEO, điều phối đội ngũ AI và vòng lặp tự vận hành.', iconName: 'Bot', group: 'Build', status: 'core', owner: 'Founder' },
  { tab: 'analytics', laneId: 'analytics-models-sandbox', label: 'Phân tích & Sandbox', shortLabel: 'Sandbox', description: 'Dự báo doanh thu 90 ngày, mô phỏng doanh nghiệp và phân tích dữ liệu.', iconName: 'BarChart3', group: 'Extend', status: 'core', owner: 'Founder' },
  { tab: 'system_settings', laneId: 'system-settings', label: 'Cài đặt & Quản trị', shortLabel: 'Cài đặt', description: 'Cấu hình tài khoản, bảo mật kho khóa AI Vault và tích hợp hệ thống.', iconName: 'Settings', group: 'Control', status: 'core', owner: 'Admin' },
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
