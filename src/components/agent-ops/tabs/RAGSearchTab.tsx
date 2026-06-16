import { useMemo, useState } from 'react';
import { appendAgentOpsAudit, readLocalStorageValue, useLocalStorageVersion } from '../storage';

const KNOWLEDGE_KEY = 'ledgerflow_company_knowledge_v1';
const MEMORY_VERSION_KEY = 'ledgerflow_company_memory_versions_v1';

type KnowledgeNote = {
  id: string;
  title?: string;
  source?: string;
  status?: string;
  trust?: string;
  confidence?: string;
  summary?: string;
  content?: string;
  body?: string;
  tags?: string[] | string;
  createdAt?: string;
};

type MemoryVersion = {
  id: string;
  version?: string;
  status?: string;
  title?: string;
  summary?: string;
  snapshot?: string;
  context?: string;
  content?: string;
  rollbackNote?: string;
  createdAt?: string;
};

type RAGStatus = 'Draft' | 'Needs Review' | 'Approved' | 'Archived';
type ConfidenceFilter = 'all' | 'Low' | 'Medium' | 'High';
type StatusFilter = 'all' | RAGStatus;

type RAGSource = {
  id: string;
  citation: string;
  title: string;
  type: 'Knowledge' | 'Memory';
  status: RAGStatus;
  confidence: 'Low' | 'Medium' | 'High';
  source: string;
  text: string;
  score: number;
};

function normalizeText(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function scoreText(text: string, query: string) {
  const terms = normalizeText(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return 1;
  const normalized = normalizeText(text);
  return terms.reduce((score, term) => score + (normalized.includes(term) ? 1 : 0), 0);
}

function normalizeStatus(value: string | undefined, fallback: RAGStatus = 'Draft'): RAGStatus {
  if (value === 'Draft' || value === 'Needs Review' || value === 'Approved' || value === 'Archived') return value;
  return fallback;
}

function normalizeConfidence(value: string | undefined): 'Low' | 'Medium' | 'High' {
  if (value === 'Low' || value === 'Medium' || value === 'High') return value;
  return 'Medium';
}

function stringifyTags(tags: KnowledgeNote['tags']) {
  if (Array.isArray(tags)) return tags.join(', ');
  return tags || '';
}

function knowledgeToSource(note: KnowledgeNote, index: number): RAGSource {
  const title = note.title || `Knowledge note ${index + 1}`;
  const status = normalizeStatus(note.status || note.trust);
  const text = [note.summary, note.content, note.body, stringifyTags(note.tags)].filter(Boolean).join('\n');
  return {
    id: note.id || `knowledge-${index}`,
    citation: `K${index + 1}`,
    title,
    type: 'Knowledge',
    status,
    confidence: normalizeConfidence(note.confidence),
    source: note.source || 'Knowledge Base',
    text: text || title,
    score: 0,
  };
}

function memoryToSource(memory: MemoryVersion, index: number): RAGSource {
  const title = memory.title || memory.version || `Memory version ${index + 1}`;
  const text = [memory.summary, memory.snapshot, memory.context, memory.content, memory.rollbackNote].filter(Boolean).join('\n');
  return {
    id: memory.id || `memory-${index}`,
    citation: `M${index + 1}`,
    title,
    type: 'Memory',
    status: normalizeStatus(memory.status),
    confidence: memory.status === 'Approved' ? 'High' : 'Medium',
    source: memory.version || 'Company Memory',
    text: text || title,
    score: 0,
  };
}

function buildContext(sources: RAGSource[]) {
  if (sources.length === 0) {
    return 'No approved sources selected. Ask founder to approve knowledge notes or memory versions first.';
  }

  return sources.map((source) => [
    `## [${source.citation}] ${source.title}`,
    `- Type: ${source.type}`,
    `- Status: ${source.status}`,
    `- Source: ${source.source}`,
    '',
    source.text,
  ].join('\n')).join('\n\n---\n\n');
}

function evidenceWarning(query: string, matches: RAGSource[], selectedSources: RAGSource[]) {
  if (matches.length === 0) return 'Không có source phù hợp. Không nên trả lời chắc chắn; cần bổ sung hoặc approve nguồn.';
  if (selectedSources.length === 0) return 'Chưa chọn citation vào context basket. AI chỉ được trả lời sau khi có nguồn được chọn.';
  if (query.trim() && selectedSources.length < 2) return 'Nguồn còn mỏng. Nên chọn thêm citation độc lập hoặc nói rõ bằng chứng chưa đủ.';
  return '';
}

export default function RAGSearchTab() {
  useLocalStorageVersion();
  const [query, setQuery] = useState('');
  const [includeDraft, setIncludeDraft] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceFilter>('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  const storedKnowledge = readLocalStorageValue<KnowledgeNote[]>(KNOWLEDGE_KEY, []);
  const storedMemories = readLocalStorageValue<MemoryVersion[]>(MEMORY_VERSION_KEY, []);
  const knowledge = Array.isArray(storedKnowledge) ? storedKnowledge : [];
  const memories = Array.isArray(storedMemories) ? storedMemories : [];

  const allSources = useMemo(() => [
    ...knowledge.map(knowledgeToSource),
    ...memories.map(memoryToSource),
  ], [knowledge, memories]);

  const sourceOptions = useMemo(() => Array.from(new Set(allSources.map((source) => source.source))).sort(), [allSources]);

  const eligibleSources = useMemo(() => allSources.filter((source) => {
    const approvalMatch = includeDraft || source.status === 'Approved';
    const statusMatch = statusFilter === 'all' || source.status === statusFilter;
    const confidenceMatch = confidenceFilter === 'all' || source.confidence === confidenceFilter;
    const sourceMatch = sourceFilter === 'all' || source.source === sourceFilter;
    return approvalMatch && statusMatch && confidenceMatch && sourceMatch;
  }), [allSources, confidenceFilter, includeDraft, sourceFilter, statusFilter]);

  const sources = useMemo(() => eligibleSources
    .map((source) => ({ ...source, score: scoreText(`${source.title}\n${source.text}`, query) }))
    .filter((source) => !query.trim() || source.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, 30), [eligibleSources, query]);

  const selectedSources = eligibleSources.filter((source) => selectedIds.includes(source.id));
  const context = buildContext(selectedSources);
  const approvedCount = allSources.filter((item) => item.status === 'Approved').length;
  const warning = evidenceWarning(query, sources, selectedSources);

  const toggleSource = (id: string) => {
    const source = allSources.find((item) => item.id === id);
    setSelectedIds((current) => {
      const isSelected = current.includes(id);
      appendAgentOpsAudit(
        isSelected ? 'RAG_SOURCE_EXCLUDED' : 'RAG_SOURCE_SELECTED',
        id,
        `${source?.citation || id} ${source?.title || 'source'} for query: ${query || 'empty'}`
      );
      return isSelected ? current.filter((item) => item !== id) : [...current, id];
    });
  };

  const copyContext = async () => {
    await navigator.clipboard.writeText([
      '# LedgerFlow RAG Context',
      '',
      `Query: ${query || 'No query'}`,
      `Sources: ${selectedSources.map((source) => `[${source.citation}]`).join(', ') || 'none'}`,
      `Approved-only: ${includeDraft ? 'off' : 'on'}`,
      warning ? `Evidence warning: ${warning}` : '',
      '',
      context,
      '',
      'Instruction: use only cited context above. If evidence is weak, say what is missing.',
    ].filter(Boolean).join('\n'));
    appendAgentOpsAudit('RAG_CONTEXT_COPIED', 'rag-search', `${selectedSources.length} sources copied for query: ${query || 'none'}; approved-only=${includeDraft ? 'off' : 'on'}; selected=${selectedSources.map((source) => source.id).join(', ') || 'none'}`);
    if (warning) appendAgentOpsAudit('RAG_LOW_EVIDENCE_WARNING', 'rag-search', warning);
  };

  const runSearch = () => {
    appendAgentOpsAudit('RAG_SEARCH_RUN', 'rag-search', `${sources.length} matches for query: ${query || 'empty'}; status=${statusFilter}; confidence=${confidenceFilter}; source=${sourceFilter}; approved-only=${includeDraft ? 'off' : 'on'}`);
    if (warning) appendAgentOpsAudit('RAG_LOW_EVIDENCE_WARNING', 'rag-search', warning);
  };

  return (
    <section className="rounded-3xl border border-cyan-400/30 bg-cyan-400/10 p-4 text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">Local RAG phase 1</p>
          <h3 className="mt-1 text-xl font-black text-white">RAG Search / Evidence Context</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Search Knowledge Base và Memory Versions bằng localStorage. Chỉ nguồn Approved được dùng mặc định; copy context phải có citation.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-black">
          <span className="rounded-full border border-cyan-300/40 px-3 py-1 text-cyan-100">{sources.length} matches</span>
          <span className="rounded-full border border-emerald-300/40 px-3 py-1 text-emerald-100">{approvedCount} approved</span>
          <span className="rounded-full border border-amber-300/40 px-3 py-1 text-amber-100">{selectedSources.length} selected</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3 md:grid-cols-[1fr_auto_auto]">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search evidence, rule, SOP, decision..." className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-cyan-300" />
        <label className="flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-xs font-black text-slate-300">
          <input type="checkbox" checked={includeDraft} onChange={(event) => setIncludeDraft(event.target.checked)} /> Include draft
        </label>
        <button onClick={runSearch} className="rounded-xl border border-cyan-300/50 px-3 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-400/10">Audit search</button>
      </div>

      <div className="mt-3 grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3 md:grid-cols-3">
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-cyan-300">
          <option value="all">All statuses</option>
          <option value="Approved">Approved</option>
          <option value="Needs Review">Needs Review</option>
          <option value="Draft">Draft</option>
          <option value="Archived">Archived</option>
        </select>
        <select value={confidenceFilter} onChange={(event) => setConfidenceFilter(event.target.value as ConfidenceFilter)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-cyan-300">
          <option value="all">All confidence</option>
          <option value="High">High confidence</option>
          <option value="Medium">Medium confidence</option>
          <option value="Low">Low confidence</option>
        </select>
        <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-cyan-300">
          <option value="all">All sources</option>
          {sourceOptions.map((source) => <option key={source} value={source}>{source}</option>)}
        </select>
      </div>

      {warning && <p className="mt-3 rounded-2xl border border-amber-300/35 bg-amber-400/10 p-3 text-xs font-bold leading-5 text-amber-100">Evidence warning: {warning}</p>}

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-3">
          {sources.map((source) => (
            <article key={source.id} className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-black text-white">[{source.citation}] {source.title}</p>
                  <p className="mt-1 text-[11px] font-bold text-slate-400">{source.type} · {source.status} · {source.confidence} confidence · {source.source} · score {source.score}</p>
                </div>
                <button onClick={() => toggleSource(source.id)} className={`rounded-xl border px-3 py-2 text-[11px] font-black ${selectedIds.includes(source.id) ? 'border-emerald-300 text-emerald-100' : 'border-slate-700 text-slate-300 hover:border-cyan-300'}`}>{selectedIds.includes(source.id) ? 'Selected' : 'Select'}</button>
              </div>
              <p className="mt-3 line-clamp-4 text-xs font-semibold leading-5 text-slate-300">{source.text}</p>
            </article>
          ))}
          {sources.length === 0 && <p className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm font-semibold text-slate-400">Không có source phù hợp. Hãy approve knowledge note/memory version hoặc bật Include draft.</p>}
        </div>

        <aside className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-black text-white">Context basket</p>
            <button onClick={copyContext} className="rounded-xl border border-emerald-300/50 px-3 py-2 text-[11px] font-black text-emerald-100 hover:bg-emerald-400/10">Copy context</button>
          </div>
          <pre className="mt-3 max-h-[520px] overflow-auto whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-[11px] font-semibold leading-5 text-slate-300">{context}</pre>
        </aside>
      </div>
    </section>
  );
}
