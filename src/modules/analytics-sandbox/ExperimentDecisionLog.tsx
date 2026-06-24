import React, { useEffect, useMemo, useState } from 'react';

type DecisionStatus = 'BUILD' | 'HOLD' | 'KILL';
type SignalSource = 'Persona Interview' | 'Distribution Lead' | 'Finance Lab' | 'Founder Judgment' | 'Market Observation';

type DecisionRecord = {
  id: string;
  title: string;
  source: SignalSource;
  evidence: string;
  decision: DecisionStatus;
  owner: string;
  nextAction: string;
  reviewDate: string;
  confidence: number;
};

const STORAGE_KEY = 'ledgerflow-experiment-decisions-v1';

const demoDecisions: DecisionRecord[] = [
  {
    id: 'dec-001',
    title: 'Audit Red Flag mini-game MVP',
    source: 'Persona Interview',
    evidence: 'Người học phản hồi muốn case ngắn, có điểm số và giải thích sau mỗi lựa chọn.',
    decision: 'BUILD',
    owner: 'Founder',
    nextAction: 'Làm prototype 5 case chứng từ và đo completion rate.',
    reviewDate: '2026-07-01',
    confidence: 76
  },
  {
    id: 'dec-002',
    title: 'Tích hợp payment quốc tế ngay',
    source: 'Finance Lab',
    evidence: 'Chưa có paid signal đủ mạnh; MoR/payment fee chưa cần thiết ở giai đoạn demo.',
    decision: 'HOLD',
    owner: 'Founder',
    nextAction: 'Tiếp tục bán thử manual invoice/local transfer trước.',
    reviewDate: '2026-07-15',
    confidence: 68
  },
  {
    id: 'dec-003',
    title: 'Build game 3D kế toán phức tạp',
    source: 'Founder Judgment',
    evidence: 'Scope quá lớn, không phù hợp giai đoạn solo founder chi phí thấp.',
    decision: 'KILL',
    owner: 'Founder',
    nextAction: 'Giữ hướng 2D card game bằng React trước.',
    reviewDate: '2026-08-01',
    confidence: 84
  }
];

const emptyForm: Omit<DecisionRecord, 'id'> = {
  title: '',
  source: 'Persona Interview',
  evidence: '',
  decision: 'HOLD',
  owner: 'Founder',
  nextAction: '',
  reviewDate: '',
  confidence: 50
};

function loadDecisions(): DecisionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return demoDecisions;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : demoDecisions;
  } catch {
    return demoDecisions;
  }
}

function badgeClass(decision: DecisionStatus) {
  if (decision === 'BUILD') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  if (decision === 'KILL') return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
  return 'bg-amber-500/15 text-amber-200 border-amber-500/30';
}

export default function ExperimentDecisionLog() {
  const [records, setRecords] = useState<DecisionRecord[]>(() => loadDecisions());
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  const stats = useMemo(() => {
    const total = records.length || 1;
    const build = records.filter((item) => item.decision === 'BUILD').length;
    const hold = records.filter((item) => item.decision === 'HOLD').length;
    const kill = records.filter((item) => item.decision === 'KILL').length;
    const avgConfidence = Math.round(records.reduce((sum, item) => sum + item.confidence, 0) / total);
    return { total: records.length, build, hold, kill, avgConfidence };
  }, [records]);

  const addRecord = () => {
    if (!form.title.trim() || !form.evidence.trim() || !form.nextAction.trim()) return;
    setRecords((current) => [
      {
        ...form,
        id: `dec-${Date.now()}`,
        reviewDate: form.reviewDate || new Date().toISOString().slice(0, 10)
      },
      ...current
    ]);
    setForm(emptyForm);
  };

  const removeRecord = (id: string) => {
    setRecords((current) => current.filter((item) => item.id !== id));
  };

  const resetDemo = () => setRecords(demoDecisions);

  return (
    <section className="space-y-5 text-slate-100">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <p className="text-[10px] font-black uppercase tracking-wider text-cyan-300">Experiment Decision Log</p>
        <h2 className="mt-2 text-2xl font-black text-white">Nhật ký quyết định thử nghiệm</h2>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-400">
          Ghi lại quyết định BUILD / HOLD / KILL dựa trên interview, lead, finance signal và nhận định founder. Mục tiêu là ngăn AI build lan man khi chưa có bằng chứng.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><p className="text-[10px] font-black uppercase text-slate-500">Total</p><p className="mt-2 text-2xl font-black text-white">{stats.total}</p></div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4"><p className="text-[10px] font-black uppercase text-emerald-300">Build</p><p className="mt-2 text-2xl font-black text-white">{stats.build}</p></div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4"><p className="text-[10px] font-black uppercase text-amber-300">Hold</p><p className="mt-2 text-2xl font-black text-white">{stats.hold}</p></div>
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4"><p className="text-[10px] font-black uppercase text-rose-300">Kill</p><p className="mt-2 text-2xl font-black text-white">{stats.kill}</p></div>
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4"><p className="text-[10px] font-black uppercase text-cyan-300">Confidence</p><p className="mt-2 text-2xl font-black text-white">{stats.avgConfidence}%</p></div>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 xl:col-span-1">
          <h3 className="text-sm font-black text-white">Thêm quyết định</h3>
          <div className="mt-4 space-y-3">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Tên thử nghiệm / ý tưởng" className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500" />
            <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value as SignalSource })} className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500">
              <option>Persona Interview</option><option>Distribution Lead</option><option>Finance Lab</option><option>Founder Judgment</option><option>Market Observation</option>
            </select>
            <textarea value={form.evidence} onChange={(e) => setForm({ ...form, evidence: e.target.value })} placeholder="Bằng chứng / tín hiệu" className="h-24 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500" />
            <select value={form.decision} onChange={(e) => setForm({ ...form, decision: e.target.value as DecisionStatus })} className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500">
              <option>BUILD</option><option>HOLD</option><option>KILL</option>
            </select>
            <input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} placeholder="Owner" className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500" />
            <textarea value={form.nextAction} onChange={(e) => setForm({ ...form, nextAction: e.target.value })} placeholder="Next action" className="h-20 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500" />
            <input type="date" value={form.reviewDate} onChange={(e) => setForm({ ...form, reviewDate: e.target.value })} className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500" />
            <label className="block text-xs font-bold text-slate-400">Confidence: {form.confidence}%</label>
            <input type="range" min="0" max="100" value={form.confidence} onChange={(e) => setForm({ ...form, confidence: Number(e.target.value) })} className="w-full" />
            <button onClick={addRecord} className="w-full rounded-xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950 hover:bg-cyan-300">Lưu quyết định</button>
            <button onClick={resetDemo} className="w-full rounded-xl border border-slate-800 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white">Reset demo</button>
          </div>
        </div>

        <div className="space-y-3 xl:col-span-2">
          {records.map((item) => (
            <article key={item.id} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{item.source} • review {item.reviewDate}</p>
                  <h3 className="mt-1 text-base font-black text-white">{item.title}</h3>
                </div>
                <span className={`rounded-full border px-3 py-1 text-[10px] font-black ${badgeClass(item.decision)}`}>{item.decision}</span>
              </div>
              <p className="mt-4 text-sm font-semibold leading-7 text-slate-300">{item.evidence}</p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3"><p className="text-[10px] font-black uppercase text-slate-500">Owner</p><p className="mt-1 text-xs font-bold text-white">{item.owner}</p></div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 md:col-span-2"><p className="text-[10px] font-black uppercase text-slate-500">Next action</p><p className="mt-1 text-xs font-bold leading-5 text-white">{item.nextAction}</p></div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-xs font-bold text-cyan-300">Confidence: {item.confidence}%</p>
                <button onClick={() => removeRecord(item.id)} className="text-xs font-bold text-rose-300 hover:text-rose-200">Xóa</button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
