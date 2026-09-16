import React, { useEffect, useState } from 'react';
import {
  HeartPulse,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Gift,
  CheckCircle2,
  Users,
  Activity,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react';

export interface CustomerHealthRecord {
  customerId: string;
  companyName: string;
  planTier: string;
  healthScore: number;
  churnRiskPercent: number;
  sentimentStatus: string;
  activeUsersCount: number;
  lastActiveHoursAgo: number;
  retentionActionTaken?: string;
}

const DEFAULT_CUSTOMERS: CustomerHealthRecord[] = [
  {
    customerId: 'cust_vin_01',
    companyName: 'Tập đoàn Xây dựng & Thương mại Vingroup',
    planTier: 'Enterprise',
    healthScore: 94,
    churnRiskPercent: 4.2,
    sentimentStatus: 'Delighted',
    activeUsersCount: 42,
    lastActiveHoursAgo: 1,
    retentionActionTaken: 'Đã kích hoạt hỗ trợ kỹ thuật chuyên trách 24/7'
  },
  {
    customerId: 'cust_delta_02',
    companyName: 'Delta Logistics Solutions JSC',
    planTier: 'Growth',
    healthScore: 68,
    churnRiskPercent: 38.5,
    sentimentStatus: 'Neutral',
    activeUsersCount: 12,
    lastActiveHoursAgo: 48,
    retentionActionTaken: 'Đang gửi gợi ý tối ưu luồng đối soát tự động'
  },
  {
    customerId: 'cust_tech_03',
    companyName: 'NexTech Software Global Corp',
    planTier: 'Enterprise',
    healthScore: 91,
    churnRiskPercent: 6.8,
    sentimentStatus: 'Delighted',
    activeUsersCount: 28,
    lastActiveHoursAgo: 3,
    retentionActionTaken: 'Đã nâng hạn mức Token AI & Đào tạo nội bộ'
  }
];

export default function CustomerHealthScorePanel() {
  const [customers, setCustomers] = useState<CustomerHealthRecord[]>(DEFAULT_CUSTOMERS);
  const [avgHealth, setAvgHealth] = useState(88);
  const [atRiskCount, setAtRiskCount] = useState(1);
  const [retentionRate, setRetentionRate] = useState(94.6);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dormant/customer-health/data');
      const data = await res.json();
      if (data?.success) {
        setCustomers(data.customers && data.customers.length > 0 ? data.customers : DEFAULT_CUSTOMERS);
        setAvgHealth(data.averageHealthScore || 88);
        setAtRiskCount(data.atRiskCustomersCount || 1);
        setRetentionRate(data.retentionSuccessRatePercent || 94.6);
      }
    } catch {
      // fallback to defaults
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRetain = async (customerId: string) => {
    try {
      await fetch('/api/dormant/customer-health/retain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      });
      await fetchData();
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-rose-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-rose-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <HeartPulse className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Sức Khỏe Khách Hàng 360° & Giữ Chân Tự Động</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Retention {retentionRate}%
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Đo lường chỉ số sức khỏe khách hàng 360 độ, phát hiện sớm nguy cơ rời bỏ (Churn) và tự động kích hoạt kịch bản giữ chân VIP.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Tỷ lệ duy trì: {retentionRate}%
            </span>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-br from-slate-950 to-rose-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Điểm Sức Khỏe Trung Bình</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-300 font-mono">
            {avgHealth} <span className="text-xs text-slate-400 font-normal">/ 100</span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Tần suất dùng &amp; mức độ hài lòng cao</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-950 to-amber-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Khách Hàng Có Nguy Cơ Rời Bỏ</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300 font-mono">
            {atRiskCount} <span className="text-xs text-slate-400 font-normal">doanh nghiệp</span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Đã kích hoạt can thiệp tự động</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tỷ Lệ Giữ Chân Thành Công</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">
            {retentionRate}%
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400/90 font-mono">Tối đa hóa Giá trị Vòng đời (LTV)</p>
        </div>
      </div>

      {/* Customers Feed */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-rose-400" />
            <h2 className="text-sm font-black text-white uppercase tracking-wider">Danh Sách Theo Dõi Sức Khỏe Khách Hàng Real-Time</h2>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold">{customers.length} Tài khoản</span>
        </div>

        <div className="space-y-3">
          {customers.map((c) => (
            <div key={c.customerId} className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-sm font-bold text-white">{c.companyName}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      {c.planTier}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                    <span>Active: <strong className="text-slate-200 font-mono">{c.activeUsersCount} người dùng</strong></span>
                    <span className="text-slate-600">|</span>
                    <span>Hoạt động gần nhất: <strong className="text-slate-200 font-mono">{c.lastActiveHoursAgo} giờ trước</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-bold font-mono">
                      Điểm sức khỏe: <strong className={c.healthScore > 75 ? 'text-emerald-400' : 'text-amber-400'}>{c.healthScore}/100</strong>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Nguy cơ rời bỏ: <strong className={c.churnRiskPercent > 30 ? 'text-rose-400' : 'text-emerald-400'}>{c.churnRiskPercent}%</strong>
                    </div>
                  </div>

                  {c.churnRiskPercent > 30 ? (
                    <button
                      type="button"
                      onClick={() => handleRetain(c.customerId)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-black text-xs transition-all shadow-md cursor-pointer"
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>Ưu Đãi VIP Giữ Chân</span>
                    </button>
                  ) : (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>AN TOÀN</span>
                    </span>
                  )}
                </div>
              </div>

              {c.retentionActionTaken && (
                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span><strong>Hành động AI tự động:</strong> {c.retentionActionTaken}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
