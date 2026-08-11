import React, { useMemo, useState } from 'react';

type OutputType = 'Code' | 'Document' | 'Content' | 'Business decision' | 'Accounting / audit explanation' | 'Automation workflow';
type Status = 'Draft' | 'Needs review' | 'Approved' | 'Rejected' | 'Rework';

type ReviewItem = {
  id: string;
  title: string;
  outputType: OutputType;
  aiSource: string;
  intendedUse: string;
  factualCheck: number;
  logicCheck: number;
  safetyCheck: number;
  businessFit: number;
  evidence: string;
  risks: string;
  requiredFix: string;
  founderDecision: Status;
};

const STORAGE_KEY = 'ledgerflow-ai-output-quality-review-v1';

const demoItems: ReviewItem[] = [
  {
    id: 'qa-code-release-guard',
    title: 'Kiểm tra patch code trước khi đưa vào build',
    outputType: 'Code',
    aiSource: 'ChatGPT / Codex / Copilot',
    intendedUse: 'Dùng cho module Founder Labs hoặc guard script.',
    factualCheck: 8,
    logicCheck: 8,
    safetyCheck: 9,
    businessFit: 8,
    evidence: 'Đã đọc diff, có guard, không sửa route chính, không đổi storage key.',
    risks: 'AI có thể sửa quá rộng hoặc làm mất lab cũ.',
    requiredFix: 'Chạy release guard, kiểm tra tab Labs và backup key trước khi merge.',
    founderDecision: 'Needs review'
  },
  {
    id: 'qa-accounting-explanation',
    title: 'Giải thích kế toán / kiểm toán đa ngành',
    outputType: 'Accounting / audit explanation',
    aiSource: 'ChatGPT / Claude',
    intendedUse: 'Dùng cho quy trình kiểm soát nội bộ, rà soát chứng từ kế toán doanh nghiệp.',
    factualCheck: 7,
    logicCheck: 8,
    safetyCheck: 8,
    businessFit: 9,
    evidence: 'Có quy trình kiểm soát rủi ro, bút toán hạch toán VAS và điểm soát xét chứng từ.',
    risks: 'Cần kiểm tra văn bản chính sách thuế hiện hành trước khi chốt kỳ kế toán.',
    requiredFix: 'Yêu cầu Trưởng phòng Kế toán duyệt chứng từ trước khi hạch toán chính thức.',
    founderDecision: 'Needs review'
  }
];

const readItems = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : demoItems;
    return Array.isArray(parsed) ? parsed : demoItems;
  } catch {
    return demoItems;
  }
};

const saveItems = (items: ReviewItem[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
const scoreItem = (item: ReviewItem) => Math.round((item.factualCheck * 0.3 + item.logicCheck * 0.25 + item.safetyCheck * 0.25 + item.businessFit * 0.2) * 10);
const verdict = (score: number, status: Status) => {
  if (status === 'Rejected') return 'REJECTED - KHÔNG DÙNG';
  if (score >= 82 && status === 'Approved') return 'SAFE TO USE';
  if (score >= 65) return 'FOUNDER REVIEW NEEDED';
  return 'REWORK BEFORE USE';
};

const emptyItem: Omit<ReviewItem, 'id'> = {
  title: '',
  outputType: 'Document',
  aiSource: 'ChatGPT',
  intendedUse: '',
  factualCheck: 6,
  logicCheck: 6,
  safetyCheck: 6,
  businessFit: 6,
  evidence: '',
  risks: '',
  requiredFix: '',
  founderDecision: 'Draft'
};

export default function AIOutputQualityReview() {
  const [items, setItems] = useState<ReviewItem[]>(readItems);
  const [form, setForm] = useState(emptyItem);

  const summary = useMemo(() => {
    const total = items.length;
    const approved = items.filter((item) => item.founderDecision === 'Approved').length;
    const needsReview = items.filter((item) => item.founderDecision === 'Needs review' || item.founderDecision === 'Rework').length;
    const rejected = items.filter((item) => item.founderDecision === 'Rejected').length;
    const avgScore = total ? Math.round(items.reduce((sum, item) => sum + scoreItem(item), 0) / total) : 0;
    const verdictText = avgScore >= 82 && needsReview === 0 ? 'QUALITY SYSTEM HEALTHY' : avgScore >= 65 ? 'REVIEW BOTTLENECK' : 'AI OUTPUT RISKY';
    return { total, approved, needsReview, rejected, avgScore, verdictText };
  }, [items]);

  const addItem = () => {
    if (!form.title.trim()) return;
    const next = [{ ...form, id: `qa-${Date.now()}` }, ...items];
    setItems(next);
    saveItems(next);
    setForm(emptyItem);
  };

  const updateItem = (id: string, patch: Partial<ReviewItem>) => {
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
      <div className="rounded-3xl border border-border-primary bg-slate-950/80 p-6">
        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">AI Output Quality Review</p>
        <h2 className="mt-2 text-xl font-black text-text-primary">Bảng kiểm chất lượng đầu ra của AI</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-text-secondary">
          Dùng để kiểm tra output do AI tạo ra trước khi đưa vào code, tài liệu, content, automation hoặc quyết định kinh doanh/kế toán. AI có thể soạn, nhưng founder phải duyệt.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-4"><p className="text-[10px] font-black uppercase text-text-tertiary">Avg QA score</p><p className="mt-2 text-3xl font-black text-text-primary">{summary.avgScore}</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-4"><p className="text-[10px] font-black uppercase text-text-tertiary">Total</p><p className="mt-2 text-3xl font-black text-text-primary">{summary.total}</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-4"><p className="text-[10px] font-black uppercase text-text-tertiary">Approved</p><p className="mt-2 text-3xl font-black text-emerald-300">{summary.approved}</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-4"><p className="text-[10px] font-black uppercase text-text-tertiary">Review</p><p className="mt-2 text-3xl font-black text-amber-300">{summary.needsReview}</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-4"><p className="text-[10px] font-black uppercase text-text-tertiary">Verdict</p><p className="mt-2 text-xs font-black text-cyan-200">{summary.verdictText}</p></div>
      </div>

      <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-5">
        <h3 className="text-sm font-black text-text-primary">Thêm output cần review</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Tên output / patch / tài liệu" className="rounded-xl border border-border-primary bg-slate-950 px-3 py-3 text-sm font-bold text-text-primary" />
          <select value={form.outputType} onChange={(event) => setForm({ ...form, outputType: event.target.value as OutputType })} className="rounded-xl border border-border-primary bg-slate-950 px-3 py-3 text-sm font-bold text-text-primary">
            <option>Code</option>
            <option>Document</option>
            <option>Content</option>
            <option>Business decision</option>
            <option>Accounting / audit explanation</option>
            <option>Automation workflow</option>
          </select>
          <input value={form.aiSource} onChange={(event) => setForm({ ...form, aiSource: event.target.value })} placeholder="AI nguồn: ChatGPT / Claude / Gemini..." className="rounded-xl border border-border-primary bg-slate-950 px-3 py-3 text-sm font-bold text-text-primary" />
          <input value={form.intendedUse} onChange={(event) => setForm({ ...form, intendedUse: event.target.value })} placeholder="Dùng vào việc gì?" className="rounded-xl border border-border-primary bg-slate-950 px-3 py-3 text-sm font-bold text-text-primary" />
          <textarea value={form.evidence} onChange={(event) => setForm({ ...form, evidence: event.target.value })} placeholder="Bằng chứng đã kiểm" className="min-h-24 rounded-xl border border-border-primary bg-slate-950 px-3 py-3 text-sm font-bold text-text-primary md:col-span-2" />
          <textarea value={form.risks} onChange={(event) => setForm({ ...form, risks: event.target.value })} placeholder="Rủi ro nếu dùng output này" className="min-h-24 rounded-xl border border-border-primary bg-slate-950 px-3 py-3 text-sm font-bold text-text-primary" />
          <textarea value={form.requiredFix} onChange={(event) => setForm({ ...form, requiredFix: event.target.value })} placeholder="Cần sửa / kiểm thêm" className="min-h-24 rounded-xl border border-border-primary bg-slate-950 px-3 py-3 text-sm font-bold text-text-primary" />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {(['factualCheck', 'logicCheck', 'safetyCheck', 'businessFit'] as const).map((key) => (
            <label key={key} className="text-[10px] font-black uppercase text-text-tertiary">{key}<input type="number" min="0" max="10" value={form[key]} onChange={(event) => setForm({ ...form, [key]: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-border-primary bg-slate-950 px-3 py-2 text-sm text-text-primary" /></label>
          ))}
        </div>
        <button onClick={addItem} className="mt-4 rounded-2xl bg-emerald-400 px-4 py-3 text-xs font-black text-slate-950 hover:bg-emerald-300">Thêm review item</button>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const itemScore = scoreItem(item);
          return (
            <div key={item.id} className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5">
              <div className="grid gap-3 md:grid-cols-[1fr_12rem]">
                <div>
                  <p className="text-[10px] font-black uppercase text-emerald-300">{item.outputType} • {item.aiSource}</p>
                  <h3 className="mt-1 text-sm font-black text-text-primary">{item.title}</h3>
                  <p className="mt-2 text-xs font-semibold leading-6 text-text-secondary">{item.intendedUse}</p>
                </div>
                <div className="rounded-2xl border border-border-primary bg-slate-950/70 p-4 text-center">
                  <p className="text-[10px] font-black uppercase text-text-tertiary">QA score</p>
                  <p className="mt-1 text-3xl font-black text-text-primary">{itemScore}</p>
                  <p className="mt-1 text-[10px] font-black uppercase text-cyan-200">{verdict(itemScore, item.founderDecision)}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-4">
                {(['factualCheck', 'logicCheck', 'safetyCheck', 'businessFit'] as const).map((key) => (
                  <label key={key} className="text-[10px] font-black uppercase text-text-tertiary">{key}<input type="number" min="0" max="10" value={item[key]} onChange={(event) => updateItem(item.id, { [key]: Number(event.target.value) } as Partial<ReviewItem>)} className="mt-1 w-full rounded-xl border border-border-primary bg-slate-950 px-3 py-2 text-sm text-text-primary" /></label>
                ))}
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-border-primary bg-slate-950/60 p-3"><p className="text-[10px] font-black uppercase text-text-tertiary">Evidence</p><p className="mt-2 text-xs font-semibold leading-6 text-text-secondary">{item.evidence}</p></div>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3"><p className="text-[10px] font-black uppercase text-amber-300">Risks</p><p className="mt-2 text-xs font-semibold leading-6 text-amber-100">{item.risks}</p></div>
                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3"><p className="text-[10px] font-black uppercase text-cyan-300">Required fix</p><p className="mt-2 text-xs font-semibold leading-6 text-cyan-100">{item.requiredFix}</p></div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <select value={item.founderDecision} onChange={(event) => updateItem(item.id, { founderDecision: event.target.value as Status })} className="rounded-xl border border-border-primary bg-slate-950 px-3 py-2 text-xs font-bold text-text-primary">
                  <option>Draft</option>
                  <option>Needs review</option>
                  <option>Approved</option>
                  <option>Rejected</option>
                  <option>Rework</option>
                </select>
                <button onClick={() => removeItem(item.id)} className="rounded-xl border border-rose-500/30 px-3 py-2 text-xs font-black text-rose-200 hover:bg-rose-500/10">Xóa</button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
