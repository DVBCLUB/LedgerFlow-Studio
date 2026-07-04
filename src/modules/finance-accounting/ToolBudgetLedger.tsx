import React, { useMemo, useState } from 'react';

type ToolCost = {
  id: string;
  month: string;
  tool: string;
  category: 'AI' | 'Hosting' | 'Design' | 'Marketing' | 'Dev' | 'Other';
  amount: number;
  purpose: string;
  keepDecision: 'Keep' | 'Review' | 'Cancel';
};

const storageKey = 'ledgerflow-tool-budget-ledger-v1';

const demoCosts: ToolCost[] = [
  { id: 'tb-1', month: '2026-06', tool: 'AI coding assistant', category: 'AI', amount: 500000, purpose: 'Code review, refactor nhỏ, tạo component lab.', keepDecision: 'Keep' },
  { id: 'tb-2', month: '2026-06', tool: 'Hosting static app', category: 'Hosting', amount: 0, purpose: 'Deploy thử nghiệm bản web tĩnh.', keepDecision: 'Keep' },
  { id: 'tb-3', month: '2026-06', tool: 'Marketing test budget', category: 'Marketing', amount: 300000, purpose: 'Test demo-led selling và phản hồi cộng đồng.', keepDecision: 'Review' }
];

const readCosts = () => {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as ToolCost[]) : demoCosts;
  } catch {
    return demoCosts;
  }
};

const writeCosts = (items: ToolCost[]) => localStorage.setItem(storageKey, JSON.stringify(items));

const money = (value: number) => value.toLocaleString('vi-VN') + ' đ';

export default function ToolBudgetLedger() {
  const [costs, setCosts] = useState<ToolCost[]>(readCosts);
  const [form, setForm] = useState<Omit<ToolCost, 'id'>>({
    month: new Date().toISOString().slice(0, 7),
    tool: '',
    category: 'AI',
    amount: 0,
    purpose: '',
    keepDecision: 'Review'
  });

  const stats = useMemo(() => {
    const monthlyBurn = costs.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const keep = costs.filter((item) => item.keepDecision === 'Keep').length;
    const review = costs.filter((item) => item.keepDecision === 'Review').length;
    const cancel = costs.filter((item) => item.keepDecision === 'Cancel').length;
    const aiSpend = costs.filter((item) => item.category === 'AI').reduce((sum, item) => sum + item.amount, 0);
    return { monthlyBurn, keep, review, cancel, aiSpend };
  }, [costs]);

  const addCost = () => {
    if (!form.tool.trim()) return;
    const next = [{ ...form, id: `tool-${Date.now()}`, amount: Number(form.amount || 0) }, ...costs];
    setCosts(next);
    writeCosts(next);
    setForm({ ...form, tool: '', amount: 0, purpose: '', keepDecision: 'Review' });
  };

  const updateDecision = (id: string, keepDecision: ToolCost['keepDecision']) => {
    const next = costs.map((item) => (item.id === id ? { ...item, keepDecision } : item));
    setCosts(next);
    writeCosts(next);
  };

  const removeCost = (id: string) => {
    const next = costs.filter((item) => item.id !== id);
    setCosts(next);
    writeCosts(next);
  };

  const resetDemo = () => {
    setCosts(demoCosts);
    writeCosts(demoCosts);
  };

  return (
    <section className="space-y-4 text-text-primary">
      <div className="rounded-3xl border border-border-primary bg-bg-primary p-6">
        <p className="text-[10px] font-bold uppercase tracking-wider text-success">Tool Budget Ledger</p>
        <h2 className="mt-2 text-xl font-bold text-text-primary">Sổ ngân sách công cụ</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-text-secondary">
          Theo dõi tiền AI, hosting, thiết kế, marketing và dev tool theo tháng. Mục tiêu là biết tool nào nên giữ, cần review hoặc nên hủy trước khi burn rate phình ra.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <div className="rounded-2xl border border-border-primary bg-bg-surface p-4"><p className="text-[10px] font-bold uppercase text-text-muted">Monthly burn</p><p className="mt-2 text-lg font-bold text-text-primary">{money(stats.monthlyBurn)}</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface p-4"><p className="text-[10px] font-bold uppercase text-text-muted">AI spend</p><p className="mt-2 text-lg font-bold text-info">{money(stats.aiSpend)}</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface p-4"><p className="text-[10px] font-bold uppercase text-text-muted">Keep</p><p className="mt-2 text-lg font-bold text-success">{stats.keep}</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface p-4"><p className="text-[10px] font-bold uppercase text-text-muted">Review</p><p className="mt-2 text-lg font-bold text-warning">{stats.review}</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface p-4"><p className="text-[10px] font-bold uppercase text-text-muted">Cancel</p><p className="mt-2 text-lg font-bold text-error">{stats.cancel}</p></div>
      </div>

      <div className="rounded-3xl border border-border-primary bg-bg-primary p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <input value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} type="month" className="rounded-xl border border-border-primary bg-bg-surface p-3 text-sm font-bold text-text-primary outline-none" />
          <input value={form.tool} onChange={(e) => setForm({ ...form, tool: e.target.value })} placeholder="Tên tool" className="rounded-xl border border-border-primary bg-bg-surface p-3 text-sm font-bold text-text-primary outline-none" />
          <input value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} type="number" placeholder="Chi phí" className="rounded-xl border border-border-primary bg-bg-surface p-3 text-sm font-bold text-text-primary outline-none" />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ToolCost['category'] })} className="rounded-xl border border-border-primary bg-bg-surface p-3 text-sm font-bold text-text-primary outline-none">
            {['AI', 'Hosting', 'Design', 'Marketing', 'Dev', 'Other'].map((item) => <option key={item}>{item}</option>)}
          </select>
          <select value={form.keepDecision} onChange={(e) => setForm({ ...form, keepDecision: e.target.value as ToolCost['keepDecision'] })} className="rounded-xl border border-border-primary bg-bg-surface p-3 text-sm font-bold text-text-primary outline-none">
            {['Keep', 'Review', 'Cancel'].map((item) => <option key={item}>{item}</option>)}
          </select>
          <input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="Mục đích dùng" className="rounded-xl border border-border-primary bg-bg-surface p-3 text-sm font-bold text-text-primary outline-none" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={addCost} className="rounded-xl bg-emerald-400 px-4 py-2 text-xs font-bold text-slate-950">Thêm chi phí</button>
          <button onClick={resetDemo} className="rounded-xl border border-border-secondary px-4 py-2 text-xs font-bold text-text-secondary">Reset demo</button>
        </div>
      </div>

      <div className="space-y-3">
        {costs.map((item) => (
          <div key={item.id} className="rounded-2xl border border-border-primary bg-bg-surface p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-bold text-text-primary">{item.tool}</p>
                <p className="mt-1 text-xs font-semibold text-text-secondary">{item.month} • {item.category} • {money(item.amount)}</p>
                <p className="mt-2 text-xs font-semibold leading-6 text-text-secondary">{item.purpose}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['Keep', 'Review', 'Cancel'] as ToolCost['keepDecision'][]).map((decision) => (
                  <button key={decision} onClick={() => updateDecision(item.id, decision)} className={`rounded-lg border px-3 py-1 text-[10px] font-bold ${item.keepDecision === decision ? 'border-emerald-400 bg-success/10 text-emerald-100' : 'border-border-secondary text-text-secondary'}`}>{decision}</button>
                ))}
                <button onClick={() => removeCost(item.id)} className="rounded-lg border border-rose-800 px-3 py-1 text-[10px] font-bold text-error">Xóa</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
