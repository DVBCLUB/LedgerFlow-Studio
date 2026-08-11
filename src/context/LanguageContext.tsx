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
