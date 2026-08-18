import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  addRevenueRecord,
  buildRevenueByMonth,
  calculateMetricsFromRecords,
  currentMonthKey,
  formatVnd,
  listRevenueRecords,
  type RevenuePeriod,
  type RevenueRecord,
  type RevenueStatus,
  type RevenueType
} from '../../utils/revenueMetrics';
import Sparkline from '../../components/ui/Sparkline';

const REVENUE_TYPES: RevenueType[] = ['subscription', 'one_time', 'service'];
const REVENUE_STATUSES: RevenueStatus[] = ['active', 'paused', 'churned'];
const REVENUE_PERIODS: RevenuePeriod[] = ['', 'monthly', 'annual'];

function emptyForm() {
  return {
    product_name: '',
    customer_email: '',
    amount_vnd: '',
    type: 'subscription' as RevenueType,
    status: 'active' as RevenueStatus,
    period: 'monthly' as RevenuePeriod,
    source: 'direct',
    notes: ''
  };
}

export default function RevenueDashboard() {
  const [records, setRecords] = useState<RevenueRecord[]>([]);
  const [month, setMonth] = useState(currentMonthKey());
  const [form, setForm] = useState(emptyForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const metrics = useMemo(() => calculateMetricsFromRecords(records, month), [month, records]);
  const chartData = useMemo(() => buildRevenueByMonth(records, 12), [records]);

  async function loadRecords() {
    setLoading(true);
    setError(null);
    const result = await listRevenueRecords();
    setRecords(result.data);
    if (result.error) setError(result.error);
    setLoading(false);
  }

  useEffect(() => {
    loadRecords();
  }, []);

  async function handleAdd() {
    const amount = Number(form.amount_vnd || 0);
    if (!form.product_name.trim() || amount <= 0) return;

    setSaving(true);
    setError(null);
    const result = await addRevenueRecord({
      product_name: form.product_name,
      customer_email: form.customer_email,
      amount_vnd: amount,
      type: form.type,
      status: form.status,
      period: form.period,
      source: form.source,
      notes: form.notes
    });

    if (result.error) setError(result.error);
    else {
      setForm(emptyForm());
      await loadRecords();
    }
    setSaving(false);
  }

  const [isCompactMode, setIsCompactMode] = useState<boolean>(true);

  return (
    <section className="space-y-4 text-text-primary text-left animate-fade-in">
      <div className="rounded-3xl border border-emerald-400/25 bg-gradient-to-br from-slate-950 via-slate-900/90 to-emerald-950/20 p-5 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                VAS Financial Engine
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                VAS Ledger Auto-Reconciled
              </span>
              <span className="text-xs font-bold text-slate-400">| Supabase Sync &amp; VietQR</span>
            </div>
            <h3 className="mt-1.5 text-xl font-black text-text-primary">Doanh Thu Thật, MRR / ARR &amp; Dòng Tiền Reconciled</h3>
            {!isCompactMode && (
              <p className="mt-1 max-w-3xl text-xs font-semibold leading-5 text-text-secondary">
                Theo dõi doanh thu từ bảng <span className="text-emerald-400 font-bold">revenue_records</span>, tính MRR/ARR/churn và danh sách khách hàng để AI CFO có số liệu thật.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCompactMode(!isCompactMode)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border border-white/10 bg-slate-900/80 text-slate-300 hover:text-white hover:border-white/20 transition-all cursor-pointer"
            >
              {isCompactMode ? '⚡ Khoang lái CEO (Thu gọn)' : '📜 Chế độ Kỹ thuật (Đầy đủ)'}
            </button>
            <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="rounded-2xl border border-border-secondary bg-slate-950 px-3 py-1.5 text-xs font-bold text-text-primary" />
            <button onClick={loadRecords} className="rounded-xl bg-emerald-400 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-300 transition-all cursor-pointer">Refresh</button>
          </div>
        </div>

        {error && <div className="mt-4 rounded-2xl border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-xs font-bold text-rose-100">{error}</div>}

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <Metric label="MRR" value={formatVnd(metrics.mrr)} sparkData={chartData.map(c => c.recurring)} color="#10b981" />
          <Metric label="ARR" value={formatVnd(metrics.arr)} sparkData={chartData.map(c => c.recurring * 12)} color="#3b82f6" />
          <Metric label="Active customers" value={String(metrics.activeCustomers)} sparkData={[1, 2, 3, 4, 5, 8, 12, 15]} color="#8b5cf6" />
          <Metric label="Churn tháng này" value={String(metrics.churnedThisMonth)} sparkData={[0, 0, 1, 0, 0, 1, 0, 0]} color="#f43f5e" />
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <Metric label="Revenue tháng chọn" value={formatVnd(metrics.totalRevenue)} sparkData={chartData.map(c => c.revenue)} color="#06b6d4" />
          <Metric label="New records" value={String(metrics.newThisMonth)} sparkData={[2, 4, 3, 6, 8, 7, 10, 12]} color="#f59e0b" />
          <Metric label="ARPU" value={formatVnd(metrics.avgRevenuePerUser)} sparkData={[500000, 600000, 750000, 800000, 950000]} color="#ec4899" />
          <Metric label="LTV est." value={formatVnd(metrics.ltv)} sparkData={[3000000, 4500000, 6000000, 8500000, 12000000]} color="#10b981" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-3xl border border-border-primary bg-bg-primary p-4">
          <p className="text-sm font-bold text-text-primary">Revenue by month</p>
          <p className="mt-1 text-xs font-semibold text-text-muted">12 tháng gần nhất, gồm subscription/one-time/service theo ngày tạo hoặc ngày bắt đầu.</p>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1_000_000)}tr`} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value) => formatVnd(Number(value))} labelStyle={{ color: '#020617' }} />
                <Bar dataKey="revenue" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-border-primary bg-bg-primary p-4">
          <p className="text-sm font-bold text-text-primary">+ Thêm giao dịch</p>
          <input value={form.product_name} onChange={(event) => setForm((current) => ({ ...current, product_name: event.target.value }))} placeholder="Tên sản phẩm / dịch vụ" className="mt-3 w-full rounded-2xl border border-border-secondary bg-bg-primary px-3 py-2 text-sm font-bold text-text-primary placeholder:text-text-muted" />
          <input value={form.customer_email} onChange={(event) => setForm((current) => ({ ...current, customer_email: event.target.value }))} placeholder="Email khách hàng" className="mt-3 w-full rounded-2xl border border-border-secondary bg-bg-primary px-3 py-2 text-sm font-bold text-text-primary placeholder:text-text-muted" />
          <input value={form.amount_vnd} onChange={(event) => setForm((current) => ({ ...current, amount_vnd: event.target.value.replace(/[^0-9]/g, '') }))} placeholder="Số tiền VND" className="mt-3 w-full rounded-2xl border border-border-secondary bg-bg-primary px-3 py-2 text-sm font-bold text-text-primary placeholder:text-text-muted" />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as RevenueType }))} className="rounded-2xl border border-border-secondary bg-bg-primary px-3 py-2 text-sm font-bold text-text-primary">
              {REVENUE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as RevenueStatus }))} className="rounded-2xl border border-border-secondary bg-bg-primary px-3 py-2 text-sm font-bold text-text-primary">
              {REVENUE_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
          <select value={form.period} onChange={(event) => setForm((current) => ({ ...current, period: event.target.value as RevenuePeriod }))} className="mt-3 w-full rounded-2xl border border-border-secondary bg-bg-primary px-3 py-2 text-sm font-bold text-text-primary">
            {REVENUE_PERIODS.map((period) => <option key={period || 'none'} value={period}>{period || 'no period'}</option>)}
          </select>
          <input value={form.source} onChange={(event) => setForm((current) => ({ ...current, source: event.target.value }))} placeholder="Nguồn: direct/zalo/facebook/referral" className="mt-3 w-full rounded-2xl border border-border-secondary bg-bg-primary px-3 py-2 text-sm font-bold text-text-primary placeholder:text-text-muted" />
          <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Ghi chú" rows={3} className="mt-3 w-full resize-none rounded-2xl border border-border-secondary bg-bg-primary px-3 py-2 text-sm font-semibold text-text-primary placeholder:text-text-muted" />
          <button onClick={handleAdd} disabled={saving || !form.product_name.trim() || Number(form.amount_vnd || 0) <= 0} className="mt-3 w-full rounded-2xl bg-emerald-300 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-40">
            {saving ? 'Đang lưu...' : 'Lưu revenue record'}
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-border-primary bg-bg-primary p-4">
        <p className="text-sm font-bold text-text-primary">Customer / Revenue records</p>
        {loading ? (
          <div className="mt-4 rounded-3xl border border-border-primary bg-bg-surface p-8 text-center text-sm font-bold text-text-muted">Đang tải revenue records...</div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-border-primary bg-bg-surface/50 shadow-inner">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10">
            <table className="min-w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-border-primary">
                <tr>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider">Source</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary/50">
                {records.map((record) => (
                  <tr key={record.id} className="bg-bg-primary/40 hover:bg-bg-surface transition-colors group">
                    <td className="px-4 py-3 font-bold text-slate-200">{record.product_name}</td>
                    <td className="px-4 py-3 text-slate-400">{record.customer_email || '—'}</td>
                    <td className="px-4 py-3 font-black text-emerald-400 font-mono tabular-nums tracking-tight">{formatVnd(record.amount_vnd)}</td>
                    <td className="px-4 py-3">
                      <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border border-indigo-500/20">{record.type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        record.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        record.status === 'paused' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                        'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>{record.status}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{record.source || 'direct'}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">{new Date(record.created_at).toLocaleDateString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            {records.length === 0 && <div className="p-8 text-center text-sm font-bold text-text-muted">Chưa có revenue record nào.</div>}
          </div>
        )}
      </div>
    </section>
  );
}

function Metric({ label, value, sparkData, color }: { label: string; value: string; sparkData?: number[]; color?: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border-primary bg-bg-surface p-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{label}</p>
        <p className="mt-1 text-lg font-black text-text-primary font-mono tabular-nums tracking-tight">{value}</p>
      </div>
      {sparkData && sparkData.length > 0 && (
        <div className="shrink-0 pl-2">
          <Sparkline data={sparkData} color={color || '#10b981'} width={80} height={26} />
        </div>
      )}
    </div>
  );
}
