import { useMemo, useState } from 'react';
import type { WorkCard } from '../../../types/agentOps';
import { appendAgentOpsAudit, appendLocalStorageArrayItem, readLocalStorageValue, useLocalStorageVersion, writeLocalStorageValue } from '../storage';

const KNOWLEDGE_KEY = 'ledgerflow_company_knowledge_v1';
const WORKBOARD_KEY = 'ledgerflow_aiops_cards_v1';

type KnowledgeSource = 'Founder Note' | 'Customer Feedback' | 'Process SOP' | 'Code Decision' | 'Accounting Rule' | 'Risk Note' | 'Document Import';
type KnowledgeTrust = 'Draft' | 'Approved' | 'Needs Review';

type KnowledgeNote = {
  id: string;
  title: string;
  source: KnowledgeSource;
  trust: KnowledgeTrust;
  tags: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

const sourceOptions: KnowledgeSource[] = ['Founder Note', 'Customer Feedback', 'Process SOP', 'Code Decision', 'Accounting Rule', 'Risk Note', 'Document Import'];
const trustOptions: KnowledgeTrust[] = ['Draft', 'Needs Review', 'Approved'];

function emptyDraft(): Pick<KnowledgeNote, 'title' | 'source' | 'trust' | 'tags' | 'body'> {
  return {
    title: '',
    source: 'Founder Note',
    trust: 'Draft',
    tags: '',
    body: ''
  };
}

function trustTone(trust: KnowledgeTrust) {
  if (trust === 'Approved') return 'border-emerald-400/35 text-emerald-200';
  if (trust === 'Needs Review') return 'border-amber-400/35 text-amber-200';
  return 'border-slate-700 text-slate-300';
}

function buildRagContext(notes: KnowledgeNote[]) {
  return notes
    .slice(0, 12)
    .map((note, index) => [
      `#${index + 1} ${note.title}`,
      `Source: ${note.source}`,
      `Trust: ${note.trust}`,
      `Tags: ${note.tags || 'none'}`,
      note.body
    ].join('\n'))
    .join('\n\n---\n\n');
}

function makeWorkCard(note: KnowledgeNote): WorkCard {
  const needsFounderReview = note.source === 'Risk Note' || note.trust !== 'Approved';
  return {
    id: `kb-card-${Date.now()}`,
    title: `Review knowledge: ${note.title}`,
    kind: 'Audit',
    owner: 'AI Chief of Staff',
    status: needsFounderReview ? 'Waiting Approval' : 'Inbox',
    risk: needsFounderReview ? 'MEDIUM' : 'LOW',
    request: `Review knowledge note before AI/RAG usage. Source: ${note.source}. Trust: ${note.trust}. Tags: ${note.tags || 'no tags'}.`,
    plan: ['Read note', 'Check source and trust level', 'Decide if safe for AI context', 'Update Knowledge Base trust level'],
    tools: ['Knowledge Base', 'Company Memory', 'Approval Gate'],
    approval: needsFounderReview ? 'Founder review required before using this note as approved AI context.' : 'Approved note can be used as local RAG context.'
  };
}

function splitDocumentIntoChunks(text: string) {
  const paragraphs = text
    .split(/\n\s*\n/g)
    .map((item) => item.trim())
    .filter(Boolean);

  if (paragraphs.length <= 1) {
    const compact = text.trim();
    if (!compact) return [];
    const chunks: string[] = [];
    for (let index = 0; index < compact.length; index += 1200) chunks.push(compact.slice(index, index + 1200).trim());
    return chunks.filter(Boolean);
  }

  const chunks: string[] = [];
  let current = '';
  for (const paragraph of paragraphs) {
    const next = current ? `${current}\n\n${paragraph}` : paragraph;
    if (next.length > 1400 && current) {
      chunks.push(current);
      current = paragraph;
    } else {
      current = next;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export default function KnowledgeBaseTab() {
  useLocalStorageVersion();
  const notes = readLocalStorageValue<KnowledgeNote[]>(KNOWLEDGE_KEY, []);
  const [draft, setDraft] = useState(emptyDraft());
  const [filter, setFilter] = useState<'all' | KnowledgeTrust>('all');
  const [query, setQuery] = useState('');
  const [importTitle, setImportTitle] = useState('');
  const [importTags, setImportTags] = useState('');
  const [importText, setImportText] = useState('');

  const filteredNotes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return notes.filter((note) => {
      const trustMatch = filter === 'all' || note.trust === filter;
      const queryMatch = !normalizedQuery || [note.title, note.source, note.trust, note.tags, note.body].join(' ').toLowerCase().includes(normalizedQuery);
      return trustMatch && queryMatch;
    });
  }, [filter, notes, query]);

  const approvedCount = notes.filter((note) => note.trust === 'Approved').length;
  const reviewCount = notes.filter((note) => note.trust === 'Needs Review').length;
  const ragContext = buildRagContext(filteredNotes.filter((note) => note.trust === 'Approved'));

  const saveNote = () => {
    const title = draft.title.trim();
    const body = draft.body.trim();
    if (!title || !body) return;
    const now = new Date().toLocaleString('vi-VN');
    const note: KnowledgeNote = {
      id: `kb-${Date.now()}`,
      title,
      source: draft.source,
      trust: draft.trust,
      tags: draft.tags.trim(),
      body,
      createdAt: now,
      updatedAt: now
    };
    writeLocalStorageValue(KNOWLEDGE_KEY, [note, ...notes].slice(0, 200));
    appendAgentOpsAudit('KNOWLEDGE_NOTE_CREATED', note.id, `${note.source} · ${note.trust} · ${note.title}`);
    setDraft(emptyDraft());
  };

  const importDocument = () => {
    const title = importTitle.trim();
    const text = importText.trim();
    if (!title || !text) return;
    const chunks = splitDocumentIntoChunks(text);
    if (chunks.length === 0) return;
    const now = new Date().toLocaleString('vi-VN');
    const importedNotes: KnowledgeNote[] = chunks.map((chunk, index) => ({
      id: `kb-import-${Date.now()}-${index + 1}`,
      title: chunks.length === 1 ? title : `${title} · chunk ${index + 1}/${chunks.length}`,
      source: 'Document Import',
      trust: 'Needs Review',
      tags: [importTags.trim(), `doc:${title}`, `chunk:${index + 1}`].filter(Boolean).join(', '),
      body: chunk,
      createdAt: now,
      updatedAt: now
    }));
    writeLocalStorageValue(KNOWLEDGE_KEY, [...importedNotes, ...notes].slice(0, 240));
    appendAgentOpsAudit('KNOWLEDGE_DOCUMENT_IMPORTED', importedNotes[0].id, `${title} · ${importedNotes.length} chunks · Needs Review`);
    setImportTitle('');
    setImportTags('');
    setImportText('');
  };

  const updateTrust = (note: KnowledgeNote, trust: KnowledgeTrust) => {
    const next = notes.map((item) => item.id === note.id ? { ...item, trust, updatedAt: new Date().toLocaleString('vi-VN') } : item);
    writeLocalStorageValue(KNOWLEDGE_KEY, next);
    appendAgentOpsAudit('KNOWLEDGE_TRUST_UPDATED', note.id, `${note.title} -> ${trust}`);
  };

  const deleteNote = (note: KnowledgeNote) => {
    writeLocalStorageValue(KNOWLEDGE_KEY, notes.filter((item) => item.id !== note.id));
    appendAgentOpsAudit('KNOWLEDGE_NOTE_DELETED', note.id, note.title);
  };

  const copyRagContext = async () => {
    if (!ragContext) return;
    await navigator.clipboard.writeText(ragContext);
    appendAgentOpsAudit('KNOWLEDGE_RAG_CONTEXT_COPIED', 'knowledge-base', `${filteredNotes.length} filtered notes, ${approvedCount} approved notes available.`);
  };

  const sendToWorkboard = (note: KnowledgeNote) => {
    const card = makeWorkCard(note);
    appendLocalStorageArrayItem<WorkCard>(WORKBOARD_KEY, card, 120);
    appendAgentOpsAudit('KNOWLEDGE_SENT_TO_WORKBOARD', card.id, note.title);
  };

  return (
    <section className="rounded-3xl border border-violet-400/35 bg-violet-400/10 p-4 text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-200">Knowledge base</p>
          <h3 className="mt-1 text-xl font-black text-white">Company Memory / RAG Seed</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Lưu tri thức công ty local-first. Tài liệu import luôn vào Needs Review, chỉ note Approved mới được dùng làm RAG context.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-black">
          <span className="rounded-full border border-violet-300/35 px-3 py-1 text-violet-100">{notes.length} notes</span>
          <span className="rounded-full border border-emerald-300/35 px-3 py-1 text-emerald-100">{approvedCount} approved</span>
          <span className="rounded-full border border-amber-300/35 px-3 py-1 text-amber-100">{reviewCount} review</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[0.95fr_1.4fr]">
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-sm font-black text-white">Add knowledge note</p>
            <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Tiêu đề tri thức / quyết định / SOP" className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-violet-300" />
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <select value={draft.source} onChange={(event) => setDraft({ ...draft, source: event.target.value as KnowledgeSource })} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-violet-300">
                {sourceOptions.map((source) => <option key={source} value={source}>{source}</option>)}
              </select>
              <select value={draft.trust} onChange={(event) => setDraft({ ...draft, trust: event.target.value as KnowledgeTrust })} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-violet-300">
                {trustOptions.map((trust) => <option key={trust} value={trust}>{trust}</option>)}
              </select>
            </div>
            <input value={draft.tags} onChange={(event) => setDraft({ ...draft, tags: event.target.value })} placeholder="tags: accounting, github, ci, founder-rule..." className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-violet-300" />
            <textarea value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} placeholder="Nội dung tri thức..." rows={6} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold leading-6 text-white outline-none focus:border-violet-300" />
            <button onClick={saveNote} className="mt-3 rounded-xl border border-violet-300/50 px-4 py-2 text-xs font-black text-violet-100 hover:bg-violet-400/10">Save note</button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-sm font-black text-white">Import document text</p>
            <p className="mt-1 text-xs font-semibold text-slate-400">Dán text tài liệu vào đây. App sẽ tách chunk local-only và lưu Needs Review trước khi được dùng cho RAG.</p>
            <input value={importTitle} onChange={(event) => setImportTitle(event.target.value)} placeholder="Tên tài liệu / nguồn" className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-violet-300" />
            <input value={importTags} onChange={(event) => setImportTags(event.target.value)} placeholder="tags import" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-violet-300" />
            <textarea value={importText} onChange={(event) => setImportText(event.target.value)} placeholder="Dán nội dung tài liệu dài ở đây..." rows={8} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold leading-6 text-white outline-none focus:border-violet-300" />
            <button onClick={importDocument} className="mt-3 rounded-xl border border-amber-300/50 px-4 py-2 text-xs font-black text-amber-100 hover:bg-amber-400/10">Import as review chunks</button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-black text-white">Knowledge library</p>
            <button onClick={copyRagContext} disabled={!ragContext} className="rounded-xl border border-emerald-300/50 px-3 py-2 text-[11px] font-black text-emerald-100 hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-40">Copy approved RAG context</button>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_180px]">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notes..." className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-violet-300" />
            <select value={filter} onChange={(event) => setFilter(event.target.value as 'all' | KnowledgeTrust)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-violet-300">
              <option value="all">All trust levels</option>
              {trustOptions.map((trust) => <option key={trust} value={trust}>{trust}</option>)}
            </select>
          </div>

          <div className="mt-3 grid max-h-[760px] gap-2 overflow-y-auto pr-1">
            {filteredNotes.map((note) => (
              <article key={note.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-black text-white">{note.title}</p>
                    <p className="mt-1 text-[11px] font-bold text-slate-400">{note.source} · {note.tags || 'no tags'} · updated {note.updatedAt}</p>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${trustTone(note.trust)}`}>{note.trust}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-xs font-semibold leading-5 text-slate-300">{note.body}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {trustOptions.map((trust) => <button key={trust} onClick={() => updateTrust(note, trust)} className="rounded-xl border border-slate-700 px-2 py-1 text-[10px] font-black text-slate-300 hover:border-violet-300">{trust}</button>)}
                  <button onClick={() => sendToWorkboard(note)} className="rounded-xl border border-cyan-300/50 px-2 py-1 text-[10px] font-black text-cyan-100 hover:bg-cyan-400/10">Send to Workboard</button>
                  <button onClick={() => deleteNote(note)} className="rounded-xl border border-rose-300/50 px-2 py-1 text-[10px] font-black text-rose-100 hover:bg-rose-400/10">Delete</button>
                </div>
              </article>
            ))}
            {filteredNotes.length === 0 && <p className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm font-semibold text-slate-400">Chưa có note phù hợp. Thêm SOP/quy tắc/quyết định để tạo Company Memory cho AI.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
