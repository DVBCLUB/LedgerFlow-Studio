import React, { useState, useMemo } from 'react';
import { Calculator, ShieldAlert, Check, HelpCircle } from 'lucide-react';

export default function FrictionalCostCalculator() {
  const [revenue, setRevenue] = useState<number>(30000000); // 30M monthly revenue
  const [gatewayRate, setGatewayRate] = useState<number>(2.5); // 2.5% card/gateway fee
  const [adsSpent, setAdsSpent] = useState<number>(5000000); // 5M monthly ads spent
  const [hasFctTax, setHasFctTax] = useState<boolean>(true); // FCT tax risk
  const [invoiceCost, setInvoiceCost] = useState<number>(600000); // Annual e-invoice cost

  const calculation = useMemo(() => {
    // Payment gateway cost per month
    const gatewayCost = Math.round(revenue * (gatewayRate / 100));

    // Foreign Contractor Tax (FCT) risk (typically 10% on corporate tax for ads if not declared properly)
    const fctTaxMonthly = hasFctTax ? Math.round(adsSpent * 0.1) : 0;

    // Total monthly frictional costs
    const totalMonthly = gatewayCost + fctTaxMonthly;

    // Total annual frictional costs
    const totalAnnual = totalMonthly * 12 + invoiceCost;

    return { gatewayCost, fctTaxMonthly, totalMonthly, totalAnnual };
  }, [revenue, gatewayRate, adsSpent, hasFctTax, invoiceCost]);

  const money = (val: number) => new Intl.NumberFormat('vi-VN').format(val) + 'đ';

  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-6 text-left shadow-xl">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
        <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-xl">
          <Calculator className="w-5 h-5 animate-spin-slow" />
        </div>
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider">Financial Frictional Cost Calculator</h3>
          <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">Đo lường và tối ưu hóa các loại chi phí ma sát vận hành ẩn (thuế nhà thầu, phí thanh toán, phí chứng từ).</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-3 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-350 mb-1">1. Doanh thu kỳ vọng hàng tháng:</label>
            <input
              type="number"
              value={revenue}
              onChange={(e) => setRevenue(Math.max(0, Number(e.target.value) || 0))}
              className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-slate-350">2. Phí cổng thanh toán / chuyển khoản:</span>
              <span className="text-emerald-400 font-mono">{gatewayRate}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="0.1"
              value={gatewayRate}
              onChange={(e) => setGatewayRate(Number(e.target.value))}
              className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-semibold">
              <span>Chuyển khoản tay (0%)</span>
              <span>Cổng thẻ Visa/Master (2.5% - 3.5%)</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-350 mb-1">3. Ngân sách chạy ads Facebook/Google tháng:</label>
            <input
              type="number"
              value={adsSpent}
              onChange={(e) => setAdsSpent(Math.max(0, Number(e.target.value) || 0))}
              className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-bold">
            <input
              type="checkbox"
              id="hasFctTax"
              checked={hasFctTax}
              onChange={(e) => setHasFctTax(e.target.checked)}
              className="accent-emerald-500 cursor-pointer"
            />
            <label htmlFor="hasFctTax" className="text-slate-300 cursor-pointer">
              Tính rủi ro Thuế nhà thầu nước ngoài (FCT) (+10% chi phí ads nếu không tự khai thuế)
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-350 mb-1">4. Phí duy trì hóa đơn điện tử / chữ ký số năm:</label>
            <input
              type="number"
              value={invoiceCost}
              onChange={(e) => setInvoiceCost(Math.max(0, Number(e.target.value) || 0))}
              className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
            />
          </div>
        </div>

        {/* Right Column: Calculated Results */}
        <div className="lg:col-span-2 flex flex-col justify-between bg-slate-950/60 rounded-xl p-5 border border-slate-850/80">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Phí ma sát hàng tháng</span>
              <p className="text-2xl font-black text-rose-350 font-mono mt-1">{money(calculation.totalMonthly)}</p>
              <div className="text-[9.5px] text-slate-400 mt-1 font-semibold space-y-0.5 leading-relaxed">
                <p>• Phí cổng nhận tiền: {money(calculation.gatewayCost)}</p>
                <p>• Thuế nhà thầu ads: {money(calculation.fctTaxMonthly)}</p>
              </div>
            </div>

            <div className="border-t border-slate-900 pt-3">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Tổng chi ma sát ước tính / năm</span>
              <p className="text-3xl font-black text-white font-mono mt-1">{money(calculation.totalAnnual)}</p>
            </div>

            <div className="border-t border-slate-900 pt-3 text-left">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">💡 Cách giảm thiểu ma sát:</span>
              <ul className="text-[10px] text-slate-350 mt-1.5 space-y-1 font-bold">
                <li>• Khuyến khích KH thanh toán bằng quét mã VietQR chuyển khoản (0% phí).</li>
                <li>• Liên kết MST cá nhân/doanh nghiệp Việt Nam vào tài khoản Facebook Ads để họ tự thu và nộp 5% VAT nhà thầu hộ bạn.</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-[9px] font-black text-rose-300/90 border border-rose-500/10 bg-rose-500/5 p-2 rounded-lg">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>Mô phỏng tối ưu thuế & ma sát tài chính doanh nghiệp.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
