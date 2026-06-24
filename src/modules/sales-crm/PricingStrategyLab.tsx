import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  ClipboardList,
  Copy,
  DollarSign,
  Layers,
  LineChart,
  ShieldCheck,
  TrendingUp,
  WalletCards
} from 'lucide-react';
import {
  PRICING_METRICS,
  PRICING_PACKAGES,
  ROI_CASES,
  SCOPE_CONTROL_RULES,
  VALUE_DRIVERS
} from '../../data/pricingStrategyKnowledge';

type PricingTab = 'packages' | 'roi' | 'scope' | 'calculator';

const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value);

export default function PricingStrategyLab() {
  const [tab, setTab] = useState<PricingTab>('packages');
  const [copied, setCopied] = useState<string | null>(null);
  const [monthlyHoursSaved, setMonthlyHoursSaved] = useState(36);
  const [hourlyCost, setHourlyCost] = useState(85000);
  const [monthlySoftwareCost, setMonthlySoftwareCost] = useState(599000);
  const [setupCost, setSetupCost] = useState(5000000);

  const roi = useMemo(() => {
    const monthlySavings = monthlyHoursSaved * hourlyCost;
    const netMonthlyBenefit = monthlySavings - monthlySoftwareCost;
    const paybackMonths = netMonthlyBenefit > 0 ? setupCost / netMonthlyBenefit : 0;
    const annualRoi = setupCost > 0 ? ((netMonthlyBenefit * 12 - setupCost) / setupCost) * 100 : 0;
    return { monthlySavings, netMonthlyBenefit, paybackMonths, annualRoi };
  }, [monthlyHoursSaved, hourlyCost, monthlySoftwareCost, setupCost]);

  const pricingBrief = `ĐỀ XUẤT ĐỊNH GIÁ LEDGERFLOW\n\n1. Gói nội bộ/offline: dùng thử trong công ty, không tính cloud.\n2. Gói solo founder/team nhỏ: 199.000đ/tháng cho Company OS local-first.\n3. Gói SME nhiều workspace: 599.000đ/tháng cho nhiều dự án/sản phẩm, có cảnh báo và báo cáo sếp.\n4. Phí triển khai riêng: từ 5.000.000đ, gồm tùy chỉnh form, báo cáo, migrate dữ liệu và đào tạo.\n5. Không bán quá rẻ nếu phải support nhiều, migrate Excel bẩn hoặc tùy chỉnh theo từng công ty.`;

  const copyText = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1200);
  };

  const tabs: { id: PricingTab; label: string }[] = [
    { id: 'packages', label: 'Packages' },
    { id: 'roi', label: 'ROI' },
    { id: 'scope', label: 'Scope control' },
    { id: 'calculator', label: 'Calculator' }
  ];

  return (
    <div className="space-y-6 text-slate-100">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-emerald-950/30 p-6 shadow-2xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-300">
              <DollarSign className="h-3.5 w-3.5" />
              Pricing Strategy Lab
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Định giá LedgerFlow Company OS: không bán rẻ công sức triển khai
            </h1>
            <p className="mt-3 text-sm font-semibold leading-7 text-slate-400">
              Module này giúp tính giá cho Company OS và accounting templates theo giá trị thật: tiết kiệm thời gian,
              giảm hồ sơ thiếu, kiểm soát tạm ứng, theo dõi dự án/sản phẩm và báo cáo sếp. Trọng tâm là tách rõ
              phí phần mềm, phí triển khai, phí migrate dữ liệu và phí support.
            </p>
          </div>

          <button
            onClick={() => copyText('brief', pricingBrief)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/10"
          >
            <Copy className="h-4 w-4" />
            {copied === 'brief' ? 'Đã copy' : 'Copy đề xuất giá'}
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`rounded-xl px-4 py-2 text-xs font-black transition ${
                tab === item.id
                  ? 'bg-emerald-400 text-slate-950'
                  : 'border border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {tab === 'packages' && (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {PRICING_PACKAGES.map((pkg) => (
              <div key={pkg.name} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <WalletCards className="h-5 w-5 text-emerald-300" />
                  <span className="rounded-full bg-slate-950 px-2 py-1 text-[10px] font-black text-slate-400">
                    {pkg.price === 0 ? 'Free/internal' : `${money(pkg.price)}đ`}
                  </span>
                </div>
                <h2 className="text-sm font-black text-white">{pkg.name}</h2>
                <p className="mt-2 text-xs font-semibold leading-6 text-slate-400"><span className="font-black text-slate-200">Ai dùng:</span> {pkg.audience}</p>
                <p className="mt-2 text-xs font-semibold leading-6 text-slate-400"><span className="font-black text-slate-200">Giá trị:</span> {pkg.value}</p>
                <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs font-semibold leading-6 text-amber-100">
                  {pkg.risk}
                </div>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <TrendingUp className="h-4 w-4 text-cyan-300" />
              Value drivers
            </h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {VALUE_DRIVERS.map((item) => (
                <div key={item} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <CheckCircle2 className="mb-3 h-4 w-4 text-emerald-300" />
                  <p className="text-xs font-semibold leading-6 text-slate-300">{item}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {tab === 'roi' && (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <LineChart className="h-4 w-4 text-emerald-300" />
              Chỉ số định giá nên theo dõi
            </h2>
            <div className="space-y-3">
              {PRICING_METRICS.map((metric) => (
                <div key={metric.name} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <h3 className="text-sm font-black text-white">{metric.name}</h3>
                  <code className="mt-3 block rounded-lg bg-black/30 p-3 text-[11px] font-bold text-emerald-300">{metric.formula}</code>
                  <p className="mt-3 text-xs font-semibold leading-6 text-slate-400">{metric.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <ClipboardList className="h-4 w-4 text-purple-300" />
              Case ROI cho sếp
            </h2>
            <div className="space-y-3">
              {ROI_CASES.map((item) => (
                <div key={item.title} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <h3 className="text-sm font-black text-white">{item.title}</h3>
                  <p className="mt-2 text-xs font-semibold leading-6 text-slate-400"><span className="text-rose-300">Trước:</span> {item.before}</p>
                  <p className="mt-1 text-xs font-semibold leading-6 text-slate-400"><span className="text-emerald-300">Sau:</span> {item.after}</p>
                  <p className="mt-1 text-xs font-black leading-6 text-amber-200">Lợi ích: {item.saving}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {tab === 'scope' && (
        <section className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              Rule chống lỗ khi triển khai
            </h2>
            <div className="space-y-3">
              {SCOPE_CONTROL_RULES.map((item) => (
                <div key={item.rule} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <h3 className="text-sm font-black text-white">{item.rule}</h3>
                  <p className="mt-2 text-xs font-semibold leading-6 text-slate-400">{item.reason}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-rose-100">
              <AlertTriangle className="h-4 w-4" />
              Không nên hứa trong báo giá
            </h2>
            <div className="space-y-3 text-xs font-semibold leading-6 text-slate-300">
              <p>Không hứa sửa vô hạn.</p>
              <p>Không hứa AI thay kế toán trưởng.</p>
              <p>Không hứa migrate dữ liệu cũ miễn phí nếu file bẩn.</p>
              <p>Không hứa tích hợp mọi phần mềm cũ nếu chưa khảo sát.</p>
              <p>Không gộp phí triển khai vào phí tháng quá thấp.</p>
            </div>
          </div>
        </section>
      )}

      {tab === 'calculator' && (
        <section className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <Calculator className="h-4 w-4 text-emerald-300" />
              ROI calculator
            </h2>
            <div className="space-y-4">
              {[
                ['Giờ tiết kiệm/tháng', monthlyHoursSaved, setMonthlyHoursSaved],
                ['Chi phí 1 giờ nhân sự', hourlyCost, setHourlyCost],
                ['Phí phần mềm/tháng', monthlySoftwareCost, setMonthlySoftwareCost],
                ['Phí triển khai ban đầu', setupCost, setSetupCost]
              ].map(([label, value, setter]) => (
                <label key={label as string} className="block">
                  <span className="mb-1 block text-xs font-black text-slate-400">{label as string}</span>
                  <input
                    type="number"
                    value={value as number}
                    onChange={(e) => (setter as React.Dispatch<React.SetStateAction<number>>)(Number(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm font-bold text-white outline-none focus:border-emerald-400"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <DollarSign className="mb-3 h-5 w-5 text-emerald-300" />
              <p className="text-[10px] font-black uppercase text-slate-500">Tiết kiệm/tháng</p>
              <p className="mt-2 text-2xl font-black text-white">{money(roi.monthlySavings)}đ</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <Layers className="mb-3 h-5 w-5 text-cyan-300" />
              <p className="text-[10px] font-black uppercase text-slate-500">Lợi ích ròng/tháng</p>
              <p className="mt-2 text-2xl font-black text-white">{money(roi.netMonthlyBenefit)}đ</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <TrendingUp className="mb-3 h-5 w-5 text-purple-300" />
              <p className="text-[10px] font-black uppercase text-slate-500">Thời gian hoàn vốn</p>
              <p className="mt-2 text-2xl font-black text-white">{roi.paybackMonths > 0 ? roi.paybackMonths.toFixed(1) : 'Không đạt'} tháng</p>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <CheckCircle2 className="mb-3 h-5 w-5 text-emerald-300" />
              <p className="text-[10px] font-black uppercase text-emerald-200">ROI năm đầu</p>
              <p className="mt-2 text-2xl font-black text-white">{roi.annualRoi.toFixed(1)}%</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
