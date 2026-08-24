import React, { useEffect, useState } from 'react';
import {
  Globe2,
  DollarSign,
  ArrowRightLeft,
  ShieldCheck,
  RefreshCw,
  TrendingUp,
  FileSpreadsheet,
  Layers,
} from 'lucide-react';
import { formatMoneyVN } from '../../utils/excelFormatters';

export interface CurrencyFxRate {
  currencyCode: string;
  rateToVnd: number;
  lastUpdated: string;
  source: string;
}

export interface DualStandardAccountMap {
  vasAccountCode: string;
  vasAccountName: string;
  ifrsAccountCode: string;
  ifrsAccountName: string;
  category: string;
}

export default function GlobalLocalizationAdapterPanel() {
  const [fxRates, setFxRates] = useState<CurrencyFxRate[]>([]);
  const [dualAccounts, setDualAccounts] = useState<DualStandardAccountMap[]>([]);
  const [amount, setAmount] = useState('1000');
  const [fromCurr, setFromCurr] = useState('USD');
  const [toCurr, setToCurr] = useState('VND');
  const [conversionResult, setConversionResult] = useState<string>('');

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dormant/localization/data');
      const data = await res.json();
      if (data?.success) {
        setFxRates(data.fxRates || []);
        setDualAccounts(data.dualStandardAccounts || []);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConvert = async () => {
    try {
      const res = await fetch(
        `/api/dormant/localization/convert?amount=${amount}&from=${fromCurr}&to=${toCurr}`
      );
      const data = await res.json();
      if (data?.success) {
        setConversionResult(data.formattedText);
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
            <Globe2 className="w-5 h-5 text-teal-400" />
            <h2 className="text-base font-black text-white">🌐 Global Multi-Currency &amp; Dual VAS / IFRS Standard Adapter</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              SBV Live FX
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Chuyển đổi tức thì báo cáo tài chính giữa chuẩn VAS (Việt Nam) và IFRS/US GAAP (Toàn cầu), đồng bộ tỷ giá Ngân hàng Nhà nước.
          </p>
        </div>
      </div>

      {/* FX Rates Ticker */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {fxRates.filter((r) => r.currencyCode !== 'VND').map((rate) => (
          <div key={rate.currencyCode} className="p-3.5 rounded-xl bg-white/4 border border-white/8">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold">{rate.currencyCode} / VND</span>
              <span className="text-[9px] text-emerald-400">Live</span>
            </div>
            <div className="text-lg font-black text-white mt-1 font-mono">
              {formatMoneyVN(rate.rateToVnd, ' đ')}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Nguồn: SBV</div>
          </div>
        ))}
      </div>

      {/* Live Converter Widget */}
      <div className="p-4 rounded-xl bg-black/40 border border-white/8 space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Công Cụ Quy Đổi Ngoại Tệ Nhanh</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400">Số tiền</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-xs text-white font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-400">Từ (From)</label>
            <select
              value={fromCurr}
              onChange={(e) => setFromCurr(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-xs text-white"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="SGD">SGD (S$)</option>
              <option value="VND">VND (đ)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-400">Sang (To)</label>
            <select
              value={toCurr}
              onChange={(e) => setToCurr(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-xs text-white"
            >
              <option value="VND">VND (đ)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="SGD">SGD (S$)</option>
            </select>
          </div>

          <button
            onClick={handleConvert}
            className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs cursor-pointer h-9 flex items-center justify-center gap-1.5"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Quy Đổi</span>
          </button>
        </div>

        {conversionResult && (
          <div className="p-3 rounded-lg bg-teal-950/20 border border-teal-500/30 text-xs text-teal-300 font-mono font-bold">
            {conversionResult}
          </div>
        )}
      </div>

      {/* Dual VAS ↔ IFRS Mapping Table */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Bảng Ánh Xạ Chuẩn Mực Kế Toán Kép (VAS ↔ IFRS)</h3>
        <div className="rounded-xl border border-white/8 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 border-b border-white/8 text-slate-400">
              <tr>
                <th className="p-3">Mã VAS (Việt Nam)</th>
                <th className="p-3">Tên Tài Khoản VAS</th>
                <th className="p-3">Mã IFRS (Quốc Tế)</th>
                <th className="p-3">Tên Tài Khoản IFRS</th>
                <th className="p-3">Phân Loại</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {dualAccounts.map((row, i) => (
                <tr key={i} className="hover:bg-white/2">
                  <td className="p-3 font-mono font-bold text-cyan-300">{row.vasAccountCode}</td>
                  <td className="p-3">{row.vasAccountName}</td>
                  <td className="p-3 font-mono font-bold text-purple-300">{row.ifrsAccountCode}</td>
                  <td className="p-3">{row.ifrsAccountName}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-white/10 text-slate-300">
                      {row.category}
                    </span>
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
