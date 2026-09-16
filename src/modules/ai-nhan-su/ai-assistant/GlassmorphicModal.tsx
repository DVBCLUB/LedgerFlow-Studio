import React, { useCallback, useState } from 'react';

// ── Modal state type ─────────────────────────────────────────────────────────
export interface ModalConfig {
  type: 'privacy' | 'quota';
  title: string;
  message: string;
  details?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// ── Hook: modal state management ─────────────────────────────────────────────
export function useGlassmorphicModal() {
  const [activeModal, setActiveModal] = useState<ModalConfig | null>(null);

  const showCustomConfirm = useCallback((
    type: 'privacy' | 'quota',
    title: string,
    message: string,
    details?: string
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setActiveModal({
        type,
        title,
        message,
        details,
        onConfirm: () => {
          setActiveModal(null);
          resolve(true);
        },
        onCancel: () => {
          setActiveModal(null);
          resolve(false);
        }
      });
    });
  }, []);

  return { activeModal, showCustomConfirm };
}

// ── Modal component ──────────────────────────────────────────────────────────
interface GlassmorphicModalProps {
  modal: ModalConfig;
}

export default function GlassmorphicModal({ modal }: GlassmorphicModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="flex w-full max-w-md flex-col rounded-3xl border border-border-primary bg-slate-950 p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-900 pb-3">
          <span className="text-xl">
            {modal.type === 'privacy' ? '🛡️' : '⚠️'}
          </span>
          <h3 className="text-sm font-black text-text-primary uppercase tracking-wider">
            {modal.title}
          </h3>
        </div>

        <div className="text-xs text-text-secondary leading-relaxed font-semibold whitespace-pre-wrap">
          {modal.message}
        </div>

        {modal.details && (
          <div className="bg-black/60 border border-slate-850 rounded-xl p-3 max-h-40 overflow-y-auto">
            <span className="text-[9px] uppercase font-bold text-text-tertiary block mb-1">Nội dung chi tiết:</span>
            <pre className="font-mono text-[10px] text-cyan-300 leading-normal whitespace-pre-wrap break-all">
              {modal.details}
            </pre>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={modal.onCancel}
            className="px-4 py-2 rounded-xl border border-border-primary bg-bg-primary text-text-secondary hover:text-text-primary hover:bg-slate-850 text-xs font-black transition-all cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={modal.onConfirm}
            className={`px-4 py-2 rounded-xl text-text-primary text-xs font-black transition-all cursor-pointer ${
              modal.type === 'privacy'
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20'
                : 'bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-600/20'
            }`}
          >
            Đồng ý & Tiếp tục
          </button>
        </div>
      </div>
    </div>
  );
}
