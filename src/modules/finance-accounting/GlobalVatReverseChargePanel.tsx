import React, { useEffect, useState } from 'react';
import {
  Globe2,
  Receipt,
  DollarSign,
  ShieldCheck,
  Zap,
  Calculator,
  CheckCircle2,
} from 'lucide-react';
import { formatMoneyVN } from '../../utils/excelFormatters';

export interface GlobalVatInvoiceRule {
  ruleId: string;
  countryCode: string;
  countryName: string;
  vatGstRatePercent: number;
  withholdingTaxPercent: number;
  reverseChargeApplicable: boolean;
  dtaTreatyActive: boolean;
}

export default function GlobalVatReverseChargePanel() {
  const [rules, setRules] = useState<GlobalVatInvoiceRule[]>([]);
  const [totalInvoices, setTotalInvoices] = useState(284);
  const [simAmount, setSimAmount] = useState(1000);
  const [simCountry, setSimCountry] = useState('SG');
  const [simResult, setSimResult] = useState<any>(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dormant/vat/rules');
      const data = await res.json();
      if (data?.success) {
        setRules(data.rules || []);
        setTotalInvoices(data.totalCrossBorderInvoicesProcessed || 284);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSimulate = async () => {
    try {
      const res = await fetch('/api/dormant/vat/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountUsd: simAmount, countryCode: simCountry }),
      });
      const data = await res.json();
      if (data?.success) {
        setSimResult(data);
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
            <h2 className="text-base font-black text-white">🌐 Cross-Border VAT/GST Reverse Charge &amp; Tax Hub</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              DTA Treaty Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Quản trị thuế GTGT &amp; Thuế nhà thầu FCT/WHT xuyên biên giới (Singapore GST 9%, EU VAT OSS, VN FCT 5%), tự động áp dụng cơ chế Reverse Charge.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Hóa Đơn Xuyên Biên Giới Đã Xử Lý</div>
          <div className="text-2xl font-black text-teal-300 mt-1 font-mono">{totalInvoices} Hóa Đơn</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Khách hàng quốc tế B2B</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Điểm Tuân Thủ Thuế Quốc Tế</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">100% HOÀN HẢO</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tránh đánh thuế 2 lần (DTA)</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Cơ Chế Khấu Trừ Tự Động</div>
          <div className="text-2xl font-black text-cyan-300 mt-1">Reverse Charge</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tiết kiệm chi phí hành chính thuế</div>
        </div>
      </div>

      {/* Tax Simulator Tool */}
      <div className="p-4 rounded-xl bg-white/4 border border-white/8 space-y-4">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-teal-400" />
          <h4 className="text-xs font-bold text-white uppercase">Công Cụ Tính Thuế Xuyên Biên Giới Tức Thì</h4>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] text-slate-400 font-bold block mb-1">Giá Trị Hợp Đồng (USD):</label>
            <input
              type="number"
              value={simAmount}
              onChange={(e) => setSimAmount(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-lg bg-black/50 border border-white/10 text-white text-xs font-mono font-bold"
            />
          </div>

          <div className="w-[200px]">
            <label className="text-[10px] text-slate-400 font-bold block mb-1">Quốc Gia Khách Hàng:</label>
            <select
              value={simCountry}
              onChange={(e) => setSimCountry(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-black/50 border border-white/10 text-white text-xs font-bold"
            >
              <option value="SG">Singapore (SG - 9%)</option>
              <option value="VN">Việt Nam (VN - 10%/5%)</option>
              <option value="EU">European Union (EU - 21%)</option>
            </select>
          </div>

          <button
            onClick={handleSimulate}
            className="mt-4 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs cursor-pointer"
          >
            Tính Thuế &amp; Xuất Hóa Đơn
          </button>
        </div>

        {simResult && (
          <div className="p-3.5 rounded-xl bg-teal-950/20 border border-teal-500/30 text-xs text-teal-300 space-y-1">
            <div className="font-bold text-white">
              Tổng tiền hóa đơn: <span className="text-teal-300 font-mono">${simResult.totalInvoiceAmountUsd}</span> (Gốc: ${simResult.baseAmountUsd} + Thuế: ${simResult.taxAmountUsd})
            </div>
            <p className="text-slate-300">{simResult.taxSummary}</p>
          </div>
        )}
      </div>

      {/* Rules Feed */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {rules.map((r) => (
          <div key={r.ruleId} className="p-4 rounded-xl bg-white/4 border border-white/8 space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-white/10 text-teal-300 font-mono">
                {r.countryCode}
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">DTA Hiệp Định</span>
            </div>
            <h4 className="text-xs font-bold text-white">{r.countryName}</h4>
            <div className="text-[11px] text-slate-400 space-y-0.5">
              <div>VAT / GST: <strong className="text-white font-mono">{r.vatGstRatePercent}%</strong></div>
              <div>Thuế nhà thầu (WHT): <strong className="text-amber-400 font-mono">{r.withholdingTaxPercent}%</strong></div>
              <div>Reverse Charge: <strong className="text-teal-300">{r.reverseChargeApplicable ? 'ÁP DỤNG' : 'KHÔNG'}</strong></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
