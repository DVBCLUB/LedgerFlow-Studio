/**
 * core/types/module.interface.ts
 * ─────────────────────────────────────────────────────────────
 * IModule — hợp đồng mà mọi module phải tuân thủ.
 * Backend đọc meta.id + gọi registerRoutes().
 * Frontend đọc meta.nav để build sidebar.
 * ─────────────────────────────────────────────────────────────
 */

import type { Express } from 'express';

// ─── Navigation ───────────────────────────────────────────────

export interface ModuleNavItem {
  /** Khớp với route path: "/accounting" */
  id: string;
  label: string;
  /** Tên icon từ lucide-react */
  icon: string;
  path: string;
  badge?: string;
  /** Thứ tự trong sidebar, nhỏ hơn = lên trên */
  order?: number;
}

// ─── Module Metadata ───────────────────────────────────────────

export interface ModuleMeta {
  /** snake_case, duy nhất toàn hệ thống */
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  /** false → module-loader bỏ qua hoàn toàn */
  enabled: boolean;
  /** Nếu có → xuất hiện trong sidebar */
  nav?: ModuleNavItem;
  /** Các permission string cần có để dùng module */
  permissions?: string[];
  /** Tag để group trong UI (vd: "core", "ai", "finance") */
  category?: string;
}

// ─── IModule — interface chính ─────────────────────────────────

export interface IModule {
  meta: ModuleMeta;

  /**
   * Đăng ký Express routes cho module này.
   * Gọi một lần khi server khởi động.
   */
  registerRoutes?: (app: Express) => void;

  /**
   * Async init — chạy trước khi routes được register.
   * Dùng cho: DB migrations, warm-up cache, connect external APIs.
   */
  onInit?: () => Promise<void>;

  /**
   * Cleanup khi server shutdown gracefully.
   */
  onDestroy?: () => Promise<void>;
}
