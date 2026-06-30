/**
 * src/app/DynamicModuleComponentLoader.tsx
 * Tự động quét và lazy-load các component UI của module động
 * dựa trên Vite import.meta.glob.
 */

import React, { lazy, Suspense, useMemo } from 'react';

// Quét toàn bộ file ui/index.tsx trong src/modules/
const uiImports = import.meta.glob('../modules/*/ui/index.tsx');

interface DynamicModuleComponentLoaderProps {
  moduleId: string;
}

export default function DynamicModuleComponentLoader({ moduleId }: DynamicModuleComponentLoaderProps) {
  const Component = useMemo(() => {
    // Tìm key tương ứng, ví dụ: '../modules/accounting/ui/index.tsx'
    const targetKey = Object.keys(uiImports).find((key) => {
      const parts = key.split('/');
      // parts[2] sẽ là tên module folder (ví dụ: 'accounting')
      return parts[2] === moduleId;
    });

    if (!targetKey) {
      return null;
    }

    return lazy(uiImports[targetKey] as () => Promise<{ default: React.ComponentType<any> }>);
  }, [moduleId]);

  if (!Component) {
    return (
      <div className="p-8 text-slate-400 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
        <h3 className="text-sm font-bold text-white mb-2">Không tìm thấy giao diện cho module: {moduleId}</h3>
        <p className="text-xs leading-5">
          Vui lòng kiểm tra chắc chắn rằng bạn đã tạo file component giao diện chính tại{' '}
          <code>src/modules/{moduleId}/ui/index.tsx</code> (export default).
        </p>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Đang nạp giao diện module...</div>}>
      <Component />
    </Suspense>
  );
}
