import React, { useState } from 'react';
import { Palette, Code2, Sparkles, RefreshCw, CheckCircle2, ArrowRight, Layers, FileCode } from 'lucide-react';
import { importFigmaComponent, FigmaConversionResult } from '../../utils/knowledgeIntegrationsApi';

export default function FigmaCodeBridgePanel() {
  const [figmaUrl, setFigmaUrl] = useState('https://figma.com/file/sample');
  const [componentName, setComponentName] = useState('LedgerFlowDashboard');
  const [result, setResult] = useState<FigmaConversionResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImport = () => {
    setLoading(true);
    importFigmaComponent({ figmaUrl, componentName })
      .then((d) => setResult(d.result))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Palette className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Cầu Nối Thiết Kế Figma Sang React (Figma &rarr; React Code Bridge)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Design Token Sync
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Chuyển đổi Design Tokens &amp; Layout Figma thành mã JSX + CSS Variables — Tự động đồng bộ React component.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Chuẩn JSX &amp; Tailwind
            </span>
          </div>
        </div>
      </section>

      {/* Input Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl space-y-4">
        <div className="space-y-1">
          <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            Figma Design URL &amp; Component Name
          </label>
          <input
            type="text"
            value={figmaUrl}
            onChange={(e) => setFigmaUrl(e.target.value)}
            placeholder="https://figma.com/file/..."
            className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors font-mono"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={componentName}
            onChange={(e) => setComponentName(e.target.value)}
            placeholder="Tên React Component (VD: LedgerFlowDashboard)"
            className="flex-1 bg-slate-950/60 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors font-mono"
          />
          <button
            type="button"
            onClick={handleImport}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl font-black text-xs transition-all shadow-lg cursor-pointer bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/20 whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Đang Import...' : '🎨 Import Figma Sang React'}</span>
          </button>
        </div>
      </div>

      {/* Result Cards */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-200">
                Design Tokens Trích Xuất
              </h2>
            </div>
            <pre className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-cyan-300 font-mono text-[11px] overflow-x-auto">
              {JSON.stringify(result.designTokens, null, 2)}
            </pre>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <Code2 className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-200">
                Mã Nguồn JSX Sinh Tự Động ({result.componentName})
              </h2>
            </div>
            <pre className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-emerald-300 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
              {result.jsxCode}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
