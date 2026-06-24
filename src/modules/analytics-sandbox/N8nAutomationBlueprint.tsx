import React, { useMemo, useState } from 'react';

type Status = 'Idea' | 'Draft' | 'Ready' | 'Paused';
type Risk = 'Low' | 'Medium' | 'High';

type AutomationFlow = {
  id: string;
  name: string;
  trigger: string;
  steps: string;
  humanApproval: string;
  output: string;
  antiSpamRule: string;
  risk: Risk;
  status: Status;
};

const STORAGE_KEY = 'ledgerflow-n8n-automation-blueprint-v1';

const defaultFlows: AutomationFlow[] = [
  {
    id: 'content-to-draft',
    name: 'Content Board → Draft bài viết',
    trigger: 'Khi Content Repurpose có item trạng thái Draft/Review',
    steps: 'Lấy hook + outline → AI viết draft → lưu vào Google Doc/Notion/Markdown → gửi founder duyệt.',
    humanApproval: 'Founder phải duyệt trước khi publish.',
    output: 'Bản nháp post/email/video script có CTA rõ.',
    antiSpamRule: 'Không tự đăng. Không gửi DM hàng loạt. Tối đa 1–2 nội dung/ngày/kênh.',
    risk: 'Medium',
    status: 'Draft'
  },
  {
    id: 'lead-follow-up',
    name: 'Lead Board → Follow-up nhắc lịch demo',
    trigger: 'Lead stage = Đã liên hệ hoặc Đã demo',
    steps: 'Tạo email follow-up cá nhân hóa → kiểm tra paid signal/objection → founder xem trước → gửi thủ công hoặc bán tự động.',
    humanApproval: 'Founder duyệt nội dung và người nhận trước khi gửi.',
    output: 'Email follow-up ngắn, đúng pain point, có next action.',
    antiSpamRule: 'Không gửi quá 1 follow-up/lead/3 ngày. Có lý do liên hệ thật.',
    risk: 'High',
    status: 'Draft'
  },
  {
    id: 'weekly-report',
    name: 'Weekly Actions → Báo cáo tuần',
    trigger: 'Cuối tuần hoặc khi Weekly Actions có Done/Blocked',
    steps: 'Tổng hợp Done/Doing/Blocked → tạo summary → gợi ý việc tuần sau → lưu vào One-Page Report.',
    humanApproval: 'Founder xác nhận việc nào chuyển tuần sau.',
    output: 'Báo cáo tuần 1 trang.',
    antiSpamRule: 'Chỉ tạo nội bộ, không gửi ra ngoài.',
    risk: 'Low',
    status: 'Ready'
  },
  {
    id: 'tool-cancel-reminder',
    name: 'Tool Budget → Nhắc hủy/review tool',
    trigger: 'Tool có decision = Review hoặc Cancel',
    steps: 'Tạo checklist backup dữ liệu tool → nhắc ngày review/cancel → cập nhật Finance Lab burn.',
    humanApproval: 'Founder tự bấm hủy trong tool thật, automation chỉ nhắc.',
    output: 'Danh sách tool cần xử lý và tiền tiết kiệm dự kiến.',
    antiSpamRule: 'Không thao tác billing tự động. Không hủy tài khoản tự động.',
    risk: 'Medium',
    status: 'Ready'
  }
];

const readFlows = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : defaultFlows;
    return Array.isArray(parsed) ? parsed : defaultFlows;
  } catch {
    return defaultFlows;
  }
};

const saveFlows = (flows: AutomationFlow[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(flows));

export default function N8nAutomationBlueprint() {
  const [flows, setFlows] = useState<AutomationFlow[]>(readFlows);
  const [draft, setDraft] = useState<Omit<AutomationFlow, 'id'>>({
    name: '',
    trigger: '',
    steps: '',
    humanApproval: 'Founder duyệt trước khi chạy thật.',
    output: '',
    antiSpamRule: 'Không tự gửi hàng loạt. Luôn có người duyệt.',
    risk: 'Medium',
    status: 'Idea'
  });

  const summary = useMemo(() => {
    const ready = flows.filter((flow) => flow.status === 'Ready').length;
    const highRisk = flows.filter((flow) => flow.risk === 'High').length;
    const missingApproval = flows.filter((flow) => !flow.humanApproval.trim()).length;
    const paused = flows.filter((flow) => flow.status === 'Paused').length;
    const guardScore = Math.max(0, Math.min(100, 100 - highRisk * 12 - missingApproval * 25 - paused * 5));
    const verdict = guardScore >= 80 ? 'SAFE TO PILOT' : guardScore >= 55 ? 'FOUNDER REVIEW NEEDED' : 'DO NOT AUTOMATE YET';
    return { ready, highRisk, missingApproval, paused, guardScore, verdict };
  }, [flows]);

  const updateFlow = (id: string, patch: Partial<AutomationFlow>) => {
    const next = flows.map((flow) => flow.id === id ? { ...flow, ...patch } : flow);
    setFlows(next);
    saveFlows(next);
  };

  const addFlow = () => {
    if (!draft.name.trim()) return;
    const next = [{ ...draft, id: crypto.randomUUID() }, ...flows];
    setFlows(next);
    saveFlows(next);
    setDraft({ name: '', trigger: '', steps: '', humanApproval: 'Founder duyệt trước khi chạy thật.', output: '', antiSpamRule: 'Không tự gửi hàng loạt. Luôn có người duyệt.', risk: 'Medium', status: 'Idea' });
  };

  const removeFlow = (id: string) => {
    const next = flows.filter((flow) => flow.id !== id);
    setFlows(next);
    saveFlows(next);
  };

  const reset = () => {
    setFlows(defaultFlows);
    saveFlows(defaultFlows);
  };

  return (
    <section className="space-y-4 text-slate-100">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Automation Blueprint</p>
        <h2 className="mt-2 text-xl font-black text-white">n8n Automation + Anti-Spam Guard</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-slate-400">
          Thiết kế workflow tự động hóa cho marketing, lead, báo cáo tuần và tool budget. Nguyên tắc: AI chỉ soạn/nhắc/tổng hợp, founder duyệt trước khi gửi hoặc publish.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Flows</p><p className="mt-2 text-3xl font-black text-white">{flows.length}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Ready</p><p className="mt-2 text-3xl font-black text-emerald-300">{summary.ready}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">High risk</p><p className="mt-2 text-3xl font-black text-rose-300">{summary.highRisk}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Guard score</p><p className="mt-2 text-3xl font-black text-cyan-300">{summary.guardScore}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Verdict</p><p className="mt-2 text-sm font-black text-amber-300">{summary.verdict}</p></div>
      </div>

      <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-5">
        <h3 className="text-sm font-black text-white">Thêm automation flow</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Tên flow" className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm font-bold text-white" />
          <input value={draft.trigger} onChange={(event) => setDraft({ ...draft, trigger: event.target.value })} placeholder="Trigger" className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm font-bold text-white" />
          <textarea value={draft.steps} onChange={(event) => setDraft({ ...draft, steps: event.target.value })} placeholder="Các bước workflow" className="min-h-24 rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm font-bold text-white" />
          <textarea value={draft.output} onChange={(event) => setDraft({ ...draft, output: event.target.value })} placeholder="Output mong muốn" className="min-h-24 rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm font-bold text-white" />
          <input value={draft.humanApproval} onChange={(event) => setDraft({ ...draft, humanApproval: event.target.value })} placeholder="Founder approval" className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm font-bold text-white" />
          <input value={draft.antiSpamRule} onChange={(event) => setDraft({ ...draft, antiSpamRule: event.target.value })} placeholder="Anti-spam rule" className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm font-bold text-white" />
          <select value={draft.risk} onChange={(event) => setDraft({ ...draft, risk: event.target.value as Risk })} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm font-bold text-white"><option>Low</option><option>Medium</option><option>High</option></select>
          <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as Status })} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm font-bold text-white"><option>Idea</option><option>Draft</option><option>Ready</option><option>Paused</option></select>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={addFlow} className="rounded-xl bg-emerald-400 px-4 py-3 text-xs font-black text-slate-950 hover:bg-emerald-300">Thêm flow</button>
          <button onClick={reset} className="rounded-xl border border-slate-700 px-4 py-3 text-xs font-black text-slate-300 hover:border-cyan-400">Reset mẫu CT1</button>
        </div>
      </div>

      <div className="space-y-3">
        {flows.map((flow) => (
          <div key={flow.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="grid gap-3 md:grid-cols-[1fr_9rem_9rem]">
              <div>
                <h3 className="text-sm font-black text-white">{flow.name}</h3>
                <p className="mt-2 text-xs font-semibold leading-6 text-slate-400">Trigger: {flow.trigger}</p>
              </div>
              <select value={flow.risk} onChange={(event) => updateFlow(flow.id, { risk: event.target.value as Risk })} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-bold text-white"><option>Low</option><option>Medium</option><option>High</option></select>
              <select value={flow.status} onChange={(event) => updateFlow(flow.id, { status: event.target.value as Status })} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-bold text-white"><option>Idea</option><option>Draft</option><option>Ready</option><option>Paused</option></select>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase text-slate-500">Workflow steps</p><p className="mt-2 text-xs font-semibold leading-6 text-slate-300">{flow.steps}</p></div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase text-slate-500">Output</p><p className="mt-2 text-xs font-semibold leading-6 text-slate-300">{flow.output}</p></div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3"><p className="text-[10px] font-black uppercase text-emerald-300">Human approval</p><p className="mt-2 text-xs font-semibold leading-6 text-emerald-50">{flow.humanApproval}</p></div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3"><p className="text-[10px] font-black uppercase text-amber-300">Anti-spam guard</p><p className="mt-2 text-xs font-semibold leading-6 text-amber-50">{flow.antiSpamRule}</p></div>
            </div>
            <button onClick={() => removeFlow(flow.id)} className="mt-4 rounded-xl border border-rose-500/30 px-3 py-2 text-xs font-black text-rose-200 hover:bg-rose-500/10">Xóa flow</button>
          </div>
        ))}
      </div>
    </section>
  );
}
