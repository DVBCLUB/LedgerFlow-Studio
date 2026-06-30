/**
 * modules/integration-hub/module.ts
 * Integration Hub Module — Quản lý kết nối GitHub, Local Tools, IDE Bridge.
 */
import type { IModule } from '../../core/types/module.interface.js';

const IntegrationHubModule: IModule = {
  meta: {
    id: 'integration-hub',
    name: 'Cổng Tích hợp',
    version: '1.0.0',
    description: 'Kết nối công cụ local, đồng bộ GitHub, quản lý contract kết nối và IDE bridge.',
    enabled: true,
    category: 'devops',
    nav: {
      id: 'integration-hub',
      label: 'Tích hợp',
      icon: 'Network',
      path: '/integration_hub',
      order: 50,
    },
  },

  async onInit() {
    console.log('[Integration Hub] initialized');
  },

  registerRoutes(app) {
    // Note: Các route API thực tế của Integration hiện đang được đăng ký trực tiếp trong server.ts.
  }
};

export default IntegrationHubModule;
