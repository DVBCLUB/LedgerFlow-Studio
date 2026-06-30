/**
 * modules/ai-workforce/module.ts
 * AI Workforce Module — Lực lượng nhân sự AI và tác vụ Agentic.
 */
import type { IModule } from '../../core/types/module.interface.js';

const AIWorkforceModule: IModule = {
  meta: {
    id: 'ai-workforce',
    name: 'Lực lượng Nhân sự AI',
    version: '1.0.0',
    description: 'Quản lý AI Staff, thiết lập năng lực (Skills), giám sát Agentic Loops và bộ nhớ Compound Memory.',
    enabled: true,
    category: 'ai',
    nav: {
      id: 'ai-workforce',
      label: 'AI Nhân sự',
      icon: 'UsersRound',
      path: '/ai-hr',
      order: 40,
    },
  },

  async onInit() {
    console.log('[AI Workforce] initialized');
  },

  registerRoutes(app) {
    // Note: Các route API thực tế của AI Workforce hiện đang được đăng ký trực tiếp trong server.ts.
    // Khi thực hiện migrate triệt để, ta có thể di chuyển chúng qua đây.
    // Ở phase này, ta giữ nguyên trong server.ts để đảm bảo không lỗi import.
  }
};

export default AIWorkforceModule;
