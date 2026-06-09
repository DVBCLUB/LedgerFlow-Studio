import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Copy,
  Heart,
  LineChart,
  MessageCircle,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
  WalletCards
} from 'lucide-react';
import {
  CHURN_SIGNALS,
  CUSTOMER_SEGMENTS,
  HEALTH_SCORE_WEIGHTS,
  LTV_FORMULAS,
  RETENTION_PLAYBOOK,
  WINBACK_MESSAGES
} from '../data/customerLtvKnowledge';

type LtvTab = 'segments' | 'ltv' | 'churn' | 'playbook';

const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value);

export default function CustomerLTVDashboard() {
  const [tab, setTab] = useState<LtvTab>('segments');
  const [copied, setCopied] = useState<string | null>(null);
  const [arpu, setArpu] = useState(599000);
  const [grossMargin, setGrossMargin] = useState(82);
  const [monthlyChurn, setMonthlyChurn] = useState(4);
  const [cac, setCac] = useState(850000);

  const metrics = useMemo(() => {
    const grossProfit = arpu * (grossMargin / 100);
    const ltv = monthlyChurn > 0 ? grossProfit / (monthlyChurn / 100) : 0;
    const ratio = cac > 0 ? ltv / cac : 0;
    const payback = grossProfit > 0 ? cac / grossProfit : 0;
    return { grossProfit, ltv, ratio, payback };
  }, [arpu, grossMargin, monthlyChurn, cac]);

  const customerBrief = `BÁO CÁO LTV/CAC\n\nARPU: ${money(arpu)}đ/tháng\nGross margin: ${grossMargin}%\nMonthly churn: ${monthlyChurn}%\nCAC: ${money(cac)}đ\nLTV ước tính: ${money(Math.round(metrics.ltv))}đ\nLTV/CAC: ${metrics.ratio.toFixed(2)}x\nPayback: ${metrics.payback.toFixed(1)} tháng\n\nƯu tiên: giảm churn bằng onboarding, báo cáo sếp, cảnh báo hồ sơ thiếu và chăm sóc khách ít dùng.`;

  const copyText = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1200);
  };

  const tabs: { id: LtvTab; label: string }[] = [
    { id: 'segments', label: 'Segments' },
    { id: 'ltv', label: 'LTV/CAC' },
    { id: 'churn', label: 'Churn shield' },
    { id: 'playbook', label: 'Retention' }
  ];

  return (
    <div className="space-y-6 text-slate-100">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-rose-950/30 p-6 shadow-2xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-rose-300">
              <Heart className="h-3.5 w-3.5" />
              Customer LTV Dashboard
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Giữ chân khách hàng phần mềm kế toán công trình
            </h1>
            <p className="mt-3 text-sm font-semibold leading-7 text-slate-400">
              Module này giúp nhìn khách hàng theo giá trị vòng đời, chi phí có được khách, dấu hiệu sắp rời bỏ,
              onboarding và bằng chứng ROI. Với phần mềm kế toán, giữ chân khách không nằm ở quảng cáo,
              mà nằm ở việc khách thật sự xuất báo cáo, giảm hồ sơ thiếu và kiểm soát được công trình.
            </p>
          </div>

          <button
            onClick={() => copyText('brief', customerBrief)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-400 px-4 py-3 text-xs font-black text-slate-950 shadow-lg shadow-rose-500/10"
          >
            <Copy className="h-4 w-4" />
            {copied === 'brief' ? 'Đã copy' : 'Copy báo cáo LTV'}
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`rounded-xl px-4 py-2 text-xs font-black transition ${
                tab === item.id
                  ? 'bg-rose-400 text-slate-950'
                  : 'border border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {tab === 'segments' && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {CUSTOMER_SEGMENTS.map((segment) => (
            <div key={segment.name} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <Users className="mb-3 h-5 w-5 text-rose-300" />
              <h2 className="text-sm font-black text-white">{segment.name}</h2>
              <p className="mt-2 text-xs font-semibold leading-6 text-slate-400"><span className="font-black text-slate-200">Đau:</span> {segment.pain}</p>
              <p className="mt-2 text-xs font-semibold leading-6 text-slate-400"><span className="font-black text-slate-200">Giá trị:</span> {segment.value}</p>
              <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs font-semibold leading-6 text-emerald-100">
                {segment.retention}
              </div>
            </div>
          ))}
        </section>
      )}

      {tab === 'ltv' && (
        <section className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <WalletCards className="h-4 w-4 text-rose-300" />
              LTV calculator
            </h2>
            <div className="space-y-4">
              {[
                ['ARPU/tháng', arpu, setArpu],
                ['Gross margin %', grossMargin, setGrossMargin],
                ['Monthly churn %', monthlyChurn, setMonthlyChurn],
                ['CAC', cac, setCac]
              ].map(([label, value, setter]) => (
                <label key={label as string} className="block">
                  <span className="mb-1 block text-xs font-black text-slate-400">{label as string}</span>
                  <input
                    type="number"
                    value={value as number}
                    onChange={(e) => (setter as React.Dispatch<React.SetStateAction<number>>)(Number(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm font-bold text-white outline-none focus:border-rose-400"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <TrendingUp className="mb-3 h-5 w-5 text-emerald-300" />
              <p className="text-[10px] font-black uppercase text-slate-500">LTV</p>
              <p className="mt-2 text-2xl font-black text-white">{money(Math.round(metrics.ltv))}đ</p>
            </div>
            <div className={`rounded-2xl border p-5 ${metrics.ratio >= 3 ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}>
              <LineChart className="mb-3 h-5 w-5 text-cyan-300" />
              <p className="text-[10px] font-black uppercase text-slate-500">LTV/CAC</p>
              <p className="mt-2 text-2xl font-black text-white">{metrics.ratio.toFixed(2)}x</p>
              <p className="mt-2 text-xs font-semibold text-slate-400">Mốc khỏe thường từ 3x trở lên.</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <CheckCircle2 className="mb-3 h-5 w-5 text-purple-300" />
              <p className="text-[10px] font-black uppercase text-slate-500">Payback</p>
              <p className="mt-2 text-2xl font-black text-white">{metrics.payback.toFixed(1)} tháng</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <UserCheck className="mb-3 h-5 w-5 text-rose-300" />
              <p className="text-[10px] font-black uppercase text-slate-500">Gross profit/customer</p>
              <p className="mt-2 text-2xl font-black text-white">{money(Math.round(metrics.grossProfit))}đ</p>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <ClipboardList className="h-4 w-4 text-cyan-300" />
              Công thức cần nhớ
            </h2>
            <div className="grid gap-3 md:grid-cols-5">
              {LTV_FORMULAS.map((item) => (
                <div key={item.name} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <h3 className="text-xs font-black text-white">{item.name}</h3>
                  <code className="mt-3 block rounded-lg bg-black/30 p-3 text-[11px] font-bold text-rose-300">{item.formula}</code>
                  <p className="mt-3 text-xs font-semibold leading-6 text-slate-400">{item.use}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {tab === 'churn' && (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <AlertTriangle className="h-4 w-4 text-amber-300" />
              Tín hiệu churn
            </h2>
            <div className="space-y-3">
              {CHURN_SIGNALS.map((item) => (
                <div key={item.signal} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <h3 className="text-sm font-black text-amber-100">{item.signal}</h3>
                  <p className="mt-2 text-xs font-semibold leading-6 text-slate-400">{item.meaning}</p>
                  <p className="mt-2 text-xs font-semibold leading-6 text-emerald-200">Hành động: {item.action}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              Health score weights
            </h2>
            <div className="space-y-3">
              {HEALTH_SCORE_WEIGHTS.map((item) => (
                <div key={item.factor} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-black text-white">{item.factor}</h3>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-black text-emerald-300">{item.weight}%</span>
                  </div>
                  <p className="text-xs font-semibold leading-6 text-slate-400">{item.example}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {tab === 'playbook' && (
        <section className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <ClipboardList className="h-4 w-4 text-emerald-300" />
              Retention playbook 30 ngày
            </h2>
            <div className="space-y-3">
              {RETENTION_PLAYBOOK.map((item) => (
                <div key={item.stage} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-black text-white">{item.stage}</h3>
                    <span className="rounded-full bg-slate-900 px-2 py-1 text-[10px] font-black text-slate-400">{item.metric}</span>
                  </div>
                  <p className="text-xs font-semibold leading-6 text-slate-400">{item.task}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <MessageCircle className="h-4 w-4 text-cyan-300" />
              Win-back messages
            </h2>
            <div className="space-y-3">
              {WINBACK_MESSAGES.map((item) => (
                <div key={item.title} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <h3 className="text-sm font-black text-white">{item.title}</h3>
                  <p className="mt-2 text-xs font-semibold leading-6 text-slate-400">{item.message}</p>
                  <button
                    onClick={() => copyText(item.title, item.message)}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-[11px] font-black text-slate-300 hover:border-rose-400 hover:text-white"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copied === item.title ? 'Đã copy' : 'Copy tin nhắn'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-emerald-200">
          <CheckCircle2 className="h-4 w-4" />
          Nguyên tắc giữ chân khách
        </h2>
        <p className="text-xs font-semibold leading-7 text-slate-300">
          Khách kế toán không ở lại vì giao diện màu mè. Họ ở lại khi phần mềm thật sự giảm việc lặp lại,
          giảm lỗi chứng từ, giúp báo cáo sếp nhanh hơn và không làm họ mất quyền kiểm soát số liệu.
        </p>
      </section>
    </div>
  );
}
