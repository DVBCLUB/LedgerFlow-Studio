import React, { useMemo, useState } from 'react';

type MoatStatus = 'Idea' | 'Building' | 'Validated' | 'Weak';
type MoatType = 'Data moat' | 'Workflow moat' | 'Community moat' | 'Distribution moat' | 'Switching cost' | 'Brand/trust moat';

type MoatItem = {
  id: string;
  product: string;
  moatType: MoatType;
  description: string;
  evidence: string;
  nextAction: string;
  owner: string;
  status: MoatStatus;
  uniqueness: number;
  compounding: number;
  hardToCopy: number;
  customerValue: number;
};

const STORAGE_KEY = 'ledgerflow-moat-defensibility-tracker-v1';

const defaultItems: MoatItem[] = [
  {
    id: 'case-bank-data-moat',
    product: 'LedgerFlow learning + simulation OS',
    moatType: 'Data moat',
    description: 'Tích lũy case kế toán/kiểm toán đa ngành, red flags, chứng từ, câu hỏi kiểm toán và bài học thực chiến.',
    evidence: 'Multi-Industry Case Bank + Audit Red Flag Game đã có dữ liệu mẫu và UI học tập.',
    nextAction: 'Mỗi tuần thêm 5 case thật/ẩn danh theo ngành, có red flags và chứng từ.',
    owner: 'Founder + ChatGPT',
    status: 'Building',
    uniqueness: 7,
    compounding: 8,
    hardToCopy: 6,
    customerValue: 8
  },
  {
    id: 'founder-workflow-moat',
    product: 'Founder Labs',
    moatType: 'Workflow moat',
    description: 'Workflow khép kín: interview → lead → decision → weekly action → report → automation blueprint.',
    evidence: 'Founder Labs Dock có các module vận hành liên kết bằng localStorage.',
    nextAction: 'Tạo report liên kết tự động giữa Moat, Pricing, Content và Weekly Actions.',
    owner: 'Founder + Copilot/Codex',
    status: 'Building',
    uniqueness: 6,
    compounding: 7,
    hardToCopy: 6,
    customerValue: 7
  },
  {
    id: 'distribution-moat',
    product: 'Educational accounting content engine',
    moatType: 'Distribution moat',
    description: 'Biến case mô phỏng, game và red flags thành bài viết, demo script, short video và email follow-up.',
    evidence: 'Content Repurpose Board + Lead Board đã có khung vận hành.',
    nextAction: 'Xuất 10 nội dung đầu tiên từ Case Bank và đo lead/paid signal.',
    owner: 'Founder + Gemini/Claude',
    status: 'Idea',
    uniqueness: 5,
    compounding: 7,
    hardToCopy: 5,
    customerValue: 7
  }
];

const readItems = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : defaultItems;
    return Array.isArray(parsed) ? parsed : defaultItems;
  } catch {
    return defaultItems;
  }
};

const saveItems = (items: MoatItem[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
const scoreMoat = (item: MoatItem) => Math.round(item.uniqueness * 0.25 + item.compounding * 0.25 + item.hardToCopy * 0.25 + item.customerValue * 0.25) * 10;

const emptyItem: Omit<MoatItem, 'id'> = {
  product: 'LedgerFlow product idea',
  moatType: 'Workflow moat',
  description: '',
  evidence: '',
  nextAction: '',
  owner: 'Founder',
  status: 'Idea',
  uniqueness: 5,
  compounding: 5,
  hardToCopy: 5,
  customerValue: 5
};

export default function MoatDefensibilityTracker() {
  const [items, setItems] = useState<MoatItem[]>(readItems);
  const [draft, setDraft] = useState<Omit<MoatItem, 'id'>>(emptyItem);
  const [filter, setFilter] = useState<'All' | MoatType>('All');

  const filtered = filter === 'All' ? items : items.filter((item) => item.moatType === filter);

  const summary = useMemo(() => {
    const scores = items.map(scoreMoat);
    const avg = scores.length ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length) : 0;
    const validated = items.filter((item) => item.status === 'Validated').length;
    const weak = items.filter((item) => item.status === 'Weak').length;
    const verdict = avg >= 75 && weak === 0 ? 'DEFENSIBLE DIRECTION' : avg >= 55 ? 'BUILD MORE PROOF' : 'TOO EASY TO COPY';
    return { avg, validated, weak, verdict };
  }, [items]);

  const addItem = () => {
    if (!draft.description.trim()) return;
    const next = [{ ...draft, id: `moat-${Date.now()}` }, ...items];
    setItems(next);
    saveItems(next);
    setDraft(emptyItem);
  };

  const updateItem = (id: string, patch: Partial<MoatItem>) => {
    const next = items.map((item) => item.id === id ? { ...item, ...patch } : item);
    setItems(next);
    saveItems(next);
  };

  const removeItem = (id: string) => {
    const next = items.filter((item) => item.id !== id);
    setItems(next);
    saveItems(next);
  };

  return (
    <section className="space-y-4 text-slate-100">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Moat / Defensibility</p>
        <h2 className="mt-2 text-xl font-black text-white">Theo dõi lợi thế cạnh tranh</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-slate-400">
          Dùng để kiểm tra sản phẩm có lợi thế tích lũy thật hay chỉ là AI wrapper dễ bị copy. Mỗi moat cần có bằng chứng, next action và điểm khó sao chép.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Moat score</p><p className="mt-2 text-3xl font-black text-white">{summary.avg}/100</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Validated</p><p className="mt-2 text-3xl font-black text-emerald-300">{summary.validated}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Weak</p><p className="mt-2 text-3xl font-black text-rose-300">{summary.weak}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Verdict</p><p className="mt-2 text-sm font-black text-amber-300">{summary.verdict}</p></div>
      </div>

      <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-5">
        <h3 className="text-sm font-black text-white">Thêm moat mới</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input value={draft.product} onChange={(event) => setDraft({ ...draft, product: event.target.value })} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm font-bold text-white" placeholder="Product / module" />
          <select value={draft.moatType} onChange={(event) => setDraft({ ...draft, moatType: event.target.value as MoatType })} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm font-bold text-white">
            <option>Data moat</option><option>Workflow moat</option><option>Community moat</option><option>Distribution moat</option><option>Switching cost</option><option>Brand/trust moat</option>
          </select>
          <textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className="min-h-24 rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm font-bold text-white md:col-span-2" placeholder="Moat này là gì? Vì sao khó copy?" />
          <input value={draft.evidence} onChange={(event) => setDraft({ ...draft, evidence: event.target.value })} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm font-bold text-white" placeholder="Evidence hiện có" />
          <input value={draft.nextAction} onChange={(event) => setDraft({ ...draft, nextAction: event.target.value })} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm font-bold text-white" placeholder="Next action" />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {(['uniqueness', 'compounding', 'hardToCopy', 'customerValue'] as const).map((field) => (
            <label key={field} className="text-[10px] font-black uppercase text-slate-500">{field}<input type="number" min={1} max={10} value={draft[field]} onChange={(event) => setDraft({ ...draft, [field]: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
          ))}
        </div>
        <button onClick={addItem} className="mt-4 rounded-2xl bg-emerald-400 px-4 py-3 text-xs font-black text-slate-950 hover:bg-emerald-300">Thêm moat</button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['All', 'Data moat', 'Workflow moat', 'Community moat', 'Distribution moat', 'Switching cost', 'Brand/trust moat'] as const).map((value) => (
          <button key={value} onClick={() => setFilter(value)} className={`rounded-full border px-3 py-2 text-[11px] font-black ${filter === value ? 'border-emerald-400 bg-emerald-500/10 text-emerald-200' : 'border-slate-800 bg-slate-900 text-slate-400'}`}>{value}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="grid gap-3 md:grid-cols-[1fr_10rem_8rem] md:items-start">
              <div>
                <p className="text-[10px] font-black uppercase text-emerald-300">{item.moatType} • {item.product}</p>
                <h3 className="mt-2 text-sm font-black text-white">{item.description}</h3>
              </div>
              <select value={item.status} onChange={(event) => updateItem(item.id, { status: event.target.value as MoatStatus })} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-bold text-white">
                <option>Idea</option><option>Building</option><option>Validated</option><option>Weak</option>
              </select>
              <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-center text-lg font-black text-emerald-200">{scoreMoat(item)}</p>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="text-[10px] font-black uppercase text-slate-500">Evidence<input value={item.evidence} onChange={(event) => updateItem(item.id, { evidence: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs normal-case text-slate-200" /></label>
              <label className="text-[10px] font-black uppercase text-slate-500">Next action<input value={item.nextAction} onChange={(event) => updateItem(item.id, { nextAction: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs normal-case text-slate-200" /></label>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              {(['uniqueness', 'compounding', 'hardToCopy', 'customerValue'] as const).map((field) => (
                <label key={field} className="text-[10px] font-black uppercase text-slate-500">{field}<input type="number" min={1} max={10} value={item[field]} onChange={(event) => updateItem(item.id, { [field]: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
              ))}
            </div>
            <button onClick={() => removeItem(item.id)} className="mt-4 rounded-xl border border-rose-500/30 px-3 py-2 text-xs font-black text-rose-200 hover:bg-rose-500/10">Xóa moat</button>
          </div>
        ))}
      </div>
    </section>
  );
}
