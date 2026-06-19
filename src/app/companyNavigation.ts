/**
 * Company Navigation Registry
 * Central config for all workspaces, departments, and module metadata.
 * Used by the app sidebar and WorkspaceRenderer.
 */

// ─── Tab Types ────────────────────────────────────────────────────────────────
export type TabType =
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
  | 'system_settings';

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
    label: 'Ban điều hành',
    color: 'text-purple-400',
    dotColor: 'bg-purple-500',
    chevronColor: 'text-purple-400',
    roles: ['all', 'ceo'],
    defaultExpanded: true,
  },
  {
    key: 'product',
    label: 'Phòng R&D & Sản phẩm',
    color: 'text-indigo-400',
    dotColor: 'bg-indigo-500',
    chevronColor: 'text-indigo-400',
    roles: ['all', 'dev'],
    defaultExpanded: true,
  },
  {
    key: 'media',
    label: 'Phòng Nội dung & Media',
    color: 'text-rose-400',
    dotColor: 'bg-rose-500',
    chevronColor: 'text-rose-400',
    roles: ['all', 'marketing'],
    defaultExpanded: false,
  },
  {
    key: 'marketing',
    label: 'Phòng Marketing & Growth',
    color: 'text-sky-400',
    dotColor: 'bg-sky-500',
    chevronColor: 'text-sky-400',
    roles: ['all', 'marketing'],
    defaultExpanded: false,
  },
  {
    key: 'sales',
    label: 'Phòng Kinh doanh & CRM',
    color: 'text-amber-400',
    dotColor: 'bg-amber-500',
    chevronColor: 'text-amber-400',
    roles: ['all', 'marketing', 'ceo'],
    defaultExpanded: false,
  },
  {
    key: 'finance',
    label: 'Phòng Tài chính & Kế toán',
    color: 'text-emerald-400',
    dotColor: 'bg-emerald-500',
    chevronColor: 'text-emerald-400',
    roles: ['all', 'ceo'],
    defaultExpanded: false,
  },
  {
    key: 'aiops',
    label: 'Phòng AI Nhân sự',
    color: 'text-violet-400',
    dotColor: 'bg-violet-500',
    chevronColor: 'text-violet-400',
    roles: ['all', 'dev', 'ceo'],
    defaultExpanded: false,
  },
  {
    key: 'control',
    label: 'Hệ thống & Kiểm soát',
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
  // Command Center
  { tab: 'dashboard',        dept: 'command',   label: 'Bảng Chiến Lược',            badge: 'ROOT',  badgeColor: 'bg-purple-500/15 text-purple-300', desc: 'Bảng điều khiển trung tâm nghiên cứu chiến lược khởi nghiệp.' },
  { tab: 'knowledge',        dept: 'command',   label: 'Thư viện tri thức',          badge: 'MEM',   badgeColor: 'bg-violet-500/15 text-violet-300', desc: 'Company Memory và RAG seed.' },
  { tab: 'advisory',         dept: 'command',   label: 'Hội Đồng Cố Vấn',            badge: 'BOARD', badgeColor: 'bg-amber-500/15 text-amber-400',   desc: 'Báo cáo thẩm định toàn diện phản hồi từ 4 cố vấn.' },
  { tab: 'founder',          dept: 'command',   label: 'Tài Chính Solo Founder',      badge: 'CEO',   badgeColor: 'bg-slate-800 text-slate-400',      desc: 'Tính toán chi tiết tài chính, MRR, chi phí hòa vốn.' },

  // Product Studio
  { tab: 'guerrilla',        dept: 'product',   label: 'Sản Phẩm Du Kích',           badge: 'STUDIO', badgeColor: 'bg-emerald-500/15 text-emerald-400', desc: 'Setup kịch bản 0đ, sinh ý tưởng sản phẩm hóa dịch vụ.' },
  { tab: 'roadmap',          dept: 'product',   label: 'Lộ Trình Sản Phẩm',          badge: 'MAP',   badgeColor: 'bg-indigo-500/15 text-indigo-400', desc: 'Lộ trình phát triển Web full-stack từ A-Z.' },
  { tab: 'architecture',     dept: 'product',   label: 'Sơ Đồ AI & Cloud',           badge: 'ARCH',  badgeColor: 'bg-indigo-500/15 text-indigo-400', desc: 'Hạ tầng Hybrid Offline-First & Cloudflare Serverless.' },
  { tab: 'game_ml',          dept: 'product',   label: 'Game Mobile Lab',             badge: 'LAB',   badgeColor: 'bg-pink-500/15 text-pink-400',     desc: 'Thử nghiệm máy học tài chính và Game mô phỏng kinh tế.' },
  { tab: 'ml_applied',       dept: 'product',   label: 'Machine Learning Thực Tế',   badge: 'ML',    badgeColor: 'bg-indigo-500/15 text-indigo-400', desc: 'Ứng dụng AI API, tự train model, dự báo chuỗi thời gian.' },
  { tab: 'datascience',      dept: 'product',   label: 'Data Science & FinLab',       badge: 'DATA',  badgeColor: 'bg-cyan-500/15 text-cyan-400',     desc: 'Pipeline làm sạch dữ liệu tự động, audit toán học, Pandas.' },
  { tab: 'deploy_business',  dept: 'product',   label: 'Đăng Ký & Cổng Thanh Toán',  badge: 'OPS',   badgeColor: 'bg-teal-500/15 text-teal-400',     desc: 'Đăng ký kinh doanh, VietQR/Momo, DevOps pipeline.' },

  // Media & Content
  { tab: 'video_lab',        dept: 'media',     label: 'AI Content & Video Lab',      badge: 'MEDIA', badgeColor: 'bg-rose-500/15 text-rose-400',     desc: 'Kế hoạch video TikTok, YouTube, FB Reels, mô phỏng doanh thu Creator.' },

  // Marketing & Growth
  { tab: 'marketing_growth_v2', dept: 'marketing', label: 'V2 Growth OS Workspace',  badge: 'V2',    badgeColor: 'bg-sky-500/15 text-sky-400',       desc: 'Hệ điều hành tăng trưởng V2: landing page, email sequence, launch playbook.' },
  { tab: 'marketing_suite',  dept: 'marketing', label: 'Tự Động Hóa Marketing',      badge: 'AUTO',  badgeColor: 'bg-sky-500/15 text-sky-400',       desc: 'Phễu chăm sóc khách hàng, hành trình tự động, A/B test.' },
  { tab: 'seo_strategy',     dept: 'marketing', label: 'Chiến Lược SEO Từ Khóa',     badge: 'SEO',   badgeColor: 'bg-emerald-500/15 text-emerald-400', desc: 'Nghiên cứu từ khóa Google, ánh xạ sản phẩm micro-SaaS.' },
  { tab: 'zalo_hub',         dept: 'marketing', label: 'Zalo Marketing Hub 🇻🇳',     badge: 'ZALO',  badgeColor: 'bg-blue-500/15 text-blue-400',     desc: 'ZNS Template Builder, OA Campaign Manager, ROI Calculator.' },
  { tab: 'affiliate_hub',    dept: 'marketing', label: 'Partner Affiliate Network',   badge: 'AFF',   badgeColor: 'bg-sky-500/15 text-sky-400',       desc: 'Tự động hóa kênh tiếp thị liên kết, lượng truy cập tự nhiên.' },
  { tab: 'market_survey',    dept: 'marketing', label: 'Khảo Sát & Phân Tích Thị Trường', badge: 'SURVEY', badgeColor: 'bg-sky-500/15 text-sky-400', desc: 'Nghiên cứu & phản hồi mục tiêu khách hàng, chứng minh nhu cầu.' },
  { tab: 'funnel_lab',       dept: 'marketing', label: 'Funnel & CRO Lab',            badge: 'CRO',   badgeColor: 'bg-sky-500/15 text-sky-400',       desc: 'Phân tích phễu chuyển đổi, tối ưu CAC/LTV, micro-events.' },

  // Sales & CRM
  { tab: 'outbound_hub',     dept: 'sales',     label: 'Outbound AI Outreach',        badge: 'CRM',   badgeColor: 'bg-amber-500/15 text-amber-400',   desc: 'Chiến dịch Cold Pitch qua Email B2B và LinkedIn.' },
  { tab: 'lead_scoring',     dept: 'sales',     label: 'Lead Scoring Engine',         badge: 'SCORE', badgeColor: 'bg-amber-500/15 text-amber-400',   desc: 'Chấm điểm lead tự động theo hành vi và độ phù hợp ICP.' },
  { tab: 'nps_manager',      dept: 'sales',     label: 'NPS & Review Intel',          badge: 'NPS',   badgeColor: 'bg-amber-500/15 text-amber-400',   desc: 'Thu thập NPS, phân tích Sentiment, kho Testimonial.' },
  { tab: 'ltv_dashboard',    dept: 'sales',     label: 'Customer LTV & Churn',        badge: 'LTV',   badgeColor: 'bg-amber-500/15 text-amber-400',   desc: 'Phân tích phễu giữ chân khách hàng, cohort, cảnh báo Churn.' },

  // Finance & Accounting
  { tab: 'custom_data',      dept: 'finance',   label: 'Sổ Cái & Nhật Ký',           badge: 'GL',    badgeColor: 'bg-emerald-500/15 text-emerald-400', desc: 'Ghi chép sổ cái Nợ/Có, kiểm soát cân bằng kép.' },
  { tab: 'accounting_vn',    dept: 'finance',   label: 'Kế Toán Thực Chiến VN',       badge: 'VN',    badgeColor: 'bg-red-500/15 text-red-400',       desc: 'Nghị định 123 hóa đơn điện tử, Thông tư 200 hạch toán.' },
  { tab: 'approval_workflow',dept: 'finance',   label: 'Phê Duyệt Chứng Từ',          badge: 'APPR',  badgeColor: 'bg-orange-500/15 text-orange-400', desc: 'Luồng phê duyệt chứng từ: Nháp → Trình duyệt → Đã duyệt → Đã thanh toán.' },
  { tab: 'financial_reports',dept: 'finance',   label: 'Báo Cáo Tài Chính',           badge: 'B01+',  badgeColor: 'bg-emerald-500/15 text-emerald-400', desc: 'B01-DN Bảng CĐKT, B02-DN KQKD, B03-DN Lưu chuyển tiền tệ theo TT200.' },
  { tab: 'pricing_lab',      dept: 'finance',   label: 'Pricing Strategy Lab 🇻🇳',   badge: 'PRICE', badgeColor: 'bg-emerald-500/15 text-emerald-400', desc: 'Mô hình giá Van Westendorp, cấu trúc gói, hệ số co giãn.' },

  // AI Ops & Sandbox
  { tab: 'ai_staff',         dept: 'aiops',     label: 'Điều Phối AI Nhân Sự',        badge: 'HR',    badgeColor: 'bg-purple-500/15 text-purple-300', desc: 'Bảng phân công nhiệm vụ, chạy và phê duyệt kết quả thực thi của các nhân sự AI.' },
  { tab: 'assistant',        dept: 'aiops',     label: 'AI Trợ Lý Chatbot',           badge: 'AI',    badgeColor: 'bg-violet-500/15 text-violet-400', desc: 'Chatbot đàm thoại, upload file sao kê PDF/CSV.' },
  { tab: 'prompts',          dept: 'aiops',     label: 'Bộ Kỹ Sư Prompt',             badge: 'PROMPT',badgeColor: 'bg-violet-500/15 text-violet-400', desc: 'Prompt chuyên sâu kế toán, tài chính Việt Nam.' },
  { tab: 'advanced_ai',      dept: 'aiops',     label: 'AI Advanced Labs',             badge: 'VIP',   badgeColor: 'bg-violet-500/15 text-violet-400', desc: 'WebLLM local, GraphRAG, AI proxy Gateway bảo vệ PII.' },
  { tab: 'audit_workspace',  dept: 'aiops',     label: 'Kiểm Toán Nội Bộ COSO',       badge: 'COSO',  badgeColor: 'bg-slate-700 text-slate-300',       desc: 'Thẩm định rủi ro theo khung COSO, kế hoạch chọn mẫu.' },
  { tab: 'python_sandbox',   dept: 'aiops',     label: 'Python Data Sandbox',          badge: 'WASM',  badgeColor: 'bg-slate-700 text-slate-300',       desc: 'Phân tích dữ liệu, làm sạch sao kê, tính Altman Z-score.' },

  // System Settings
  { tab: 'system_settings',  dept: 'control',   label: 'Cài Đặt Hệ Thống',             badge: 'CFG',   badgeColor: 'bg-violet-700/20 text-violet-300',  desc: 'Cài đặt AI Gateway, bảo mật vault, tích hợp nền tảng và cấu hình ứng dụng.' },
];

export interface WorkspaceNavigationItem {
  tab: TabType;
  label: string;
  shortLabel: string;
  description: string;
  iconName: string;
}

export const COMPANY_WORKSPACES: WorkspaceNavigationItem[] = [
  { tab: 'dashboard', label: 'Tổng quan điều hành', shortLabel: 'Tổng quan', description: 'Ưu tiên, doanh thu và cảnh báo', iconName: 'Building2' },
  { tab: 'knowledge', label: 'Thư viện tri thức', shortLabel: 'Tri thức', description: 'Company Memory và RAG seed', iconName: 'Database' },
  { tab: 'guerrilla', label: 'Product Studio', shortLabel: 'Sản phẩm', description: 'Danh mục, roadmap và phát hành', iconName: 'PackageOpen' },
  { tab: 'marketing_growth_v2', label: 'Marketing & Growth', shortLabel: 'Marketing', description: 'Chiến dịch, nội dung và tăng trưởng', iconName: 'BarChart3' },
  { tab: 'outbound_hub', label: 'Sales & CRM', shortLabel: 'Kinh doanh', description: 'Lead, khách hàng và cơ hội', iconName: 'UsersRound' },
  { tab: 'accounting_vn', label: 'Tài chính & Kế toán', shortLabel: 'Tài chính', description: 'Dòng tiền, công nợ và báo cáo', iconName: 'CircleDollarSign' },
  { tab: 'roadmap', label: 'Dự án & Delivery', shortLabel: 'Dự án', description: 'Tiến độ, nguồn lực và bàn giao', iconName: 'FolderKanban' },
  { tab: 'approval_workflow', label: 'Hồ sơ & Phê duyệt', shortLabel: 'Hồ sơ', description: 'Chứng từ, hợp đồng và kiểm soát', iconName: 'FileCheck2' },
  { tab: 'ai_staff', label: 'AI Nhân sự', shortLabel: 'AI Nhân sự', description: 'Vai trò, nhiệm vụ và chất lượng AI', iconName: 'Bot' },
  { tab: 'game_ml', label: 'Analytics & Sandbox', shortLabel: 'Phân tích', description: 'Mô hình, dữ liệu và thử nghiệm', iconName: 'Boxes' },
  { tab: 'integration_hub', label: 'Integration Hub', shortLabel: 'Tích hợp', description: 'GitHub, công cụ và đồng bộ', iconName: 'Network' },
  { tab: 'system_settings', label: 'Cài đặt hệ thống', shortLabel: 'Cài đặt', description: 'Bảo mật, AI Gateway và chẩn đoán', iconName: 'Settings' },
];
