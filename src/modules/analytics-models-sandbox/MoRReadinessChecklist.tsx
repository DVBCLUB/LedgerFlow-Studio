import React, { useMemo, useState } from 'react';

type Status = 'Not started' | 'Draft' | 'Ready' | 'Blocked';
type PaymentPath = 'Manual invoice/local transfer' | 'Payment processor' | 'Merchant of Record';

type ChecklistItem = {
  id: string;
  area: string;
  item: string;
  status: Status;
  owner: string;
  evidence: string;
  risk: string;
};

const STORAGE_KEY = 'ledgerflow-mor-readiness-checklist-v1';

const defaultItems: ChecklistItem[] = [
  { id: 'refund-policy', area: 'Policy', item: 'Refund policy rõ ràng cho sản phẩm số / template / subscription.', status: 'Draft', owner: 'Founder', evidence: 'Viết rule hoàn tiền 7-14 ngày hoặc no-refund có điều kiện rõ.', risk: 'Không có refund policy dễ tranh chấp và làm giảm trust.' },
  { id: 'terms', area: 'Legal', item: 'Terms of Service: giới hạn trách nhiệm, mục đích học tập/mô phỏng, không thay ERP/kế toán chính thức.', status: 'Draft', owner: 'Founder + AI Legal Draft', evidence: 'Có bản draft terms và disclaimer trong landing/app.', risk: 'Người dùng hiểu nhầm phần mềm là tư vấn pháp lý/kế toán chính thức.' },
  { id: 'privacy', area: 'Legal', item: 'Privacy note: dữ liệu localStorage, backup JSON, dữ liệu người dùng và AI usage.', status: 'Draft', owner: 'Founder + AI Privacy Draft', evidence: 'Có privacy note ngắn, dễ hiểu, đặt trước khi bán.', risk: 'Bán quốc tế/nội địa mà không nói rõ dữ liệu được lưu ở đâu.' },
  { id: 'tax-note', area: 'Compliance', item: 'Tax responsibility note: founder cần kiểm tra VAT/GST/sales tax/TNCN/TNDN với kế toán thật.', status: 'Not started', owner: 'Founder + Accountant', evidence: 'Có checklist hỏi kế toán trước khi mở bán thật.', risk: 'Nhầm payment processor là đã xử lý nghĩa vụ thuế.' },
  { id: 'payment-path', area: 'Payment', item: 'Chọn đường thanh toán: manual transfer, payment processor hoặc Merchant of Record.', status: 'Draft', owner: 'Founder', evidence: 'Có lý do chọn, phí dự kiến, điều kiện dùng/hủy.', risk: 'Bật thanh toán quốc tế quá sớm khi chưa đủ compliance.' },
  { id: 'access-control', area: 'Product', item: 'Sau thanh toán, có cách cấp quyền/download/license rõ ràng.', status: 'Not started', owner: 'Founder + AI Dev', evidence: 'Có flow cấp quyền thủ công hoặc tự động.', risk: 'Khách trả tiền nhưng không nhận được quyền dùng đúng lúc.' },
  { id: 'support-flow', area: 'Ops', item: 'Support/refund/contact flow: email, form, thời gian phản hồi, escalation.', status: 'Not started', owner: 'Founder', evidence: 'Có template support và quy trình xử lý khiếu nại.', risk: 'Bán được nhưng support thủ công làm founder kiệt sức.' },
  { id: 'launch-scope', area: 'Launch', item: 'Scope mở bán nhỏ: pilot/beta/early access, không hứa quá mức.', status: 'Ready', owner: 'Founder', evidence: 'Có giới hạn beta và lời hứa sản phẩm nhỏ.', risk: 'Marketing quá tay khiến scope phình và tăng refund.' }
];

const statusScore: Record<Status, number> = {
  'Not started': 0,
  Draft: 45,
  Ready: 100,
  Blocked: 10
};

const readItems = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : defaultItems;
    return Array.isArray(parsed) ? parsed : defaultItems;
  } catch {
    return defaultItems;
  }
};

const saveItems = (items: ChecklistItem[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

export default function MoRReadinessChecklist() {
  const [items, setItems] = useState<ChecklistItem[]>(readItems);
  const [paymentPath, setPaymentPath] = useState<PaymentPath>(() => localStorage.getItem('ledgerflow-payment-path-v1') as PaymentPath || 'Manual invoice/local transfer');

  const summary = useMemo(() => {
    const score = Math.round(items.reduce((sum, item) => sum + statusScore[item.status], 0) / Math.max(items.length, 1));
    const ready = items.filter((item) => item.status === 'Ready').length;
    const blocked = items.filter((item) => item.status === 'Blocked').length;
    const notStarted = items.filter((item) => item.status === 'Not started').length;
    const verdict = score >= 80 && blocked === 0 ? 'READY FOR SMALL PILOT' : score >= 55 ? 'BETA ONLY / FIX CHECKLIST' : 'NOT READY TO SELL';
    return { score, ready, blocked, notStarted, verdict };
  }, [items]);

  const updateItem = (id: string, patch: Partial<ChecklistItem>) => {
    const next = items.map((item) => item.id === id ? { ...item, ...patch } : item);
    setItems(next);
    saveItems(next);
  };

  const reset = () => {
    setItems(defaultItems);
    saveItems(defaultItems);
  };

  const updatePaymentPath = (value: PaymentPath) => {
    setPaymentPath(value);
    localStorage.setItem('ledgerflow-payment-path-v1', value);
  };

  return (
    <section className="space-y-4 text-slate-100">
      <div className="rounded-3xl border border-border-primary bg-slate-950/80 p-6">
        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">MoR Readiness</p>
        <h2 className="mt-2 text-xl font-black text-text-primary">Checklist sẵn sàng bán sản phẩm số</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-text-secondary">
          Kiểm tra refund, terms, privacy, tax note, payment path và support trước khi bật thanh toán. Đây là checklist vận hành, không phải tư vấn pháp lý/thuế chính thức.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5"><p className="text-[10px] font-black uppercase text-text-tertiary">Readiness score</p><p className="mt-2 text-3xl font-black text-text-primary">{summary.score}/100</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5"><p className="text-[10px] font-black uppercase text-text-tertiary">Ready</p><p className="mt-2 text-3xl font-black text-emerald-300">{summary.ready}</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5"><p className="text-[10px] font-black uppercase text-text-tertiary">Blocked</p><p className="mt-2 text-3xl font-black text-rose-300">{summary.blocked}</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5"><p className="text-[10px] font-black uppercase text-text-tertiary">Verdict</p><p className="mt-2 text-sm font-black text-amber-300">{summary.verdict}</p></div>
      </div>

      <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label className="text-[10px] font-black uppercase text-cyan-300">Payment path</label>
            <select value={paymentPath} onChange={(event) => updatePaymentPath(event.target.value as PaymentPath)} className="mt-2 w-full rounded-xl border border-border-primary bg-slate-950 px-3 py-3 text-sm font-bold text-text-primary">
              <option>Manual invoice/local transfer</option>
              <option>Payment processor</option>
              <option>Merchant of Record</option>
            </select>
          </div>
          <button onClick={reset} className="rounded-xl border border-border-secondary px-4 py-3 text-xs font-black text-text-secondary hover:border-cyan-400">Reset checklist</button>
        </div>
        <p className="mt-3 text-xs font-semibold leading-6 text-text-secondary">
          Gợi ý: nếu chưa có paid signal rõ, dùng manual invoice/local transfer cho pilot nhỏ. Nếu bán quốc tế thật, cân nhắc Merchant of Record để giảm gánh compliance nhưng vẫn cần đọc phí/chính sách.
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5">
            <div className="grid gap-3 md:grid-cols-[1fr_11rem]">
              <div>
                <p className="text-[10px] font-black uppercase text-emerald-300">{item.area}</p>
                <h3 className="mt-1 text-sm font-black text-text-primary">{item.item}</h3>
              </div>
              <select value={item.status} onChange={(event) => updateItem(item.id, { status: event.target.value as Status })} className="rounded-xl border border-border-primary bg-slate-950 px-3 py-2 text-xs font-bold text-text-primary">
                <option>Not started</option>
                <option>Draft</option>
                <option>Ready</option>
                <option>Blocked</option>
              </select>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <label className="text-[10px] font-black uppercase text-text-tertiary">Owner<input value={item.owner} onChange={(event) => updateItem(item.id, { owner: event.target.value })} className="mt-1 w-full rounded-xl border border-border-primary bg-slate-950 px-3 py-2 text-xs normal-case text-slate-200" /></label>
              <label className="text-[10px] font-black uppercase text-text-tertiary md:col-span-2">Evidence<input value={item.evidence} onChange={(event) => updateItem(item.id, { evidence: event.target.value })} className="mt-1 w-full rounded-xl border border-border-primary bg-slate-950 px-3 py-2 text-xs normal-case text-slate-200" /></label>
            </div>
            <p className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs font-semibold leading-6 text-amber-100">Rủi ro nếu bỏ qua: {item.risk}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
