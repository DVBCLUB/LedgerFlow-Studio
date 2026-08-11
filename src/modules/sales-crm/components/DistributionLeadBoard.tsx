import React, { useMemo, useState } from 'react';
import { Mail, Phone, Calendar, Clock, DollarSign, Activity, FileText, X } from 'lucide-react';
import Drawer from '../../../components/ui/Drawer';

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
    name: 'Doanh nghiệp cần tự động hóa Kế toán VAS',
    persona: 'Kế toán trưởng / CFO',
    source: 'Tư vấn trực tiếp',
    pain: 'Muốn kiểm soát chứng từ và trích xuất dữ liệu OCR hóa đơn tự động.',
    signal: 'Yêu cầu demo đối chiếu chứng từ và báo cáo tài chính VAS.',
    stage: 'demo',
    nextAction: 'Demo giải pháp AI OCR hóa đơn + Bảng soát xét thuế VAS.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'lead-demo-002',
    name: 'Công ty công nghệ triển khai AI Workforce',
    persona: 'CEO / Operations Director',
    source: 'Kênh tư vấn giải pháp',
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
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);
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

      {/* Pipeline View */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-2 scrollbar-thin scrollbar-thumb-white/10 px-1" style={{ scrollbarGutter: 'stable' }}>
        {(Object.entries(stageLabels) as [LeadStage, string][]).map(([stageKey, label]) => {
          const stageLeads = leads.filter(l => l.stage === stageKey);
          
          return (
            <div key={stageKey} className="shrink-0 w-[300px] rounded-2xl border border-border-primary bg-bg-surface/30 flex flex-col max-h-[600px]">
              {/* Column Header */}
              <div className="p-4 border-b border-white/5 bg-slate-900/40 flex items-center justify-between rounded-t-2xl">
                <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider">{label}</h3>
                <span className="bg-slate-800 text-slate-300 text-xs font-bold px-2 py-0.5 rounded-full">{stageLeads.length}</span>
              </div>
              
              {/* Column Cards */}
              <div className="p-3 flex-1 overflow-y-auto space-y-3">
                {stageLeads.map(lead => (
                  <div 
                    key={lead.id} 
                    onClick={() => setSelectedLead(lead)}
                    className="bg-slate-900/80 border border-white/5 rounded-xl p-4 shadow-sm cursor-pointer hover:border-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-bold text-slate-200 line-clamp-2 leading-tight">{lead.name}</h4>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-3">{lead.persona}</p>
                    
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-xs">
                        <Activity className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-slate-400 line-clamp-2">{lead.signal || 'Chưa có tín hiệu'}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {stageLeads.length === 0 && (
                  <div className="h-24 border-2 border-dashed border-white/5 rounded-xl flex items-center justify-center">
                    <p className="text-xs text-slate-600 font-bold">Kéo thả vào đây</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Customer 360 View Drawer */}
      <Drawer
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        title="Customer 360 View"
        width="w-[550px]"
      >
        {selectedLead && (
          <div className="space-y-6 pb-20">
            {/* Header Profile */}
            <div className="flex gap-4 items-start">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-xl font-black text-slate-900 shrink-0 shadow-lg shadow-emerald-500/20">
                {selectedLead.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-black text-white">{selectedLead.name}</h2>
                <div className="flex gap-2 mt-2">
                  <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                    {selectedLead.persona}
                  </span>
                  <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                    {selectedLead.source}
                  </span>
                </div>
              </div>
              
              {/* Stage Changer in Drawer */}
              <select 
                value={selectedLead.stage} 
                onChange={(e) => {
                  updateStage(selectedLead.id, e.target.value as LeadStage);
                  setSelectedLead(leads.find(l => l.id === selectedLead.id)!); // Optimistic or just re-read later
                }} 
                className="rounded-lg border border-border-primary bg-bg-elevated px-3 py-2 text-xs font-black text-emerald-400 outline-none"
              >
                {Object.entries(stageLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-4 gap-2">
              <button className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 border border-white/5 hover:bg-slate-800 transition-colors text-slate-300">
                <Mail className="w-5 h-5 mb-1 text-slate-400" />
                <span className="text-[10px] font-bold">Email</span>
              </button>
              <button className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 border border-white/5 hover:bg-slate-800 transition-colors text-slate-300">
                <Phone className="w-5 h-5 mb-1 text-slate-400" />
                <span className="text-[10px] font-bold">Gọi</span>
              </button>
              <button className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 border border-white/5 hover:bg-slate-800 transition-colors text-slate-300">
                <Calendar className="w-5 h-5 mb-1 text-slate-400" />
                <span className="text-[10px] font-bold">Meeting</span>
              </button>
              <button className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 border border-white/5 hover:bg-slate-800 transition-colors text-slate-300">
                <DollarSign className="w-5 h-5 mb-1 text-slate-400" />
                <span className="text-[10px] font-bold">Báo giá</span>
              </button>
            </div>

            {/* Core Info */}
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" /> Pain Point
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">{selectedLead.pain}</p>
              </div>

              <div className="p-4 rounded-xl bg-amber-950/10 border border-amber-500/10">
                <h3 className="text-xs font-bold text-amber-500/80 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5" /> Tín hiệu Mua hàng (Signal)
                </h3>
                <p className="text-sm text-amber-200/80 leading-relaxed">{selectedLead.signal || 'Chưa ghi nhận tín hiệu rõ ràng.'}</p>
              </div>

              <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Next Action</h3>
                <p className="text-sm text-indigo-200 leading-relaxed">{selectedLead.nextAction || 'Cần lên kế hoạch follow up.'}</p>
              </div>
            </div>

            {/* Activity Feed */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Activity Timeline</h3>
              <div className="space-y-4 pl-2 border-l-2 border-white/10 ml-2">
                <div className="relative pl-6">
                  <div className="absolute w-3 h-3 bg-emerald-500 rounded-full -left-[7px] top-1 border-2 border-[#09090b]"></div>
                  <p className="text-sm text-slate-300">Lead được tạo từ <span className="text-white font-bold">{selectedLead.source}</span></p>
                  <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(selectedLead.updatedAt).toLocaleString('vi-VN')}</p>
                </div>
                {/* Mock historical activity */}
                <div className="relative pl-6">
                  <div className="absolute w-3 h-3 bg-indigo-500 rounded-full -left-[7px] top-1 border-2 border-[#09090b]"></div>
                  <p className="text-sm text-slate-300">Gửi email giới thiệu tự động (AI Marketer)</p>
                  <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" /> 2 ngày trước</p>
                </div>
              </div>
            </div>
            
            <div className="pt-6 border-t border-white/10 flex justify-between">
              <button 
                onClick={() => {
                  removeLead(selectedLead.id);
                  setSelectedLead(null);
                }} 
                className="text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors"
              >
                Xoá khách hàng
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </section>
  );
}
