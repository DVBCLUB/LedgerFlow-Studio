export type CompanyOSV2LaneGroup = 'Command' | 'Build' | 'Sell' | 'Control' | 'Extend';

export interface CompanyOSV2LaneMapItem {
  id: string;
  label: string;
  group: CompanyOSV2LaneGroup;
  route: string;
  purpose: string;
  v2Note: string;
}

export const COMPANY_OS_V2_LANE_MAP: CompanyOSV2LaneMapItem[] = [
  {
    id: 'dashboard',
    label: 'Command Center',
    group: 'Command',
    route: '/dashboard',
    purpose: 'Màn hình điều hành tổng hợp cho founder.',
    v2Note: 'Ưu tiên Daily Brief, trạng thái P0 và next action.'
  },
  {
    id: 'founder',
    label: 'Founder Office',
    group: 'Command',
    route: '/founder',
    purpose: 'Quản trị mục tiêu, quyết định và chiến lược cá nhân.',
    v2Note: 'Giữ như phòng CEO thay vì chỉ là lab rời rạc.'
  },
  {
    id: 'custom_data',
    label: 'Custom Data Workbench',
    group: 'Build',
    route: '/custom_data',
    purpose: 'Phòng dữ liệu: schema, query, pivot và sandbox phân tích.',
    v2Note: 'Deepen bằng schema preview và pivot simulation.'
  },
  {
    id: 'accounting_vn',
    label: 'Vietnam Accounting Lab',
    group: 'Control',
    route: '/accounting_vn',
    purpose: 'Kế toán Việt Nam, case học tập và kiểm soát hồ sơ.',
    v2Note: 'Không định vị là ERP thay MISA; đây là learning/control workspace.'
  },
  {
    id: 'audit_workspace',
    label: 'Internal Audit Workspace',
    group: 'Control',
    route: '/audit_workspace',
    purpose: 'Không gian kiểm tra quy trình, checklist và bằng chứng.',
    v2Note: 'Deepen bằng audit program templates cho SME Việt Nam.'
  },
  {
    id: 'marketing_suite',
    label: 'Marketing Suite',
    group: 'Sell',
    route: '/marketing_suite',
    purpose: 'Lập kế hoạch nội dung, kênh bán và chiến dịch.',
    v2Note: 'Gắn vào Market Engine, không để rời khỏi Company OS.'
  },
  {
    id: 'sales_crm',
    label: 'Sales CRM',
    group: 'Sell',
    route: '/sales-crm',
    purpose: 'Quản lý lead, pipeline, khách hàng và follow-up.',
    v2Note: 'Dùng như phòng bán hàng của solo founder.'
  },
  {
    id: 'advanced_ai',
    label: 'AI Workforce',
    group: 'Build',
    route: '/advanced_ai',
    purpose: 'Quản lý năng lực AI, prompt, agent và automation.',
    v2Note: 'AI là nhân viên, founder duyệt cuối.'
  },
  {
    id: 'zalo_hub',
    label: 'Zalo Hub',
    group: 'Extend',
    route: '/zalo_hub',
    purpose: 'Kênh kết nối thị trường Việt Nam qua Zalo.',
    v2Note: 'Ưu tiên blueprint/offline trước khi có API thật.'
  }
];

export const COMPANY_OS_V2_NAV_ACCEPTANCE = [
  'Label hiển thị theo phòng ban hoặc chức năng kinh doanh, không chỉ theo tên kỹ thuật.',
  'Không đổi id hoặc route khi chỉ đổi framing.',
  'Mỗi module có group rõ: Command, Build, Sell, Control hoặc Extend.',
  'Navigation vẫn chạy offline và không cần dependency mới.'
];
