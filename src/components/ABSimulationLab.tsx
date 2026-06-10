import React, { useMemo, useState } from 'react';

type ExperimentType = 'Pricing' | 'Landing Page' | 'Onboarding' | 'Demo Script' | 'Feature Package';
type ExperimentStatus = 'Draft' | 'Running' | 'Winner Picked' | 'Need Real Test' | 'Archived';

type Variant = {
  name: string;
  hypothesis: string;
  conversionRate: number;
  paidSignalRate: number;
  objectionRate: number;
  setupCost: number;
  confidence: number;
};

type ABExperiment = {
  id: string;
  title: string;
  type: ExperimentType;
  targetPersona: string;
  metric: string;
  variantA: Variant;
  variantB: Variant;
  sampleSize: number;
  biasWarning: string;
  realValidationPlan: string;
  status: ExperimentStatus;
  createdAt: string;
};

const STORAGE_KEY = 'ledgerflow-ab-simulation-lab-v1';

const experimentTypes: ExperimentType[] = ['Pricing', 'Landing Page', 'Onboarding', 'Demo Script', 'Feature Package'];
const statuses: ExperimentStatus[] = ['Draft', 'Running', 'Winner Picked', 'Need Real Test', 'Archived'];

const demoExperiments: ABExperiment[] = [
  {
    id: 'ab-demo-pricing',
    title: 'Test gói giá học qua case mô phỏng',
    type: 'Pricing',
    targetPersona: 'Kế toán viên đa ngành',
    metric: 'Paid signal sau demo',
    sampleSize: 40,
    variantA: {
      name: 'Gói 99k/tháng',
      hypothesis: 'Giá thấp giúp người học thử nhanh hơn.',
      conversionRate: 18,
      paidSignalRate: 12,
      objectionRate: 30,
      setupCost: 200000,
      confidence: 55
    },
    variantB: {
      name: 'Gói 299k có case bank + checklist',
      hypothesis: 'Giá cao hơn nhưng rõ giá trị công việc sẽ có paid signal tốt hơn.',
      conversionRate: 12,
      paidSignalRate: 18,
      objectionRate: 22,
      setupCost: 350000,
      confidence: 62
    },
    biasWarning: 'Dữ liệu này là mô phỏng, không được coi là bằng chứng thị trường thật.',
    realValidationPlan: 'Demo trực tiếp 5 kế toán viên, hỏi willingness-to-pay và lý do từ chối.',
    status: 'Need Real Test',
    createdAt: new Date().toISOString()
  }
];

const blankVariant: Variant = {
  name: '',
  hypothesis: '',
  conversionRate: 10,
  paidSignalRate: 10,
  objectionRate: 20,
  setupCost: 0,
  confidence: 50
};

const initialForm: Omit<ABExperiment, 'id' | 'createdAt'> = {
  title: '',
  type: 'Pricing',
  targetPersona: '',
  metric: 'Paid signal / conversion',
  sampleSize: 30,
  variantA: { ...blankVariant, name: 'Variant A' },
  variantB: { ...blankVariant, name: 'Variant B' },
  biasWarning: 'Synthetic A/B chỉ là giả thuyết. Phải test bằng demo hoặc traffic thật trước khi build lớn.',
  realValidationPlan: '',
  status: 'Draft'
};

const readExperiments = (): ABExperiment[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return demoExperiments;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : demoExperiments;
  } catch {
    return demoExperiments;
  }
};

const saveExperiments = (items: ABExperiment[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
const money = (value: number) => new Intl.NumberFormat('vi-VN').format(Math.round(value));

const variantScore = (variant: Variant, sampleSize: number) => {
  const sampleBonus = Math.min(15, sampleSize / 10);
  const costPenalty = Math.min(12, variant.setupCost / 500000);
  return Math.max(0, Math.min(100, Math.round(
    variant.conversionRate * 1.4 +
    variant.paidSignalRate * 2.2 -
    variant.objectionRate * 0.8 +
    variant.confidence * 0.35 +
    sampleBonus -
    costPenalty
  )));
};

export default function ABSimulationLab() {
  const [experiments, setExperiments] = useState<ABExperiment[]>(readExperiments);
  const [form, setForm] = useState<Omit<ABExperiment, 'id' | 'createdAt'>>(initialForm);

  const stats = useMemo(() => {
    const total = experiments.length;
    const winnerPicked = experiments.filter((item) => item.status === 'Winner Picked').length;
    const needRealTest = experiments.filter((item) => item.status === 'Need Real Test').length;
    const avgScoreGap = total ? experiments.reduce((sum, item) => sum + Math.abs(variantScore(item.variantA, item.sampleSize) - variantScore(item.variantB, item.sampleSize)), 0) / total : 0;
    return { total, winnerPicked, needRealTest, avgScoreGap };
  }, [experiments]);

  const updateVariant = (key: 'variantA' | 'variantB', field: keyof Variant, value: string | number) => {
    setForm((current) => ({
      ...current,
      [key]: {
        ...current[key],
        [field]: typeof current[key][field] === 'number' ? Number(value) : value
      }
    }));
  };

  const persist = (next: ABExperiment[]) => {
    setExperiments(next);
    saveExperiments(next);
  };

  const addExperiment = () => {
    if (!form.title.trim()) return;
    const next: ABExperiment = {
      ...form,
      id: `ab-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    persist([next, ...experiments]);
    setForm(initialForm);
  };

  const updateStatus = (id: string, status: ExperimentStatus) => {
    persist(experiments.map((item) => item.id === id ? { ...item, status } : item));
  };

  const removeExperiment = (id: string) => persist(experiments.filter((item) => item.id !== id));
  const resetDemo = () => persist(demoExperiments);

  return (
    <section className="space-y-4 text-slate-100">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <p className="text-[10px] font-black uppercase tracking-wider text-cyan-300">A/B Simulation Lab</p>
        <h2 className="mt-2 text-xl font-black text-white">Mô phỏng A/B trước khi build lớn</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-slate-400">
          So sánh hai biến thể pricing, landing page, onboarding, demo script hoặc feature package. Kết quả chỉ là giả thuyết; phải validate bằng người dùng thật trước khi quyết định build.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Experiments</p><p className="mt-2 text-3xl font-black text-white">{stats.total}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Winner picked</p><p className="mt-2 text-3xl font-black text-white">{stats.winnerPicked}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Need real test</p><p className="mt-2 text-3xl font-black text-white">{stats.needRealTest}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Avg score gap</p><p className="mt-2 text-3xl font-black text-white">{stats.avgScoreGap.toFixed(0)}</p></div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <h3 className="text-sm font-black text-white">Tạo A/B experiment</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Tên experiment" className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-semibold text-slate-100 outline-none" />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ExperimentType })} className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-semibold text-slate-100 outline-none">
            {experimentTypes.map((item) => <option key={item}>{item}</option>)}
          </select>
          <input value={form.targetPersona} onChange={(e) => setForm({ ...form, targetPersona: e.target.value })} placeholder="Persona mục tiêu" className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-semibold text-slate-100 outline-none" />
          <input value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })} placeholder="Metric chính" className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-semibold text-slate-100 outline-none" />
          <input type="number" value={form.sampleSize} onChange={(e) => setForm({ ...form, sampleSize: Number(e.target.value) })} placeholder="Sample size" className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-semibold text-slate-100 outline-none" />
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ExperimentStatus })} className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-semibold text-slate-100 outline-none">
            {statuses.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {(['variantA', 'variantB'] as const).map((key) => (
            <div key={key} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-[10px] font-black uppercase text-cyan-300">{key === 'variantA' ? 'Variant A' : 'Variant B'}</p>
              <div className="mt-3 grid gap-3">
                <input value={form[key].name} onChange={(e) => updateVariant(key, 'name', e.target.value)} placeholder="Tên biến thể" className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-semibold text-slate-100 outline-none" />
                <textarea value={form[key].hypothesis} onChange={(e) => updateVariant(key, 'hypothesis', e.target.value)} placeholder="Giả thuyết" className="min-h-[72px] rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-semibold text-slate-100 outline-none" />
                <div className="grid gap-3 md:grid-cols-2">
                  <input type="number" value={form[key].conversionRate} onChange={(e) => updateVariant(key, 'conversionRate', e.target.value)} placeholder="Conversion %" className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-semibold text-slate-100 outline-none" />
                  <input type="number" value={form[key].paidSignalRate} onChange={(e) => updateVariant(key, 'paidSignalRate', e.target.value)} placeholder="Paid signal %" className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-semibold text-slate-100 outline-none" />
                  <input type="number" value={form[key].objectionRate} onChange={(e) => updateVariant(key, 'objectionRate', e.target.value)} placeholder="Objection %" className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-semibold text-slate-100 outline-none" />
                  <input type="number" value={form[key].confidence} onChange={(e) => updateVariant(key, 'confidence', e.target.value)} placeholder="Confidence %" className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-semibold text-slate-100 outline-none" />
                  <input type="number" value={form[key].setupCost} onChange={(e) => updateVariant(key, 'setupCost', e.target.value)} placeholder="Setup cost" className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-semibold text-slate-100 outline-none md:col-span-2" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <textarea value={form.biasWarning} onChange={(e) => setForm({ ...form, biasWarning: e.target.value })} placeholder="Bias warning" className="min-h-[80px] rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-semibold text-slate-100 outline-none" />
          <textarea value={form.realValidationPlan} onChange={(e) => setForm({ ...form, realValidationPlan: e.target.value })} placeholder="Kế hoạch validation thật" className="min-h-[80px] rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-semibold text-slate-100 outline-none" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={addExperiment} className="rounded-xl bg-cyan-400 px-4 py-2 text-xs font-black text-slate-950">Thêm experiment</button>
          <button onClick={resetDemo} className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-black text-slate-300">Reset demo</button>
        </div>
      </div>

      <div className="space-y-3">
        {experiments.map((item) => {
          const scoreA = variantScore(item.variantA, item.sampleSize);
          const scoreB = variantScore(item.variantB, item.sampleSize);
          const winner = scoreA === scoreB ? 'Hòa / cần test thật' : scoreA > scoreB ? item.variantA.name : item.variantB.name;
          return (
            <div key={item.id} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase text-cyan-300">{item.type} • {item.targetPersona || 'No persona'}</p>
                  <h3 className="mt-1 text-lg font-black text-white">{item.title}</h3>
                  <p className="mt-1 text-xs font-semibold text-slate-400">Metric: {item.metric} • Sample: {item.sampleSize}</p>
                </div>
                <select value={item.status} onChange={(e) => updateStatus(item.id, e.target.value as ExperimentStatus)} className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs font-bold text-slate-100">
                  {statuses.map((status) => <option key={status}>{status}</option>)}
                </select>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {[item.variantA, item.variantB].map((variant, index) => (
                  <div key={`${item.id}-${variant.name}-${index}`} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-sm font-black text-white">{variant.name || `Variant ${index + 1}`}</h4>
                      <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-[10px] font-black text-cyan-200">Score {variantScore(variant, item.sampleSize)}</span>
                    </div>
                    <p className="mt-2 text-xs font-semibold leading-6 text-slate-400">{variant.hypothesis}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-300">
                      <p>Conversion: {variant.conversionRate}%</p>
                      <p>Paid signal: {variant.paidSignalRate}%</p>
                      <p>Objection: {variant.objectionRate}%</p>
                      <p>Confidence: {variant.confidence}%</p>
                      <p className="col-span-2">Setup cost: {money(variant.setupCost)}đ</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <p className="text-[10px] font-black uppercase text-emerald-300">Winner suggestion</p>
                <p className="mt-2 text-sm font-black text-white">{winner}</p>
                <p className="mt-2 text-xs font-semibold leading-6 text-slate-300">Bias: {item.biasWarning}</p>
                <p className="mt-1 text-xs font-semibold leading-6 text-slate-300">Real validation: {item.realValidationPlan || 'Chưa có kế hoạch validation thật.'}</p>
              </div>

              <button onClick={() => removeExperiment(item.id)} className="mt-3 text-xs font-bold text-rose-300 hover:text-rose-200">Xóa experiment</button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
