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

  return (
    <section className="space-y-4 text-slate-100">
      <div className="rounded-3xl border border-emerald-400/25 bg-slate-950 p-4 shadow-2xl shadow-emerald-950/20">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">Revenue Dashboard · Supabase</p>
            <h3 className="mt-1 text-xl font-black text-white">Doanh thu thật / MRR / ARR</h3>
            <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-400">
              Theo dõi doanh thu từ bảng <span className="text-emerald-200">revenue_records</span>, tính MRR/ARR/churn và danh sách khách hàng để AI CFO có số liệu thật.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-black text-white" />
            <button onClick={loadRecords} className="rounded-2xl bg-emerald-300 px-4 py-2 text-xs font-black text-slate-950 hover:bg-emerald-200">Refresh</button>
          </div>
        </div>

        {error && <div className="mt-4 rounded-2xl border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-xs font-bold text-rose-100">{error}</div>}

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <Metric label="MRR" value={formatVnd(metrics.mrr)} />
          <Metric label="ARR" value={formatVnd(metrics.arr)} />
          <Metric label="Active customers" value={String(metrics.activeCustomers)} />
          <Metric label="Churn tháng này" value={String(metrics.churnedThisMonth)} />
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <Metric label="Revenue tháng chọn" value={formatVnd(metrics.totalRevenue)} />
          <Metric label="New records" value={String(metrics.newThisMonth)} />
          <Metric label="ARPU" value={formatVnd(metrics.avgRevenuePerUser)} />
          <Metric label="LTV est." value={formatVnd(metrics.ltv)} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/95 p-4">
          <p className="text-sm font-black text-white">Revenue by month</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">12 tháng gần nhất, gồm subscription/one-time/service theo ngày tạo hoặc ngày bắt đầu.</p>
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

        <div className="rounded-3xl border border-slate-800 bg-slate-950/95 p-4">
          <p className="text-sm font-black text-white">+ Thêm giao dịch</p>
          <input value={form.product_name} onChange={(event) => setForm((current) => ({ ...current, product_name: event.target.value }))} placeholder="Tên sản phẩm / dịch vụ" className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-bold text-white placeholder:text-slate-600" />
          <input value={form.customer_email} onChange={(event) => setForm((current) => ({ ...current, customer_email: event.target.value }))} placeholder="Email khách hàng" className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-bold text-white placeholder:text-slate-600" />
          <input value={form.amount_vnd} onChange={(event) => setForm((current) => ({ ...current, amount_vnd: event.target.value.replace(/[^0-9]/g, '') }))} placeholder="Số tiền VND" className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-bold text-white placeholder:text-slate-600" />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as RevenueType }))} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-bold text-white">
              {REVENUE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as RevenueStatus }))} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-bold text-white">
              {REVENUE_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
          <select value={form.period} onChange={(event) => setForm((current) => ({ ...current, period: event.target.value as RevenuePeriod }))} className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-bold text-white">
            {REVENUE_PERIODS.map((period) => <option key={period || 'none'} value={period}>{period || 'no period'}</option>)}
          </select>
          <input value={form.source} onChange={(event) => setForm((current) => ({ ...current, source: event.target.value }))} placeholder="Nguồn: direct/zalo/facebook/referral" className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-bold text-white placeholder:text-slate-600" />
          <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Ghi chú" rows={3} className="mt-3 w-full resize-none rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white placeholder:text-slate-600" />
          <button onClick={handleAdd} disabled={saving || !form.product_name.trim() || Number(form.amount_vnd || 0) <= 0} className="mt-3 w-full rounded-2xl bg-emerald-300 px-4 py-2 text-xs font-black text-slate-950 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-40">
            {saving ? 'Đang lưu...' : 'Lưu revenue record'}
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/95 p-4">
        <p className="text-sm font-black text-white">Customer / Revenue records</p>
        {loading ? (
          <div className="mt-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-8 text-center text-sm font-bold text-slate-500">Đang tải revenue records...</div>
        ) : (
          <div className="mt-4 overflow-auto rounded-2xl border border-slate-800">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400">
                <tr>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {records.map((record) => (
                  <tr key={record.id} className="bg-slate-950/70 text-slate-300">
                    <td className="px-3 py-2 font-black text-white">{record.product_name}</td>
                    <td className="px-3 py-2">{record.customer_email || '—'}</td>
                    <td className="px-3 py-2 font-black text-emerald-200">{formatVnd(record.amount_vnd)}</td>
                    <td className="px-3 py-2">{record.type}</td>
                    <td className="px-3 py-2">{record.status}</td>
                    <td className="px-3 py-2">{record.source || 'direct'}</td>
                    <td className="px-3 py-2">{new Date(record.created_at).toLocaleDateString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {records.length === 0 && <div className="p-8 text-center text-sm font-bold text-slate-500">Chưa có revenue record nào.</div>}
          </div>
        )}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}
