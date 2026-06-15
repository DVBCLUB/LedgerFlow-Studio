import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface SeoTrafficCalculatorPanelProps {
  initialPrice: number;
}

export default function SeoTrafficCalculatorPanel({ initialPrice }: SeoTrafficCalculatorPanelProps) {
  const [volume, setVolume] = useState(3100);
  const [ctr, setCtr] = useState(3);
  const [conversion, setConversion] = useState(8);
  const [price, setPrice] = useState(initialPrice || 99000);
  const [churn, setChurn] = useState(5);

  useEffect(() => {
    if (initialPrice > 0) setPrice(initialPrice);
  }, [initialPrice]);

  const calcData = useMemo(() => {
    const monthlyVisitors = volume * (ctr / 100);
    const newTrials = monthlyVisitors * (conversion / 100);
    const churnRate = churn / 100;
    const months = Array.from({ length: 12 }, (_, index) => index + 1);

    return months.map((month) => {
      let realisticUsers = 0;
      let conservativeUsers = 0;
      let optimisticUsers = 0;
      const conservativeTrials = volume * ((ctr / 3) / 100) * ((conversion / 2) / 100);
      const optimisticTrials = volume * ((ctr * 2.2) / 100) * ((conversion * 1.5) / 100);

      for (let prev = 1; prev <= month; prev += 1) {
        realisticUsers = realisticUsers * (1 - churnRate) + newTrials;
        conservativeUsers = conservativeUsers * (1 - (churnRate + 0.02)) + conservativeTrials;
        optimisticUsers = optimisticUsers * (1 - (churnRate - 0.015)) + optimisticTrials;
      }

      return {
        month: `Thang ${month}`,
        'Than trong': Math.round(conservativeUsers * (price * 0.9)),
        'Khach quan': Math.round(realisticUsers * price),
        'Toi uu': Math.round(optimisticUsers * (price * 1.15)),
        realisticUsers: Math.floor(realisticUsers),
      };
    });
  }, [churn, conversion, ctr, price, volume]);

  const month12 = calcData[11];
  const realisticMonth12MRR = month12['Khach quan'];
  const realisticCumulativeUsers = month12.realisticUsers;
  const conservativeMonth12MRR = month12['Than trong'];
  const estimatedPaybackWeeks = Math.max(1, Math.round((30000 * volume * 0.05) / (realisticMonth12MRR || 1) * 4));

  return (
    <div className="space-y-6">
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-5 rounded-2xl border border-slate-900 bg-[#070b13]/85 p-5 lg:col-span-4">
          <span className="block border-b border-slate-900 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
            SEO conversion inputs
          </span>

          <Slider label="Google traffic" value={volume} suffix="/ thang" min={500} max={15000} step={100} onChange={setVolume} accent="accent-purple-500" />
          <Slider label="Organic CTR" value={ctr} suffix="%" min={1} max={15} step={0.5} onChange={setCtr} accent="accent-amber-500" />
          <Slider label="Trial to paid" value={conversion} suffix="%" min={1} max={20} step={0.5} onChange={setConversion} accent="accent-emerald-500" />
          <Slider label="Monthly price" value={price} suffix="VND" min={19000} max={499000} step={5000} onChange={setPrice} accent="accent-purple-500" />
          <Slider label="Monthly churn" value={churn} suffix="%" min={1} max={15} step={0.5} onChange={setChurn} accent="accent-rose-500" />
        </div>

        <div className="space-y-6 lg:col-span-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <Metric label="Realistic month 12 MRR" value={`${realisticMonth12MRR.toLocaleString('vi-VN')} VND`} />
            <Metric label="Total customers" value={`${realisticCumulativeUsers.toLocaleString('vi-VN')}`} className="text-purple-400" />
            <Metric label="SEO payback" value={`~ ${estimatedPaybackWeeks} tuan`} className="text-emerald-400" />
          </div>

          <div className="space-y-5 rounded-2xl border border-slate-900 bg-[#070b13]/85 p-5">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                12-month MRR scenarios
              </span>
              <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[8.5px] font-bold text-emerald-400">
                MRR SPREAD
              </span>
            </div>

            <div className="h-[220px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={calcData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="seoConsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="seoRealGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="seoOptGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
                  <XAxis dataKey="month" stroke="#475569" style={{ fontSize: '9px', fontFamily: 'monospace' }} />
                  <YAxis stroke="#475569" tickFormatter={(value) => `${Number(value) / 1000000}M`} style={{ fontSize: '9px', fontFamily: 'monospace' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b' }}
                    formatter={(value) => [`${Number(value).toLocaleString('vi-VN')} VND`]}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="Than trong" stroke="#f59e0b" strokeWidth={1.5} fill="url(#seoConsGrad)" />
                  <Area type="monotone" dataKey="Khach quan" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#seoRealGrad)" />
                  <Area type="monotone" dataKey="Toi uu" stroke="#10b981" strokeWidth={1.5} fill="url(#seoOptGrad)" strokeDasharray="4 4" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border border-slate-900 bg-slate-950 p-3 text-center text-xs font-semibold italic leading-relaxed text-slate-400">
              Conservative month 12 still reaches <strong className="text-amber-400">{conservativeMonth12MRR.toLocaleString('vi-VN')} VND</strong> MRR with organic traffic assumptions.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  suffix,
  min,
  max,
  step,
  accent,
  onChange,
}: {
  label: string;
  value: number;
  suffix: string;
  min: number;
  max: number;
  step: number;
  accent: string;
  onChange: (next: number) => void;
}) {
  return (
    <label className="block space-y-1.5 text-xs font-semibold">
      <span className="flex items-center justify-between gap-3 text-[11px]">
        <span className="font-bold text-slate-400">{label}</span>
        <span className="font-mono font-extrabold text-cyan-300">
          {value.toLocaleString('vi-VN')} {suffix}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={`h-1 w-full cursor-pointer rounded bg-slate-950 ${accent}`}
      />
    </label>
  );
}

function Metric({ label, value, className = 'text-white' }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-xl border border-slate-900 bg-[#070b13]/85 p-4">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <p className={`mt-1 text-xl font-black ${className}`}>{value}</p>
    </div>
  );
}
