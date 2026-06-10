import React, { useMemo, useState } from 'react';

const money = (value: number) => new Intl.NumberFormat('vi-VN').format(Math.round(value));

const NumberInput = ({ label, value, setValue }: { label: string; value: number; setValue: (next: number) => void }) => (
  <label className="block">
    <span className="mb-1 block text-[10px] font-black uppercase text-slate-400">{label}</span>
    <input
      type="number"
      value={value}
      onChange={(event) => setValue(Number(event.target.value) || 0)}
      className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm font-bold text-white outline-none focus:border-cyan-400"
    />
  </label>
);

export default function FinanceLabMini() {
  const [cash, setCash] = useState(15000000);
  const [toolCost, setToolCost] = useState(450000);
  const [hostingCost, setHostingCost] = useState(0);
  const [aiCost, setAiCost] = useState(600000);
  const [marketingCost, setMarketingCost] = useState(300000);
  const [customers, setCustomers] = useState(20);
  const [price, setPrice] = useState(99000);
  const [churn, setChurn] = useState(5);
  const [variableCostRate, setVariableCostRate] = useState(15);

  const result = useMemo(() => {
    const burnRate = toolCost + hostingCost + aiCost + marketingCost;
    const runway = burnRate > 0 ? cash / burnRate : 999;
    const mrr = customers * price * (1 - churn / 100);
    const variableCost = mrr * (variableCostRate / 100);
    const grossMargin = mrr > 0 ? ((mrr - variableCost) / mrr) * 100 : 0;
    const netAfterBurn = mrr - burnRate;
    const verdict = runway >= 6 && grossMargin >= 70 && netAfterBurn >= 0
      ? 'GO - có thể test gói trả phí nhỏ'
      : runway >= 3 || mrr > 0
        ? 'HOLD - cần giảm burn hoặc xác minh willingness-to-pay'
        : 'NO-GO - chưa nên trả thêm tool hoặc build lớn';
    return { burnRate, runway, mrr, variableCost, grossMargin, netAfterBurn, verdict };
  }, [aiCost, cash, churn, customers, hostingCost, marketingCost, price, toolCost, variableCostRate]);

  return (
    <section className="space-y-4 text-slate-100">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <p className="text-[10px] font-black uppercase tracking-wider text-cyan-300">Finance Lab</p>
        <h2 className="mt-2 text-xl font-black text-white">Calculator tài chính solo founder</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-slate-400">
          Mô phỏng burn rate, runway, MRR và gross margin trước khi trả thêm tool hoặc build tính năng lớn. Đây là mô hình học tập/ra quyết định, không thay thế tư vấn tài chính hay kế toán chính thức.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 lg:col-span-2">
          <h3 className="mb-4 text-sm font-black text-white">Input mô phỏng</h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
            <NumberInput label="Tiền mặt còn lại" value={cash} setValue={setCash} />
            <NumberInput label="Chi phí tool/tháng" value={toolCost} setValue={setToolCost} />
            <NumberInput label="Hosting/tháng" value={hostingCost} setValue={setHostingCost} />
            <NumberInput label="AI/API/tháng" value={aiCost} setValue={setAiCost} />
            <NumberInput label="Marketing test/tháng" value={marketingCost} setValue={setMarketingCost} />
            <NumberInput label="Khách trả tiền" value={customers} setValue={setCustomers} />
            <NumberInput label="Giá gói/tháng" value={price} setValue={setPrice} />
            <NumberInput label="Churn %" value={churn} setValue={setChurn} />
            <NumberInput label="Variable cost %" value={variableCostRate} setValue={setVariableCostRate} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:col-span-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <p className="text-xs font-bold text-amber-200">Burn rate</p>
            <p className="mt-2 text-2xl font-black text-white">{money(result.burnRate)}đ/tháng</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <p className="text-xs font-bold text-cyan-200">Runway</p>
            <p className="mt-2 text-2xl font-black text-white">{result.runway > 99 ? '∞' : result.runway.toFixed(1)} tháng</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <p className="text-xs font-bold text-emerald-200">MRR mô phỏng</p>
            <p className="mt-2 text-2xl font-black text-white">{money(result.mrr)}đ</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <p className="text-xs font-bold text-purple-200">Gross margin</p>
            <p className="mt-2 text-2xl font-black text-white">{result.grossMargin.toFixed(1)}%</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 md:col-span-2">
            <p className="text-[10px] font-black uppercase text-emerald-300">Kết luận</p>
            <p className="mt-3 text-base font-black text-white">{result.verdict}</p>
            <p className="mt-3 text-xs font-semibold leading-6 text-slate-300">Net sau burn: {money(result.netAfterBurn)}đ/tháng • Chi phí biến đổi: {money(result.variableCost)}đ/tháng</p>
          </div>
        </div>
      </div>
    </section>
  );
}
