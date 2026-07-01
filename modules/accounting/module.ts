/**
 * modules/accounting/module.ts
 * Wrapper manifest cho kế toán — routes đã tồn tại ở
 * server/services/accountingRoutes.ts, không di chuyển.
 */
import type { IModule } from '../../core/types/module.interface.js';
import { registerAccountingRoutes } from '../../server/services/accountingRoutes.ts';

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
    registerAccountingRoutes(app);
  },
};

export default AccountingModule;
