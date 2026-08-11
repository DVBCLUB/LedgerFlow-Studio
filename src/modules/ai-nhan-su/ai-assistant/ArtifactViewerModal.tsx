import React from 'react';
import { FileText, CheckCircle, X, Code, Play, ShieldAlert } from 'lucide-react';

interface ArtifactViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  onProceed?: () => void;
}

export default function ArtifactViewerModal({
  isOpen,
  onClose,
  title,
  content,
  onProceed,
}: ArtifactViewerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-slate-950 border border-violet-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-950 border border-violet-500/40 flex items-center justify-center text-violet-300">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">{title || 'Kế hoạch Thực thi & Artifact'}</h3>
              <p className="text-[10px] text-slate-400 font-medium">Báo cáo cấu trúc chi tiết từ AI Agent</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-xs leading-relaxed text-slate-200 bg-slate-950/90 whitespace-pre-wrap selection:bg-violet-600 selection:text-white">
          {content}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/10 bg-slate-900/80">
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
            <span>Xem xét kỹ kế hoạch trước khi cho phép AI sửa file hệ thống</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all border border-white/10"
            >
              Đóng
            </button>
            {onProceed && (
              <button
                onClick={() => {
                  onProceed();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/30 cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>✅ Đồng ý Thực thi Kế hoạch (Proceed)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
