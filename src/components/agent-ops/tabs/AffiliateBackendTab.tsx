import { useCallback, useEffect, useMemo, useState } from 'react';

const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value || 0) + ' ₫';

type AffiliateCodeStats = {
  code: string;
  partner_name: string;
  commission_rate: number;
  clicks: number;
  signups: number;
  paid: number;
  pendingCommission: number;
};

type AffiliateStats = {
  codes: AffiliateCodeStats[];
  totals: {
    clicks: number;
    signups: number;
    paid: number;
    pendingCommission: number;
  };
};

type AffiliateCodeResponse = { code?: string; error?: string };
type ApiErrorResponse = { error?: string };

type ReferralEventType = 'click' | 'signup' | 'paid';

const emptyStats: AffiliateStats = {
  codes: [],
  totals: { clicks: 0, signups: 0, paid: 0, pendingCommission: 0 },
};

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

async function parseJson<T>(res: Response): Promise<T> {
  return res.json() as Promise<T>;
}

export default function AffiliateBackendTab() {
  const [userId, setUserId] = useState('');
  const [stats, setStats] = useState<AffiliateStats>(emptyStats);
  const [partnerName, setPartnerName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerType, setPartnerType] = useState('Kế toán dịch vụ');
  const [commissionRate, setCommissionRate] = useState(20);
  const [status, setStatus] = useState('Nhập userId để tải affiliate stats từ backend.');
  const [loading, setLoading] = useState(false);

  const conversion = useMemo(() => {
    if (!stats.totals.clicks) return 0;
    return Math.round((stats.totals.paid / stats.totals.clicks) * 100);
  }, [stats]);

  const loadStats = useCallback(async (nextUserId = userId) => {
    const trimmedUserId = nextUserId.trim();
    if (!trimmedUserId) return;
    setLoading(true);
    setStatus('Đang tải affiliate stats...');
    try {
      const res = await fetch(`/api/affiliate/stats?userId=${encodeURIComponent(trimmedUserId)}`);
      const data = await parseJson<AffiliateStats & ApiErrorResponse>(res);
      if (!res.ok) throw new Error(data.error || 'Không tải được stats');
      setStats({ codes: data.codes || [], totals: data.totals || emptyStats.totals });
      setStatus('Đã tải stats từ backend.');
    } catch (err) {
      setStatus(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  async function createCode() {
    if (!userId.trim() || !partnerName.trim()) {
      setStatus('Cần userId và tên partner.');
      return;
    }
    setLoading(true);
    setStatus('Đang tạo referral code...');
    try {
      const res = await fetch('/api/affiliate/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId.trim(),
          partnerName: partnerName.trim(),
          partnerEmail: partnerEmail.trim(),
          partnerType,
          commissionRate: Number(commissionRate) || 20,
          commissionType: 'recurring',
        }),
      });
      const data = await parseJson<AffiliateCodeResponse>(res);
      if (!res.ok) throw new Error(data.error || 'Không tạo được code');
      setPartnerName('');
      setPartnerEmail('');
      setStatus(`Đã tạo code ${data.code || ''}`);
      await loadStats(userId);
    } catch (err) {
      setStatus(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function trackDemo(code: string, eventType: ReferralEventType) {
    setLoading(true);
    setStatus(`Đang ghi event ${eventType} cho ${code}...`);
    try {
      const res = await fetch('/api/affiliate/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, eventType, revenueVND: eventType === 'paid' ? 599000 : 0 }),
      });
      const data = await parseJson<ApiErrorResponse>(res);
      if (!res.ok) throw new Error(data.error || 'Không ghi được event');
      setStatus(`Đã ghi event ${eventType}.`);
      await loadStats(userId);
    } catch (err) {
      setStatus(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem('ledgerflow-affiliate-user-id');
    if (saved) {
      setUserId(saved);
      void loadStats(saved);
    }
  }, [loadStats]);

  function saveUserId() {
    localStorage.setItem('ledgerflow-affiliate-user-id', userId.trim());
    void loadStats(userId);
  }

  return (
    <section className="space-y-5 text-slate-100">
      <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200">Brief 3 • Affiliate Backend</p>
        <h2 className="mt-1 text-2xl font-black text-white">Affiliate API Dashboard</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">Tạo mã referral, theo dõi click/signup/paid và hoa hồng pending từ backend thật.</p>
      </div>

      <div className="grid gap-3 rounded-3xl border border-slate-800 bg-slate-950/70 p-4 lg:grid-cols-[1.2fr_0.8fr]">
        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Owner userId</span>
          <input value={userId} onChange={(event) => setUserId(event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="UUID owner trong Supabase" />
        </label>
        <button disabled={loading} onClick={saveUserId} className="rounded-2xl bg-emerald-300 px-4 py-2 text-xs font-black text-slate-950 disabled:opacity-50">Lưu & tải stats</button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="Clicks" value={stats.totals.clicks} />
        <Metric label="Signups" value={stats.totals.signups} />
        <Metric label="Paid" value={stats.totals.paid} />
        <Metric label="Pending commission" value={money(stats.totals.pendingCommission)} />
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm font-bold text-slate-300">Conversion paid/click: <span className="text-emerald-200">{conversion}%</span></div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-white">Tạo referral code</h3>
          <div className="mt-3 space-y-3">
            <input value={partnerName} onChange={(event) => setPartnerName(event.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Tên partner" />
            <input value={partnerEmail} onChange={(event) => setPartnerEmail(event.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Email partner" />
            <input value={partnerType} onChange={(event) => setPartnerType(event.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Loại partner" />
            <input type="number" value={commissionRate} onChange={(event) => setCommissionRate(Number(event.target.value) || 0)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Commission %" />
            <button disabled={loading} onClick={createCode} className="w-full rounded-2xl bg-emerald-300 px-4 py-3 text-xs font-black text-slate-950 disabled:opacity-50">Tạo code</button>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-white">Referral codes</h3>
          <div className="mt-3 space-y-2">
            {stats.codes.length === 0 && <p className="rounded-2xl border border-slate-800 p-4 text-sm text-slate-500">Chưa có code hoặc chưa tải stats.</p>}
            {stats.codes.map((code) => (
              <article key={code.code} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-black text-white">{code.code}</p>
                    <p className="text-xs font-semibold text-slate-400">{code.partner_name} • {code.commission_rate}%</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => trackDemo(code.code, 'click')} className="rounded-xl border border-slate-700 px-3 py-2 text-[11px] font-black text-slate-300">+Click</button>
                    <button onClick={() => trackDemo(code.code, 'signup')} className="rounded-xl border border-cyan-400/40 px-3 py-2 text-[11px] font-black text-cyan-200">+Signup</button>
                    <button onClick={() => trackDemo(code.code, 'paid')} className="rounded-xl border border-emerald-400/40 px-3 py-2 text-[11px] font-black text-emerald-200">+Paid</button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[11px] font-bold text-slate-300">
                  <span>Clicks {code.clicks}</span><span>Signups {code.signups}</span><span>Paid {code.paid}</span><span>{money(code.pendingCommission)}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <p className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3 text-xs font-semibold text-slate-400">{status}</p>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-white">{value}</p></div>;
}
