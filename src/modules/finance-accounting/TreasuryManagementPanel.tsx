import React, { useEffect, useState } from 'react';
import {
  Landmark,
  TrendingUp,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  PiggyBank,
} from 'lucide-react';
import { formatMoneyVN } from '../../utils/excelFormatters';

export interface BankAccountBalance {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  liquidBalanceVnd: number;
  yieldEarningBalanceVnd: number;
  annualInterestRatePercent: number;
  lastSyncedAt: string;
}

export default function TreasuryManagementPanel() {
  const [accounts, setAccounts] = useState<BankAccountBalance[]>([]);
  const [totalLiquid, setTotalLiquid] = useState(250000000);
  const [totalYield, setTotalYield] = useState(700000000);
  const [passiveIncome, setPassiveIncome] = useState(36400000);
  const [sweepMsg, setSweepMsg] = useState<string>('');

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dormant/treasury/data');
      const data = await res.json();
      if (data?.success) {
        setAccounts(data.accounts || []);
        setTotalLiquid(data.totalLiquidVnd || 250000000);
        setTotalYield(data.totalYieldEarningVnd || 700000000);
        setPassiveIncome(data.annualPassiveIncomeVnd || 36400000);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSweep = async () => {
    try {
      const res = await fetch('/api/dormant/treasury/sweep', { method: 'POST' });
      const data = await res.json();
      if (data?.success) {
        setSweepMsg(data.message);
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
            <Landmark className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-black text-white">🏦 Autonomous Treasury &amp; High-Yield Cash Hub</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Lãi Suất 5.2%/Năm
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Quản trị thanh khoản kho bạc đa ngân hàng (VCB, TCB, MBB), tự động quét tiền nhàn rỗi qua đêm sinh lãi thụ động.
          </p>
        </div>

        <button
          onClick={handleSweep}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-amber-600/20"
        >
          <Zap className="w-4 h-4" />
          <span>Quét Tiền Nhàn Rỗi (Overnight Sweep)</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Thanh Khoản Sẵn Sàng Chi Trả</div>
          <div className="text-2xl font-black text-cyan-300 mt-1 font-mono">
            {formatMoneyVN(totalLiquid, ' đ')}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Sẵn sàng gạch nợ VietQR tức thì</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Quỹ Đang Sinh Lãi Linh Hoạt</div>
          <div className="text-2xl font-black text-amber-400 mt-1 font-mono">
            {formatMoneyVN(totalYield, ' đ')}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tiền gửi ngắn hạn &amp; Chứng chỉ tiền gửi</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Thu Nhập Thụ Động Dự Kiến / Năm</div>
          <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
            +{formatMoneyVN(passiveIncome, ' đ')}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tối ưu hóa lợi tức kho bạc</div>
        </div>
      </div>

      {/* Sweep Alert */}
      {sweepMsg && (
        <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{sweepMsg}</span>
        </div>
      )}

      {/* Bank Accounts Feed */}
      <div className="space-y-3">
        {accounts.map((a) => (
          <div key={a.bankCode} className="p-4 rounded-xl bg-white/4 border border-white/8 space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-white/10 text-amber-300 font-mono">
                    {a.bankCode}
                  </span>
                  <h4 className="text-xs font-bold text-white">{a.bankName}</h4>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Số tài khoản: <strong className="text-white font-mono">{a.accountNumber}</strong> | Lãi suất: <strong className="text-emerald-400 font-bold">{a.annualInterestRatePercent}%/năm</strong>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-bold text-white font-mono">
                  {formatMoneyVN(a.liquidBalanceVnd + a.yieldEarningBalanceVnd, ' đ')}
                </div>
                <div className="text-[10px] text-slate-400">
                  Khả dụng: {formatMoneyVN(a.liquidBalanceVnd, ' đ')} | Sinh lãi: {formatMoneyVN(a.yieldEarningBalanceVnd, ' đ')}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
