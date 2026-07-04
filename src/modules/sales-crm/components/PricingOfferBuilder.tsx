import React, { useMemo, useState } from 'react';

type OfferStatus = 'Draft' | 'Testing' | 'Pilot ready' | 'Rejected';
type OfferType = 'Template / file' | 'Mini app' | 'Subscription' | 'Service-assisted product' | 'Course / learning pack';

type PricingOffer = {
  id: string;
  name: string;
  offerType: OfferType;
  buyerPersona: string;
  pain: string;
  valuePromise: string;
  price: number;
  costToServe: number;
  pilotLimit: string;
  refundRule: string;
  proofNeeded: string;
  status: OfferStatus;
  confidence: number;
};

const STORAGE_KEY = 'ledgerflow-pricing-offer-builder-v1';

const demoOffers: PricingOffer[] = [
  {
    id: 'offer-audit-red-flag-pack',
    name: 'Audit Red Flag Learning Pack',
    offerType: 'Course / learning pack',
    buyerPersona: 'Kế toán viên muốn học kiểm toán chứng từ đa ngành',
    pain: 'Không biết nhìn chứng từ để phát hiện rủi ro sai kỳ, thiếu hồ sơ, chi phí không hợp lệ.',
    valuePromise: 'Học qua case + game red flag, có checklist chứng từ và câu hỏi kiểm toán.',
    price: 199000,
    costToServe: 20000,
    pilotLimit: 'Bán thử 20 suất đầu, hỗ trợ qua email/Zalo thủ công.',
    refundRule: 'Hoàn tiền trong 7 ngày nếu chưa tải file/tài liệu chính và chưa dùng support.',
    proofNeeded: 'Cần 5 paid signal hoặc 3 khách beta phản hồi hữu ích.',
    status: 'Testing',
    confidence: 65
  },
  {
    id: 'offer-founder-labs-mini',
    name: 'Founder Labs Mini OS',
    offerType: 'Mini app',
    buyerPersona: 'Solo founder dùng AI để build app nhưng thiếu hệ thống kiểm soát',
    pain: 'Làm nhiều ý tưởng nhưng không biết nên build, hold hay kill; tool burn tăng không kiểm soát.',
    valuePromise: 'Một hệ thống nhẹ để quản lý lab, lead, quyết định, tool budget và báo cáo tháng.',
    price: 490000,
    costToServe: 50000,
    pilotLimit: 'Pilot 10 người, không hứa custom sâu, chỉ nhận feedback qua form.',
    refundRule: 'Hoàn tiền 7 ngày nếu app không mở được hoặc thiếu tính năng đã mô tả.',
    proofNeeded: 'Cần 3 demo call có buyer nói sẵn sàng trả tiền.',
    status: 'Draft',
    confidence: 52
  }
];

const readOffers = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : demoOffers;
    return Array.isArray(parsed) ? parsed : demoOffers;
  } catch {
    return demoOffers;
  }
};

const saveOffers = (offers: PricingOffer[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(offers));
const money = (value: number) => new Intl.NumberFormat('vi-VN').format(Math.round(value));

const emptyOffer = (): PricingOffer => ({
  id: `offer-${Date.now()}`,
  name: '',
  offerType: 'Mini app',
  buyerPersona: '',
  pain: '',
  valuePromise: '',
  price: 0,
  costToServe: 0,
  pilotLimit: '',
  refundRule: '',
  proofNeeded: '',
  status: 'Draft',
  confidence: 50
});

function scoreOffer(offer: PricingOffer) {
  const margin = offer.price ? ((offer.price - offer.costToServe) / offer.price) * 100 : 0;
  const proofScore = offer.proofNeeded.length > 20 ? 15 : 0;
  const refundScore = offer.refundRule.length > 20 ? 10 : -10;
  const pilotScore = offer.pilotLimit.length > 15 ? 10 : -5;
  const clarityScore = [offer.buyerPersona, offer.pain, offer.valuePromise].filter((value) => value.length > 20).length * 10;
  const confidenceScore = offer.confidence * 0.25;
  return Math.max(0, Math.min(100, Math.round(margin * 0.25 + proofScore + refundScore + pilotScore + clarityScore + confidenceScore)));
}

function verdict(score: number) {
  if (score >= 75) return 'PILOT OFFER';
  if (score >= 50) return 'REFINE BEFORE SELLING';
  return 'DO NOT SELL YET';
}

export default function PricingOfferBuilder() {
  const [offers, setOffers] = useState<PricingOffer[]>(readOffers);
  const [draft, setDraft] = useState<PricingOffer>(emptyOffer);

  const summary = useMemo(() => {
    const pilotReady = offers.filter((offer) => offer.status === 'Pilot ready').length;
    const testing = offers.filter((offer) => offer.status === 'Testing').length;
    const avgScore = offers.length ? Math.round(offers.reduce((sum, offer) => sum + scoreOffer(offer), 0) / offers.length) : 0;
    const bestOffer = [...offers].sort((a, b) => scoreOffer(b) - scoreOffer(a))[0];
    return { pilotReady, testing, avgScore, bestOffer };
  }, [offers]);

  const updateOffers = (next: PricingOffer[]) => {
    setOffers(next);
    saveOffers(next);
  };

  const addOffer = () => {
    if (!draft.name.trim()) return;
    updateOffers([{ ...draft, id: `offer-${Date.now()}` }, ...offers]);
    setDraft(emptyOffer());
  };

  const updateOffer = (id: string, patch: Partial<PricingOffer>) => {
    updateOffers(offers.map((offer) => offer.id === id ? { ...offer, ...patch } : offer));
  };

  const removeOffer = (id: string) => updateOffers(offers.filter((offer) => offer.id !== id));

  return (
    <section className="space-y-4 text-slate-100">
      <div className="rounded-3xl border border-border-primary bg-slate-950/80 p-6">
        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Pricing Offer Builder</p>
        <h2 className="mt-2 text-xl font-black text-text-primary">Thiết kế gói bán trước khi launch</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-text-secondary">
          Dùng để biến ý tưởng thành offer có buyer persona, nỗi đau, lời hứa giá trị, giá, chi phí phục vụ, refund rule và điều kiện pilot. Mục tiêu là bán nhỏ, đo paid signal, không hứa quá mức.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5"><p className="text-[10px] font-black uppercase text-text-tertiary">Offers</p><p className="mt-2 text-3xl font-black text-text-primary">{offers.length}</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5"><p className="text-[10px] font-black uppercase text-text-tertiary">Testing</p><p className="mt-2 text-3xl font-black text-cyan-300">{summary.testing}</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5"><p className="text-[10px] font-black uppercase text-text-tertiary">Pilot ready</p><p className="mt-2 text-3xl font-black text-emerald-300">{summary.pilotReady}</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5"><p className="text-[10px] font-black uppercase text-text-tertiary">Avg score</p><p className="mt-2 text-3xl font-black text-amber-300">{summary.avgScore}/100</p></div>
      </div>

      <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5">
        <h3 className="text-sm font-black text-text-primary">Tạo offer mới</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Tên offer" className="rounded-xl border border-border-primary bg-slate-950 px-3 py-3 text-sm font-bold text-text-primary" />
          <select value={draft.offerType} onChange={(event) => setDraft({ ...draft, offerType: event.target.value as OfferType })} className="rounded-xl border border-border-primary bg-slate-950 px-3 py-3 text-sm font-bold text-text-primary">
            <option>Template / file</option><option>Mini app</option><option>Subscription</option><option>Service-assisted product</option><option>Course / learning pack</option>
          </select>
          <input value={draft.buyerPersona} onChange={(event) => setDraft({ ...draft, buyerPersona: event.target.value })} placeholder="Buyer persona" className="rounded-xl border border-border-primary bg-slate-950 px-3 py-3 text-sm font-bold text-text-primary" />
          <input value={draft.valuePromise} onChange={(event) => setDraft({ ...draft, valuePromise: event.target.value })} placeholder="Value promise" className="rounded-xl border border-border-primary bg-slate-950 px-3 py-3 text-sm font-bold text-text-primary" />
          <input value={draft.pain} onChange={(event) => setDraft({ ...draft, pain: event.target.value })} placeholder="Nỗi đau cần giải quyết" className="rounded-xl border border-border-primary bg-slate-950 px-3 py-3 text-sm font-bold text-text-primary md:col-span-2" />
          <input type="number" value={draft.price} onChange={(event) => setDraft({ ...draft, price: Number(event.target.value) })} placeholder="Giá bán" className="rounded-xl border border-border-primary bg-slate-950 px-3 py-3 text-sm font-bold text-text-primary" />
          <input type="number" value={draft.costToServe} onChange={(event) => setDraft({ ...draft, costToServe: Number(event.target.value) })} placeholder="Chi phí phục vụ" className="rounded-xl border border-border-primary bg-slate-950 px-3 py-3 text-sm font-bold text-text-primary" />
          <input value={draft.pilotLimit} onChange={(event) => setDraft({ ...draft, pilotLimit: event.target.value })} placeholder="Giới hạn pilot" className="rounded-xl border border-border-primary bg-slate-950 px-3 py-3 text-sm font-bold text-text-primary" />
          <input value={draft.refundRule} onChange={(event) => setDraft({ ...draft, refundRule: event.target.value })} placeholder="Refund rule" className="rounded-xl border border-border-primary bg-slate-950 px-3 py-3 text-sm font-bold text-text-primary" />
          <input value={draft.proofNeeded} onChange={(event) => setDraft({ ...draft, proofNeeded: event.target.value })} placeholder="Bằng chứng cần có trước khi bán lớn" className="rounded-xl border border-border-primary bg-slate-950 px-3 py-3 text-sm font-bold text-text-primary md:col-span-2" />
        </div>
        <button onClick={addOffer} className="mt-4 rounded-2xl bg-emerald-400 px-4 py-3 text-xs font-black text-slate-950 hover:bg-emerald-300">Thêm offer</button>
      </div>

      <div className="space-y-3">
        {offers.map((offer) => {
          const score = scoreOffer(offer);
          const margin = offer.price ? ((offer.price - offer.costToServe) / offer.price) * 100 : 0;
          return (
            <div key={offer.id} className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5">
              <div className="grid gap-3 md:grid-cols-[1fr_10rem_8rem]">
                <div>
                  <p className="text-[10px] font-black uppercase text-emerald-300">{offer.offerType}</p>
                  <h3 className="mt-1 text-lg font-black text-text-primary">{offer.name}</h3>
                  <p className="mt-2 text-xs font-semibold leading-6 text-text-secondary">{offer.buyerPersona}</p>
                </div>
                <select value={offer.status} onChange={(event) => updateOffer(offer.id, { status: event.target.value as OfferStatus })} className="h-11 rounded-xl border border-border-primary bg-slate-950 px-3 text-xs font-bold text-text-primary">
                  <option>Draft</option><option>Testing</option><option>Pilot ready</option><option>Rejected</option>
                </select>
                <button onClick={() => removeOffer(offer.id)} className="h-11 rounded-xl border border-rose-500/30 text-xs font-black text-rose-200 hover:bg-rose-500/10">Xóa</button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-border-primary bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase text-text-tertiary">Price</p><p className="mt-1 text-xl font-black text-text-primary">{money(offer.price)}đ</p></div>
                <div className="rounded-xl border border-border-primary bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase text-text-tertiary">Cost</p><p className="mt-1 text-xl font-black text-text-primary">{money(offer.costToServe)}đ</p></div>
                <div className="rounded-xl border border-border-primary bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase text-text-tertiary">Margin</p><p className="mt-1 text-xl font-black text-cyan-300">{margin.toFixed(0)}%</p></div>
                <div className="rounded-xl border border-border-primary bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase text-text-tertiary">Offer score</p><p className="mt-1 text-xl font-black text-amber-300">{score}/100</p></div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <p className="rounded-xl border border-border-primary bg-slate-950/70 p-3 text-xs font-semibold leading-6 text-text-secondary"><b className="text-text-primary">Pain:</b> {offer.pain}</p>
                <p className="rounded-xl border border-border-primary bg-slate-950/70 p-3 text-xs font-semibold leading-6 text-text-secondary"><b className="text-text-primary">Promise:</b> {offer.valuePromise}</p>
                <p className="rounded-xl border border-border-primary bg-slate-950/70 p-3 text-xs font-semibold leading-6 text-text-secondary"><b className="text-text-primary">Pilot:</b> {offer.pilotLimit}</p>
                <p className="rounded-xl border border-border-primary bg-slate-950/70 p-3 text-xs font-semibold leading-6 text-text-secondary"><b className="text-text-primary">Refund:</b> {offer.refundRule}</p>
              </div>
              <p className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs font-black text-emerald-100">Verdict: {verdict(score)} • Proof needed: {offer.proofNeeded}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
