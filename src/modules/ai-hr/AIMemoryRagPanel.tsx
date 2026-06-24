import { useState } from 'react';
import { AlertTriangle, Brain, Database, Search, Send } from 'lucide-react';
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
    setBusy(true); setError(''); setMessage('');
    try {
      const [m, v] = await Promise.all([
        daemonFetch<unknown>(`/api/agent-memory/search?q=${encodeURIComponent(query)}&limit=10`, undefined, 10000).catch(() => []),
        daemonFetch<unknown>('/api/vectors/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ namespace, query, topK: 8 }) }, 10000).catch(() => []),
      ]);
      setMemory(listFrom<MemoryResult>(m, 'results'));
      setVectors(listFrom<VectorResult>(v, 'results'));
    } catch (err: any) {
      setError(err?.message || 'Memory search failed.');
    } finally { setBusy(false); }
  };

  const createMemory = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await daemonFetch('/api/agent-memory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'company', title: newTitle.trim(), content: newContent.trim(), source: 'desktop-memory-panel', reviewed: true, confidence: 0.85 }) }, 10000);
      setMessage('Memory saved to daemon.');
      setNewTitle(''); setNewContent('');
    } catch (err: any) { setError(err?.message || 'Cannot save memory.'); }
    finally { setBusy(false); }
  };

  return <div className="space-y-6 text-slate-100">
    <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-fuchsia-950/20 p-6 shadow-2xl">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-fuchsia-300"><Brain className="h-3.5 w-3.5" /> AI Memory & RAG</div>
      <h1 className="text-2xl font-black tracking-tight text-white">Memory / RAG Control</h1>
      <p className="mt-1 text-sm font-semibold text-slate-400">Search and add reviewed memories through the assistant daemon.</p>
    </section>

    {error && <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-bold text-rose-300"><AlertTriangle className="mr-2 inline h-4 w-4" />{error}</div>}
    {message && <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-200">{message}</div>}

    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <h2 className="mb-3 text-sm font-black text-white"><Search className="mr-2 inline h-4 w-4 text-fuchsia-300" />Search memory</h2>
      <div className="grid gap-3 lg:grid-cols-[1fr_180px_auto]"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search company memory, notes, decisions..." className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white" /><input value={namespace} onChange={(e) => setNamespace(e.target.value)} placeholder="vector namespace" className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white" /><button onClick={() => void search()} disabled={busy || !query.trim()} className="rounded-xl bg-fuchsia-300 px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-50"><Search className="mr-2 inline h-4 w-4" />Search</button></div>
    </div>

    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><h2 className="mb-3 text-sm font-black text-white"><Brain className="mr-2 inline h-4 w-4 text-fuchsia-300" />Agent memory</h2><div className="space-y-2">{memory.map((item, index) => <div key={item.id || index} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"><p className="font-black text-white">{item.title || item.kind || 'Memory'}</p><p className="mt-1 line-clamp-3 text-xs text-slate-400">{item.content || JSON.stringify(item).slice(0, 260)}</p></div>)}{memory.length === 0 && <p className="text-xs font-bold text-slate-500">No agent-memory results yet.</p>}</div></div>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><h2 className="mb-3 text-sm font-black text-white"><Database className="mr-2 inline h-4 w-4 text-cyan-300" />Vector RAG</h2><div className="space-y-2">{vectors.map((item, index) => <div key={item.id || index} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"><p className="text-[10px] font-black uppercase text-cyan-300">similarity {item.similarity ?? '-'}</p><p className="mt-1 line-clamp-3 text-xs text-slate-400">{item.content || JSON.stringify(item).slice(0, 260)}</p></div>)}{vectors.length === 0 && <p className="text-xs font-bold text-slate-500">No vector results yet. Namespace may need documents inserted first.</p>}</div></div>
    </div>

    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><h2 className="mb-3 text-sm font-black text-white"><Send className="mr-2 inline h-4 w-4 text-emerald-300" />Add reviewed memory</h2><div className="grid gap-3"><input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Memory title" className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white" /><textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="Memory content" rows={4} className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white" /><button onClick={() => void createMemory()} disabled={busy || !newTitle.trim() || !newContent.trim()} className="w-fit rounded-xl bg-emerald-300 px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-50">Save Memory</button></div></div>
  </div>;
}
