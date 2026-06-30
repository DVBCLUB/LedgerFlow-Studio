/**
 * modules/product-studio/module.ts
 * Product Studio Module — Quản lý phát triển phần mềm, game, AI code generator.
 */
import type { IModule } from '../../core/types/module.interface.js';

const ProductStudioModule: IModule = {
  meta: {
    id: 'product-studio',
    name: 'Product Studio',
    version: '1.0.0',
    description: 'Thiết kế sản phẩm, tạo game/ML sandbox, AI Software Factory và triển khai ứng dụng.',
    enabled: true,
    category: 'core',
    nav: {
      id: 'product-studio',
      label: 'Product Studio',
      icon: 'BriefcaseBusiness',
      path: '/product-studio',
      order: 10,
    },
  },

  async onInit() {
    console.log('[Product Studio] initialized');
  },

  registerRoutes(app) {
    // Note: Các route API thực tế của Product Studio hiện đang được đăng ký trực tiếp trong server.ts.
  }
};

export default ProductStudioModule;
