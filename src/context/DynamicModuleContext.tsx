/**
 * src/context/DynamicModuleContext.tsx
 * React Context quản lý danh sách module được nạp động từ Backend.
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { getActiveModules, type DynamicModuleMeta, type DynamicModuleNavItem } from '../utils/coreModulesApi';

interface DynamicModuleContextValue {
  modules: DynamicModuleMeta[];
  navItems: DynamicModuleNavItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const DynamicModuleContext = createContext<DynamicModuleContextValue | null>(null);

export function DynamicModuleProvider({ children }: { children: React.ReactNode }) {
  const [modules, setModules] = useState<DynamicModuleMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModules = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getActiveModules();
      if (res.success) {
        setModules(res.modules);
      } else {
        setError(res.failed?.[0]?.error || 'Failed to load modules from server.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  // Trích xuất và sắp xếp các items hiển thị trên Navbar
  const navItems = useMemo(() => {
    return modules
      .filter((m) => m.enabled && m.nav)
      .map((m) => m.nav!)
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  }, [modules]);

  const value = useMemo(
    () => ({
      modules,
      navItems,
      loading,
      error,
      refetch: fetchModules,
    }),
    [modules, navItems, loading, error]
  );

  return <DynamicModuleContext.Provider value={value}>{children}</DynamicModuleContext.Provider>;
}

export function useDynamicModules() {
  const context = useContext(DynamicModuleContext);
  if (!context) {
    throw new Error('useDynamicModules must be used within DynamicModuleProvider');
  }
  return context;
}
