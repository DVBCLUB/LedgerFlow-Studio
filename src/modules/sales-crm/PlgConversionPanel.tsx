import React, { useEffect, useState } from 'react';
import { Rocket, TrendingUp, Clock, Users, DollarSign, CheckCircle2, Zap } from 'lucide-react';
import { getPlgFunnel, triggerPlgUpsell } from '../../utils/salesMarketingApi';

interface PlgMember {
  userId: string;
  tenantName: string;
  plan: string;
  featureAdoptionScore: number;
  upsellEligible: boolean;
  recommendedUpgrade: string;
}

const MEMBERS: PlgMember[] = [
  { userId: 'usr_001', tenantName: 'StarterCorp VN', plan: 'Starter', featureAdoptionScore: 87, upsellEligible: true, recommendedUpgrade: 'Growth' },
  { userId: 'usr_002', tenantName: 'SME Saigon', plan: 'Starter', featureAdoptionScore: 92, upsellEligible: true, recommendedUpgrade: 'Growth' },
  { userId: 'usr_003', tenantName: 'Hanoi Retail', plan: 'Growth', featureAdoptionScore: 78, upsellEligible: false, recommendedUpgrade: '' },
  { userId: 'usr_004', tenantName: 'MidSize Tech', plan: 'Growth', featureAdoptionScore: 45, upsellEligible: false, recommendedUpgrade: '' },
];

export default function PlgConversionPanel() {
  const [upsellSent, setUpsellSent] = useState<string | null>(null);
  const [members, setMembers] = useState<PlgMember[]>(MEMBERS);

  useEffect(() => {
    getPlgFunnel().then((d) => {
      if (d.members?.length) setMembers(d.members);
    }).catch(() => {});
  }, []);

  const candidates = members.filter((m) => m.upsellEligible);

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-purple-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Rocket className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Động Cơ Chuyển Đổi Tăng Trưởng Sản Phẩm (PLG Conversion)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Product-Led Growth
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Feature Adoption · Khoảnh khắc Aha Moment · Kích hoạt Upsell tự động · Mở rộng doanh thu MRR bền vững.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              34.7% Conversion Rate
            </span>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-950 to-purple-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tỷ Lệ Chuyển Đổi PLG</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-300 font-mono">
            34.7%
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400">+4.2% so với tháng trước</p>
        </div>

        <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-br from-slate-950 to-sky-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Thời Gian Chạm Aha-Moment</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-sky-300 font-mono">
            2.8 <span className="text-xs text-slate-400 font-normal">ngày</span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-sky-400">Nhanh gấp 3x trung bình ngành</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-950 to-amber-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Khách Hàng Đạt Chuẩn Upsell</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300 font-mono">
            {candidates.length} Doanh Nghiệp
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Adoption Score &gt; 85%</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ước Tính MRR Mở Rộng</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">
            ₫{(candidates.length * 2).toFixed(0)}M
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400/90 font-mono">Dự báo dòng tiền chuẩn xác</p>
        </div>
      </div>

      {/* Feature Adoption Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Theo Dõi Mức Độ Ứng Dụng Tính Năng (Feature Adoption Tracker)
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3.5">Khách Hàng (Tenant)</th>
                <th className="px-5 py-3.5">Gói Hiện Tại</th>
                <th className="px-5 py-3.5 w-1/4">Adoption Score</th>
                <th className="px-5 py-3.5">Upsell Status</th>
                <th className="px-5 py-3.5">Gói Đề Xuất</th>
                <th className="px-5 py-3.5 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {members.map((m) => (
                <tr key={m.userId} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-white">
                    {m.tenantName}
                  </td>
                  <td className="px-5 py-3.5 text-slate-400">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {m.plan}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>{m.featureAdoptionScore}/100</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            m.featureAdoptionScore > 70 ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${m.featureAdoptionScore}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      m.upsellEligible
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                        : 'bg-slate-800/40 text-slate-500 border-slate-800'
                    }`}>
                      {m.upsellEligible ? '✅ Đủ Chuẩn' : '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-purple-300 font-bold font-mono">
                    {m.recommendedUpgrade || '—'}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {m.upsellEligible && (
                      <button
                        type="button"
                        onClick={() => {
                          setUpsellSent(m.userId);
                          triggerPlgUpsell(m.userId).catch(() => {});
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-md ${
                          upsellSent === m.userId
                            ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                            : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/20'
                        }`}
                      >
                        {upsellSent === m.userId ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Đã Gửi</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5" />
                            <span>Kích Hoạt</span>
                          </>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
