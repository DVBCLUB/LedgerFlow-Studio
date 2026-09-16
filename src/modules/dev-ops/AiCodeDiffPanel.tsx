import React, { useState } from 'react';
import { GitCompare, Code2, CheckCircle2, FileCode, Sparkles } from 'lucide-react';
import { generateCodeDiff, FileDiffSession } from '../../utils/devopsApi';

export default function AiCodeDiffPanel() {
  const [targetFile, setTargetFile] = useState('src/utils/aiSettingsApi.ts');
  const [original, setOriginal] = useState('export function getAiConfig() {\n  return { provider: "openai" };\n}');
  const [proposed, setProposed] = useState('export function getAiConfig() {\n  return { provider: "litellm" };\n}');
  const [session, setSession] = useState<FileDiffSession | null>(null);

  const handleGenerate = () => {
    generateCodeDiff({ targetFilePath: targetFile, originalContent: original, proposedContent: proposed })
      .then((d) => setSession(d.session))
      .catch(() => {});
  };

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <GitCompare className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">So Sánh Mã Nguồn &amp; Tái Cấu Trúc AI (AI Code Diff Engine)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Hunk Diff
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                So sánh mã nguồn theo hunk · Áp dụng từng dòng thay đổi · Tự động tái cấu trúc an toàn không phá vỡ logic.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Kiểm Soát Từng Dòng An Toàn
            </span>
          </div>
        </div>
      </section>

      {/* Inputs for Original vs Proposed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-black text-white uppercase tracking-wider">Mã Nguồn Gốc (Original Code)</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Base version</span>
          </div>
          <textarea
            value={original}
            onChange={(e) => setOriginal(e.target.value)}
            rows={6}
            className="w-full bg-slate-950/90 text-slate-300 border border-slate-700/80 rounded-2xl p-3.5 font-mono text-xs focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-black text-white uppercase tracking-wider">Mã Nguồn Đề Xuất (Proposed Patch)</h3>
            </div>
            <span className="text-[10px] font-mono text-indigo-400">AI suggested</span>
          </div>
          <textarea
            value={proposed}
            onChange={(e) => setProposed(e.target.value)}
            rows={6}
            className="w-full bg-slate-950/90 text-slate-300 border border-slate-700/80 rounded-2xl p-3.5 font-mono text-xs focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Target file & Action */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Code2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={targetFile}
            onChange={(e) => setTargetFile(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
            placeholder="Đường dẫn file đích (VD: src/utils/aiSettingsApi.ts)..."
          />
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl font-black text-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 transition-all cursor-pointer whitespace-nowrap"
        >
          <GitCompare className="w-3.5 h-3.5" />
          <span>🚀 Tạo Bản Diff &amp; So Sánh Hunk</span>
        </button>
      </div>

      {/* Diff Result Session */}
      {session && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-black text-white">
                Phiên So Sánh: <code className="text-indigo-400 font-mono">{session.id}</code> · {session.hunks.length} hunks
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {session.status}
            </span>
          </div>

          <div className="p-4 sm:p-5 space-y-4">
            {session.hunks.map((h) => (
              <div key={h.id} className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden">
                <div className="p-3 bg-slate-900/90 text-sky-400 font-mono text-xs border-b border-slate-800 flex items-center gap-2">
                  <span>{h.header}</span>
                </div>
                <pre className="p-4 font-mono text-xs leading-relaxed overflow-x-auto">
                  {h.lines.map((l, i) => (
                    <div
                      key={i}
                      className={`px-2 py-0.5 rounded ${
                        l.type === 'add'
                          ? 'bg-emerald-500/10 text-emerald-300'
                          : l.type === 'remove'
                          ? 'bg-rose-500/10 text-rose-300'
                          : 'text-slate-400'
                      }`}
                    >
                      {l.type === 'add' ? '+' : l.type === 'remove' ? '-' : ' '} {l.content}
                    </div>
                  ))}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
