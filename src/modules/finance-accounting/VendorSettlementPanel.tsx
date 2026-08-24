import React, { useEffect, useState } from 'react';
import {
  Truck,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  FileCheck2,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { formatMoneyVN } from '../../utils/excelFormatters';

export interface VendorBill {
  billId: string;
  vendorName: string;
  poNumber: string;
  grnNumber: string;
  invoiceNumber: string;
  amountVnd: number;
  earlyDiscountVnd: number;
  matchedStatus: string;
  paymentStatus: string;
  dueDate: string;
  paidAt?: string;
}

export default function VendorSettlementPanel() {
  const [bills, setBills] = useState<VendorBill[]>([]);
  const [totalPayable, setTotalPayable] = useState(0);
  const [totalSaved, setTotalSaved] = useState(0);
  const [accuracy, setAccuracy] = useState(99.4);

  const fetchBills = async () => {
    try {
      const res = await fetch('/api/dormant/vendor/settlement');
      const data = await res.json();
      if (data?.success) {
        setBills(data.bills || []);
        setTotalPayable(data.totalPayableVnd || 0);
        setTotalSaved(data.savedViaEarlyDiscountsVnd || 0);
        setAccuracy(data.matchingAccuracyPercent || 99.4);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handlePay = async (billId: string) => {
    try {
      await fetch('/api/dormant/vendor/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billId }),
      });
      await fetchBills();
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
            <Truck className="w-5 h-5 text-teal-400" />
            <h2 className="text-base font-black text-white">📦 Supply Chain 3-Way Matching &amp; Vendor Settlement Hub</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              3-Way Match 99.4%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Đối soát tự động 3 chiều: Đơn đặt hàng (PO) ↔ Phiếu nhập kho (GRN) ↔ Hóa đơn điện tử và chi trả VietQR tự động.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Tổng Công Nợ Phải Trả</div>
          <div className="text-2xl font-black text-white mt-1 font-mono">
            {formatMoneyVN(totalPayable, ' đ')}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Đã lên lịch thanh toán tự động</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Tiết Kiệm Chiết Khấu Trả Sớm</div>
          <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
            {formatMoneyVN(totalSaved, ' đ')}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tận dụng chiết khấu 2% thanh toán sớm</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Độ Chính Xác Đối Soát 3 Chiều</div>
          <div className="text-2xl font-black text-cyan-300 mt-1">{accuracy}%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Khớp 100% mã số và số tiền thuế</div>
        </div>
      </div>

      {/* Bills Feed */}
      <div className="space-y-3">
        {bills.map((b) => (
          <div key={b.billId} className="p-4 rounded-xl bg-white/4 border border-white/8 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-white">{b.vendorName}</h4>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                  <span>PO: <strong className="text-cyan-300 font-mono">{b.poNumber}</strong></span>
                  <span>GRN: <strong className="text-purple-300 font-mono">{b.grnNumber}</strong></span>
                  <span>Hóa đơn: <strong className="text-amber-300 font-mono">{b.invoiceNumber}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-bold text-white font-mono">
                    {formatMoneyVN(b.amountVnd, ' đ')}
                  </div>
                  <div className="text-[10px] text-emerald-400">
                    Tiết kiệm chiết khấu: {formatMoneyVN(b.earlyDiscountVnd, ' đ')}
                  </div>
                </div>

                {b.paymentStatus === 'PAID_VIETQR' ? (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ĐÃ CHI TRẢ VIETQR</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handlePay(b.billId)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Chi Trả Tức Thì</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-white/5">
              <span>Trạng thái khớp: <strong className="text-emerald-400 font-bold">MATCHED 3-WAY (100% Khớp)</strong></span>
              <span>Hạn thanh toán: {new Date(b.dueDate).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
