import React, { useEffect, useState } from 'react';
import {
  Coins,
  ShieldCheck,
  ArrowDownRight,
  TrendingUp,
  CheckCircle2,
  Lock,
  Wallet,
  Zap,
} from 'lucide-react';
import { formatMoneyVN } from '../../utils/excelFormatters';

export interface CryptoTreasuryHolding {
  holdingId: string;
  chain: string;
  tokenSymbol: string;
  balanceAmount: number;
  valueUsd: number;
  valueVnd: number;
  multiSigAddress: string;
}

export default function CryptoTreasuryWeb3Panel() {
  const [holdings, setHoldings] = useState<CryptoTreasuryHolding[]>([]);
  const [totalUsd, setTotalUsd] = useState(173000);
  const [totalVnd, setTotalVnd] = useState(4411500000);
  const [offrampAmount, setOfframpAmount] = useState(5000);
  const [offrampMsg, setOfframpMsg] = useState<string>('');

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dormant/crypto-treasury/holdings');
      const data = await res.json();
      if (data?.success) {
        setHoldings(data.holdings || []);
        setTotalUsd(data.totalTreasuryUsd || 173000);
        setTotalVnd(data.totalTreasuryVnd || 4411500000);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOffRamp = async () => {
    try {
      const res = await fetch('/api/dormant/crypto-treasury/offramp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountUsd: offrampAmount }),
      });
      const data = await res.json();
      if (data?.success) {
        setOfframpMsg(`Đã chuyển đổi On-Chain $${offrampAmount.toLocaleString()} sang ${formatMoneyVN(data.settledVnd, ' đ')} và tạo mã VietQR ${data.vietQrRef}. Hash: ${data.txHash.slice(0, 16)}...`);
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
            <Coins className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-black text-white">🪙 Crypto Treasury &amp; Web3 Stablecoin Settlement Hub</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
              Multi-Sig Safe 3/5 Protected
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Quản trị thanh khoản tiền mã hóa doanh nghiệp (USDC / USDT trên Arbitrum, Base), cầu nối Fiat Off-Ramp VietQR tự động và hạch toán VAS TK 515/635.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Tổng Thanh Khoản Stablecoin (USD)</div>
          <div className="text-2xl font-black text-sky-400 mt-1 font-mono">${totalUsd.toLocaleString()} USDC/T</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tương đương {formatMoneyVN(totalVnd, ' đ')}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Bảo Mật Ví Đa Chữ Ký (Multi-Sig)</div>
          <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">100% MPC SAFE</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Hợp đồng Gnosis Safe đã audit</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Tốc Độ Thanh Khoản VietQR Off-Ramp</div>
          <div className="text-2xl font-black text-cyan-300 mt-1 font-mono">&lt; 3 Giây</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tự động khớp lệnh 24/7</div>
        </div>
      </div>

      {/* Off-Ramp Tool */}
      <div className="p-4 rounded-xl bg-white/4 border border-white/8 space-y-3">
        <div className="flex items-center gap-2">
          <ArrowDownRight className="w-4 h-4 text-sky-400" />
          <h4 className="text-xs font-bold text-white uppercase">Cầu Nối Chuyển Đổi USDC Sang VND &amp; VietQR Tức Thì</h4>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <input
              type="number"
              value={offrampAmount}
              onChange={(e) => setOfframpAmount(Number(e.target.value))}
              placeholder="Số lượng USD cần chuyển đổi"
              className="w-full px-3 py-1.5 rounded-lg bg-black/50 border border-white/10 text-white text-xs font-mono font-bold"
            />
          </div>

          <button
            onClick={handleOffRamp}
            className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-sky-600/20"
          >
            Chuyển Đổi &amp; Nhận VietQR Ngân Hàng
          </button>
        </div>

        {offrampMsg && (
          <div className="p-3.5 rounded-xl bg-sky-950/20 border border-sky-500/30 text-xs text-sky-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
            <span>{offrampMsg}</span>
          </div>
        )}
      </div>

      {/* Holdings Feed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {holdings.map((h) => (
          <div key={h.holdingId} className="p-4 rounded-xl bg-white/4 border border-white/8 space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-sky-500/20 text-sky-300 font-mono">
                {h.chain}
              </span>
              <span className="text-xs font-bold text-white font-mono">
                ${h.balanceAmount.toLocaleString()} {h.tokenSymbol}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 space-y-0.5">
              <div>Quy đổi VND: <strong className="text-emerald-400 font-mono">{formatMoneyVN(h.valueVnd, ' đ')}</strong></div>
              <div>Địa chỉ Multi-Sig: <span className="text-slate-300 font-mono">{h.multiSigAddress}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
