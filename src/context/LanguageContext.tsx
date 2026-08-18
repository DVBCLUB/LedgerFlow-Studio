import React, { createContext, useContext, useState, useEffect } from 'react';

export type LanguageMode = 'vi' | 'en';

export interface LanguageContextType {
  language: LanguageMode;
  setLanguage: (lang: LanguageMode) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

const STORAGE_KEY = 'lf_language';

const TRANSLATIONS: Record<LanguageMode, Record<string, string>> = {
  vi: {
    // Topbar & System Controls
    'nav.role': 'Vai trò:',
    'nav.role.founder': '👑 Founder (Quản trị)',
    'nav.role.admin': '🛡️ Admin (Hệ thống)',
    'nav.role.cfo': '📊 CFO (Tài chính)',
    'nav.role.devops': '🚀 DevOps / AgentOps',
    'nav.role.product_owner': '📦 Product Owner',
    'nav.role.all': '👁️ Tất cả (Xem full)',
    'nav.theme.light': 'Chuyển sang Light mode',
    'nav.theme.dark': 'Chuyển sang Dark mode',
    'nav.language': 'Ngôn ngữ',
    'nav.language.vi': '🇻🇳 Tiếng Việt',
    'nav.language.en': '🇬🇧 English',
    'nav.voice': 'Giao tiếp Giọng nói với AI',

    // Workspaces
    'ws.ceo_command': 'Trung tâm Điều hành',
    'ws.knowledge_library': 'Thư viện Tri thức',
    'ws.product_studio': 'Xưởng Sản phẩm',
    'ws.marketing_growth': 'Tăng trưởng & Marketing',
    'ws.sales_crm': 'Bán hàng & Khách hàng',
    'ws.finance_accounting': 'Tài chính - Kế toán',
    'ws.projects_delivery': 'Dự án & Delivery',
    'ws.documents_approval': 'Hồ sơ & Phê duyệt',
    'ws.ai_factory': 'Đội ngũ AI',
    'ws.analytics': 'Analytics - Models - Sandbox',
    'ws.system_settings': 'Quản trị Hệ thống',

    // CEO Command Subtabs
    'subtab.ceo_command.overview': '💼 Tổng quan Vận hành',
    'subtab.ceo_command.today': '⚡ Trọng tâm Quyết định',
    'subtab.ceo_command.autonomous_command': '🤖 Tháp Điều hành AI',
    'subtab.ceo_command.standup_rhythm': '📋 Nhịp độ Quản trị',

    // CEO Cockpit Mode Switcher
    'ceo.mode.today': '1. Việc cần chốt hôm nay',
    'ceo.mode.boardroom': '2. Họp Hội đồng AI',
    'ceo.mode.finance': '3. Dòng tiền & Sức khỏe Tài chính',
    'ceo.mode.ai_ops': '4. Đội ngũ AI & Trạng thái Hệ thống',
    'ceo.mode.risk_kpi': '5. Kiểm soát Rủi ro & KPI',

    // Knowledge Library Subtabs & Trust Levels
    'subtab.knowledge_library.library': '📚 Kho Tri thức Doanh nghiệp',
    'subtab.knowledge_library.rag_simulator': '🔍 Tìm kiếm Vector RAG & Live Chat',
    'subtab.knowledge_library.operating_layer': '🌐 Tầng Tri thức Vận hành',
    'kb.trust.approved': '✓ Đã duyệt',
    'kb.trust.needs_review': '⏳ Chờ duyệt',
    'kb.trust.draft': '📝 Bản nháp',
    'kb.source.founder': '👑 Ghi chú Founder',
    'kb.source.sop': '📋 SOP Quy trình',
    'kb.source.code': '⚙️ Quyết định Kỹ thuật',
    'kb.source.accounting': '📊 Quy tắc Kế toán VAS',
    'kb.source.risk': '🛡️ Cảnh báo Rủi ro',
    'kb.source.customer': '💬 Ý kiến Khách hàng',
    'kb.source.import': '📄 Tài liệu Tải lên',

    // Product Studio Subtabs
    'subtab.product_studio.portfolio': '📦 Danh mục Sản phẩm',
    'subtab.product_studio.ideation': '💡 Phòng Ý tưởng & Nghiên cứu',
    'subtab.product_studio.games_ml': '🎮 Studio Game & Model AI',
    'subtab.product_studio.game_builder': '🛠️ Lắp ráp Game & App',
    'subtab.product_studio.smoke_test': '🧪 Kiểm thử Sản phẩm',

    // Marketing & Growth Subtabs
    'subtab.marketing_growth.campaigns': '🚀 Chiến dịch Tăng trưởng',
    'subtab.marketing_growth.content': '✍️ Tự động hóa Nội dung',
    'subtab.marketing_growth.video_studio': '🎥 Studio Video AI',

    // Sales & CRM Subtabs
    'subtab.sales_crm.funnel_lab': '🎯 Phễu Chuyển đổi Khách hàng',
    'subtab.sales_crm.pricing_ltv': '💰 Báo giá & Giá trị LTV',
    'subtab.sales_crm.referral_nps': '🤝 Đối tác & Chỉ số NPS',

    // Finance & Accounting Subtabs
    'subtab.finance_accounting.ledger': '📖 Sổ Kế toán & Nhật ký Thu chi',
    'subtab.finance_accounting.reports': '📊 Báo cáo Tài chính VAS',
    'subtab.finance_accounting.cashflow': '📈 Dự báo Dòng tiền',
    'subtab.finance_accounting.founder_control': '🛡️ Điểm Kiểm soát Founder',
    'subtab.finance_accounting.approval': '✍️ Duyệt Chi phí',
    'subtab.finance_accounting.audit': '🔍 Kiểm toán Chứng từ',
    'subtab.finance_accounting.tax_simulator': '🧮 Kịch bản Thuế & Audit',

    // Projects & Delivery Subtabs
    'subtab.projects_delivery.portfolio': '📋 Danh mục Dự án',
    'subtab.projects_delivery.industry_templates': '🏢 Mẫu Phân hệ theo Ngành',
    'subtab.projects_delivery.admin_ops': '👥 Vận hành Nhân sự',

    // Documents & Approvals Subtabs
    'subtab.documents_approval.approvals': '✍️ Luồng Phê duyệt',
    'subtab.documents_approval.audit': '🛡️ Kiểm soát Hồ sơ',
    'subtab.documents_approval.evidence': '📑 Bằng chứng & Audit Trail',

    // AI Factory Subtabs
    'subtab.ai_factory.command': '🤖 Trung tâm Điều phối AI',
    'subtab.ai_factory.builder': '⚙️ Lắp ráp Agent',
    'subtab.ai_factory.automation': '⚡ Quy trình Tự động hóa',
    'subtab.ai_factory.governance': '🛡️ Quản trị & Phân quyền AI',
    'subtab.ai_factory.release': '🚀 Đóng gói Nhiệm vụ',
    'subtab.ai_factory.advanced': '📊 Giám sát Kỹ thuật',

    // Analytics Subtabs
    'subtab.analytics.dashboard': '📈 Báo cáo Tổng hợp',
    'subtab.analytics.simulations': '🎲 Mô phỏng Kinh doanh',
    'subtab.analytics.data_engineering': '💾 Xử lý Dữ liệu',
    'subtab.analytics.ai_sandbox': '🧪 AI Playground',
    'subtab.analytics.python_sandbox': '🐍 Python Sandbox',

    // System Settings Subtabs
    'subtab.system_settings.general': '⚙️ Cấu hình Hệ thống',
    'subtab.system_settings.security': '🛡️ Bảo mật & Phân quyền',
    'subtab.system_settings.connectors': '🔌 Kết nối External',
    'subtab.system_settings.dev_ops': '🚀 GitOps & Release',
    'subtab.system_settings.recovery_ops': '🛠️ Khôi phục Dữ liệu',

    // Common Actions & Badges
    'action.save': 'Lưu lại',
    'action.cancel': 'Hủy bỏ',
    'action.confirm': 'Xác nhận',
    'action.edit': 'Chỉnh sửa',
    'action.delete': 'Xóa',
    'action.search': 'Tìm kiếm...',
    'action.export': 'Xuất báo cáo',
    'action.import': 'Nhập dữ liệu',
    'action.filter': 'Bộ lọc',
    'action.refresh': 'Làm mới',
    'action.close': 'Đóng',
    'action.approved': 'Đã phê duyệt',
    'action.pending': 'Chờ phê duyệt',
    'action.rejected': 'Từ chối',

    // Settings Panel
    'settings.title': 'Cấu hình Hệ thống',
    'settings.language_title': '🌐 Cấu hình Ngôn ngữ / Language Settings',
    'settings.language_desc': 'Lựa chọn ngôn ngữ hiển thị mặc định trên toàn bộ giao diện phần mềm.',
    'settings.language_select': 'Ngôn ngữ hiển thị:',
    'settings.office_precision': 'Định dạng Biểu mẫu Office Paper-Grade:',
    'settings.office_enabled': 'Đã kích hoạt chuẩn in nét căng Office Excel/Word',

    // Office Forms & Vouchers
    'form.company_name': 'CÔNG TY CỔ PHẦN CÔNG NGHỆ LEDGERFLOW',
    'form.voucher_title': 'CHỨNG TỪ KẾ TOÁN & PHÊ DUYỆT',
    'form.voucher_code': 'Mã chứng từ:',
    'form.date': 'Ngày lập:',
    'form.creator': 'Người lập phiếu',
    'form.chief_accountant': 'Kế toán trưởng',
    'form.director': 'Giám đốc phê duyệt',
    'form.total_amount': 'TỔNG CỘNG TIỀN (VNĐ):',
    'form.signature_note': '(Ký, ghi rõ họ tên và đóng dấu)',
  },
  en: {
    // Topbar & System Controls
    'nav.role': 'Role:',
    'nav.role.founder': '👑 Founder (Governance)',
    'nav.role.admin': '🛡️ Admin (System)',
    'nav.role.cfo': '📊 CFO (Finance)',
    'nav.role.devops': '🚀 DevOps / AgentOps',
    'nav.role.product_owner': '📦 Product Owner',
    'nav.role.all': '👁️ All Views',
    'nav.theme.light': 'Switch to Light mode',
    'nav.theme.dark': 'Switch to Dark mode',
    'nav.language': 'Language',
    'nav.language.vi': '🇻🇳 Vietnamese',
    'nav.language.en': '🇬🇧 English',
    'nav.voice': 'Voice Communication with AI',

    // Workspaces
    'ws.ceo_command': 'Executive Command Center',
    'ws.knowledge_library': 'Knowledge Library',
    'ws.product_studio': 'Product Studio',
    'ws.marketing_growth': 'Marketing & Growth',
    'ws.sales_crm': 'Sales & Customer CRM',
    'ws.finance_accounting': 'Finance & Accounting',
    'ws.projects_delivery': 'Projects & Delivery',
    'ws.documents_approval': 'Documents & Approvals',
    'ws.ai_factory': 'AI Workforce',
    'ws.analytics': 'Analytics - Models - Sandbox',
    'ws.system_settings': 'System Settings',

    // CEO Command Subtabs
    'subtab.ceo_command.overview': '💼 Executive Overview',
    'subtab.ceo_command.today': '⚡ Decision Priorities',
    'subtab.ceo_command.autonomous_command': '🤖 AI Command Tower',
    'subtab.ceo_command.standup_rhythm': '📋 Founder Governance Rhythm',

    // CEO Cockpit Mode Switcher
    'ceo.mode.today': "1. Today's Action Items",
    'ceo.mode.boardroom': '2. AI Boardroom Meeting',
    'ceo.mode.finance': '3. Cashflow & Financial Health',
    'ceo.mode.ai_ops': '4. AI Workforce & System Status',
    'ceo.mode.risk_kpi': '5. Risk Controls & KPI Model',

    // Knowledge Library Subtabs
    'subtab.knowledge_library.library': '📚 Enterprise Knowledge Hub',
    'subtab.knowledge_library.rag_simulator': '🔍 RAG Vector Search Simulator',
    'subtab.knowledge_library.operating_layer': '🌐 Operating Knowledge Layer',

    // Product Studio Subtabs
    'subtab.product_studio.portfolio': '📦 Product Portfolio',
    'subtab.product_studio.ideation': '💡 Ideation & Research Lab',
    'subtab.product_studio.games_ml': '🎮 Game & AI Model Studio',
    'subtab.product_studio.game_builder': '🛠️ App & Game Builder',
    'subtab.product_studio.smoke_test': '🧪 Product Smoke Test',

    // Marketing & Growth Subtabs
    'subtab.marketing_growth.campaigns': '🚀 Growth Campaigns',
    'subtab.marketing_growth.content': '✍️ Content Automation',
    'subtab.marketing_growth.video_studio': '🎥 AI Video Studio',

    // Sales & CRM Subtabs
    'subtab.sales_crm.funnel_lab': '🎯 Customer Conversion Funnel',
    'subtab.sales_crm.pricing_ltv': '💰 Quotes & Customer LTV',
    'subtab.sales_crm.referral_nps': '🤝 Partners & NPS Metrics',

    // Finance & Accounting Subtabs
    'subtab.finance_accounting.ledger': '📖 Accounting Ledger & Journals',
    'subtab.finance_accounting.reports': '📊 VAS Financial Statements',
    'subtab.finance_accounting.cashflow': '📈 Cashflow Forecasting',
    'subtab.finance_accounting.founder_control': '🛡️ Founder Control Points',
    'subtab.finance_accounting.approval': '✍️ Expense Approvals',
    'subtab.finance_accounting.audit': '🔍 Document Audit',
    'subtab.finance_accounting.tax_simulator': '🧮 Tax Scenarios & Audit Risk',

    // Projects & Delivery Subtabs
    'subtab.projects_delivery.portfolio': '📋 Project Delivery Portfolio',
    'subtab.projects_delivery.industry_templates': '🏢 Industry Specific Templates',
    'subtab.projects_delivery.admin_ops': '👥 Labor & HR Operations',

    // Documents & Approvals Subtabs
    'subtab.documents_approval.approvals': '✍️ Approval Workflows',
    'subtab.documents_approval.audit': '🛡️ Document Compliance Audit',
    'subtab.documents_approval.evidence': '📑 Evidence & Audit Trail',

    // AI Factory Subtabs
    'subtab.ai_factory.command': '🤖 AI Workforce Command Center',
    'subtab.ai_factory.builder': '⚙️ Agent Assembly Builder',
    'subtab.ai_factory.automation': '⚡ Process Automation & Robots',
    'subtab.ai_factory.governance': '🛡️ AI Governance & Access',
    'subtab.ai_factory.release': '🚀 Mission Packaging',
    'subtab.ai_factory.advanced': '📊 Technical Monitoring & Logs',

    // Analytics Subtabs
    'subtab.analytics.dashboard': '📈 Executive Dashboard',
    'subtab.analytics.simulations': '🎲 Business Simulation Engine',
    'subtab.analytics.data_engineering': '💾 Data Engineering Workbench',
    'subtab.analytics.ai_sandbox': '🧪 AI Playground',
    'subtab.analytics.python_sandbox': '🐍 Python & SQL Sandbox',

    // System Settings Subtabs
    'subtab.system_settings.general': '⚙️ System Configuration',
    'subtab.system_settings.security': '🛡️ Security & Permissions',
    'subtab.system_settings.connectors': '🔌 External Connectors',
    'subtab.system_settings.dev_ops': '🚀 GitOps & Release Pipeline',
    'subtab.system_settings.recovery_ops': '🛠️ Data Maintenance & Recovery',

    // Common Actions & Badges
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.confirm': 'Confirm',
    'action.edit': 'Edit',
    'action.delete': 'Delete',
    'action.search': 'Search...',
    'action.export': 'Export Report',
    'action.import': 'Import Data',
    'action.filter': 'Filter',
    'action.refresh': 'Refresh',
    'action.close': 'Close',
    'action.approved': 'Approved',
    'action.pending': 'Pending Approval',
    'action.rejected': 'Rejected',

    // Settings Panel
    'settings.title': 'System Settings',
    'settings.language_title': '🌐 Language Settings',
    'settings.language_desc': 'Select default interface display language across all modules.',
    'settings.language_select': 'Display Language:',
    'settings.office_precision': 'Office Paper-Grade Form Alignment:',
    'settings.office_enabled': 'Office Excel/Word paper precision enabled',

    // Office Forms & Vouchers
    'form.company_name': 'LEDGERFLOW TECHNOLOGY JOINT STOCK COMPANY',
    'form.voucher_title': 'ACCOUNTING VOUCHER & APPROVAL FORM',
    'form.voucher_code': 'Voucher No:',
    'form.date': 'Created Date:',
    'form.creator': 'Prepared By',
    'form.chief_accountant': 'Chief Accountant',
    'form.director': 'Approved By Director',
    'form.total_amount': 'TOTAL AMOUNT (VND):',
    'form.signature_note': '(Sign, write full name and stamp)',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'vi') return saved;
    } catch {}
    return 'vi'; // Default to Vietnamese
  });

  const setLanguage = (lang: LanguageMode) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {}
  };

  const toggleLanguage = () => {
    setLanguage(language === 'vi' ? 'en' : 'vi');
  };

  const t = (key: string, fallback?: string): string => {
    return TRANSLATIONS[language]?.[key] ?? fallback ?? TRANSLATIONS['vi']?.[key] ?? key;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
