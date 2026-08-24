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
    <div className="p-4 md:p-6 rounded-2xl bg-[#0e0e16] border border-white/8 text-white space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-black text-white">🏆 AI Employee Equity &amp; Performance Bonus Escrow Hub</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Proof-of-Contribution Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Quỹ thưởng hiệu suất và ESOP cổ phiếu tự động cho Swarm AI Agents &amp; Nhân sự cốt lõi, trích trực tiếp từ tăng trưởng doanh thu MRR thực tế.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Tổng Quỹ Thưởng Hiệu Suất (Bonus Pool)</div>
          <div className="text-2xl font-black text-amber-400 mt-1 font-mono">{formatMoneyVN(totalPool, ' đ')}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Trích 5-10% từ MRR tăng thêm</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Quỹ Thưởng Đã Giải Ngân (Disbursed)</div>
          <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">{formatMoneyVN(disbursed, ' đ')}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Thanh toán tự động qua VietQR</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Quỹ Escrow Khóa Chờ Quyết Toán</div>
          <div className="text-2xl font-black text-cyan-300 mt-1 font-mono">{formatMoneyVN(locked, ' đ')}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Hợp đồng thông minh Proof-of-Work</div>
        </div>
      </div>

      {/* Disburse Alert */}
      {disburseMsg && (
        <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{disburseMsg}</span>
        </div>
      )}

      {/* Allocations Feed */}
      <div className="space-y-3">
        {allocations.map((a) => (
          <div key={a.allocationId} className="p-4 rounded-xl bg-white/4 border border-white/8 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white">{a.recipientName}</h4>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 font-mono">
                    {a.recipientType}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-white/10 text-cyan-300 font-mono">
                    {a.proofOfWorkHash}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">{a.role}</p>
                <div className="text-[11px] text-slate-400 mt-1">
                  Đóng góp MRR: <strong className="text-emerald-400">{formatMoneyVN(a.mrrImpactContributedVnd, ' đ')}</strong> ({a.bonusPercentage}% Thưởng)
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-bold text-amber-400 font-mono">
                  {formatMoneyVN(a.bonusAmountVnd, ' đ')}
                </div>
                <div className="text-[10px] text-slate-400">
                  Trạng thái: <strong className={a.payoutStatus === 'DISBURSED_VIA_VIETQR' ? 'text-emerald-400' : 'text-amber-400'}>{a.payoutStatus}</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-white/5">
              {a.payoutStatus === 'ESCROW_LOCKED' ? (
                <button
                  onClick={() => handleDisburse(a.allocationId)}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-amber-600/20"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Giải Ngân Quỹ Thưởng VietQR</span>
                </button>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>ĐÃ GIẢI NGÂN HOÀN TẤT</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
