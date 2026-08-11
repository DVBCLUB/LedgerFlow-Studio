import React, { useMemo, useState } from 'react';

type Status = 'Not started' | 'In progress' | 'Ready' | 'Blocked';
type LaunchMode = 'Internal test' | 'Private beta' | 'Paid pilot' | 'Public launch';

type ChecklistItem = {
  id: string;
  area: string;
  item: string;
  status: Status;
  owner: string;
  evidence: string;
  blocker: string;
};

type Lead = { stage?: string };
type Offer = { status?: string; price?: number; confidence?: number };
type Moat = { status?: string; uniqueness?: number; compounding?: number; hardToCopy?: number; customerValue?: number };
type ContentItem = { status?: string };
type MoRItem = { status?: string };

const STORAGE_KEY = 'ledgerflow-product-launch-checklist-v1';
const LAUNCH_MODE_KEY = 'ledgerflow-product-launch-mode-v1';

const readArray = <T,>(key: string): T[] => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const defaultItems: ChecklistItem[] = [
  { id: 'offer', area: 'Offer', item: 'Có ít nhất 1 offer rõ: buyer persona, pain, value promise, giá, refund rule, pilot limit.', status: 'In progress', owner: 'Founder', evidence: 'Pricing Offer Builder có offer đạt Pilot Offer.', blocker: 'Không biết bán cái gì, bán cho ai, giá bao nhiêu.' },
  { id: 'paid-signal', area: 'Market', item: 'Có paid signal hoặc demo signal từ Lead Board / Persona Interview.', status: 'In progress', owner: 'Founder', evidence: 'Lead có stage Có tín hiệu trả tiền hoặc phỏng vấn có pay score cao.', blocker: 'Chỉ có ý tưởng nội bộ, chưa có tín hiệu thị trường.' },
  { id: 'mor', area: 'Payment', item: 'MoR/payment/refund/privacy/tax note đã đủ cho pilot nhỏ.', status: 'In progress', owner: 'Founder', evidence: 'MoR Readiness score đủ cao, không còn blocker lớn.', blocker: 'Bật thanh toán khi chưa rõ refund, terms, privacy hoặc thuế.' },
  { id: 'content', area: 'Marketing', item: 'Có ít nhất 3 nội dung launch: post, demo script, email hoặc landing section.', status: 'Not started', owner: 'Founder + AI Content', evidence: 'Content Repurpose Board có item ở Review/Published.', blocker: 'Có sản phẩm nhưng không có cách giải thích và phân phối.' },
  { id: 'moat', area: 'Strategy', item: 'Có moat/defensibility angle để tránh chỉ là AI wrapper dễ copy.', status: 'In progress', owner: 'Founder', evidence: 'Moat Tracker có ít nhất 1 moat đang Validating/Proven.', blocker: 'Sản phẩm chỉ là wrapper, không có dữ liệu/workflow/community/distribution riêng.' },
  { id: 'support', area: 'Ops', item: 'Có support flow, refund/contact template và thời gian phản hồi.', status: 'Not started', owner: 'Founder', evidence: 'Có template support và quy trình xử lý khiếu nại.', blocker: 'Bán được nhưng không chăm được khách, dễ refund và mất trust.' },
  { id: 'scope', area: 'Product', item: 'Phạm vi triển khai Pilot: Quy định rõ phạm vi tính năng, điều khoản dịch vụ và bàn giao hạ tầng.', status: 'Ready', owner: 'Founder', evidence: 'Quy định điều khoản dịch vụ, SLA và phạm vi hạ tầng minh bạch.', blocker: 'Khách hàng chưa rõ phạm vi cam kết kỹ thuật hoặc thời gian nghiệm thu.' },
  { id: 'backup', area: 'Data', item: 'Backup dữ liệu Founder Labs trước khi launch/deploy.', status: 'Not started', owner: 'Founder', evidence: 'Đã xuất JSON Backup / Restore.', blocker: 'Clear cache/đổi máy/deploy làm mất dữ liệu research và quyết định.' }
];

const statusScore: Record<Status, number> = {
  'Not started': 0,
  'In progress': 55,
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

export default function ProductLaunchChecklist() {
  const [items, setItems] = useState<ChecklistItem[]>(readItems);
  const [launchMode, setLaunchMode] = useState<LaunchMode>(() => (localStorage.getItem(LAUNCH_MODE_KEY) as LaunchMode) || 'Private beta');

  const signals = useMemo(() => {
    const leads = readArray<Lead>('ledgerflow-distribution-leads-v1');
    const offers = readArray<Offer>('ledgerflow-pricing-offer-builder-v1');
    const moats = readArray<Moat>('ledgerflow-moat-defensibility-tracker-v1');
    const content = readArray<ContentItem>('ledgerflow-content-repurpose-board-v1');
    const mor = readArray<MoRItem>('ledgerflow-mor-readiness-checklist-v1');

    const paidLeads = leads.filter((item) => item.stage === 'Có tín hiệu trả tiền').length;
    const demoLeads = leads.filter((item) => ['Đã demo', 'Có tín hiệu trả tiền'].includes(item.stage || '')).length;
    const pilotOffers = offers.filter((item) => (item.status || '').includes('Pilot') || Number(item.confidence || 0) >= 70 || Number(item.price || 0) > 0).length;
    const activeMoats = moats.filter((item) => ['Validating', 'Proven'].includes(item.status || '') || ((Number(item.uniqueness || 0) + Number(item.compounding || 0) + Number(item.hardToCopy || 0) + Number(item.customerValue || 0)) / 4) >= 6).length;
    const launchContent = content.filter((item) => ['Review', 'Published'].includes(item.status || '')).length;
    const morReady = mor.filter((item) => item.status === 'Ready').length;
    const morBlocked = mor.filter((item) => item.status === 'Blocked').length;

    return { paidLeads, demoLeads, pilotOffers, activeMoats, launchContent, morReady, morBlocked };
  }, [items]);

  const summary = useMemo(() => {
    const checklistScore = Math.round(items.reduce((sum, item) => sum + statusScore[item.status], 0) / Math.max(items.length, 1));
    const marketBonus = Math.min(20, signals.paidLeads * 8 + signals.demoLeads * 3);
    const offerBonus = Math.min(15, signals.pilotOffers * 8);
    const contentBonus = Math.min(10, signals.launchContent * 3);
    const moatBonus = Math.min(10, signals.activeMoats * 5);
    const compliancePenalty = signals.morBlocked * 12;
    const launchScore = Math.max(0, Math.min(100, Math.round(checklistScore * 0.65 + marketBonus + offerBonus + contentBonus + moatBonus - compliancePenalty)));
    const blocked = items.filter((item) => item.status === 'Blocked').length;
    const ready = items.filter((item) => item.status === 'Ready').length;
    const verdict = launchScore >= 80 && blocked === 0
      ? 'READY FOR PAID PILOT'
      : launchScore >= 60
        ? 'PRIVATE BETA / FIX GAPS'
        : 'DO NOT LAUNCH YET';
    return { checklistScore, launchScore, blocked, ready, verdict };
  }, [items, signals]);

  const updateItem = (id: string, patch: Partial<ChecklistItem>) => {
    const next = items.map((item) => item.id === id ? { ...item, ...patch } : item);
    setItems(next);
    saveItems(next);
  };

  const updateLaunchMode = (value: LaunchMode) => {
    setLaunchMode(value);
    localStorage.setItem(LAUNCH_MODE_KEY, value);
  };

  const reset = () => {
    setItems(defaultItems);
    saveItems(defaultItems);
  };

  return (
    <section className="space-y-4 text-slate-100">
      <div className="rounded-3xl border border-border-primary bg-slate-950/80 p-6">
        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Product Launch Checklist</p>
        <h2 className="mt-2 text-xl font-black text-text-primary">Checklist mở bán / pilot sản phẩm</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-text-secondary">
          Gom tín hiệu từ Pricing Offer, MoR Readiness, Moat Tracker, Lead Board và Content Board để quyết định có nên launch hay chưa. Mục tiêu là paid pilot nhỏ, không hứa quá mức.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5"><p className="text-[10px] font-black uppercase text-text-tertiary">Launch score</p><p className="mt-2 text-3xl font-black text-text-primary">{summary.launchScore}/100</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5"><p className="text-[10px] font-black uppercase text-text-tertiary">Ready items</p><p className="mt-2 text-3xl font-black text-emerald-300">{summary.ready}</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5"><p className="text-[10px] font-black uppercase text-text-tertiary">Blocked</p><p className="mt-2 text-3xl font-black text-rose-300">{summary.blocked}</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5"><p className="text-[10px] font-black uppercase text-text-tertiary">Verdict</p><p className="mt-2 text-sm font-black text-amber-300">{summary.verdict}</p></div>
      </div>

      <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <label className="text-[10px] font-black uppercase text-cyan-300">Launch mode
            <select value={launchMode} onChange={(event) => updateLaunchMode(event.target.value as LaunchMode)} className="mt-2 w-full rounded-xl border border-border-primary bg-slate-950 px-3 py-3 text-sm font-bold text-text-primary">
              <option>Internal test</option>
              <option>Private beta</option>
              <option>Paid pilot</option>
              <option>Public launch</option>
            </select>
          </label>
          <button onClick={reset} className="rounded-xl border border-border-secondary px-4 py-3 text-xs font-black text-text-secondary hover:border-cyan-400">Reset checklist</button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-6">
          <div className="rounded-xl border border-border-primary bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase text-text-tertiary">Paid leads</p><p className="text-2xl font-black text-text-primary">{signals.paidLeads}</p></div>
          <div className="rounded-xl border border-border-primary bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase text-text-tertiary">Demo leads</p><p className="text-2xl font-black text-text-primary">{signals.demoLeads}</p></div>
          <div className="rounded-xl border border-border-primary bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase text-text-tertiary">Offers</p><p className="text-2xl font-black text-text-primary">{signals.pilotOffers}</p></div>
          <div className="rounded-xl border border-border-primary bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase text-text-tertiary">Content</p><p className="text-2xl font-black text-text-primary">{signals.launchContent}</p></div>
          <div className="rounded-xl border border-border-primary bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase text-text-tertiary">Moats</p><p className="text-2xl font-black text-text-primary">{signals.activeMoats}</p></div>
          <div className="rounded-xl border border-border-primary bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase text-text-tertiary">MoR blocked</p><p className="text-2xl font-black text-text-primary">{signals.morBlocked}</p></div>
        </div>
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
                <option>In progress</option>
                <option>Ready</option>
                <option>Blocked</option>
              </select>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <label className="text-[10px] font-black uppercase text-text-tertiary">Owner<input value={item.owner} onChange={(event) => updateItem(item.id, { owner: event.target.value })} className="mt-1 w-full rounded-xl border border-border-primary bg-slate-950 px-3 py-2 text-xs normal-case text-slate-200" /></label>
              <label className="text-[10px] font-black uppercase text-text-tertiary md:col-span-2">Evidence<input value={item.evidence} onChange={(event) => updateItem(item.id, { evidence: event.target.value })} className="mt-1 w-full rounded-xl border border-border-primary bg-slate-950 px-3 py-2 text-xs normal-case text-slate-200" /></label>
            </div>
            <p className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs font-semibold leading-6 text-rose-100">Blocker nếu bỏ qua: {item.blocker}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
