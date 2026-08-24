import React, { useEffect, useState } from 'react';
import {
  HeartPulse,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Gift,
  CheckCircle2,
  Users,
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

export default function CustomerHealthScorePanel() {
  const [customers, setCustomers] = useState<CustomerHealthRecord[]>([]);
  const [avgHealth, setAvgHealth] = useState(88);
  const [atRiskCount, setAtRiskCount] = useState(1);
  const [retentionRate, setRetentionRate] = useState(94.6);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dormant/customer-health/data');
      const data = await res.json();
      if (data?.success) {
        setCustomers(data.customers || []);
        setAvgHealth(data.averageHealthScore || 88);
        setAtRiskCount(data.atRiskCustomersCount || 1);
        setRetentionRate(data.retentionSuccessRatePercent || 94.6);
      }
    } catch {
      // fallback
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
    <div className="p-4 md:p-6 rounded-2xl bg-[#0e0e16] border border-white/8 text-white space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-rose-400" />
            <h2 className="text-base font-black text-white">❤️ Autonomous Customer Health &amp; Churn Prevention Hub</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Retention 94.6%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Đo lường chỉ số sức khỏe khách hàng 360 độ, phát hiện sớm nguy cơ hủy đăng ký và tự động tung gói giữ chân VIP.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Điểm Sức Khỏe Khách Hàng TB</div>
          <div className="text-2xl font-black text-rose-400 mt-1 font-mono">{avgHealth} / 100</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tần suất dùng &amp; mức độ hài lòng</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Khách Hàng Có Nguy Cơ Rời Bỏ</div>
          <div className="text-2xl font-black text-amber-400 mt-1 font-mono">{atRiskCount} Khách Hàng</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Đã kích hoạt kịch bản can thiệp</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Tỷ Lệ Giữ Chân Thành Công</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{retentionRate}%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tối đa hóa Giá trị Vòng đời (LTV)</div>
        </div>
      </div>

      {/* Customers Feed */}
      <div className="space-y-3">
        {customers.map((c) => (
          <div key={c.customerId} className="p-4 rounded-xl bg-white/4 border border-white/8 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white">{c.companyName}</h4>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-white/10 text-cyan-300">
                    {c.planTier}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Active: <strong>{c.activeUsersCount} người dùng</strong> | Hoạt động gần nhất: <strong>{c.lastActiveHoursAgo} giờ trước</strong>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-bold font-mono">
                    Điểm: <strong className={c.healthScore > 75 ? 'text-emerald-400' : 'text-amber-400'}>{c.healthScore}/100</strong>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Nguy cơ rời bỏ: <strong className={c.churnRiskPercent > 30 ? 'text-rose-400' : 'text-emerald-400'}>{c.churnRiskPercent}%</strong>
                  </div>
                </div>

                {c.churnRiskPercent > 30 ? (
                  <button
                    onClick={() => handleRetain(c.customerId)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>Kích Hoạt Ưu Đãi VIP</span>
                  </button>
                ) : (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>AN TOÀN</span>
                  </span>
                )}
              </div>
            </div>

            {c.retentionActionTaken && (
              <div className="p-2.5 rounded bg-emerald-950/20 border border-emerald-500/30 text-[11px] text-emerald-300">
                🚀 <strong>Hành động giữ chân:</strong> {c.retentionActionTaken}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
