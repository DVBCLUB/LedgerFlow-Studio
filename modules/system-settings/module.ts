/**
 * modules/system-settings/module.ts
 * System Settings Module — Cài đặt bảo mật, vault credentials, AI API keys.
 */
import type { IModule } from '../../core/types/module.interface.js';

const SystemSettingsModule: IModule = {
  meta: {
    id: 'system-settings',
    name: 'Cấu hình Hệ thống',
    version: '1.0.0',
    description: 'Thiết lập bảo mật khóa API, quản lý vault tự động khóa và nhật ký chi phí token.',
    enabled: true,
    category: 'core',
    nav: {
      id: 'system-settings',
      label: 'Cài đặt',
      icon: 'Settings',
      path: '/system-settings',
      order: 100,
    },
  },

  async onInit() {
    console.log('[System Settings] initialized');
  },

  registerRoutes(app) {
    // Note: Các route API cài đặt bảo mật hiện được đăng ký trong server.ts.
  }
};

export default SystemSettingsModule;
