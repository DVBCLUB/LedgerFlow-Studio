import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Copy,
  Database,
  GitBranch,
  Layers,
  LineChart,
  Play,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import {
  DATA_ENGINEERING_LAYERS,
  DATA_QUALITY_RULES,
  DATA_SCIENCE_USE_CASES,
  FEATURE_ENGINEERING_RECIPES,
  LEARNING_CHECKLIST
} from '../data/dataScienceEngineeringKnowledge';

type LabTab = 'roadmap' | 'usecases' | 'lab';

const currency = (value: number) => new Intl.NumberFormat('vi-VN').format(value);

export default function DataScienceEngineering() {
  const [tab, setTab] = useState<LabTab>('roadmap');
  const [actualCost, setActualCost] = useState(7_835_000_000);
  const [plannedBudget, setPlannedBudget] = useState(8_500_000_000);
  const [advanceAmount, setAdvanceAmount] = useState(920_000_000);
  const [settledAmount, setSettledAmount] = useState(662_000_000);
  const [copied, setCopied] = useState<string | null>(null);

  const labResult = useMemo(() => {
    const budgetUsed = plannedBudget > 0 ? actualCost / plannedBudget : 0;
    const advanceSettled = advanceAmount > 0 ? settledAmount / advanceAmount : 0;
    const overrunRisk = budgetUsed > 0.95 ? 'Cao' : budgetUsed > 0.85 ? 'Trung bình' : 'Thấp';
    const advanceRisk = advanceSettled < 0.8 ? 'Cao' : advanceSettled < 0.9 ? 'Trung bình' : 'Thấp';
    const score = Math.round((budgetUsed * 55 + (1 - advanceSettled) * 45) * 100);

    return {
      budgetUsedPct: Math.round(budgetUsed * 100),
      advanceSettledPct: Math.round(advanceSettled * 100),
      overrunRisk,
      advanceRisk,
      score
    };
  }, [actualCost, plannedBudget, advanceAmount, settledAmount]);

  const prompt = `Bạn là data analyst cho kế toán công trình. Hãy phân tích dữ liệu gồm plannedBudget=${plannedBudget}, actualCost=${actualCost}, advanceAmount=${advanceAmount}, settledAmount=${settledAmount}. Trả về: budget_used_pct, advance_settlement_pct, cảnh báo vượt ngân sách, cảnh báo tạm ứng treo, và 5 hành động ưu tiên cho kế toán.`;

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied('prompt');
    setTimeout(() => setCopied(null), 1200);
  };

  const tabs: { id: LabTab; label: string }[] = [
    { id: 'roadmap', label: 'Roadmap' },
    { id: 'usecases', label: 'Use cases' },
    { id: 'lab', label: 'Mini Lab' }
  ];

  return (
    <div className="space-y-6 text-slate-100">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-cyan-950/30 p-6 shadow-2xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-cyan-300">
              <Database className="h-3.5 w-3.5" />
              Data Science & Data Engineering
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Khoa học dữ liệu cho kế toán, kiểm toán và công trình
            </h1>
            <p className="mt-3 text-sm font-semibold leading-7 text-slate-400">
              Module này giải thích cách biến dữ liệu kế toán rời rạc thành hệ thống phân tích: gom nguồn dữ liệu,
              làm sạch, thiết kế bảng, kiểm soát chất lượng, tạo KPI, phát hiện bất thường và chuẩn bị nền cho AI.
              Nội dung chạy offline, dùng cho người không chuyên code vẫn hiểu được luồng dữ liệu.
            </p>
          </div>
          <button
            onClick={copyPrompt}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-xs font-black text-slate-950 shadow-lg shadow-cyan-500/10"
          >
            <Copy className="h-4 w-4" />
            {copied === 'prompt' ? 'Đã copy prompt' : 'Copy prompt phân tích'}
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`rounded-xl px-4 py-2 text-xs font-black transition ${
                tab === item.id
                  ? 'bg-cyan-400 text-slate-950'
                  : 'border border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {tab === 'roadmap' && (
        <>
          <section className="grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
                <Layers className="h-4 w-4 text-cyan-300" />
                5 lớp xây hệ thống dữ liệu kế toán
              </h2>
              <div className="space-y-3">
                {DATA_ENGINEERING_LAYERS.map((layer) => (
                  <div key={layer.title} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                    <h3 className="text-sm font-black text-white">{layer.title}</h3>
                    <p className="mt-2 text-xs font-semibold leading-6 text-slate-400">{layer.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                Checklist học nhanh
              </h2>
              <div className="space-y-3">
                {LEARNING_CHECKLIST.map((item) => (
                  <div key={item} className="flex gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    <p className="text-xs font-semibold leading-6 text-slate-300">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <ShieldCheck className="h-4 w-4 text-amber-300" />
              Data quality rules
            </h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {DATA_QUALITY_RULES.map((rule) => (
                <div key={rule.rule} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <h3 className="text-sm font-black text-amber-100">{rule.rule}</h3>
                  <p className="mt-2 text-xs font-semibold leading-6 text-slate-400">{rule.reason}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {tab === 'usecases' && (
        <section className="grid gap-4 lg:grid-cols-2">
          {DATA_SCIENCE_USE_CASES.map((useCase) => (
            <div key={useCase.name} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-black text-white">{useCase.name}</h2>
                <span className="rounded-full bg-slate-950 px-2 py-1 text-[10px] font-black text-cyan-300">{useCase.method}</span>
              </div>
              <div className="space-y-3 text-xs font-semibold leading-6 text-slate-400">
                <p><span className="font-black text-slate-200">Input:</span> {useCase.input}</p>
                <p><span className="font-black text-slate-200">Output:</span> {useCase.output}</p>
              </div>
            </div>
          ))}

          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <GitBranch className="h-4 w-4 text-purple-300" />
              Feature engineering recipes
            </h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {FEATURE_ENGINEERING_RECIPES.map((item) => (
                <div key={item.feature} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <h3 className="text-xs font-black text-white">{item.feature}</h3>
                  <code className="mt-3 block rounded-lg bg-black/30 p-3 text-[11px] font-bold text-purple-300">{item.formula}</code>
                  <p className="mt-3 text-xs font-semibold leading-6 text-slate-400">{item.use}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {tab === 'lab' && (
        <section className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <Play className="h-4 w-4 text-emerald-300" />
              Mini lab: rủi ro ngân sách & hoàn ứng
            </h2>
            <div className="space-y-4">
              {[
                ['Ngân sách kế hoạch', plannedBudget, setPlannedBudget],
                ['Chi phí thực tế', actualCost, setActualCost],
                ['Tổng tạm ứng', advanceAmount, setAdvanceAmount],
                ['Đã hoàn ứng', settledAmount, setSettledAmount]
              ].map(([label, value, setter]) => (
                <label key={label as string} className="block">
                  <span className="mb-1 block text-xs font-black text-slate-400">{label as string}</span>
                  <input
                    type="number"
                    value={value as number}
                    onChange={(e) => (setter as React.Dispatch<React.SetStateAction<number>>)(Number(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm font-bold text-white outline-none focus:border-cyan-400"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <LineChart className="mb-3 h-5 w-5 text-cyan-300" />
                <p className="text-[10px] font-black uppercase text-slate-500">Budget used</p>
                <p className="mt-2 text-2xl font-black text-white">{labResult.budgetUsedPct}%</p>
                <p className="mt-2 text-xs font-semibold text-slate-400">Risk: {labResult.overrunRisk}</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <ClipboardList className="mb-3 h-5 w-5 text-emerald-300" />
                <p className="text-[10px] font-black uppercase text-slate-500">Advance settled</p>
                <p className="mt-2 text-2xl font-black text-white">{labResult.advanceSettledPct}%</p>
                <p className="mt-2 text-xs font-semibold text-slate-400">Risk: {labResult.advanceRisk}</p>
              </div>

              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5">
                <AlertTriangle className="mb-3 h-5 w-5 text-rose-300" />
                <p className="text-[10px] font-black uppercase text-rose-300">Risk score</p>
                <p className="mt-2 text-2xl font-black text-white">{labResult.score}</p>
                <p className="mt-2 text-xs font-semibold text-slate-400">Điểm càng cao càng cần xử lý.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
                <BookOpen className="h-4 w-4 text-cyan-300" />
                Diễn giải cho kế toán
              </h2>
              <p className="text-xs font-semibold leading-7 text-slate-300">
                Công trình đã dùng {labResult.budgetUsedPct}% ngân sách, còn lại {currency(plannedBudget - actualCost)} VNĐ.
                Tạm ứng đã hoàn {labResult.advanceSettledPct}%, còn treo {currency(advanceAmount - settledAmount)} VNĐ.
                Dữ liệu này nên được đưa vào CommandCenter để sếp thấy ngay khoản nào cần chặn, khoản nào cần nhắc hoàn ứng,
                và hồ sơ nào chưa đủ điều kiện thanh toán.
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-emerald-200">
          <Sparkles className="h-4 w-4" />
          Nguyên tắc nhớ nhanh
        </h2>
        <p className="text-xs font-semibold leading-7 text-slate-300">
          Khoa học dữ liệu không phải chỉ là AI. Với kế toán công trình, nền quan trọng nhất là dữ liệu đúng mã,
          đúng chứng từ, đúng quan hệ giữa công trình - chi phí - tạm ứng - hóa đơn - kho - thanh toán. AI chỉ hiệu quả
          khi nền dữ liệu này sạch và có rule kiểm soát.
        </p>
      </section>
    </div>
  );
}
