import React, { useEffect, useState } from 'react';
import {
  Award,
  DollarSign,
  TrendingUp,
  Lock,
  Unlock,
  CheckCircle2,
  Bot,
  UserCheck,
  Zap,
} from 'lucide-react';
import { formatMoneyVN } from '../../utils/excelFormatters';

export interface AgentBonusAllocation {
  allocationId: string;
  recipientName: string;
  recipientType: string;
  role: string;
  mrrImpactContributedVnd: number;
  bonusPercentage: number;
  bonusAmountVnd: number;
  payoutStatus: string;
  proofOfWorkHash: string;
}

export default function AiBonusEscrowPanel() {
  const [allocations, setAllocations] = useState<AgentBonusAllocation[]>([]);
  const [totalPool, setTotalPool] = useState(176500000);
  const [disbursed, setDisbursed] = useState(34000000);
  const [locked, setLocked] = useState(142500000);
  const [disburseMsg, setDisburseMsg] = useState<string>('');

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dormant/ai-bonus/allocations');
      const data = await res.json();
      if (data?.success) {
        setAllocations(data.allocations || []);
        setTotalPool(data.totalBonusPoolVnd || 176500000);
        setDisbursed(data.totalDisbursedVnd || 34000000);
        setLocked(data.escrowLockedVnd || 142500000);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDisburse = async (allocationId: string) => {
    try {
      const res = await fetch('/api/dormant/ai-bonus/disburse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allocationId }),
      });
      const data = await res.json();
      if (data?.success) {
        setDisburseMsg(`Đã giải ngân thành công khoản thưởng cho ${data.allocation.recipientName} qua lệnh chuyển tiền ${data.payoutRef}.`);
        await fetchData();
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Award className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Quỹ Thưởng Hiệu Suất &amp; Escrow AI (Bonus Escrow Hub)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Proof-of-Contribution
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Quỹ thưởng hiệu suất và ESOP cổ phiếu tự động cho Swarm AI Agents &amp; Nhân sự cốt lõi, trích trực tiếp từ tăng trưởng doanh thu MRR thực tế.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Tổng Quỹ: {formatMoneyVN(totalPool, ' đ')}
            </span>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-950 to-amber-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng Quỹ Thưởng (Bonus Pool)</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-400 font-mono">{formatMoneyVN(totalPool, ' đ')}</div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Trích 5-10% từ MRR tăng thêm</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quỹ Đã Giải Ngân (Disbursed)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-400 font-mono">{formatMoneyVN(disbursed, ' đ')}</div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400 font-mono">Thanh toán tự động qua VietQR</p>
        </div>

        <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-950 to-cyan-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quỹ Escrow Khóa Chờ Quyết Toán</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-cyan-300 font-mono">{formatMoneyVN(locked, ' đ')}</div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Smart Contract Proof-of-Work</p>
        </div>
      </div>

      {/* Disburse Alert */}
      {disburseMsg && (
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-xs font-bold text-amber-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{disburseMsg}</span>
        </div>
      )}

      {/* Allocations Feed */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-black text-white">Danh Sách Phân Bổ Thưởng &amp; Cổ Phần ESOP</h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">Escrow Vault</span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {allocations.map((a) => (
            <div key={a.allocationId} className="p-4 sm:p-5 hover:bg-slate-800/30 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white">{a.recipientName}</span>
                  <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                    {a.recipientType}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg text-[9px] font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-500/20">
                    {a.proofOfWorkHash}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-400">{a.role}</p>
                <div className="text-xs text-slate-400">
                  Đóng góp MRR: <strong className="text-emerald-400 font-mono">{formatMoneyVN(a.mrrImpactContributedVnd, ' đ')}</strong> ({a.bonusPercentage}% Thưởng)
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-right">
                <div>
                  <div className="text-base font-black text-amber-400 font-mono">
                    {formatMoneyVN(a.bonusAmountVnd, ' đ')}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Trạng thái: <strong className={a.payoutStatus === 'DISBURSED_VIA_VIETQR' ? 'text-emerald-400' : 'text-amber-400'}>{a.payoutStatus}</strong>
                  </div>
                </div>

                {a.payoutStatus === 'ESCROW_LOCKED' ? (
                  <button
                    type="button"
                    onClick={() => handleDisburse(a.allocationId)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold text-xs shadow-lg shadow-amber-600/20 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Giải Ngân VietQR</span>
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ĐÃ GIẢI NGÂN</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
