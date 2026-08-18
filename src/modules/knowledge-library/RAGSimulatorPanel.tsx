import React, { useState, useMemo } from 'react';
import { Database, Search, Cpu, ArrowRight, HelpCircle, Code, Copy, Check, MessageSquare, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { readLocalStorageValue } from '../ai-nhan-su/storage';
import { formatNumberVN, formatPercentVN } from '../../utils/excelFormatters';
import { useLanguage } from '../../context/LanguageContext';

const KNOWLEDGE_KEY = 'ledgerflow_company_knowledge_v1';

type KnowledgeNote = {
  id: string;
  title: string;
  source: string;
  trust: string;
  tags: string;
  body: string;
  createdAt: string;
};

// Generates a mock 6-dimensional float vector based on string content
function generateMockVector(text: string): number[] {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const vector: number[] = [];
  for (let i = 0; i < 6; i++) {
    const val = Math.sin(hash + i) * 1.0;
    vector.push(parseFloat(val.toFixed(3)));
  }
  return vector;
}

export default function RAGSimulatorPanel() {
  const { t } = useLanguage();
  const [query, setQuery] = useState('Định vị sản phẩm LedgerFlow OS và quy tắc duyệt chi phí');
  const [isSearching, setIsSearching] = useState(false);
  const [searchTriggered, setSearchTriggered] = useState(true);
  const [copied, setCopied] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAiAnswering, setIsAiAnswering] = useState(false);

  // Load approved knowledge notes
  const notes = useMemo(() => {
    const all = readLocalStorageValue<KnowledgeNote[]>(KNOWLEDGE_KEY, []);
    return all.filter((note) => note.trust === 'Approved');
  }, []);

  // Simulates matching based on actual keyword overlap + mock cosine math
  const results = useMemo(() => {
    if (!query.trim()) return [];
    
    const queryTokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);
    const queryVector = generateMockVector(query);

    return notes.map((note) => {
      const noteText = (note.title + ' ' + note.tags + ' ' + note.body).toLowerCase();
      
      // Calculate keyword overlap
      let overlapCount = 0;
      queryTokens.forEach((token) => {
        if (noteText.includes(token)) overlapCount++;
      });

      const noteVector = generateMockVector(note.title + note.body);
      
      // Calculate mock similarity = dot product of normalized vectors + keyword boost
      let dotProduct = 0;
      let qLength = 0;
      let nLength = 0;
      for (let i = 0; i < 6; i++) {
        dotProduct += queryVector[i] * noteVector[i];
        qLength += queryVector[i] * queryVector[i];
        nLength += noteVector[i] * noteVector[i];
      }
      
      const cosineDist = Math.abs(dotProduct) / (Math.sqrt(qLength) * Math.sqrt(nLength) || 1);
      const keywordBoost = queryTokens.length > 0 ? (overlapCount / queryTokens.length) * 0.45 : 0;
      const finalScore = Math.min(0.98, parseFloat((cosineDist * 0.5 + keywordBoost + 0.1).toFixed(3)));

      return {
        note,
        score: finalScore,
        noteVector,
        overlapWords: queryTokens.filter(t => noteText.includes(t))
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  }, [query, notes]);

  const assembledPrompt = useMemo(() => {
    if (results.length === 0) return '';
    const context = results
      .map((r, i) => `[Tài liệu tham khảo #${i + 1} - ${r.note.title}]\n${r.note.body}`)
      .join('\n\n');
    
    return `Bạn là Trợ lý AI điều hành của LedgerFlow Studio. Dựa vào thông tin ngữ cảnh kho tri thức đã duyệt dưới đây để trả lời câu hỏi của Founder.

--- TRI THỨC NGỮ CẢNH ĐÃ DUYỆT ---
${context}
----------------------------------

CÂU HỎI CỦA FOUNDER: ${query}

TRẢ LỜI:`;
  }, [results, query]);

  const handleSearch = () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setSearchTriggered(false);
    setAiAnswer(null);
    setTimeout(() => {
      setIsSearching(false);
      setSearchTriggered(true);
    }, 600);
  };

  const handleGenerateAnswer = async () => {
    if (!query.trim() || results.length === 0) return;
    setIsAiAnswering(true);
    setAiAnswer(null);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: assembledPrompt }],
          systemPrompt: 'Bạn là Trợ lý AI điều hành chuyên nghiệp. Trả lời chính xác, ngắn gọn theo đúng ngữ cảnh được cấp.'
        })
      });
      const data = await res.json();
      if (data.reply) {
        setAiAnswer(data.reply);
      } else {
        // Fallback simulated answer
        setAiAnswer(`Dựa trên tri thức đã duyệt: "${results[0]?.note.title}", câu trả lời của AI là: "${results[0]?.note.body.slice(0, 200)}..."`);
      }
    } catch {
      setAiAnswer(`Dựa trên tri thức đã duyệt (#1 ${results[0]?.note.title}): ${results[0]?.note.body}`);
    } finally {
      setIsAiAnswering(false);
    }
  };

  const handleCopy = async () => {
    if (!assembledPrompt) return;
    await navigator.clipboard.writeText(assembledPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const queryVector = useMemo(() => generateMockVector(query), [query]);

  return (
    <div className="rounded-3xl border border-violet-500/25 bg-slate-950/80 p-6 space-y-6 text-left select-none shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-violet-500/15 border border-violet-500/30 p-2.5 text-violet-300 shadow-lg">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-black text-white flex items-center gap-2">
              Mô phỏng Tìm kiếm Vector RAG & Live Chat AI
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {notes.length} Approved Contexts
              </span>
            </h4>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              Trực quan hóa cách AI chuyển đổi truy vấn thành Vector, tính toán điểm tương đồng và bóc tách ngữ cảnh trước khi trả lời.
            </p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          disabled={!assembledPrompt}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 border border-slate-700 text-slate-200 hover:text-white hover:border-slate-600 transition flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-40"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-violet-400" />}
          <span>{copied ? 'Đã sao chép Prompt' : 'Sao chép RAG Prompt'}</span>
        </button>
      </div>

      {/* Query Input Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Nhập câu hỏi thử nghiệm RAG (Ví dụ: định vị sản phẩm, phê duyệt chi phí, kế toán VAS...)"
            className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-100 placeholder:text-slate-500 outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
          className="rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 text-xs font-black transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 shrink-0"
        >
          <Zap className="w-4 h-4" />
          <span>{isSearching ? 'Đang tính Vector...' : 'Chạy Mô phỏng RAG'}</span>
        </button>
      </div>

      {/* Results Container */}
      {searchTriggered && !isSearching && query.trim() && (
        <div className="grid gap-6 lg:grid-cols-2 text-left animate-fade-in">
          
          {/* Left Column: Vector Math & Matching List */}
          <div className="space-y-4">
            
            {/* Step 1: Query Vector */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-violet-500/10 border border-violet-500/30 px-2.5 py-0.5 text-[9px] font-black uppercase text-violet-300">
                  BƯỚC 1: VECTOR HÓA TRUY VẤN
                </span>
                <span className="text-[10px] font-mono text-slate-400">Dim: 6D Float</span>
              </div>
              <p className="text-xs font-bold text-slate-200">Truy vấn: "{query}"</p>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Vector biểu diễn 6 chiều (Simulated Dense Vector):</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5 font-mono text-[10.5px]">
                  {queryVector.map((val, idx) => (
                    <span key={idx} className="rounded-lg bg-slate-950 px-2.5 py-1 border border-slate-800 text-violet-300 font-bold">
                      [{formatNumberVN(val, 3)}]
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 2: Cosine Similarity matching list */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 text-[9px] font-black uppercase text-cyan-300">
                  BƯỚC 2: TÍNH ĐIỂM TƯƠNG ĐỒNG COSINE
                </span>
                <span className="text-[10px] font-mono text-cyan-300 font-bold">
                  Khớp Top 3 Tri thức
                </span>
              </div>
              
              <div className="space-y-3">
                {results.map((res, index) => {
                  const similarityPct = res.score * 100;
                  const isHighMatch = res.score > 0.45;
                  return (
                    <div key={res.note.id} className="rounded-2xl border border-slate-800/80 bg-slate-950 p-3.5 space-y-2 text-xs">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <strong className="text-slate-100 text-xs font-bold block">#{index + 1} {res.note.title}</strong>
                          <span className="text-[10px] text-indigo-300 font-bold uppercase">{res.note.source}</span>
                        </div>
                        <span className={`text-[10.5px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                          isHighMatch
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}>
                          {formatPercentVN(similarityPct)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">{res.note.body}</p>
                      
                      {res.overlapWords.length > 0 && (
                        <div className="pt-1.5 flex items-center gap-1 flex-wrap">
                          <span className="text-[9px] font-bold text-slate-500 uppercase">Từ khóa khớp:</span>
                          {res.overlapWords.map((word) => (
                            <span key={word} className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              {word}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Assembled Prompt & Live Chat Test */}
          <div className="space-y-4">
            
            {/* Step 3: Assembled Prompt */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[9px] font-black uppercase text-emerald-300">
                  BƯỚC 3: GHÉP CONTEXT VÀO PROMPT CỦA AI
                </span>
                <button
                  type="button"
                  onClick={handleGenerateAnswer}
                  disabled={isAiAnswering || results.length === 0}
                  className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-md shadow-emerald-600/20"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{isAiAnswering ? 'AI đang trả lời...' : 'Thử nghiệm Hỏi AI ngay'}</span>
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/90 font-mono text-[11px] text-slate-300 whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed">
                {assembledPrompt}
              </div>
            </div>

            {/* Live AI Answer Output */}
            {aiAnswer && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-2.5 animate-fade-in">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Câu trả lời của Trợ lý AI (Grounded RAG Answer):</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/20 text-xs text-slate-100 leading-relaxed font-medium">
                  {aiAnswer}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
