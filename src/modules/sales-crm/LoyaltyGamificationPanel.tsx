import React, { useEffect, useState } from 'react';
import {
  Trophy,
  Star,
  Gift,
  CheckCircle2,
  TrendingUp,
  Award,
  Zap,
  Users,
} from 'lucide-react';
import { formatMoneyVN } from '../../utils/excelFormatters';

export interface LoyaltyMember {
  memberId: string;
  companyName: string;
  tier: string;
  loyaltyPoints: number;
  totalReferralsCount: number;
  earnedRewardsValueVnd: number;
  kFactorContribution: number;
}

export default function LoyaltyGamificationPanel() {
  const [members, setMembers] = useState<LoyaltyMember[]>([]);
  const [avgK, setAvgK] = useState(1.23);
  const [totalRewards, setTotalRewards] = useState(84000000);
  const [redeemMsg, setRedeemMsg] = useState<string>('');

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dormant/loyalty/members');
      const data = await res.json();
      if (data?.success) {
        setMembers(data.members || []);
        setAvgK(data.averageKFactor || 1.23);
        setTotalRewards(data.totalRewardsDistributedVnd || 84000000);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRedeem = async (memberId: string) => {
    try {
      const res = await fetch('/api/dormant/loyalty/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, pointsToRedeem: 1000 }),
      });
      const data = await res.json();
      if (data?.success) {
        setRedeemMsg(`Đã đổi 1,000 điểm thưởng thành công cho ${data.member.companyName}. Mã voucher: ${data.voucherCode}.`);
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
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-black text-white">🏆 Customer Loyalty &amp; Gamified Referral Engine</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Viral K = 1.23 Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Cơ chế thưởng điểm giới thiệu khách hàng doanh nghiệp, phân hạng thành viên (Diamond/Platinum) và đổi thưởng token tự động.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Hệ Số Lan Truyền Tự Nhiên (Viral K-Factor)</div>
          <div className="text-2xl font-black text-amber-400 mt-1 font-mono">{avgK}x</div>
          <div className="text-[10px] text-slate-400 mt-0.5">K &gt; 1.0 = Tự tăng trưởng Product-Led Growth</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Tổng Giá Trị Thưởng Đã Trao (Rewards)</div>
          <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">{formatMoneyVN(totalRewards, ' đ')}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Quy đổi voucher giảm giá &amp; token AI</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Tỷ Lệ Giữ Chân Khách VIP (Net Retention)</div>
          <div className="text-2xl font-black text-cyan-300 mt-1 font-mono">148.5%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tăng trưởng nhờ cơ chế Gamification</div>
        </div>
      </div>

      {/* Alert */}
      {redeemMsg && (
        <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{redeemMsg}</span>
        </div>
      )}

      {/* Members Feed */}
      <div className="space-y-3">
        {members.map((m) => (
          <div key={m.memberId} className="p-4 rounded-xl bg-white/4 border border-white/8 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white">{m.companyName}</h4>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 font-mono">
                    {m.tier}
                  </span>
                  <span className="text-[11px] text-emerald-400 font-mono font-bold">
                    K = {m.kFactorContribution}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 space-x-3">
                  <span>Điểm thưởng: <strong className="text-amber-400 font-mono">{m.loyaltyPoints.toLocaleString()} Pts</strong></span>
                  <span>Đã giới thiệu: <strong className="text-white font-mono">{m.totalReferralsCount} Khách</strong></span>
                  <span>Tổng thưởng: <strong className="text-emerald-400 font-mono">{formatMoneyVN(m.earnedRewardsValueVnd, ' đ')}</strong></span>
                </div>
              </div>

              <div className="text-right">
                <button
                  onClick={() => handleRedeem(m.memberId)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-amber-600/20"
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>Đổi 1,000 Điểm Lấy Voucher</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
