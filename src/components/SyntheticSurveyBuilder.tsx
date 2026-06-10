import React, { useMemo, useState } from 'react';

type SurveyStatus = 'Draft' | 'Simulated' | 'Validated' | 'Rejected';
type SurveyType = 'Pain discovery' | 'Pricing signal' | 'Feature priority' | 'Learning outcome' | 'Objection test';

type Survey = {
  id: string;
  title: string;
  persona: string;
  surveyType: SurveyType;
  hypothesis: string;
  questions: string;
  syntheticSampleSize: number;
  positiveSignalRate: number;
  objectionRate: number;
  biasWarning: string;
  realValidationPlan: string;
  status: SurveyStatus;
  createdAt: string;
};

const STORAGE_KEY = 'ledgerflow-synthetic-survey-builder-v1';

const defaultSurveys: Survey[] = [
  {
    id: 'survey-1',
    title: 'Kế toán viên có cần case mô phỏng đa ngành không?',
    persona: 'Kế toán viên đa ngành',
    surveyType: 'Pain discovery',
    hypothesis: 'Người dùng cần case thực tế theo ngành hơn là bài học lý thuyết dài.',
    questions: '1. Bạn mất thời gian nhất ở loại nghiệp vụ nào?\n2. Case mẫu nào giúp bạn làm việc nhanh hơn?\n3. Bạn muốn kết quả là checklist, báo cáo hay mô phỏng?',
    syntheticSampleSize: 40,
    positiveSignalRate: 68,
    objectionRate: 22,
    biasWarning: 'Synthetic survey chỉ là giả thuyết. Không được coi là bằng chứng thị trường thật nếu chưa phỏng vấn người thật.',
    realValidationPlan: 'Phỏng vấn 5 kế toán thật, demo 1 case bank và hỏi willingness-to-pay.',
    status: 'Simulated',
    createdAt: new Date().toISOString().slice(0, 10)
  }
];

const readSurveys = (): Survey[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : defaultSurveys;
    return Array.isArray(parsed) ? parsed : defaultSurveys;
  } catch {
    return defaultSurveys;
  }
};

const saveSurveys = (items: Survey[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

const newSurvey = (): Survey => ({
  id: `survey-${Date.now()}`,
  title: 'Khảo sát giả lập mới',
  persona: 'Solo founder làm sản phẩm bằng AI',
  surveyType: 'Pain discovery',
  hypothesis: 'Người dùng có pain đủ mạnh để xem demo MVP.',
  questions: '1. Bạn đang xử lý vấn đề này bằng cách nào?\n2. Nếu có tool giải quyết, bạn kỳ vọng đầu ra gì?\n3. Điều gì khiến bạn không trả tiền?',
  syntheticSampleSize: 30,
  positiveSignalRate: 50,
  objectionRate: 30,
  biasWarning: 'Kết quả synthetic có thể bị AI tự đồng thuận với giả thuyết của founder.',
  realValidationPlan: 'Dùng 3 cuộc phỏng vấn thật để kiểm tra lại câu trả lời giả lập.',
  status: 'Draft',
  createdAt: new Date().toISOString().slice(0, 10)
});

const scoreSurvey = (survey: Survey) => Math.max(0, Math.min(100, Math.round(
  survey.positiveSignalRate * 0.65 + (100 - survey.objectionRate) * 0.25 + Math.min(survey.syntheticSampleSize, 100) * 0.1
)));

const verdict = (score: number, status: SurveyStatus) => {
  if (status === 'Validated') return 'VALIDATED / CHUYỂN SANG DEMO';
  if (score >= 70) return 'TEST VỚI NGƯỜI THẬT';
  if (score >= 45) return 'GIỮ GIẢ THUYẾT / HỎI THÊM';
  return 'BỎ HOẶC ĐỔI GIẢ THUYẾT';
};

export default function SyntheticSurveyBuilder() {
  const [surveys, setSurveys] = useState<Survey[]>(readSurveys);
  const [activeId, setActiveId] = useState(surveys[0]?.id || '');
  const active = surveys.find((item) => item.id === activeId) || surveys[0];

  const stats = useMemo(() => {
    const scores = surveys.map(scoreSurvey);
    const avgScore = scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : 0;
    return {
      total: surveys.length,
      simulated: surveys.filter((item) => item.status === 'Simulated').length,
      validated: surveys.filter((item) => item.status === 'Validated').length,
      avgScore
    };
  }, [surveys]);

  const updateActive = (patch: Partial<Survey>) => {
    const next = surveys.map((item) => item.id === active.id ? { ...item, ...patch } : item);
    setSurveys(next);
    saveSurveys(next);
  };

  const addSurvey = () => {
    const item = newSurvey();
    const next = [item, ...surveys];
    setSurveys(next);
    setActiveId(item.id);
    saveSurveys(next);
  };

  const deleteSurvey = (id: string) => {
    const next = surveys.filter((item) => item.id !== id);
    setSurveys(next);
    setActiveId(next[0]?.id || '');
    saveSurveys(next);
  };

  if (!active) {
    return (
      <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 text-slate-100">
        <h2 className="text-xl font-black text-white">Synthetic Survey Builder</h2>
        <button onClick={addSurvey} className="mt-4 rounded-xl bg-emerald-400 px-4 py-2 text-xs font-black text-slate-950">Tạo khảo sát</button>
      </section>
    );
  }

  const activeScore = scoreSurvey(active);

  return (
    <section className="space-y-4 text-slate-100">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Synthetic Survey Builder</p>
            <h2 className="mt-2 text-xl font-black text-white">Khảo sát giả lập có cảnh báo bias</h2>
            <p className="mt-3 text-sm font-semibold leading-7 text-slate-400">Dùng để tạo giả thuyết khảo sát trước, sau đó bắt buộc kiểm tra lại bằng phỏng vấn hoặc demo thật.</p>
          </div>
          <button onClick={addSurvey} className="rounded-2xl border border-emerald-500/30 bg-emerald-400 px-4 py-3 text-xs font-black text-slate-950">+ Survey</button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Total</p><p className="mt-2 text-3xl font-black text-white">{stats.total}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Simulated</p><p className="mt-2 text-3xl font-black text-white">{stats.simulated}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Validated</p><p className="mt-2 text-3xl font-black text-white">{stats.validated}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Avg score</p><p className="mt-2 text-3xl font-black text-white">{stats.avgScore.toFixed(0)}</p></div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
          {surveys.map((survey) => (
            <button key={survey.id} onClick={() => setActiveId(survey.id)} className={`w-full rounded-xl border p-3 text-left ${active.id === survey.id ? 'border-emerald-400 bg-emerald-500/10' : 'border-slate-800 bg-slate-900/60'}`}>
              <p className="text-xs font-black text-white">{survey.title}</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-400">{survey.persona} • {survey.status}</p>
            </button>
          ))}
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs font-bold text-slate-300">Tiêu đề<input value={active.title} onChange={(e) => updateActive({ title: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm text-white" /></label>
            <label className="text-xs font-bold text-slate-300">Persona<input value={active.persona} onChange={(e) => updateActive({ persona: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm text-white" /></label>
            <label className="text-xs font-bold text-slate-300">Loại khảo sát<select value={active.surveyType} onChange={(e) => updateActive({ surveyType: e.target.value as SurveyType })} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm text-white"><option>Pain discovery</option><option>Pricing signal</option><option>Feature priority</option><option>Learning outcome</option><option>Objection test</option></select></label>
            <label className="text-xs font-bold text-slate-300">Trạng thái<select value={active.status} onChange={(e) => updateActive({ status: e.target.value as SurveyStatus })} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm text-white"><option>Draft</option><option>Simulated</option><option>Validated</option><option>Rejected</option></select></label>
          </div>

          <label className="text-xs font-bold text-slate-300">Giả thuyết<textarea value={active.hypothesis} onChange={(e) => updateActive({ hypothesis: e.target.value })} className="mt-1 h-20 w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm text-white" /></label>
          <label className="text-xs font-bold text-slate-300">Câu hỏi khảo sát<textarea value={active.questions} onChange={(e) => updateActive({ questions: e.target.value })} className="mt-1 h-28 w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm text-white" /></label>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="text-xs font-bold text-slate-300">Synthetic sample size<input type="number" value={active.syntheticSampleSize} onChange={(e) => updateActive({ syntheticSampleSize: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm text-white" /></label>
            <label className="text-xs font-bold text-slate-300">Positive signal %<input type="number" value={active.positiveSignalRate} onChange={(e) => updateActive({ positiveSignalRate: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm text-white" /></label>
            <label className="text-xs font-bold text-slate-300">Objection %<input type="number" value={active.objectionRate} onChange={(e) => updateActive({ objectionRate: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm text-white" /></label>
          </div>

          <label className="text-xs font-bold text-amber-200">Bias warning<textarea value={active.biasWarning} onChange={(e) => updateActive({ biasWarning: e.target.value })} className="mt-1 h-20 w-full rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-100" /></label>
          <label className="text-xs font-bold text-slate-300">Kế hoạch validation thật<textarea value={active.realValidationPlan} onChange={(e) => updateActive({ realValidationPlan: e.target.value })} className="mt-1 h-20 w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm text-white" /></label>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="text-[10px] font-black uppercase text-emerald-300">Survey score</p>
            <p className="mt-2 text-3xl font-black text-white">{activeScore}/100</p>
            <p className="mt-2 text-sm font-black text-emerald-200">{verdict(activeScore, active.status)}</p>
          </div>

          <button onClick={() => deleteSurvey(active.id)} className="rounded-xl border border-rose-500/30 px-4 py-2 text-xs font-black text-rose-200">Xóa survey</button>
        </div>
      </div>
    </section>
  );
}
