import React, { useMemo, useState } from 'react';
import { PERSONA_LAB } from '../../../data/founderStrategicLabs';

type Interview = {
  id: string;
  persona: string;
  respondent: string;
  pain: string;
  currentWorkaround: string;
  paidSignal: string;
  objection: string;
  nextAction: string;
  painScore: number;
  payScore: number;
  evidenceScore: number;
  createdAt: string;
};

const STORAGE_KEY = 'ledgerflow-persona-interviews-v1';

const demoInterviews: Interview[] = [
  {
    id: 'demo-1',
    persona: 'Solo founder làm sản phẩm bằng AI',
    respondent: 'Founder dùng AI để build app học kế toán',
    pain: 'AI làm rất nhanh nhưng dễ lan man, khó kiểm soát scope, tốn tool mà chưa biết có bán được không.',
    currentWorkaround: 'Ghi task thủ công trong note và nhờ nhiều AI làm riêng từng phần.',
    paidSignal: 'Sẵn sàng trả nếu có board quản lý AI work order, budget tool và simulator quyết định GO/HOLD/NO-GO.',
    objection: 'Sợ app quá rộng, khó dùng, giống dashboard trang trí.',
    nextAction: 'Demo Finance Lab + Distribution Lead Board, hỏi giá thử cho template vận hành.',
    painScore: 9,
    payScore: 8,
    evidenceScore: 7,
    createdAt: new Date().toISOString()
  }
];

const loadInterviews = (): Interview[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : demoInterviews;
  } catch {
    return demoInterviews;
  }
};

const saveInterviews = (items: Interview[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

const scoreLabel = (score: number) => {
  if (score >= 8) return 'Mạnh';
  if (score >= 5) return 'Trung bình';
  return 'Yếu';
};

export default function PersonaInterviewLab() {
  const [items, setItems] = useState<Interview[]>(loadInterviews);
  const [form, setForm] = useState({
    persona: PERSONA_LAB[0]?.persona ?? 'Persona mới',
    respondent: '',
    pain: '',
    currentWorkaround: '',
    paidSignal: '',
    objection: '',
    nextAction: '',
    painScore: 5,
    payScore: 5,
    evidenceScore: 5
  });

  const stats = useMemo(() => {
    const total = items.length;
    const avgPain = total ? Math.round(items.reduce((sum, item) => sum + item.painScore, 0) / total) : 0;
    const avgPay = total ? Math.round(items.reduce((sum, item) => sum + item.payScore, 0) / total) : 0;
    const avgEvidence = total ? Math.round(items.reduce((sum, item) => sum + item.evidenceScore, 0) / total) : 0;
    const strongSignals = items.filter((item) => item.painScore >= 8 && item.payScore >= 7 && item.evidenceScore >= 6).length;
    return { total, avgPain, avgPay, avgEvidence, strongSignals };
  }, [items]);

  const addInterview = () => {
    const next: Interview = {
      ...form,
      id: `${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const nextItems = [next, ...items];
    setItems(nextItems);
    saveInterviews(nextItems);
    setForm({ ...form, respondent: '', pain: '', currentWorkaround: '', paidSignal: '', objection: '', nextAction: '' });
  };

  const removeInterview = (id: string) => {
    const nextItems = items.filter((item) => item.id !== id);
    setItems(nextItems);
    saveInterviews(nextItems);
  };

  const resetDemo = () => {
    setItems(demoInterviews);
    saveInterviews(demoInterviews);
  };

  return (
    <section className="space-y-5 text-slate-100">
      <div className="rounded-3xl border border-border-primary bg-slate-950/80 p-6">
        <p className="text-[10px] font-black uppercase tracking-wider text-cyan-300">Persona Interview Lab</p>
        <h2 className="mt-2 text-2xl font-black text-text-primary">Phỏng vấn persona & chấm tín hiệu thị trường</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-text-secondary">
          Dùng để ghi lại phỏng vấn thật hoặc giả lập có kiểm soát. Điểm số chỉ là tín hiệu quyết định build/hold, không thay thế khảo sát thật.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-4"><p className="text-[10px] font-black uppercase text-text-tertiary">Interviews</p><p className="mt-2 text-2xl font-black text-text-primary">{stats.total}</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-4"><p className="text-[10px] font-black uppercase text-text-tertiary">Avg pain</p><p className="mt-2 text-2xl font-black text-text-primary">{stats.avgPain}/10</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-4"><p className="text-[10px] font-black uppercase text-text-tertiary">Avg pay</p><p className="mt-2 text-2xl font-black text-text-primary">{stats.avgPay}/10</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-4"><p className="text-[10px] font-black uppercase text-text-tertiary">Evidence</p><p className="mt-2 text-2xl font-black text-text-primary">{stats.avgEvidence}/10</p></div>
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4"><p className="text-[10px] font-black uppercase text-emerald-300">Strong signals</p><p className="mt-2 text-2xl font-black text-text-primary">{stats.strongSignals}</p></div>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="rounded-3xl border border-border-primary bg-slate-950/70 p-5 xl:col-span-1">
          <h3 className="text-sm font-black text-text-primary">Thêm phỏng vấn</h3>
          <div className="mt-4 space-y-3">
            <select value={form.persona} onChange={(event) => setForm({ ...form, persona: event.target.value })} className="w-full rounded-xl border border-border-primary bg-bg-primary p-3 text-xs font-bold text-slate-100">
              {PERSONA_LAB.map((item) => <option key={item.persona}>{item.persona}</option>)}
            </select>
            {(['respondent', 'pain', 'currentWorkaround', 'paidSignal', 'objection', 'nextAction'] as const).map((field) => (
              <textarea key={field} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} rows={field === 'respondent' ? 1 : 3} className="w-full rounded-xl border border-border-primary bg-bg-primary p-3 text-xs font-semibold text-slate-100 placeholder:text-slate-600" placeholder={field} />
            ))}
            {(['painScore', 'payScore', 'evidenceScore'] as const).map((field) => (
              <label key={field} className="block text-[11px] font-bold text-text-secondary">
                {field}: <span className="text-text-primary">{form[field]}/10</span>
                <input type="range" min="1" max="10" value={form[field]} onChange={(event) => setForm({ ...form, [field]: Number(event.target.value) })} className="mt-2 w-full" />
              </label>
            ))}
            <button onClick={addInterview} className="w-full rounded-xl bg-cyan-400 px-4 py-3 text-xs font-black text-slate-950 hover:bg-cyan-300">Lưu phỏng vấn</button>
            <button onClick={resetDemo} className="w-full rounded-xl border border-border-primary px-4 py-3 text-xs font-black text-text-secondary hover:border-slate-600">Reset demo</button>
          </div>
        </div>

        <div className="space-y-3 xl:col-span-2">
          {items.map((item) => {
            const decisionScore = Math.round((item.painScore * 0.4 + item.payScore * 0.35 + item.evidenceScore * 0.25) * 10);
            const verdict = decisionScore >= 75 ? 'BUILD / DEMO' : decisionScore >= 55 ? 'HOLD / PHỎNG VẤN THÊM' : 'NO-GO TẠM THỜI';
            return (
              <article key={item.id} className="rounded-3xl border border-border-primary bg-slate-950/70 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase text-cyan-300">{item.persona}</p>
                    <h3 className="mt-1 text-sm font-black text-text-primary">{item.respondent || 'Chưa đặt tên người phỏng vấn'}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-text-primary">{decisionScore}</p>
                    <p className="text-[10px] font-black uppercase text-amber-300">{verdict}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-border-primary bg-bg-primary/60 p-3"><p className="text-[10px] font-black uppercase text-text-tertiary">Pain</p><p className="mt-1 text-xs font-semibold leading-5 text-text-secondary">{item.pain}</p></div>
                  <div className="rounded-xl border border-border-primary bg-bg-primary/60 p-3"><p className="text-[10px] font-black uppercase text-text-tertiary">Paid signal</p><p className="mt-1 text-xs font-semibold leading-5 text-text-secondary">{item.paidSignal}</p></div>
                  <div className="rounded-xl border border-border-primary bg-bg-primary/60 p-3"><p className="text-[10px] font-black uppercase text-text-tertiary">Next action</p><p className="mt-1 text-xs font-semibold leading-5 text-text-secondary">{item.nextAction}</p></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-black uppercase">
                  <span className="rounded-full bg-bg-surface px-2 py-1">Pain: {scoreLabel(item.painScore)}</span>
                  <span className="rounded-full bg-bg-surface px-2 py-1">Pay: {scoreLabel(item.payScore)}</span>
                  <span className="rounded-full bg-bg-surface px-2 py-1">Evidence: {scoreLabel(item.evidenceScore)}</span>
                  <button onClick={() => removeInterview(item.id)} className="ml-auto rounded-full border border-rose-500/30 px-2 py-1 text-rose-300 hover:bg-rose-500/10">Xóa</button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
