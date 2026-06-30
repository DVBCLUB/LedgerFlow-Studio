/**
 * src/utils/coreModulesApi.ts
 * API Client để gọi lấy thông tin các modules được auto-registered từ Backend.
 */

export interface DynamicModuleNavItem {
  id: string;
  label: string;
  icon: string; // lucide icon name
  path: string;
  badge?: string;
  order?: number;
}

export interface DynamicModuleMeta {
  id: string;
  name: string;
  version: string;
  description: string;
  category?: string;
  enabled: boolean;
  nav?: DynamicModuleNavItem;
}

export interface DynamicModulesResponse {
  success: boolean;
  count: number;
  modules: DynamicModuleMeta[];
  failed: Array<{ id: string; error: string }>;
  durationMs: number;
}

/**
 * Fetch danh sách các module đang active từ backend
 */
export async function getActiveModules(): Promise<DynamicModulesResponse> {
  try {
    const response = await fetch('/api/core/modules');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as DynamicModulesResponse;
  } catch (err) {
    console.error('[coreModulesApi] Failed to fetch active modules:', err);
    return {
      success: false,
      count: 0,
      modules: [],
      failed: [{ id: 'api', error: err instanceof Error ? err.message : String(err) }],
      durationMs: 0,
    };
  }
}
