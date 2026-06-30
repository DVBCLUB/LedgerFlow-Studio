/**
 * core/server/module-loader.ts
 * ─────────────────────────────────────────────────────────────
 * Auto-Registration Engine.
 *
 * CÁCH HOẠT ĐỘNG:
 *   1. Quét thư mục modules/ (hoặc path được chỉ định)
 *   2. Tìm file module.ts trong mỗi subfolder
 *   3. Dynamic import, validate IModule contract
 *   4. Gọi onInit() → registerRoutes()
 *   5. Expose /api/core/modules endpoint cho frontend
 *
 * THÊM MODULE MỚI:
 *   → Tạo thư mục modules/ten-module/
 *   → Tạo module.ts với export default satisfying IModule
 *   → Restart server → TỰ ĐỘNG được nạp
 *   → KHÔNG cần sửa file này.
 * ─────────────────────────────────────────────────────────────
 */

import { readdirSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import type { Express } from 'express';
import type { IModule, ModuleMeta } from '../types/module.interface.js';

// ─── Types ──────────────────────────────────────────────────────

export interface ModuleLoadResult {
  loaded: ModuleMeta[];
  failed: Array<{ id: string; error: string }>;
  skipped: string[];
  durationMs: number;
}

// ─── Core Engine ────────────────────────────────────────────────

/**
 * Quét và nạp tất cả modules từ modulesDir.
 * An toàn: lỗi 1 module không ảnh hưởng module khác.
 */
export async function loadAllModules(
  app: Express,
  modulesDir: string = path.resolve(process.cwd(), 'modules')
): Promise<ModuleLoadResult> {
  const t0 = Date.now();
  const result: ModuleLoadResult = {
    loaded: [],
    failed: [],
    skipped: [],
    durationMs: 0,
  };

  // Kiểm tra thư mục modules/ tồn tại
  if (!existsSync(modulesDir)) {
    console.log(`[ModuleLoader] No modules/ directory found at: ${modulesDir}`);
    result.durationMs = Date.now() - t0;
    return result;
  }

  // Lấy danh sách subfolder
  const folders = readdirSync(modulesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort(); // sort để load theo thứ tự alphabet, dễ debug

  if (folders.length === 0) {
    console.log('[ModuleLoader] modules/ is empty, nothing to load.');
    result.durationMs = Date.now() - t0;
    return result;
  }

  console.log(`\n[ModuleLoader] Found ${folders.length} module folder(s): ${folders.join(', ')}`);

  // Load từng module song song, isolated (lỗi 1 không kill app)
  await Promise.allSettled(
    folders.map(async (folder) => {
      const manifestPath = path.join(modulesDir, folder, 'module.ts');

      // Không có module.ts → skip silently
      if (!existsSync(manifestPath)) {
        result.skipped.push(folder);
        return;
      }

      try {
        // Convert to file:// URL for cross-platform ESM dynamic import compatibility (especially Windows)
        const fileUrl = pathToFileURL(manifestPath).href;
        const imported = (await import(fileUrl)) as { default: IModule };
        const mod = imported.default;

        // Validate contract
        if (!mod?.meta?.id) throw new Error('Missing meta.id');
        if (!mod?.meta?.name) throw new Error('Missing meta.name');
        if (typeof mod?.meta?.enabled !== 'boolean') throw new Error('meta.enabled must be boolean');

        // Disabled → skip, report riêng
        if (!mod.meta.enabled) {
          result.skipped.push(`${mod.meta.id} [disabled]`);
          return;
        }

        // Phase 1: onInit (migrations, warm-up, v.v.)
        if (mod.onInit) {
          await mod.onInit();
        }

        // Phase 2: register routes
        if (mod.registerRoutes) {
          mod.registerRoutes(app);
        }

        result.loaded.push(mod.meta);
        console.log(
          `[ModuleLoader] ✅ ${mod.meta.id} v${mod.meta.version}` +
            (mod.registerRoutes ? ' (routes registered)' : ' (no routes)')
        );
      } catch (err: any) {
        result.failed.push({ id: folder, error: err?.message ?? String(err) });
        console.error(`[ModuleLoader] ❌ Failed: ${folder} — ${err?.message}`);
      }
    })
  );

  result.durationMs = Date.now() - t0;

  // ─── Summary ──────────────────────────────────────────────────
  const icons = {
    ok: result.loaded.length > 0 ? '✅' : '⚪',
    skip: result.skipped.length > 0 ? '⏭️ ' : '⚪',
    fail: result.failed.length > 0 ? '❌' : '⚪',
  };
  console.log(`\n[ModuleLoader] Done in ${result.durationMs}ms`);
  console.log(`  ${icons.ok} Loaded:  ${result.loaded.map((m) => m.id).join(', ') || 'none'}`);
  console.log(`  ${icons.skip} Skipped: ${result.skipped.join(', ') || 'none'}`);
  console.log(`  ${icons.fail} Failed:  ${result.failed.map((f) => f.id).join(', ') || 'none'}\n`);

  return result;
}

/**
 * Đăng ký endpoint /api/core/modules để frontend biết
 * modules nào đang active, có nav gì, v.v.
 *
 * Gọi sau loadAllModules() trong server.ts
 */
export function registerModuleRegistryEndpoint(
  app: Express,
  loadResult: ModuleLoadResult
): void {
  app.get('/api/core/modules', (_req, res) => {
    res.json({
      success: true,
      count: loadResult.loaded.length,
      modules: loadResult.loaded,
      failed: loadResult.failed,
      durationMs: loadResult.durationMs,
    });
  });
}
