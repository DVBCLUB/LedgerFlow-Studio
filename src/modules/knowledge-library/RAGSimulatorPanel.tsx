import React, { useState, useMemo } from 'react';
import { Database, Search, Cpu, ArrowRight, HelpCircle, Code, Copy, Check } from 'lucide-react';
import { readLocalStorageValue } from '../ai-nhan-su/storage';

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
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load approved knowledge notes
  const notes = useMemo(() => {
    const all = readLocalStorageValue<KnowledgeNote[]>(KNOWLEDGE_KEY, []);
    return all.filter((note) => note.trust === 'Approved');
  }, []);

  // Simulates matching based on actual keyword overlap + mock cosine math
  const results = useMemo(() => {
    if (!query.trim()) return [];
    
    const queryTokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
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
      
      // Overlap boost to make search feel semantically accurate
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
    
    return `Bạn là trợ lý AI thông thái của công ty. Hãy dựa vào thông tin ngữ cảnh (Context) sau đây để trả lời câu hỏi của người dùng. Nếu thông tin không có sẵn trong context, hãy nói rõ là bạn không biết dựa trên tri thức hiện tại của thư viện.

--- NGỮ CẢNH HỖ TRỢ ---
${context}
----------------------

CÂU HỎI: ${query}

TRẢ LỜI:`;
  }, [results, query]);

  const handleSearch = () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setSearchTriggered(false);
    setTimeout(() => {
      setIsSearching(false);
      setSearchTriggered(true);
    }, 850);
  };

  const handleCopy = async () => {
    if (!assembledPrompt) return;
    await navigator.clipboard.writeText(assembledPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const queryVector = useMemo(() => generateMockVector(query), [query]);

  return (
    <div className="rounded-2xl border border-violet-500/25 bg-slate-950/70 p-5 space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-violet-500/10 p-2 text-violet-300">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-black text-text-primary">RAG Sandbox & Vector Search Simulator</h4>
          <p className="text-xs font-semibold text-text-secondary">Trực quan hóa cơ chế AI phân tích truy vấn, bóc tách vector và truy xuất tri thức tương đồng.</p>
        </div>
      </div>

      {/* Query Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-tertiary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Nhập câu hỏi để mô phỏng tìm kiếm (ví dụ: supabase, định vị, kế toán...)"
            className="w-full rounded-xl border border-border-primary bg-bg-primary/60 pl-10 pr-4 py-2 text-xs font-semibold text-text-primary outline-none focus:border-violet-400"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
          className="rounded-xl bg-violet-400/25 border border-violet-400/35 hover:bg-violet-400/35 px-4 text-xs font-black text-violet-200 transition cursor-pointer disabled:opacity-40"
        >
          {isSearching ? 'Đang truy xuất...' : 'Chạy RAG'}
        </button>
      </div>

      {isSearching && (
        <div className="space-y-3 animate-pulse">
          <div className="h-3 bg-slate-850 rounded w-1/3" />
          <div className="h-10 bg-slate-850 rounded-xl" />
        </div>
      )}

      {searchTriggered && !isSearching && query.trim() && (
        <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr] animate-fade-in text-left">
          
          {/* Left Column: Vector & Match Details */}
          <div className="space-y-4">
            
            {/* Step 1: Query Vector */}
            <div className="rounded-xl border border-slate-900 bg-bg-primary/30 p-4 space-y-2">
              <span className="rounded-full bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 text-[9px] font-black text-violet-300">BƯỚC 1: VECTOR HÓA TRUY VẤN</span>
              <p className="text-xs font-bold text-text-secondary mt-2">Câu hỏi: "{query}"</p>
              <div className="mt-2">
                <p className="text-[10px] font-black text-text-tertiary uppercase">Simulated 6D Dense Vector</p>
                <div className="mt-1 flex flex-wrap gap-1.5 font-mono text-[10px]">
                  {queryVector.map((val, idx) => (
                    <span key={idx} className="rounded bg-slate-950 px-2 py-0.5 border border-slate-850 text-violet-300 font-bold">
                      [{val}]
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 2: Cosine Similarity matching list */}
            <div className="rounded-xl border border-slate-900 bg-bg-primary/30 p-4 space-y-3">
              <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 text-[9px] font-black text-cyan-300">BƯỚC 2: TÌM KIẾM ĐỘ TƯƠNG ĐỒNG</span>
              
              <div className="space-y-3 mt-2">
                {results.map((res, index) => {
                  const percent = Math.round(res.score * 100);
                  const isMatch = res.score > 0.45;
                  return (
                    <div key={res.note.id} className="rounded-xl border border-slate-850 bg-slate-950/40 p-3 space-y-2 text-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <strong className="text-text-primary text-xs block">#{index + 1} {res.note.title}</strong>
                          <span className="text-[10px] text-text-tertiary font-bold uppercase">{res.note.source}</span>
                        </div>
                        <span className={`text-[10px] font-black ${isMatch ? 'text-emerald-400' : 'text-text-secondary'}`}>
                          Score: {res.score}
                        </span>
                      </div>
                      
                      {/* similarity bar */}
                      <div className="w-full bg-slate-850 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            res.score > 0.7 ? 'bg-emerald-400' : res.score > 0.45 ? 'bg-amber-400' : 'bg-blue-400'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      {res.overlapWords.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] text-text-secondary">
                          <span className="font-black text-text-tertiary">Khớp từ khóa:</span>
                          {res.overlapWords.map(w => (
                            <span key={w} className="rounded bg-bg-primary px-1.5 border border-border-primary text-text-secondary font-semibold">{w}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {results.length === 0 && (
                  <p className="text-xs text-text-tertiary italic">Không tìm thấy ghi chú tri thức Approved nào để đối sánh.</p>
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Prompt Construction */}
          <div className="rounded-xl border border-slate-900 bg-bg-primary/30 p-4 flex flex-col justify-between space-y-3">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[9px] font-black text-emerald-300">BƯỚC 3 & 4: LẮP GHÉP CONTEXT & PROMPT</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[10px] font-black text-text-secondary hover:text-text-primary transition"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Đã copy</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy prompt</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mt-2 text-xs font-semibold text-text-secondary">
                AI sẽ nhận được một Prompt đóng gói sẵn chứa các ngữ cảnh vừa tìm thấy ở bên trái để trả lời chính xác câu hỏi của bạn.
              </div>

              <pre className="mt-3 p-3 rounded-xl border border-border-primary bg-slate-950 text-[10px] font-mono text-text-secondary leading-5 overflow-auto max-h-[320px] select-all">
                {assembledPrompt || 'Vui lòng nhập từ khóa có khớp với ghi chú tri thức.'}
              </pre>
            </div>

            <div className="border-t border-slate-850 pt-3 flex items-start gap-2.5">
              <Cpu className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
              <div className="text-[10px] text-text-tertiary leading-relaxed">
                Trong thực tế, câu hỏi sẽ được gửi đến OpenAI/Gemini Embeddings API để chuyển thành vector 1536 chiều, sau đó tìm kiếm trong Vector Database (như pgvector/Pinecone) trước khi đưa vào LLM.
              </div>
            </div>
          </div>

        </div>
      )}

      {notes.length === 0 && (
        <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4 text-xs font-semibold text-amber-200">
          ⚠️ <strong>Chú ý:</strong> Không tìm thấy ghi chú tri thức nào có trạng thái "Approved" để chạy thử. Vui lòng chuyển trạng thái của một số ghi chú trong kho tri thức sang "Approved" trước.
        </div>
      )}
    </div>
  );
}
