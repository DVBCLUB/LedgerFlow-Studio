import React, { useState } from 'react';
import { Search, Globe, ShieldCheck, Link2, AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';
import { groundSearchQuery, GroundedAIResponse } from '../../utils/enterpriseApi';

export default function SearchGroundingPanel() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<GroundedAIResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = () => {
    if (!query.trim()) return;
    setLoading(true);
    groundSearchQuery(query.trim())
      .then((d) => setResult(d.grounding))
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
              <Globe className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Công Cụ Dẫn Nguồn &amp; Kiểm Định Dữ Liệu (Search Grounding &amp; Fact-Check)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Grounding AI
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Trả lời AI có dẫn nguồn rõ ràng · Gắn citation vào từng câu · Triệt tiêu hallucination đối với văn bản pháp luật &amp; tài chính.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              100% Verified Citations
            </span>
          </div>
        </div>
      </section>

      {/* Query Search Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Nhập câu hỏi cần đối chiếu và dẫn nguồn minh bạch..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs transition-all shadow-lg cursor-pointer whitespace-nowrap bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/20 disabled:opacity-50"
        >
          <Search className="w-3.5 h-3.5" />
          <span>{loading ? 'Đang truy vấn...' : '🚀 Grounded Search'}</span>
        </button>
      </div>

      {result && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {result.grounded ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              )}
              <span className="font-bold text-xs text-slate-200">
                {result.grounded ? 'Phản Hồi Đã Được Xác Minh Dẫn Nguồn' : 'Cảnh Báo: Không Đủ Nguồn Tin Xác Thực'}
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-xl border border-slate-700/60">
              Model: {result.modelUsed}
            </span>
          </div>

          <div className="p-5 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
            {result.answerWithCitations}
          </div>

          {result.sources?.length > 0 && (
            <div className="px-5 pb-5 space-y-2 border-t border-slate-800/40 pt-4">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-300">
                <Link2 className="w-3.5 h-3.5" />
                <span>Danh Mục Nguồn Dẫn Chứng:</span>
              </div>
              <div className="space-y-1.5">
                {result.sources.map((s, i) => (
                  <div key={i} className="text-xs text-blue-400 flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-[10px] font-mono font-bold border border-blue-500/20 text-blue-300">
                      [{i + 1}]
                    </span>
                    <span className="font-semibold text-slate-300">{s.title}</span>
                    <span className="text-[11px] font-mono text-slate-500 truncate max-w-xs">{s.url}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
