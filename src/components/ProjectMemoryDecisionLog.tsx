import { useEffect, useMemo, useState } from 'react';

type MemoryKind = 'Decision' | 'Lesson' | 'CI Pattern' | 'Guardrail' | 'Bug Pattern' | 'Product Rule' | 'Architecture Note';
type MemoryStatus = 'Active' | 'Needs Review' | 'Deprecated';
type MemoryRisk = 'LOW' | 'MEDIUM' | 'HIGH';

type MemoryItem = {
  id: string;
  title: string;
  kind: MemoryKind;
  status: MemoryStatus;
  risk: MemoryRisk;
  source: string;
  tags: string[];
  decision: string;
  rationale: string;
  doNext: string;
  avoid: string;
  createdAt: string;
  updatedAt: string;
};

type MemoryEvent = {
  id: string;
  at: string;
  action: string;
  detail: string;
  memoryId?: string;
};

const memoryKinds: MemoryKind[] = ['Decision', 'Lesson', 'CI Pattern', 'Guardrail', 'Bug Pattern', 'Product Rule', 'Architecture Note'];
const memoryStatuses: MemoryStatus[] = ['Active', 'Needs Review', 'Deprecated'];
const memoryRisks: MemoryRisk[] = ['LOW', 'MEDIUM', 'HIGH'];

const starterMemories: MemoryItem[] = [
  {
    id: 'memory-company-os',
    title: 'LedgerFlow là Software Company OS, không phải app công trình',
    kind: 'Product Rule',
    status: 'Active',
    risk: 'HIGH',
    source: 'Founder correction',
    tags: ['company-os', 'product-scope', 'guardrail'],
    decision: 'Mọi module top-level phải phục vụ công ty phần mềm: product, marketing, sales, AI ops, finance, release, connectors. Công trình chỉ là template ngành xây dựng.',
    rationale: 'Tránh quay lại sai lầm biến app thành phần mềm công ty xây dựng.',
    doNext: 'Khi tạo module mới, đặt nó trong Software Company OS trước; template ngành chỉ là optional workspace.',
    avoid: 'Không đưa Mua hàng / Kho / Dầu thành top-level global nav.',
    createdAt: 'Mặc định',
    updatedAt: 'Mặc định'
  },
  {
    id: 'memory-ai-push-safety',
    title: 'AI chỉ được tạo branch ai/* và Draft PR sau approval',
    kind: 'Guardrail',
    status: 'Active',
    risk: 'HIGH',
    source: 'AI Ops security model',
    tags: ['github', 'approval', 'security'],
    decision: 'AI không push trực tiếp main, không auto-merge, không ghi secret, không chạy live tool khi chưa có founder approval.',
    rationale: 'Cho phép tự động hóa nhưng giữ quyền kiểm soát cuối cùng cho founder.',
    doNext: 'Luôn đi qua Sandbox/Diff Review, Founder Review, Review Desk và Build Monitor.',
    avoid: 'Không tạo commit vào main/master/develop/production; không lưu token ở frontend.',
    createdAt: 'Mặc định',
    updatedAt: 'Mặc định'
  },
  {
    id: 'memory-openclaw-safe-scope',
    title: 'Chỉ lấy phần OpenClaw an toàn P0/P1 trước',
    kind: 'Architecture Note',
    status: 'Active',
    risk: 'MEDIUM',
    source: 'OpenClaw research',
    tags: ['openclaw', 'sandbox', 'policy'],
    decision: 'Ưu tiên policy, approval, memory, sandbox, diff, audit, release. Browser/shell/computer-use thật để sau.',
    rationale: 'Runtime mạnh nhưng rủi ro nếu bật tool thật quá sớm.',
    doNext: 'Hoàn thiện memory, skill, browser simulation trước khi nghĩ đến execution layer thật.',
    avoid: 'Không bật unrestricted shell/browser automation trong P0/P1.',
    createdAt: 'Mặc định',
    updatedAt: 'Mặc định'
  }
];

const starterEvents: MemoryEvent[] = [
  { id: 'memory-event-001', at: 'Mặc định', action: 'MEMORY_BOOTSTRAP', detail: 'Khởi tạo Project Memory từ các quyết định quan trọng của LedgerFlow AI Ops.' }
];

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function parseTags(value: string) {
  return value.split(',').map((tag) => tag.trim()).filter(Boolean);
}

function exportJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function scoreMemory(item: MemoryItem, query: string) {
  if (!query.trim()) return 1;
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const haystack = [item.title, item.kind, item.source, item.tags.join(' '), item.decision, item.rationale, item.doNext, item.avoid].join(' ').toLowerCase();
  return terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0);
}

export default function ProjectMemoryDecisionLog() {
  const [items, setItems] = useState<MemoryItem[]>(() => readLocal('ledgerflow_project_memory_v1', starterMemories));
  const [events, setEvents] = useState<MemoryEvent[]>(() => readLocal('ledgerflow_project_memory_events_v1', starterEvents));
  const [selectedId, setSelectedId] = useState(() => items[0]?.id ?? starterMemories[0].id);
  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<'All' | MemoryKind>('All');
  const [draft, setDraft] = useState({
    title: '',
    kind: 'Decision' as MemoryKind,
    status: 'Active' as MemoryStatus,
    risk: 'MEDIUM' as MemoryRisk,
    source: 'Manual',
    tags: '',
    decision: '',
    rationale: '',
    doNext: '',
    avoid: ''
  });

  useEffect(() => {
    localStorage.setItem('ledgerflow_project_memory_v1', JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('ledgerflow-project-memory-updated'));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('ledgerflow_project_memory_events_v1', JSON.stringify(events));
  }, [events]);

  const selected = useMemo(() => items.find((item) => item.id === selectedId) ?? items[0], [items, selectedId]);

  const filteredItems = useMemo(() => items
    .map((item) => ({ item, score: scoreMemory(item, query) }))
    .filter(({ item, score }) => score > 0 && (kindFilter === 'All' || item.kind === kindFilter))
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title)), [items, query, kindFilter]);

  const pushEvent = (action: string, detail: string, memoryId?: string) => {
    setEvents((current) => [{ id: `memory-event-${Date.now()}`, at: new Date().toLocaleString('vi-VN'), action, detail, memoryId }, ...current].slice(0, 150));
  };

  const createMemory = () => {
    if (!draft.title.trim() || !draft.decision.trim()) return;
    const now = new Date().toLocaleString('vi-VN');
    const memory: MemoryItem = {
      id: `memory-${Date.now()}`,
      title: draft.title.trim(),
      kind: draft.kind,
      status: draft.status,
      risk: draft.risk,
      source: draft.source.trim() || 'Manual',
      tags: parseTags(draft.tags),
      decision: draft.decision.trim(),
      rationale: draft.rationale.trim(),
      doNext: draft.doNext.trim(),
      avoid: draft.avoid.trim(),
      createdAt: now,
      updatedAt: now
    };
    setItems((current) => [memory, ...current]);
    setSelectedId(memory.id);
    pushEvent('MEMORY_CREATED', `Tạo memory: ${memory.title}`, memory.id);
    setDraft({ title: '', kind: draft.kind, status: 'Active', risk: draft.risk, source: 'Manual', tags: '', decision: '', rationale: '', doNext: '', avoid: '' });
  };

  const updateSelected = (patch: Partial<MemoryItem>, action = 'MEMORY_UPDATED') => {
    if (!selected) return;
    setItems((current) => current.map((item) => item.id === selected.id ? { ...item, ...patch, updatedAt: new Date().toLocaleString('vi-VN') } : item));
    pushEvent(action, `Cập nhật memory: ${selected.title}`, selected.id);
  };

  const removeSelected = () => {
    if (!selected) return;
    setItems((current) => current.filter((item) => item.id !== selected.id));
    pushEvent('MEMORY_DELETED', `Xóa memory: ${selected.title}`, selected.id);
    setSelectedId(items.find((item) => item.id !== selected.id)?.id ?? '');
  };

  const sendToKnowledge = () => {
    if (!selected) return;
    const existing = readLocal<any[]>('ledgerflow_knowledge_library_v1', []);
    const knowledge = {
      id: `knowledge-from-memory-${selected.id}-${Date.now()}`,
      title: selected.title,
      category: selected.kind,
      source: `Project Memory · ${selected.source}`,
      tags: selected.tags,
      priority: selected.risk === 'HIGH' ? 'High' : selected.risk === 'MEDIUM' ? 'Medium' : 'Low',
      content: `Decision:\n${selected.decision}\n\nRationale:\n${selected.rationale}\n\nDo next:\n${selected.doNext}\n\nAvoid:\n${selected.avoid}`,
      createdAt: new Date().toLocaleString('vi-VN')
    };
    localStorage.setItem('ledgerflow_knowledge_library_v1', JSON.stringify([knowledge, ...existing]));
    pushEvent('MEMORY_SENT_TO_KNOWLEDGE', `Đưa memory sang Knowledge Library: ${selected.title}`, selected.id);
    window.dispatchEvent(new CustomEvent('ledgerflow-knowledge-updated'));
  };

  const importFromCi = () => {
    const ciPackage = readLocal<any | null>('ledgerflow_ci_fix_package_v1', null);
    if (!ciPackage) return;
    const now = new Date().toLocaleString('vi-VN');
    const memory: MemoryItem = {
      id: `memory-ci-${Date.now()}`,
      title: `CI Pattern: ${ciPackage.workflowName ?? 'workflow'} ${ciPackage.conclusion ?? 'failed'}`,
      kind: 'CI Pattern',
      status: 'Needs Review',
      risk: 'MEDIUM',
      source: `CI Recovery · PR #${ciPackage.prNumber ?? '?'}`,
      tags: ['ci', 'build', ciPackage.branch ?? 'branch'].filter(Boolean),
      decision: 'CI/build có lỗi cần ghi lại pattern xử lý để lần sau AI không lặp lại.',
      rationale: ciPackage.prompt ?? 'Chưa có prompt phân tích.',
      doNext: 'Mở CI Doctor, đọc log, ghi nguyên nhân và patch tối thiểu sau khi sửa xong.',
      avoid: 'Không sửa lan man khi chưa biết job/step fail cụ thể.',
      createdAt: now,
      updatedAt: now
    };
    setItems((current) => [memory, ...current]);
    setSelectedId(memory.id);
    pushEvent('CI_PATTERN_IMPORTED', `Import CI package thành memory: ${memory.title}`, memory.id);
  };

  return (
    <section className="rounded-3xl border border-emerald-400/35 bg-emerald-400/10 p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">Project memory / decision log</p>
          <h3 className="mt-1 text-xl font-black text-white">Bộ nhớ quyết định dự án</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Lưu guardrail, quyết định, bài học, pattern lỗi CI và luật sản phẩm để AI không quên bối cảnh.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={importFromCi} className="rounded-2xl border border-amber-400/40 px-4 py-2 text-xs font-black text-amber-200 hover:bg-amber-400/10">Import CI Pattern</button>
          <button onClick={() => exportJson('ledgerflow-project-memory.json', { items, events })} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-emerald-300">Xuất memory</button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.75fr_1.1fr_0.85fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="grid gap-2">
            <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Tìm memory..." value={query} onChange={(event) => setQuery(event.target.value)} />
            <select className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" value={kindFilter} onChange={(event) => setKindFilter(event.target.value as 'All' | MemoryKind)}>
              <option>All</option>
              {memoryKinds.map((kind) => <option key={kind}>{kind}</option>)}
            </select>
          </div>
          <div className="mt-3 max-h-[620px] space-y-2 overflow-y-auto">
            {filteredItems.map(({ item, score }) => <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full rounded-2xl border p-3 text-left transition ${selected?.id === item.id ? 'border-emerald-300 bg-emerald-400/10' : 'border-slate-800 bg-slate-950/50 hover:border-emerald-400/40'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-black text-white">{item.title}</p>
                <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] font-black text-slate-300">{item.risk}</span>
              </div>
              <p className="mt-1 text-[11px] font-bold text-slate-500">{item.kind} · {item.status} · score {score}</p>
            </button>)}
          </div>
        </div>

        {selected && <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Selected memory</p>
              <h4 className="mt-1 text-lg font-black text-white">{selected.title}</h4>
              <p className="mt-1 text-xs font-bold text-slate-400">{selected.kind} · {selected.status} · Risk {selected.risk} · {selected.source}</p>
            </div>
            <button onClick={sendToKnowledge} className="rounded-2xl border border-emerald-400/40 px-3 py-2 text-xs font-black text-emerald-200 hover:bg-emerald-400/10">Đưa sang Knowledge</button>
          </div>

          <div className="mt-4 grid gap-3">
            <label className="grid gap-1 text-xs font-black text-slate-500">Status
              <select className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" value={selected.status} onChange={(event) => updateSelected({ status: event.target.value as MemoryStatus })}>
                {memoryStatuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-black text-slate-500">Decision
              <textarea className="min-h-[90px] rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" value={selected.decision} onChange={(event) => updateSelected({ decision: event.target.value })} />
            </label>
            <label className="grid gap-1 text-xs font-black text-slate-500">Rationale
              <textarea className="min-h-[80px] rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" value={selected.rationale} onChange={(event) => updateSelected({ rationale: event.target.value })} />
            </label>
            <label className="grid gap-1 text-xs font-black text-slate-500">Do next
              <textarea className="min-h-[80px] rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" value={selected.doNext} onChange={(event) => updateSelected({ doNext: event.target.value })} />
            </label>
            <label className="grid gap-1 text-xs font-black text-slate-500">Avoid
              <textarea className="min-h-[80px] rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" value={selected.avoid} onChange={(event) => updateSelected({ avoid: event.target.value })} />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {memoryRisks.map((risk) => <button key={risk} onClick={() => updateSelected({ risk })} className={`rounded-full border px-3 py-2 text-[11px] font-black ${selected.risk === risk ? 'border-emerald-300 bg-emerald-300 text-slate-950' : 'border-slate-700 text-slate-300 hover:border-emerald-400'}`}>{risk}</button>)}
            <button onClick={removeSelected} className="rounded-full border border-rose-400/40 px-3 py-2 text-[11px] font-black text-rose-200 hover:bg-rose-400/10">Xóa</button>
          </div>
        </div>}

        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-3">
          <p className="text-sm font-black text-white">Thêm memory mới</p>
          <div className="mt-3 grid gap-2">
            <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Tiêu đề" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            <div className="grid gap-2 md:grid-cols-2">
              <select className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" value={draft.kind} onChange={(event) => setDraft({ ...draft, kind: event.target.value as MemoryKind })}>{memoryKinds.map((kind) => <option key={kind}>{kind}</option>)}</select>
              <select className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" value={draft.risk} onChange={(event) => setDraft({ ...draft, risk: event.target.value as MemoryRisk })}>{memoryRisks.map((risk) => <option key={risk}>{risk}</option>)}</select>
            </div>
            <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Nguồn" value={draft.source} onChange={(event) => setDraft({ ...draft, source: event.target.value })} />
            <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="tags, cách nhau bằng dấu phẩy" value={draft.tags} onChange={(event) => setDraft({ ...draft, tags: event.target.value })} />
            <textarea className="min-h-[80px] rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" placeholder="Quyết định / bài học" value={draft.decision} onChange={(event) => setDraft({ ...draft, decision: event.target.value })} />
            <textarea className="min-h-[70px] rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" placeholder="Vì sao" value={draft.rationale} onChange={(event) => setDraft({ ...draft, rationale: event.target.value })} />
            <textarea className="min-h-[70px] rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" placeholder="Lần sau nên làm gì" value={draft.doNext} onChange={(event) => setDraft({ ...draft, doNext: event.target.value })} />
            <textarea className="min-h-[70px] rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" placeholder="Tránh gì" value={draft.avoid} onChange={(event) => setDraft({ ...draft, avoid: event.target.value })} />
            <button onClick={createMemory} className="rounded-2xl bg-emerald-300 px-4 py-2 text-xs font-black text-slate-950">Lưu memory</button>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Memory events</p>
            <div className="mt-2 max-h-44 space-y-2 overflow-y-auto">
              {events.slice(0, 8).map((event) => <div key={event.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-2">
                <p className="text-[10px] font-black text-emerald-200">{event.action}</p>
                <p className="mt-1 text-[11px] font-semibold text-slate-400">{event.detail}</p>
                <p className="mt-1 text-[10px] font-bold text-slate-600">{event.at}</p>
              </div>)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
