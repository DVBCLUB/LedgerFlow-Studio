import React, { useEffect, useState } from 'react';
import { Search, BookOpen, Layers, Sparkles, FileText, CheckCircle2, Tag } from 'lucide-react';
import { queryKnowledgeRag, listKnowledgeDocuments, KnowledgeDocument } from '../../utils/knowledgeIntegrationsApi';

export default function KnowledgeRagPipelinePanel() {
  const [query, setQuery] = useState('');
  const [docs, setDocs] = useState<KnowledgeDocument[]>([]);
  const [answer, setAnswer] = useState<string | null>(null);

  useEffect(() => {
    listKnowledgeDocuments().then((d) => {
      if (d.documents?.length) setDocs(d.documents);
    }).catch(() => {});
  }, []);

  const handleQuery = () => {
    if (!query.trim()) return;
    queryKnowledgeRag(query).then((d) => {
      if (d.result) setAnswer(d.result.formattedContextPack);
    }).catch(() => {});
  };

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Search className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Đường Ống Truy Xuất Tri Thức RAG (Knowledge RAG Pipeline)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Vector Retrieval
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Truy vấn kho tri thức bằng RAG · Đóng gói Context Pack cho LLM · Đo độ liên quan theo điểm confidence score.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {docs.length} Tài Liệu Indexing
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
            onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
            placeholder="Đặt câu hỏi vào kho tri thức doanh nghiệp..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <button
          type="button"
          onClick={handleQuery}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs transition-all shadow-lg cursor-pointer whitespace-nowrap bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/20"
        >
          <Search className="w-3.5 h-3.5" />
          <span>🚀 Truy Vấn RAG</span>
        </button>
      </div>

      {answer && (
        <div className="rounded-3xl border border-indigo-500/30 bg-slate-950/80 p-5 backdrop-blur-xl shadow-xl space-y-2">
          <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
            <Sparkles className="w-4 h-4" />
            <span>Gói Ngữ Cảnh Tri Thức Định Tuyến Cho LLM (Context Pack):</span>
          </div>
          <div className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            {answer}
          </div>
        </div>
      )}

      {/* Documents List Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Danh Mục Tài Liệu Tri Thức Trong Kho ({docs.length})
            </h2>
          </div>
        </div>

        <div className="divide-y divide-slate-800/60">
          {docs.map((doc) => (
            <div key={doc.id} className="p-4 hover:bg-slate-800/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="font-bold text-xs text-white">{doc.title}</span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <span>Nguồn: <code className="text-indigo-300">{doc.source}</code></span>
                  <span>•</span>
                  <span>Tags: {doc.tags.join(', ')}</span>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 self-start sm:self-center">
                {doc.category}
              </span>
            </div>
          ))}
          {!docs.length && (
            <div className="p-8 text-center text-xs text-slate-500 font-medium">
              Chưa có tài liệu nào được index trong kho tri thức RAG.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
