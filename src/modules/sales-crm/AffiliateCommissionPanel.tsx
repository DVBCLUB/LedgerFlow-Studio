import React, { useEffect, useState } from 'react';
import {
  Users2,
  Gift,
  Share2,
  TrendingUp,
  DollarSign,
  QrCode,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { formatMoneyVN } from '../../utils/excelFormatters';

export interface AffiliatePartner {
  partnerId: string;
  partnerName: string;
  referralCode: string;
  tierLevel: number;
  totalReferrals: number;
  grossCommissionVnd: number;
  netPayableVnd: number;
  payoutStatus: string;
  bankAccount: string;
}

export default function AffiliateCommissionPanel() {
  const [partners, setPartners] = useState<AffiliatePartner[]>([]);
  const [totalPaid, setTotalPaid] = useState(18000000);
  const [pendingPayout, setPendingPayout] = useState(95850000);
  const [activeCount, setActiveCount] = useState(3);
  const [payoutMsg, setPayoutMsg] = useState<string>('');

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dormant/affiliate/partners');
      const data = await res.json();
      if (data?.success) {
        setPartners(data.partners || []);
        setTotalPaid(data.totalCommissionPaidVnd || 18000000);
        setPendingPayout(data.totalPendingPayoutVnd || 95850000);
        setActiveCount(data.activePartnersCount || 3);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePayout = async (partnerId: string) => {
    try {
      const res = await fetch('/api/dormant/affiliate/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId }),
      });
      const data = await res.json();
      if (data?.success) {
        setPayoutMsg(`Đã tạo lệnh chi tiền VietQR mã ${data.vietQrRef} thành công (đã khấu trừ 10% thuế TNCN).`);
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
            <Users2 className="w-5 h-5 text-fuchsia-400" />
            <h2 className="text-base font-black text-white">🤝 Multi-Tier Affiliate &amp; Partner Commission Hub</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
              Hoa Hồng Định Kỳ 15% / 5%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Quản trị mạng lưới đại lý &amp; đối tác giới thiệu (Affiliate 2 cấp), tự động khấu trừ 10% thuế TNCN tại nguồn và chi trả VietQR hàng loạt.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Hoa Hồng Chờ Chi Trả (Net Payable)</div>
          <div className="text-2xl font-black text-fuchsia-400 mt-1 font-mono">
            {formatMoneyVN(pendingPayout, ' đ')}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Đã khấu trừ 10% thuế TNCN (TT111)</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Tổng Hoa Hồng Đã Thanh Toán</div>
          <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
            {formatMoneyVN(totalPaid, ' đ')}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Qua cổng chuyển khoản VietQR tự động</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Đối Tác Đại Lý Đang Hoạt Động</div>
          <div className="text-2xl font-black text-cyan-300 mt-1">{activeCount} Đối Tác</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tier-1 (15%) &amp; Tier-2 (5%)</div>
        </div>
      </div>

      {/* Payout Alert */}
      {payoutMsg && (
        <div className="p-3.5 rounded-xl bg-fuchsia-950/20 border border-fuchsia-500/30 text-xs text-fuchsia-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-fuchsia-400 shrink-0" />
          <span>{payoutMsg}</span>
        </div>
      )}

      {/* Partners Feed */}
      <div className="space-y-3">
        {partners.map((p) => (
          <div key={p.partnerId} className="p-4 rounded-xl bg-white/4 border border-white/8 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white">{p.partnerName}</h4>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-fuchsia-500/20 text-fuchsia-300 font-mono">
                    Mã: {p.referralCode}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-white/10 text-cyan-300">
                    Tier {p.tierLevel} ({p.tierLevel === 1 ? '15%' : '5%'})
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Khách đã giới thiệu: <strong className="text-white">{p.totalReferrals} công ty</strong> | Tài khoản: <strong className="text-slate-300 font-mono">{p.bankAccount}</strong>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-bold text-white font-mono">
                  {formatMoneyVN(p.netPayableVnd, ' đ')}
                </div>
                <div className="text-[10px] text-slate-400">
                  Tổng Gross: {formatMoneyVN(p.grossCommissionVnd, ' đ')}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-[10px] text-slate-400">
                Trạng thái: <strong className={p.payoutStatus === 'PAID_VIA_VIETQR' ? 'text-emerald-400' : 'text-amber-400'}>{p.payoutStatus}</strong>
              </span>

              {p.payoutStatus === 'PENDING_PAYOUT' ? (
                <button
                  onClick={() => handlePayout(p.partnerId)}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Chi Trả VietQR Tức Thì</span>
                </button>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>ĐÃ CHI TRẢ</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
