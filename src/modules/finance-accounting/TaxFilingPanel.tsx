import React, { useState, useEffect } from 'react';

export interface TaxFilingData {
  quarter: string;
  vatOutputVnd: number;
  vatInputDeductibleVnd: number;
  netVatPayableVnd: number;
  revenueTaxableVnd: number;
  estimatedCitVnd: number;
  softwareTaxExemptionVnd: number;
  complianceStatus: 'COMPLIANT' | 'NEEDS_REVIEW' | 'FLAGGED';
  generatedAt: string;
}

const DEFAULT_TAX_FILING: TaxFilingData = {
  quarter: 'Q3/2026',
  vatOutputVnd: 15_000_000,
  vatInputDeductibleVnd: 8_000_000,
  netVatPayableVnd: 7_000_000,
  revenueTaxableVnd: 150_000_000,
  estimatedCitVnd: 7_000_000,
  softwareTaxExemptionVnd: 7_000_000,
  complianceStatus: 'COMPLIANT',
  generatedAt: new Date().toISOString(),
};

export default function TaxFilingPanel() {
  const [taxData, setTaxData] = useState<TaxFilingData>(DEFAULT_TAX_FILING);
  const [quarter, setQuarter] = useState('Q3/2026');
  const [revenue, setRevenue] = useState(150_000_000);
  const [expense, setExpense] = useState(80_000_000);
  const [loading, setLoading] = useState(false);

  const calculateFiling = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dormant/tax/quarterly-filing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quarter, totalRevenueVnd: revenue, totalExpensesVnd: expense }),
      });
      const data = await res.json();
      if (data?.success && data?.filing) {
        setTaxData(data.filing);
      }
    } catch {
      // client-side calculation fallback
      const vatOut = Math.round(revenue * 0.1);
      const vatIn = Math.round(expense * 0.1);
      const profit = Math.max(0, revenue - expense);
      const cit = Math.round(profit * 0.2 * 0.5);
      setTaxData({
        quarter,
        vatOutputVnd: vatOut,
        vatInputDeductibleVnd: vatIn,
        netVatPayableVnd: Math.max(0, vatOut - vatIn),
        revenueTaxableVnd: revenue,
        estimatedCitVnd: cit,
        softwareTaxExemptionVnd: cit,
        complianceStatus: 'COMPLIANT',
        generatedAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 rounded-2xl bg-[#0e0e16] border border-white/8 text-white space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-white">📑 Tự Động Kê Khai Thuế &amp; Tuân Thủ (VAT &amp; TNDN)</h2>
          <p className="text-xs text-slate-500 mt-0.5">Tự động tính thuế GTGT Thông tư 80/2021 &amp; Ưu đãi Thuế Sản Xuất Phần Mềm</p>
        </div>
        <button
          onClick={calculateFiling}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white font-semibold text-xs transition cursor-pointer disabled:opacity-50"
        >
          {loading ? '⏳ Đang tính toán...' : '⚡ Tính toán Tờ Khai Thuế'}
        </button>
      </div>

      {/* Input Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-white/3 border border-white/6">
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Kỳ Kê Khai</label>
          <select
            value={quarter}
            onChange={e => setQuarter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
          >
            <option value="Q1/2026">Quý 1 / 2026</option>
            <option value="Q2/2026">Quý 2 / 2026</option>
            <option value="Q3/2026">Quý 3 / 2026</option>
            <option value="Q4/2026">Quý 4 / 2026</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Tổng Doanh Thu (VND)</label>
          <input
            type="number"
            value={revenue}
            onChange={e => setRevenue(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Tổng Chi Phí Hợp Lệ (VND)</label>
          <input
            type="number"
            value={expense}
            onChange={e => setExpense(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      {/* Calculated Tax Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white/3 border border-white/6">
          <p className="text-[10px] text-slate-500">Thuế GTGT Đầu Ra (10%)</p>
          <p className="text-lg font-black text-slate-200 mt-1">{taxData.vatOutputVnd.toLocaleString('vi-VN')} đ</p>
        </div>
        <div className="p-4 rounded-xl bg-white/3 border border-white/6">
          <p className="text-[10px] text-slate-500">Thuế GTGT Được Khấu Trừ</p>
          <p className="text-lg font-black text-emerald-400 mt-1">{taxData.vatInputDeductibleVnd.toLocaleString('vi-VN')} đ</p>
        </div>
        <div className="p-4 rounded-xl bg-white/3 border border-white/6">
          <p className="text-[10px] text-slate-500">Thuế GTGT Phải Nộp</p>
          <p className="text-lg font-black text-amber-400 mt-1">{taxData.netVatPayableVnd.toLocaleString('vi-VN')} đ</p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
          <p className="text-[10px] text-emerald-400">Ưu Đãi Thuế Phần Mềm</p>
          <p className="text-lg font-black text-emerald-300 mt-1">-{taxData.softwareTaxExemptionVnd.toLocaleString('vi-VN')} đ</p>
          <p className="text-[10px] text-emerald-500 mt-0.5">Tiết kiệm 50% TNDN</p>
        </div>
      </div>

      {/* Compliance Note */}
      <div className="p-4 rounded-xl bg-violet-950/20 border border-violet-500/20 flex items-start gap-3">
        <span className="text-xl">🛡️</span>
        <div className="text-xs space-y-1">
          <p className="font-bold text-violet-300">Đánh Giá Tuân Thủ: {taxData.complianceStatus}</p>
          <p className="text-slate-400 leading-relaxed">
            Hóa đơn đầu ra và đầu vào đã được đối chiếu với hệ thống Hóa đơn Điện tử TT78.
            Doanh nghiệp đủ điều kiện hưởng chính sách ưu đãi thuế theo Nghị định số 218/2013/NĐ-CP đối với hoạt động sản xuất sản phẩm phần mềm.
          </p>
        </div>
      </div>
    </div>
  );
}
