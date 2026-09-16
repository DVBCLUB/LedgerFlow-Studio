import React, { useEffect, useState } from 'react';
import { Database, Search, Save, Sparkles, CheckCircle2, BookmarkCheck, ArrowRight } from 'lucide-react';
import { searchAgentMemory, saveAgentMemory, LessonLearned } from '../../utils/knowledgeIntegrationsApi';

export default function AgentLongTermMemoryPanel() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LessonLearned[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    searchAgentMemory('').then((d) => {
      if (d.results?.length) setResults(d.results);
    }).catch(() => {});
  }, []);

  const handleSearch = () => {
    searchAgentMemory(query).then((d) => setResults(d.results || [])).catch(() => {});
  };

  const handleSave = () => {
    setSaving(true);
    saveAgentMemory({ topic: 'Bài học từ hạch toán TT80', insight: 'Luôn kiểm tra chữ ký HMAC trước khi đối soát VietQR', recommendedAction: 'Thêm bước verify signature', category: 'accounting' })
      .then((d) => { if (d.lesson) setResults((prev) => [d.lesson, ...prev]); })
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Database className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Bộ Nhớ Dài Hạn &amp; Ngân Hàng Bài Học Cho Agent (Long-Term Memory)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Agent Memory Bank
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Bộ nhớ dài hạn cho AI Agents · Củng cố bài học thực tiễn · Suy giảm trí nhớ theo thời gian (Decay Factor).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {results.length} Bài Học Lưu Trữ
            </span>
          </div>
        </div>
      </section>

      {/* Query Search & Save Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Tìm kiếm bài học trong bộ nhớ dài hạn..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleSearch}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs transition-all shadow-lg cursor-pointer whitespace-nowrap bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/20"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Tìm Kiếm</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs transition-all shadow-lg cursor-pointer whitespace-nowrap bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Đang lưu...' : '💾 Lưu Bài Học Mới'}</span>
          </button>
        </div>
      </div>

      {/* Results List Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Danh Mục Bài Học Đã Ghi Nhớ ({results.length})
            </h2>
          </div>
        </div>

        <div className="divide-y divide-slate-800/60">
          {results.map((l) => (
            <div key={l.id} className="p-5 hover:bg-slate-800/20 transition-colors space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-black text-sm text-white">{l.topic}</span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {l.category}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-xl text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    conf {l.confidence}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-300">{l.insight}</p>
              <div className="flex items-center gap-1.5 text-xs text-sky-400 font-medium">
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                <span>Hành động khuyến nghị: {l.recommendedAction}</span>
              </div>
            </div>
          ))}
          {!results.length && (
            <div className="p-8 text-center text-xs text-slate-500 font-medium">
              Chưa có bài học nào được lưu trong ngân hàng bộ nhớ.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
