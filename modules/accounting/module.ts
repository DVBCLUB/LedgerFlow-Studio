/**
 * modules/accounting/module.ts
 * Wrapper manifest cho kế toán — routes đã tồn tại ở
 * server/services/accountingRoutes.ts, không di chuyển.
 */
import type { IModule } from '../../core/types/module.interface.js';

const AccountingModule: IModule = {
  meta: {
    id: 'accounting',
    name: 'Kế Toán & Tài Chính',
    version: '1.0.0',
    description: 'Sổ sách kế toán, hóa đơn VAT, báo cáo tài chính Việt Nam (TT200, IFRS).',
    enabled: true,
    category: 'finance',
    nav: {
      id: 'accounting',
      label: 'Kế Toán',
      icon: 'Calculator',
      path: '/finance-accounting',
      order: 20,
    },
  },

  async onInit() {
    // Placeholder: future DB schema migration or warm-up
  },

  registerRoutes(app) {
    // Note: Các route API thực tế của Kế Toán hiện đang được đăng ký trực tiếp trong server.ts.
  },
};

export default AccountingModule;
