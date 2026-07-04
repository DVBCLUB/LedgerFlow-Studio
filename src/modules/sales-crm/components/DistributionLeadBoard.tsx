import React, { useMemo, useState } from 'react';

type LeadStage = 'new' | 'contacted' | 'demo' | 'validated' | 'rejected';

type LeadRecord = {
  id: string;
  name: string;
  persona: string;
  source: string;
  pain: string;
  signal: string;
  stage: LeadStage;
  nextAction: string;
  updatedAt: string;
};

const STORAGE_KEY = 'ledgerflow-distribution-lead-board-v1';

const stageLabels: Record<LeadStage, string> = {
  new: 'Mới',
  contacted: 'Đã liên hệ',
  demo: 'Đã demo',
  validated: 'Có tín hiệu trả tiền',
  rejected: 'Loại / chưa phù hợp'
};

const defaultLeads: LeadRecord[] = [
  {
    id: 'lead-demo-001',
    name: 'Kế toán viên cần case mô phỏng',
    persona: 'Kế toán viên đa ngành',
    source: 'Community research',
    pain: 'Muốn checklist chứng từ theo tình huống thật, không chỉ lý thuyết.',
    signal: 'Hỏi demo và hỏi có mẫu báo cáo tải về không.',
    stage: 'demo',
    nextAction: 'Demo Score lab + Case mô phỏng, hỏi willingness-to-pay.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'lead-demo-002',
    name: 'Solo founder dùng AI build app',
    persona: 'Solo founder',
    source: 'Content từ case mô phỏng',
    pain: 'AI làm lan man, cần work order và decision log.',
    signal: 'Xin template giao việc cho AI agent.',
    stage: 'validated',
    nextAction: 'Gửi prototype Founder OS và hỏi mức giá chấp nhận.',
    updatedAt: new Date().toISOString()
  }
];

const readLeads = (): LeadRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultLeads;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : defaultLeads;
  } catch {
    return defaultLeads;
  }
};

export default function DistributionLeadBoard() {
  const [leads, setLeads] = useState<LeadRecord[]>(readLeads);
  const [form, setForm] = useState({
    name: '',
    persona: 'Kế toán viên đa ngành',
    source: 'Community research',
    pain: '',
    signal: '',
    stage: 'new' as LeadStage,
    nextAction: ''
  });

  const saveLeads = (next: LeadRecord[]) => {
    setLeads(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const metrics = useMemo(() => {
    const total = leads.length;
    const validated = leads.filter((lead) => lead.stage === 'validated').length;
    const demo = leads.filter((lead) => lead.stage === 'demo').length;
    const rejected = leads.filter((lead) => lead.stage === 'rejected').length;
    const validationRate = total ? Math.round((validated / total) * 100) : 0;
    return { total, validated, demo, rejected, validationRate };
  }, [leads]);

  const addLead = () => {
    if (!form.name.trim() || !form.pain.trim()) return;
    const nextLead: LeadRecord = {
      id: `lead-${Date.now()}`,
      ...form,
      updatedAt: new Date().toISOString()
    };
    saveLeads([nextLead, ...leads]);
    setForm({ name: '', persona: 'Kế toán viên đa ngành', source: 'Community research', pain: '', signal: '', stage: 'new', nextAction: '' });
  };

  const updateStage = (id: string, stage: LeadStage) => {
    saveLeads(leads.map((lead) => (lead.id === id ? { ...lead, stage, updatedAt: new Date().toISOString() } : lead)));
  };

  const removeLead = (id: string) => {
    saveLeads(leads.filter((lead) => lead.id !== id));
  };

  const resetDemo = () => saveLeads(defaultLeads);

  return (
    <section className="space-y-5 text-slate-100">
      <div className="rounded-3xl border border-border-primary bg-slate-950/80 p-6">
        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Distribution Engine</p>
        <h2 className="mt-2 text-xl font-black text-text-primary">Lead Board thương mại hóa</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-text-secondary">
          Bảng này dùng để ghi lead, pain point, tín hiệu trả tiền và next action. Đây là công cụ nghiên cứu/phân phối, không tự động spam và không thay CRM chính thức.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-4"><p className="text-[10px] font-black uppercase text-text-tertiary">Total leads</p><p className="mt-2 text-2xl font-black text-text-primary">{metrics.total}</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-4"><p className="text-[10px] font-black uppercase text-text-tertiary">Demo</p><p className="mt-2 text-2xl font-black text-cyan-200">{metrics.demo}</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-4"><p className="text-[10px] font-black uppercase text-text-tertiary">Validated</p><p className="mt-2 text-2xl font-black text-emerald-200">{metrics.validated}</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-4"><p className="text-[10px] font-black uppercase text-text-tertiary">Rejected</p><p className="mt-2 text-2xl font-black text-rose-200">{metrics.rejected}</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-4"><p className="text-[10px] font-black uppercase text-text-tertiary">Validation rate</p><p className="mt-2 text-2xl font-black text-amber-200">{metrics.validationRate}%</p></div>
      </div>

      <div className="rounded-3xl border border-border-primary bg-slate-950/70 p-5">
        <p className="text-xs font-black uppercase tracking-wider text-emerald-300">Thêm lead / feedback</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Tên lead hoặc mô tả ngắn" className="rounded-xl border border-border-primary bg-bg-primary px-3 py-2 text-xs font-semibold text-text-primary outline-none focus:border-emerald-400" />
          <select value={form.persona} onChange={(e) => setForm({ ...form, persona: e.target.value })} className="rounded-xl border border-border-primary bg-bg-primary px-3 py-2 text-xs font-semibold text-text-primary outline-none focus:border-emerald-400">
            <option>Kế toán viên đa ngành</option>
            <option>Chủ doanh nghiệp nhỏ</option>
            <option>Solo founder</option>
            <option>Người học qua game giáo dục</option>
          </select>
          <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="rounded-xl border border-border-primary bg-bg-primary px-3 py-2 text-xs font-semibold text-text-primary outline-none focus:border-emerald-400">
            <option>Community research</option>
            <option>Content từ case mô phỏng</option>
            <option>Demo-led selling</option>
            <option>Referral</option>
            <option>Manual outreach</option>
          </select>
          <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value as LeadStage })} className="rounded-xl border border-border-primary bg-bg-primary px-3 py-2 text-xs font-semibold text-text-primary outline-none focus:border-emerald-400">
            {Object.entries(stageLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
          <textarea value={form.pain} onChange={(e) => setForm({ ...form, pain: e.target.value })} placeholder="Pain point / nhu cầu thật" className="min-h-[84px] rounded-xl border border-border-primary bg-bg-primary px-3 py-2 text-xs font-semibold text-text-primary outline-none focus:border-emerald-400" />
          <textarea value={form.signal} onChange={(e) => setForm({ ...form, signal: e.target.value })} placeholder="Tín hiệu: hỏi giá, xin demo, phản đối, muốn template..." className="min-h-[84px] rounded-xl border border-border-primary bg-bg-primary px-3 py-2 text-xs font-semibold text-text-primary outline-none focus:border-emerald-400" />
          <input value={form.nextAction} onChange={(e) => setForm({ ...form, nextAction: e.target.value })} placeholder="Next action" className="rounded-xl border border-border-primary bg-bg-primary px-3 py-2 text-xs font-semibold text-text-primary outline-none focus:border-emerald-400 md:col-span-2" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={addLead} className="rounded-xl bg-emerald-400 px-4 py-2 text-xs font-black text-slate-950 hover:bg-emerald-300">Thêm lead</button>
          <button onClick={resetDemo} className="rounded-xl border border-border-secondary px-4 py-2 text-xs font-black text-text-secondary hover:text-text-primary">Reset demo</button>
        </div>
      </div>

      <div className="grid gap-3">
        {leads.map((lead) => (
          <div key={lead.id} className="rounded-2xl border border-border-primary bg-slate-950/70 p-4">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
              <div>
                <p className="text-sm font-black text-text-primary">{lead.name}</p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-emerald-300">{lead.persona} • {lead.source}</p>
              </div>
              <select value={lead.stage} onChange={(e) => updateStage(lead.id, e.target.value as LeadStage)} className="rounded-xl border border-border-primary bg-bg-primary px-3 py-2 text-xs font-black text-text-primary outline-none">
                {Object.entries(stageLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div><p className="text-[10px] font-black uppercase text-text-tertiary">Pain</p><p className="mt-1 text-xs font-semibold leading-6 text-text-secondary">{lead.pain}</p></div>
              <div><p className="text-[10px] font-black uppercase text-text-tertiary">Signal</p><p className="mt-1 text-xs font-semibold leading-6 text-text-secondary">{lead.signal || 'Chưa ghi'}</p></div>
              <div><p className="text-[10px] font-black uppercase text-text-tertiary">Next action</p><p className="mt-1 text-xs font-semibold leading-6 text-text-secondary">{lead.nextAction || 'Chưa có'}</p></div>
            </div>
            <button onClick={() => removeLead(lead.id)} className="mt-3 text-[11px] font-bold text-rose-300 hover:text-rose-200">Xóa lead</button>
          </div>
        ))}
      </div>
    </section>
  );
}
