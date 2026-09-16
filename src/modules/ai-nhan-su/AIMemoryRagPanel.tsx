import { useState } from 'react';
import { AlertTriangle, Brain, Database, Search, Send, Sparkles, CheckCircle2, Layers } from 'lucide-react';
import { daemonFetch } from '../../utils/assistantApi';

type MemoryResult = { id?: string; title?: string; content?: string; kind?: string; score?: number; tags?: string[] };
type VectorResult = { id?: string; content?: string; similarity?: number };

function listFrom<T>(value: unknown, key: string): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object' && Array.isArray((value as any)[key])) return (value as any)[key] as T[];
  return [];
}

export default function AIMemoryRagPanel() {
  const [query, setQuery] = useState('');
  const [memory, setMemory] = useState<MemoryResult[]>([]);
  const [vectors, setVectors] = useState<VectorResult[]>([]);
  const [namespace, setNamespace] = useState('ledgerflow');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const [m, v] = await Promise.all([
        daemonFetch<unknown>(`/api/agent-memory/search?q=${encodeURIComponent(query)}&limit=10`, undefined, 10000).catch(() => []),
        daemonFetch<unknown>('/api/vectors/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ namespace, query, topK: 8 }) }, 10000).catch(() => []),
      ]);
      setMemory(listFrom<MemoryResult>(m, 'results'));
      setVectors(listFrom<VectorResult>(v, 'results'));
    } catch (err: any) {
      setError(err?.message || 'Truy vấn bộ nhớ AI thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const createMemory = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await daemonFetch('/api/agent-memory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'company', title: newTitle.trim(), content: newContent.trim(), source: 'desktop-memory-panel', reviewed: true, confidence: 0.85 }) }, 10000);
      setMessage('Đã lưu ký ức vào Daemon AI thành công.');
      setNewTitle('');
      setNewContent('');
    } catch (err: any) {
      setError(err?.message || 'Không thể lưu ký ức.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-fuchsia-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-fuchsia-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400 shrink-0">
              <Brain className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Bộ Nhớ AI &amp; Truy Xuất RAG (Long-term Memory)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                  Vector RAG
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Ký ức dài hạn và tra cứu vector RAG thông minh cho toàn bộ Swarm AI Agents của doanh nghiệp.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20">
              <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-pulse" />
              {namespace.toUpperCase()} Vector Space
            </span>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-bold text-rose-300 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{message}</span>
        </div>
      )}

      {/* Search Memory Bar */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl space-y-3">
        <h2 className="text-sm font-black text-white flex items-center gap-2">
          <Search className="h-4 w-4 text-fuchsia-400" /> Tìm Kiếm Ký Ức &amp; Vector Tri Thức
        </h2>
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_auto]">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm ký ức công ty, ghi chú, quyết định, bí quyết kinh doanh..."
            className="rounded-2xl border border-slate-700/80 bg-slate-950 px-4 py-2.5 text-xs font-medium text-white placeholder-slate-500 outline-none focus:border-fuchsia-500 transition-colors"
          />
          <input
            value={namespace}
            onChange={(e) => setNamespace(e.target.value)}
            placeholder="Vector namespace"
            className="rounded-2xl border border-slate-700/80 bg-slate-950 px-4 py-2.5 text-xs font-medium text-fuchsia-300 placeholder-slate-500 outline-none focus:border-fuchsia-500 transition-colors font-mono"
          />
          <button
            type="button"
            onClick={() => void search()}
            disabled={busy || !query.trim()}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl font-black text-xs bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white shadow-lg shadow-fuchsia-500/20 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            <Search className="h-3.5 w-3.5" />
            <span>{busy ? 'Đang tra cứu...' : 'Tìm Ký Ức'}</span>
          </button>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl space-y-3">
          <h2 className="text-sm font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Brain className="h-4 w-4 text-fuchsia-400" /> Ký Ức Tác Tử (Agent Memory)
          </h2>
          <div className="space-y-2 max-h-80 overflow-auto">
            {memory.map((item, index) => (
              <div key={item.id || index} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-1">
                <p className="text-xs font-black text-white">{item.title || item.kind || 'Memory Item'}</p>
                <p className="line-clamp-3 text-xs leading-5 text-slate-400">{item.content || JSON.stringify(item).slice(0, 260)}</p>
              </div>
            ))}
            {memory.length === 0 && <p className="text-xs font-semibold text-slate-500 py-4 text-center">Chưa có kết quả ký ức tác tử.</p>}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl space-y-3">
          <h2 className="text-sm font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Database className="h-4 w-4 text-cyan-400" /> Không Gian Vector RAG (Vector RAG)
          </h2>
          <div className="space-y-2 max-h-80 overflow-auto">
            {vectors.map((item, index) => (
              <div key={item.id || index} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-cyan-300 font-mono">Độ Tương Đồng: {item.similarity ?? '-'}</p>
                <p className="line-clamp-3 text-xs leading-5 text-slate-400">{item.content || JSON.stringify(item).slice(0, 260)}</p>
              </div>
            ))}
            {vectors.length === 0 && <p className="text-xs font-semibold text-slate-500 py-4 text-center">Chưa có kết quả vector. Namespace đang sẵn sàng nạp tài liệu.</p>}
          </div>
        </div>
      </div>

      {/* Add Memory Form */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl space-y-3">
        <h2 className="text-sm font-black text-white flex items-center gap-2">
          <Send className="h-4 w-4 text-emerald-400" /> Thêm Ký Ức Mới Được CEO Kiểm Duyệt
        </h2>
        <div className="grid gap-3">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Tiêu đề ký ức (VD: Chiến lược định giá gói Enterprise 2026)"
            className="rounded-2xl border border-slate-700/80 bg-slate-950 px-4 py-2.5 text-xs font-medium text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-colors"
          />
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Nội dung ký ức chi tiết được lưu vào bộ nhớ lâu dài của Swarm AI..."
            rows={4}
            className="rounded-2xl border border-slate-700/80 bg-slate-950 px-4 py-2.5 text-xs font-medium text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-colors leading-relaxed"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void createMemory()}
              disabled={busy || !newTitle.trim() || !newContent.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl font-black text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{busy ? 'Đang lưu...' : 'Lưu Ký Ức Dài Hạn'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

