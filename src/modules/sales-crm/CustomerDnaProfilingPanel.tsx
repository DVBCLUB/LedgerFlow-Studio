import React, { useEffect, useState } from 'react';
import { Dna, ShieldCheck, HeartPulse, AlertOctagon, TrendingUp, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { getCustomerDnaProfiles } from '../../utils/salesMarketingApi';

interface Profile {
  customerId: string;
  customerName: string;
  tier: string;
  industry: string;
  healthScore: number;
  churnRiskPercent: number;
  predictedLtvVnd: number;
  propensityToUpgradeScore: number;
  primaryValueDriver: string;
  dnaTraits: string[];
}

const PROFILES: Profile[] = [
  {
    customerId: 'dna_cust_01',
    customerName: 'Tập đoàn Xây dựng Vinaconex 3',
    tier: 'Enterprise',
    industry: 'Xây dựng & Hạ tầng',
    healthScore: 96,
    churnRiskPercent: 3.2,
    predictedLtvVnd: 1_250_000_000,
    propensityToUpgradeScore: 92,
    primaryValueDriver: 'Đối soát 3 chiều & Khấu trừ Thuế VAT Thông tư 80',
    dnaTraits: ['High Invoice Volume', 'Strict TT78 Compliance', 'VietQR Heavy', 'Executive Sponsored']
  },
  {
    customerId: 'dna_cust_02',
    customerName: 'Công ty Cổ phần Dược phẩm Delta Pharma',
    tier: 'Scale',
    industry: 'Dược phẩm & Y tế',
    healthScore: 88,
    churnRiskPercent: 8.5,
    predictedLtvVnd: 580_000_000,
    propensityToUpgradeScore: 78,
    primaryValueDriver: 'AI Sales CRM & Kho Dược Thông minh',
    dnaTraits: ['Fast Growing', 'Multi-Warehouse', 'Low Ticket Volume']
  },
  {
    customerId: 'dna_cust_03',
    customerName: 'Chuỗi Bán lẻ TechVN Retail',
    tier: 'Growth',
    industry: 'Thương mại Bán lẻ',
    healthScore: 74,
    churnRiskPercent: 18.2,
    predictedLtvVnd: 240_000_000,
    propensityToUpgradeScore: 65,
    primaryValueDriver: 'VietQR Dynamic Banking Hub & Dunning',
    dnaTraits: ['Price Sensitive', 'High POS Volume', 'Growing Team']
  }
];

export default function CustomerDnaProfilingPanel() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>(PROFILES);

  useEffect(() => {
    getCustomerDnaProfiles().then((d) => {
      if (d.profiles?.length) setProfiles(d.profiles);
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Dna className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Hồ Sơ DNA Khách Hàng &amp; Phân Khúc Hành Vi (Customer DNA Matrix)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Behavioral AI
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Hồ sơ 360° · Phân khúc hành vi AI · Dự đoán LTV &amp; Churn Risk chính xác 94.2% · Playbook cá nhân hóa.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              94.2% Độ Chính Xác Churn
            </span>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Điểm Sức Khỏe TB (Health)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">
            86.0%
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400/90 font-mono">Tỷ lệ tương tác tài chính cao</p>
        </div>

        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-slate-950 to-indigo-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nhóm Khách Hàng Giá Trị Cao</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-300 font-mono">
            14 Accounts
          </div>
          <p className="mt-1 text-[11px] font-medium text-indigo-400 font-mono">Chiếm 72% tổng ARR</p>
        </div>

        <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-br from-slate-950 to-sky-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pipeline Mở Rộng (Expansion)</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-sky-300 font-mono">
            2.07 Tỷ VND
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Cơ hội upsell sắp chốt</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-950 to-amber-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Độ Chính Xác Dự Đoán Churn</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300 font-mono">
            94.2%
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Mô hình AI Random Forest</p>
        </div>
      </div>

      {/* Customer DNA Matrix */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dna className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Danh Mục Hồ Sơ DNA &amp; Phân Khúc 360°
            </h2>
          </div>
        </div>

        <div className="divide-y divide-slate-800/60">
          {profiles.map((p) => {
            const isOpen = selectedId === p.customerId;
            return (
              <div key={p.customerId} className="p-5 hover:bg-slate-800/20 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-white">{p.customerName}</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {p.tier}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Ngành: <strong className="text-slate-300">{p.industry}</strong> · Dự phóng LTV: <strong className="text-emerald-400 font-mono font-bold">{(p.predictedLtvVnd / 1e6).toFixed(0)}M VND</strong> · Động lực: <em className="text-slate-300 not-italic font-medium">{p.primaryValueDriver}</em>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-xl text-xs font-bold font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      Health: {p.healthScore}/100
                    </span>
                    <span className="px-2.5 py-1 rounded-xl text-xs font-bold font-mono bg-rose-500/10 text-rose-300 border border-rose-500/20">
                      Churn: {p.churnRiskPercent}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedId(isOpen ? null : p.customerId)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs bg-indigo-600/80 hover:bg-indigo-600 text-white transition-all cursor-pointer shadow-md shadow-indigo-500/20"
                    >
                      <span>{isOpen ? 'Thu gọn' : 'Chi tiết DNA'}</span>
                      {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-3 p-4 rounded-2xl bg-slate-950/80 border border-indigo-500/30 text-xs text-slate-300 animate-fade-in space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Đặc Trưng Hành Vi &amp; Gen Khách Hàng (DNA Traits):</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {p.dnaTraits.map((t) => (
                        <span key={t} className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          🧬 {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
