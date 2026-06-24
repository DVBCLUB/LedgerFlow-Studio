import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Database, FileSearch, Library, MessageSquareText, RefreshCw, Search, Sparkles } from 'lucide-react';
import { daemonFetch } from '../../utils/assistantApi';

type HubData = {
  memoryResults: any[];
  namespaces: any[];
  vectorResults: any[];
  promptTemplates: any[];
  promptRuns: any[];
  contentAssets: any[];
  kbArticles: any[];
  contextWindows: any[];
  documentResult: any | null;
};

const empty: HubData = {
  memoryResults: [], namespaces: [], vectorResults: [], promptTemplates: [], promptRuns: [], contentAssets: [], kbArticles: [], contextWindows: [], documentResult: null,
};

function unwrap(value: any, ...keys: string[]) {
  for (const key of keys) if (value && value[key] !== undefined) return value[key];
  return value;
}
function arr(value: any) { return Array.isArray(value) ? value : []; }

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-black text-white">{value}</p>
    {hint && <p className="mt-1 text-[11px] font-bold text-slate-500">{hint}</p>}
  </div>;
}

function Badge({ children }: { children: string }) {
  return <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-black uppercase text-cyan-200">{children}</span>;
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <section className="rounded-3xl border border-slate-800 bg-slate-950/55 p-4">
    <div className="mb-3 flex items-center gap-2 text-sm font-black text-white">{icon}{title}</div>
    {children}
  </section>;
}

function MiniList({ items, emptyText, render }: { items: any[]; emptyText: string; render: (item: any, index: number) => React.ReactNode }) {
  return <div className="space-y-2">{items.length === 0 ? <p className="text-xs font-bold text-slate-500">{emptyText}</p> : items.slice(0, 8).map(render)}</div>;
}

export default function KnowledgeContentHubPanel() {
  const [data, setData] = useState<HubData>(empty);
  const [query, setQuery] = useState('LedgerFlow AI operations release automation');
  const [namespace, setNamespace] = useState('ledgerflow');
  const [docPath, setDocPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [rawOpen, setRawOpen] = useState(false);

  const load = async (searchText = query) => {
    setLoading(true); setMessage(''); setError('');
    try {
      const results = await Promise.allSettled([
        daemonFetch<any>(`/api/agent-memory/search?q=${encodeURIComponent(searchText)}&limit=12&includeDrafts=true`, undefined, 10000),
        daemonFetch<any>('/api/vectors/namespaces', undefined, 10000),
        daemonFetch<any>('/api/vectors/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ namespace, query: searchText, topK: 8, minSimilarity: 0.05 }) }, 15000),
        daemonFetch<any>('/api/prompts/templates', undefined, 10000),
        daemonFetch<any>('/api/prompts/runs', undefined, 10000),
        daemonFetch<any>('/api/content/assets', undefined, 10000),
        daemonFetch<any>(`/api/kb/search?q=${encodeURIComponent(searchText)}`, undefined, 10000),
        daemonFetch<any>('/api/context/windows', undefined, 10000),
      ]);
      const [memory, namespaces, vectors, prompts, promptRuns, content, kb, contexts] = results;
      setData((current) => ({
        ...current,
        memoryResults: memory.status === 'fulfilled' ? arr(unwrap(memory.value, 'results', 'memories')) : [],
        namespaces: namespaces.status === 'fulfilled' ? arr(unwrap(namespaces.value, 'namespaces')) : [],
        vectorResults: vectors.status === 'fulfilled' ? arr(unwrap(vectors.value, 'results')) : [],
        promptTemplates: prompts.status === 'fulfilled' ? arr(unwrap(prompts.value, 'templates')) : [],
        promptRuns: promptRuns.status === 'fulfilled' ? arr(unwrap(promptRuns.value, 'runs')) : [],
        contentAssets: content.status === 'fulfilled' ? arr(unwrap(content.value, 'assets')) : [],
        kbArticles: kb.status === 'fulfilled' ? arr(unwrap(kb.value, 'articles')) : [],
        contextWindows: contexts.status === 'fulfilled' ? arr(unwrap(contexts.value, 'windows')) : [],
      }));
      const failed = results.filter((r) => r.status === 'rejected').length;
      setMessage(failed ? `Đã tải Knowledge Studio, nhưng ${failed} nguồn dữ liệu chưa phản hồi.` : 'Đã tải Knowledge & Content Studio.');
    } catch (err: any) {
      setError(err?.message || 'Không tải được Knowledge & Content Studio.');
    } finally { setLoading(false); }
  };

  const analyzeDocument = async () => {
    if (!docPath.trim()) return;
    setLoading(true); setError(''); setMessage('');
    try {
      const res = await daemonFetch<any>('/api/document/structure', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filePath: docPath.trim() }) }, 20000);
      setData((current) => ({ ...current, documentResult: res }));
      setMessage('Đã đọc cấu trúc tài liệu/file.');
    } catch (err: any) { setError(err?.message || 'Không phân tích được tài liệu/file.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(query); }, []);

  const totalKnowledge = useMemo(() => data.memoryResults.length + data.kbArticles.length + data.contentAssets.length + data.promptTemplates.length, [data]);

  return <div className="space-y-5 text-slate-100">
    <section className="rounded-[2rem] border border-violet-400/20 bg-gradient-to-br from-slate-950 via-slate-950 to-violet-950/30 p-5 shadow-2xl shadow-slate-950/30">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-violet-200"><BookOpen className="mr-2 inline h-4 w-4" />Knowledge & Content Studio</p>
          <h2 className="mt-2 text-2xl font-black text-white">Memory, documents, prompts, content and context</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-400">Một màn search-first để gom tri thức rời rạc: RAG memory, vector store, prompt library, content assets, KB và context windows.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setRawOpen((v) => !v)} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-violet-300">{rawOpen ? 'Ẩn raw' : 'Raw JSON'}</button>
          <button onClick={() => void load(query)} disabled={loading} className="rounded-2xl bg-violet-300 px-4 py-2 text-xs font-black text-slate-950 disabled:opacity-60"><RefreshCw className="mr-2 inline h-4 w-4" />{loading ? 'Đang tải...' : 'Refresh'}</button>
        </div>
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_180px_auto]">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm memory, prompt, KB, content..." className="rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-bold text-white outline-none focus:border-violet-400" />
        <input value={namespace} onChange={(event) => setNamespace(event.target.value)} placeholder="namespace" className="rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-bold text-white outline-none focus:border-violet-400" />
        <button onClick={() => void load(query)} disabled={loading} className="rounded-2xl border border-violet-500/30 bg-violet-950/30 px-4 py-2 text-xs font-black text-violet-100"><Search className="mr-2 inline h-4 w-4" />Search</button>
      </div>
      {message && <p className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-xs font-bold text-cyan-100">{message}</p>}
      {error && <p className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-bold text-rose-200">{error}</p>}
    </section>

    <section className="grid gap-3 md:grid-cols-5">
      <Stat label="Knowledge hits" value={totalKnowledge} hint="memory + KB + content + prompts" />
      <Stat label="Vector namespaces" value={data.namespaces.length} hint="RAG stores" />
      <Stat label="Prompt runs" value={data.promptRuns.length} hint="execution history" />
      <Stat label="Context windows" value={data.contextWindows.length} hint="context managers" />
      <Stat label="Vector hits" value={data.vectorResults.length} hint={namespace} />
    </section>

    <section className="grid gap-4 xl:grid-cols-2">
      <Section title="Agent memory / RAG" icon={<Database className="h-4 w-4 text-cyan-300" />}>
        <MiniList items={data.memoryResults} emptyText="Chưa có memory match." render={(item, index) => <div key={item.id || index} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-black text-white">{item.title || item.kind || 'Memory'}</p><Badge>{String(item.status || item.kind || 'memory')}</Badge></div><p className="mt-2 line-clamp-3 text-[11px] font-semibold leading-5 text-slate-400">{item.content || item.citation || item.source || JSON.stringify(item).slice(0, 180)}</p></div>} />
      </Section>
      <Section title="Vector search" icon={<Sparkles className="h-4 w-4 text-violet-300" />}>
        <div className="mb-3 flex flex-wrap gap-2">{data.namespaces.slice(0, 8).map((ns: any) => <Badge key={ns.name || ns.id || String(ns)}>{String(ns.name || ns.id || ns)}</Badge>)}</div>
        <MiniList items={data.vectorResults} emptyText="Không có vector result hoặc namespace chưa tồn tại." render={(item, index) => <div key={item.id || index} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><div className="flex items-center justify-between gap-2"><p className="text-xs font-black text-white">{item.id || `Vector ${index + 1}`}</p><Badge>{item.similarity !== undefined ? `${Math.round(Number(item.similarity) * 100)}%` : 'vector'}</Badge></div><p className="mt-2 line-clamp-3 text-[11px] font-semibold leading-5 text-slate-400">{item.content || JSON.stringify(item).slice(0, 180)}</p></div>} />
      </Section>
    </section>

    <section className="grid gap-4 xl:grid-cols-3">
      <Section title="Prompt library" icon={<MessageSquareText className="h-4 w-4 text-emerald-300" />}>
        <MiniList items={data.promptTemplates} emptyText="Chưa có prompt template." render={(item, index) => <div key={item.id || index} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-xs font-black text-white">{item.name || item.title || item.id || 'Prompt template'}</p><p className="mt-1 text-[11px] font-semibold text-slate-500">{item.category || item.tags?.join?.(', ') || 'prompt'}</p></div>} />
      </Section>
      <Section title="Content assets" icon={<Library className="h-4 w-4 text-amber-300" />}>
        <MiniList items={data.contentAssets} emptyText="Chưa có content asset." render={(item, index) => <div key={item.id || index} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-xs font-black text-white">{item.title || item.name || item.id || 'Content asset'}</p><p className="mt-1 text-[11px] font-semibold text-slate-500">{item.type || item.status || 'content'}</p></div>} />
      </Section>
      <Section title="Knowledge base" icon={<BookOpen className="h-4 w-4 text-cyan-300" />}>
        <MiniList items={data.kbArticles} emptyText="Không có KB article match." render={(item, index) => <div key={item.id || index} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-xs font-black text-white">{item.title || item.name || item.id || 'KB article'}</p><p className="mt-1 line-clamp-2 text-[11px] font-semibold text-slate-500">{item.category || item.summary || item.content || 'knowledge base'}</p></div>} />
      </Section>
    </section>

    <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <Section title="Document intelligence" icon={<FileSearch className="h-4 w-4 text-rose-300" />}>
        <div className="grid gap-2 md:grid-cols-[1fr_auto]"><input value={docPath} onChange={(event) => setDocPath(event.target.value)} placeholder="Nhập filePath để detect structure..." className="rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-bold text-white outline-none focus:border-rose-400" /><button onClick={() => void analyzeDocument()} disabled={loading || !docPath.trim()} className="rounded-2xl border border-rose-500/30 bg-rose-950/30 px-4 py-2 text-xs font-black text-rose-100 disabled:opacity-50">Analyze</button></div>
        {data.documentResult && <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-xs leading-5 text-slate-400">{JSON.stringify(data.documentResult, null, 2)}</pre>}
      </Section>
      <Section title="Context windows" icon={<Database className="h-4 w-4 text-slate-300" />}>
        <MiniList items={data.contextWindows} emptyText="Chưa có context window." render={(item, index) => <div key={item.id || index} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><div className="flex items-center justify-between gap-2"><p className="text-xs font-black text-white">{item.id || item.name || `Window ${index + 1}`}</p><Badge>{item.strategy || item.status || 'context'}</Badge></div><p className="mt-1 text-[11px] font-semibold text-slate-500">{item.maxTokens ? `${item.maxTokens} tokens` : item.updatedAt || 'context window'}</p></div>} />
      </Section>
    </section>

    {rawOpen && <Section title="Raw Knowledge Studio payload" icon={<Database className="h-4 w-4 text-slate-300" />}>
      <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-xs leading-5 text-slate-400">{JSON.stringify(data, null, 2)}</pre>
    </Section>}
  </div>;
}
