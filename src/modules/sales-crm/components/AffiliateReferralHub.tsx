import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardList, Copy, Gift, Link2, ShieldCheck, TrendingUp, UserPlus, Users, WalletCards } from 'lucide-react';
import {
  COMMISSION_MODELS,
  FRAUD_CONTROLS,
  PARTNER_ONBOARDING,
  PARTNER_TYPES,
  PAYOUT_CHECKLIST,
  REFERRAL_MESSAGES
} from '../../../data/affiliateReferralKnowledge';

type ReferralTab = 'partners' | 'commission' | 'controls' | 'messages';

const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value);

type Partner = {
  name: string;
  type: string;
  leads: number;
  customers: number;
  revenue: number;
  pendingCommission: number;
};

const initialPartners: Partner[] = [
  { name: 'Kế toán dịch vụ A', type: 'Kế toán dịch vụ', leads: 18, customers: 4, revenue: 8_800_000, pendingCommission: 1_320_000 },
  { name: 'Tư vấn thuế B', type: 'Tư vấn thuế', leads: 11, customers: 3, revenue: 12_000_000, pendingCommission: 2_400_000 },
  { name: 'IT triển khai local', type: 'Đại lý triển khai', leads: 9, customers: 2, revenue: 14_000_000, pendingCommission: 3_000_000 }
];

export default function AffiliateReferralHub() {
  const [tab, setTab] = useState<ReferralTab>('partners');
  const [partners] = useState<Partner[]>(initialPartners);
  const [commissionRate, setCommissionRate] = useState(20);
  const [monthlyFee, setMonthlyFee] = useState(599000);
  const [months, setMonths] = useState(12);
  const [copied, setCopied] = useState<string | null>(null);

  const metrics = useMemo(() => {
    const leads = partners.reduce((sum, item) => sum + item.leads, 0);
    const customers = partners.reduce((sum, item) => sum + item.customers, 0);
    const revenue = partners.reduce((sum, item) => sum + item.revenue, 0);
    const pending = partners.reduce((sum, item) => sum + item.pendingCommission, 0);
    return {
      leads,
      customers,
      revenue,
      pending,
      conversion: leads > 0 ? Math.round((customers / leads) * 100) : 0
    };
  }, [partners]);

  const commissionEstimate = useMemo(() => {
    const customerRevenue = monthlyFee * months;
    return Math.round(customerRevenue * (commissionRate / 100));
  }, [monthlyFee, months, commissionRate]);

  const partnerBrief = `KẾ HOẠCH REFERRAL LEDGERFLOW\n\nĐối tác ưu tiên: kế toán dịch vụ, tư vấn thuế, kế toán trưởng, IT triển khai local.\nƯu đãi: hoa hồng một lần hoặc định kỳ theo khách thanh toán thật.\nĐiều kiện trả: khách đã thanh toán, không hoàn tiền, referral code khớp log.\nThông điệp chính: LedgerFlow giúp SME/solo founder gom daily brief, tạm ứng treo, hồ sơ thiếu, dữ liệu rời rạc và báo cáo sếp chậm trong một Company OS local-first.`;

  const copyText = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1200);
  };

  const tabs: { id: ReferralTab; label: string }[] = [
    { id: 'partners', label: 'Partners' },
    { id: 'commission', label: 'Commission' },
    { id: 'controls', label: 'Controls' },
    { id: 'messages', label: 'Messages' }
  ];

  return (
    <div className="space-y-6 text-slate-100">
      <section className="rounded-3xl border border-border-primary bg-gradient-to-br from-slate-950 via-slate-950 to-green-950/30 p-6 shadow-2xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-green-300">
              <Gift className="h-3.5 w-3.5" />
              Affiliate & Referral Hub
            </div>
            <h1 className="text-2xl font-black tracking-tight text-text-primary">
              Kênh giới thiệu khách hàng Company OS
            </h1>
            <p className="mt-3 text-sm font-semibold leading-7 text-text-secondary">
              Module này giúp thiết kế chương trình cộng tác viên/referral cho LedgerFlow Company OS và accounting templates:
              ai nên làm đối tác, trả hoa hồng thế nào, chống gian lận ra sao, và dùng thông điệp nào để không spam.
            </p>
          </div>

          <button
            onClick={() => copyText('brief', partnerBrief)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-400 px-4 py-3 text-xs font-black text-slate-950 shadow-lg shadow-green-500/10"
          >
            <Copy className="h-4 w-4" />
            {copied === 'brief' ? 'Đã copy' : 'Copy kế hoạch referral'}
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`rounded-xl px-4 py-2 text-xs font-black transition ${
                tab === item.id
                  ? 'bg-green-400 text-slate-950'
                  : 'border border-border-primary bg-bg-primary text-text-secondary hover:text-text-primary'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5">
          <Users className="mb-3 h-5 w-5 text-green-300" />
          <p className="text-[10px] font-black uppercase text-text-tertiary">Leads</p>
          <p className="mt-2 text-3xl font-black text-text-primary">{metrics.leads}</p>
        </div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5">
          <UserPlus className="mb-3 h-5 w-5 text-cyan-300" />
          <p className="text-[10px] font-black uppercase text-text-tertiary">Customers</p>
          <p className="mt-2 text-3xl font-black text-text-primary">{metrics.customers}</p>
        </div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5">
          <TrendingUp className="mb-3 h-5 w-5 text-emerald-300" />
          <p className="text-[10px] font-black uppercase text-text-tertiary">Conversion</p>
          <p className="mt-2 text-3xl font-black text-text-primary">{metrics.conversion}%</p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <WalletCards className="mb-3 h-5 w-5 text-amber-300" />
          <p className="text-[10px] font-black uppercase text-amber-200">Pending payout</p>
          <p className="mt-2 text-2xl font-black text-text-primary">{money(metrics.pending)}đ</p>
        </div>
      </section>

      {tab === 'partners' && (
        <section className="grid gap-4 lg:grid-cols-2">
          {PARTNER_TYPES.map((item) => (
            <div key={item.type} className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5">
              <Users className="mb-3 h-5 w-5 text-green-300" />
              <h2 className="text-sm font-black text-text-primary">{item.type}</h2>
              <p className="mt-2 text-xs font-semibold leading-6 text-text-secondary"><span className="font-black text-slate-200">Phù hợp:</span> {item.fit}</p>
              <p className="mt-2 text-xs font-semibold leading-6 text-emerald-300"><span className="font-black">Offer:</span> {item.offer}</p>
              <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs font-semibold leading-6 text-amber-100">
                {item.risk}
              </div>
            </div>
          ))}
        </section>
      )}

      {tab === 'commission' && (
        <section className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2 rounded-2xl border border-border-primary bg-bg-surface/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-text-primary">
              <WalletCards className="h-4 w-4 text-green-300" />
              Commission calculator
            </h2>
            <div className="space-y-4">
              {[
                ['Phí tháng/khách', monthlyFee, setMonthlyFee],
                ['Số tháng tính hoa hồng', months, setMonths],
                ['Tỷ lệ hoa hồng %', commissionRate, setCommissionRate]
              ].map(([label, value, setter]) => (
                <label key={label as string} className="block">
                  <span className="mb-1 block text-xs font-black text-text-secondary">{label as string}</span>
                  <input
                    type="number"
                    value={value as number}
                    onChange={(e) => (setter as React.Dispatch<React.SetStateAction<number>>)(Number(e.target.value) || 0)}
                    className="w-full rounded-xl border border-border-primary bg-slate-950 p-3 text-sm font-bold text-text-primary outline-none focus:border-green-400"
                  />
                </label>
              ))}
            </div>
            <div className="mt-5 rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
              <p className="text-[10px] font-black uppercase text-green-200">Hoa hồng ước tính/khách</p>
              <p className="mt-2 text-3xl font-black text-text-primary">{money(commissionEstimate)}đ</p>
            </div>
          </div>

          <div className="lg:col-span-3 rounded-2xl border border-border-primary bg-bg-surface/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-text-primary">
              <ClipboardList className="h-4 w-4 text-cyan-300" />
              Mô hình hoa hồng
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {COMMISSION_MODELS.map((item) => (
                <div key={item.model} className="rounded-xl border border-border-primary bg-slate-950/70 p-4">
                  <h3 className="text-sm font-black text-text-primary">{item.model}</h3>
                  <code className="mt-3 block rounded-lg bg-black/30 p-3 text-[11px] font-bold text-green-300">{item.formula}</code>
                  <p className="mt-3 text-xs font-semibold leading-6 text-text-secondary">{item.bestFor}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {tab === 'controls' && (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-text-primary">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              Chống gian lận referral
            </h2>
            <div className="space-y-3">
              {FRAUD_CONTROLS.map((item) => (
                <div key={item.risk} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <h3 className="text-sm font-black text-amber-100">{item.risk}</h3>
                  <p className="mt-2 text-xs font-semibold leading-6 text-text-secondary">Kiểm soát: {item.control}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-text-primary">
              <CheckCircle2 className="h-4 w-4 text-green-300" />
              Payout checklist
            </h2>
            <div className="space-y-3">
              {PAYOUT_CHECKLIST.map((item) => (
                <div key={item} className="flex gap-3 rounded-xl border border-border-primary bg-slate-950/70 p-4">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-300" />
                  <p className="text-xs font-semibold leading-6 text-text-secondary">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {tab === 'messages' && (
        <section className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3 rounded-2xl border border-border-primary bg-bg-surface/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-text-primary">
              <Link2 className="h-4 w-4 text-green-300" />
              Onboarding đối tác
            </h2>
            <div className="space-y-3">
              {PARTNER_ONBOARDING.map((item) => (
                <div key={item.step} className="rounded-xl border border-border-primary bg-slate-950/70 p-4">
                  <h3 className="text-sm font-black text-text-primary">{item.step}</h3>
                  <p className="mt-2 text-xs font-semibold leading-6 text-text-secondary">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-border-primary bg-bg-surface/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-text-primary">
              <Copy className="h-4 w-4 text-cyan-300" />
              Tin nhắn giới thiệu
            </h2>
            <div className="space-y-3">
              {REFERRAL_MESSAGES.map((item) => (
                <div key={item.title} className="rounded-xl border border-border-primary bg-slate-950/70 p-4">
                  <h3 className="text-sm font-black text-text-primary">{item.title}</h3>
                  <p className="mt-2 text-xs font-semibold leading-6 text-text-secondary">{item.text}</p>
                  <button
                    onClick={() => copyText(item.title, item.text)}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border-secondary px-3 py-2 text-[11px] font-black text-text-secondary hover:border-green-400 hover:text-text-primary"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copied === item.title ? 'Đã copy' : 'Copy tin nhắn'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-emerald-200">
          <AlertTriangle className="h-4 w-4" />
          Nguyên tắc referral
        </h2>
        <p className="text-xs font-semibold leading-7 text-text-secondary">
          Referral tốt không phải spam link. Với phần mềm kế toán, đối tác phải hiểu nỗi đau thật,
          dùng thông điệp đúng, không hứa quá tính năng, và chỉ nhận hoa hồng khi khách thanh toán thật.
        </p>
      </section>
    </div>
  );
}
