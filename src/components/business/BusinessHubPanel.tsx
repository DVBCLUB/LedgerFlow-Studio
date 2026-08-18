import { useCallback, useEffect, useState } from 'react';
import {
  Bot,
  Briefcase,
  Plus,
  RefreshCw,
  Search,
  Download,
  Zap,
  TrendingUp,
  ShieldCheck,
  Rocket,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  DollarSign,
} from 'lucide-react';
import {
  listBusinessEntities,
  upsertBusinessEntity,
  persistAgentResult,
  getBusinessStats,
  setBusinessEntityStatus,
  type BusinessEntity,
  type BusinessEntityType,
  type BusinessStats,
} from '../../utils/businessApi';

const TYPES: BusinessEntityType[] = ['product', 'campaign', 'lead', 'customer', 'deal', 'invoice', 'task', 'knowledge'];

function fmtVnd(n: number): string {
  if (!n) return '0 ₫';
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} tỷ ₫`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} triệu ₫`;
  return `${n.toLocaleString('vi-VN')} ₫`;
}

function entityTitle(e: BusinessEntity): string {
  const d = e.data;
  const candidate = d.name || d.title || d.companyName || d.product_name || d.invoiceCode;
  if (candidate) return String(candidate);
  if (e.type === 'invoice') {
    const amount = Number(d.amount || d.amountVnd || 0);
    const account = d.accountCode ? `TK ${d.accountCode}` : '';
    return [account, amount ? fmtVnd(amount) : ''].filter(Boolean).join(' · ') || e.id;
  }
  return e.id;
}

export default function BusinessHubPanel() {
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [kpis, setKpis] = useState<{
    totalRevenueVnd: number;
    paidInvoicesCount: number;
    pendingInvoicesCount: number;
    pendingInvoicesAmount: number;
    totalCustomers: number;
    totalProducts: number;
    totalCampaigns: number;
  } | null>(null);
  const [entities, setEntities] = useState<BusinessEntity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [type, setType] = useState<BusinessEntityType>('task');
  const [name, setName] = useState('');
  const [aiGoal, setAiGoal] = useState('');
  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [busy, setBusy] = useState(false);

  // Webhook Simulator state
  const [webhookAmount, setWebhookAmount] = useState('15000000');
  const [webhookDesc, setWebhookDesc] = useState('Thanh toan INV-2026-001 mua goi SaaS');
  const [webhookResult, setWebhookResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [s, e, kpiRes] = await Promise.all([
        getBusinessStats(),
        listBusinessEntities(undefined, 300),
        fetch('/api/business/kpis').then((r) => r.json()).catch(() => ({ success: false })),
      ]);
      setStats(s);
      setEntities(e);
      if (kpiRes.success && kpiRes.kpis) {
        setKpis(kpiRes.kpis);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const addEntity = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await upsertBusinessEntity({ type, data: { name: name.trim(), status: 'new' }, source: 'user' });
      setName('');
      setSuccessNotice(`Đã thêm thành công [${type}] ${name}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const askAi = async () => {
    if (!aiGoal.trim()) return;
    setBusy(true);
    try {
      await persistAgentResult({
        type: 'task',
        data: { title: aiGoal.trim(), status: 'planned', source: 'AI' },
        source: 'ai',
        lesson: { domain: 'business', title: aiGoal.slice(0, 80), content: 'AI tạo task nghiệp vụ từ yêu cầu.' },
      });
      setAiGoal('');
      setSuccessNotice(`AI đã lập kế hoạch cho mục tiêu: ${aiGoal}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const decideEntity = async (id: string, status: 'approved' | 'rejected') => {
    setBusy(true);
    try {
      await setBusinessEntityStatus(id, status);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  // Robot triggers
  const triggerNightlySweeper = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/autonomous-robots/nightly-sweeper', { method: 'POST' }).then((r) => r.json());
      if (res.success) {
        setSuccessNotice(`🌙 Nightly Sweeper Robot hoàn tất (Điểm sức khỏe: ${res.report.systemHealthScore}/100)!`);
        await load();
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi chạy robot');
    } finally {
      setBusy(false);
    }
  };

  const triggerRevenueLeakRobot = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/autonomous-robots/revenue-leak', { method: 'POST' }).then((r) => r.json());
      if (res.success) {
        setSuccessNotice(`💰 Đã quét xong: Phát hiện ${res.report.overdueInvoicesCount} nợ quá hạn (${fmtVnd(res.report.totalOverdueAmount)}).`);
        await load();
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi chạy robot');
    } finally {
      setBusy(false);
    }
  };

  const testBankWebhook = async () => {
    setBusy(true);
    setWebhookResult(null);
    try {
      const res = await fetch('/api/webhooks/bank-inbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(webhookAmount) || 0,
          description: webhookDesc,
          bank: 'VietQR / MBBank',
        }),
      }).then((r) => r.json());

      if (res.success) {
        setWebhookResult(res.message);
        setSuccessNotice(res.message);
        await load();
      } else {
        setError(res.message || 'Lỗi webhook');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const pending = entities.filter((e) => e.data.status === 'pending_approval');

  const filteredEntities = entities.filter((e) => {
    if (typeFilter !== 'all' && e.type !== typeFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return e.id.toLowerCase().includes(q) || JSON.stringify(e.data).toLowerCase().includes(q);
  });

  return (
    <section className="space-y-5 rounded-3xl border border-indigo-500/20 bg-slate-950/80 p-5 text-left backdrop-blur-xl shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white">Unified Business Data Hub</h2>
              <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase text-cyan-300 border border-cyan-500/30">
                SQLite WAL + JSON Store
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-400">
              Trục dữ liệu duy nhất cho toàn công ty. Mọi phòng ban, webhook ngân hàng và 25 AI Agent đọc/ghi tại đây.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/business/export/csv"
            download
            className="inline-flex items-center gap-1.5 rounded-xl border border-border-secondary bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <Download className="h-3.5 w-3.5" /> Xuất File CSV
          </a>
          <button
            onClick={load}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-xl border border-border-secondary bg-slate-900 px-3 py-1.5 text-xs font-bold text-text-secondary hover:text-text-primary cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Live Financial KPIs Ribbon */}
      {kpis && (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/60 p-3">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Doanh Thu Đã Thu</span>
            <strong className="text-base font-black text-emerald-400 font-mono">{fmtVnd(kpis.totalRevenueVnd)}</strong>
            <span className="text-[9px] text-text-tertiary block mt-0.5">{kpis.paidInvoicesCount} hóa đơn hoàn tất</span>
          </div>
          <div className="rounded-2xl border border-amber-500/30 bg-slate-900/60 p-3">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Hóa Đơn Chờ Thu</span>
            <strong className="text-base font-black text-amber-300 font-mono">{fmtVnd(kpis.pendingInvoicesAmount)}</strong>
            <span className="text-[9px] text-text-tertiary block mt-0.5">{kpis.pendingInvoicesCount} hóa đơn treo</span>
          </div>
          <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/60 p-3">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Khách Hàng &amp; Sản Phẩm</span>
            <strong className="text-base font-black text-indigo-300">{kpis.totalCustomers} Khách</strong>
            <span className="text-[9px] text-text-tertiary block mt-0.5">{kpis.totalProducts} Sản phẩm SaaS/Game</span>
          </div>
          <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/60 p-3">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Chiến Dịch &amp; Entity</span>
            <strong className="text-base font-black text-cyan-300">{kpis.totalCampaigns} Campaign</strong>
            <span className="text-[9px] text-text-tertiary block mt-0.5">{stats?.total ?? 0} Bản ghi tổng</span>
          </div>
        </div>
      )}

      {/* Autonomous Robot Quick Trigger Toolbar */}
      <div className="rounded-2xl border border-border-primary bg-gradient-to-r from-slate-900/80 via-indigo-950/30 to-slate-900/80 p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-300" />
          <span className="text-xs font-black uppercase text-white">Robot Tự Hành Doanh Nghiệp (1-Click Trigger):</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={triggerNightlySweeper}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600/30 border border-indigo-500/40 px-3 py-1.5 text-xs font-bold text-indigo-200 hover:bg-indigo-600/50 cursor-pointer disabled:opacity-50"
          >
            🌙 Nightly Sweeper
          </button>
          <button
            onClick={triggerRevenueLeakRobot}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600/30 border border-amber-500/40 px-3 py-1.5 text-xs font-bold text-amber-200 hover:bg-amber-600/50 cursor-pointer disabled:opacity-50"
          >
            💰 Quét Rò Rỉ &amp; Nợ Quá Hạn
          </button>
        </div>
      </div>

      {/* Webhook Ingestion Live Simulator */}
      <div className="rounded-2xl border border-border-primary bg-slate-900/40 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-black uppercase text-white">Giả Lập Webhook Chuyển Khoản Ngân Hàng / VietQR</span>
          </div>
          <span className="text-[10px] text-text-tertiary">Endpoint: POST /api/webhooks/bank-inbound</span>
        </div>
        <div className="grid sm:grid-cols-12 gap-2">
          <input
            type="number"
            value={webhookAmount}
            onChange={(e) => setWebhookAmount(e.target.value)}
            placeholder="Số tiền (VND)"
            className="sm:col-span-3 rounded-xl border border-border-secondary bg-slate-950 px-3 py-1.5 text-xs font-mono text-emerald-400"
          />
          <input
            type="text"
            value={webhookDesc}
            onChange={(e) => setWebhookDesc(e.target.value)}
            placeholder="Nội dung chuyển khoản (VD: Thanh toan INV-2026-001)..."
            className="sm:col-span-6 rounded-xl border border-border-secondary bg-slate-950 px-3 py-1.5 text-xs text-white"
          />
          <button
            onClick={testBankWebhook}
            disabled={busy || !webhookDesc.trim()}
            className="sm:col-span-3 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-black text-white hover:bg-emerald-500 cursor-pointer disabled:opacity-50"
          >
            Gửi Webhook Test
          </button>
        </div>
        {webhookResult && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-2.5 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> {webhookResult}
          </div>
        )}
      </div>

      {/* Quick Add + AI Write */}
      <div className="rounded-2xl border border-border-primary bg-slate-900/60 p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as BusinessEntityType)}
            className="rounded-xl border border-border-secondary bg-slate-950 px-3 py-2 text-xs font-bold text-text-primary"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tên đối tượng hoặc giá trị cần thêm…"
            className="flex-1 min-w-40 rounded-xl border border-border-secondary bg-slate-950 px-3 py-2 text-xs text-text-primary"
          />
          <button
            onClick={addEntity}
            disabled={busy || !name.trim()}
            className="inline-flex items-center gap-1 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-black text-slate-950 hover:bg-cyan-400 disabled:opacity-50 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Thêm Dữ Liệu
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={aiGoal}
            onChange={(e) => setAiGoal(e.target.value)}
            placeholder="Giao việc cho AI (VD: Lên kế hoạch tính năng Export PDF hóa đơn)…"
            className="flex-1 min-w-40 rounded-xl border border-border-secondary bg-slate-950 px-3 py-2 text-xs text-text-primary"
          />
          <button
            onClick={askAi}
            disabled={busy || !aiGoal.trim()}
            className="inline-flex items-center gap-1 rounded-xl bg-violet-600 px-4 py-2 text-xs font-black text-white hover:bg-violet-500 disabled:opacity-50 cursor-pointer"
          >
            <Bot className="h-3.5 w-3.5" /> Nhờ AI Tạo
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-400/40 bg-rose-400/10 p-3 text-xs font-bold text-rose-100 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {successNotice && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-3 text-xs font-bold text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {successNotice}
        </div>
      )}

      {/* Pending Approvals Section */}
      {pending.length > 0 && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-950/20 p-4 space-y-2">
          <p className="text-xs font-black uppercase text-amber-300">
            ⏳ Hàng đợi chờ duyệt ({pending.length}) — Entity tài chính do AI đề xuất
          </p>
          <div className="space-y-1.5">
            {pending.map((e) => (
              <div
                key={e.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border-primary bg-slate-950/80 px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-black text-amber-300 uppercase">[{e.type}]</span>
                  <span className="font-bold text-text-primary">{entityTitle(e)}</span>
                  <span className="text-text-tertiary">· Nguồn: {e.source}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => decideEntity(e.id, 'approved')}
                    disabled={busy}
                    className="rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-black text-white hover:bg-emerald-500 cursor-pointer"
                  >
                    Duyệt
                  </button>
                  <button
                    onClick={() => decideEntity(e.id, 'rejected')}
                    disabled={busy}
                    className="rounded-lg bg-rose-600 px-3 py-1 text-[11px] font-black text-white hover:bg-rose-500 cursor-pointer"
                  >
                    Từ chối
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] rounded-xl border border-border-secondary bg-slate-900 px-3 py-2 text-xs">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm entity theo tên, ID, mã chứng từ..."
            className="w-full bg-transparent text-white placeholder:text-slate-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              typeFilter === 'all' ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Tất cả ({entities.length})
          </button>
          {TYPES.map((t) => {
            const count = stats?.byType[t] || 0;
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  typeFilter === t ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {t} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Entity Table List */}
      <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
        {filteredEntities.length === 0 && (
          <p className="py-8 text-center text-xs font-semibold text-text-tertiary">
            Không tìm thấy dữ liệu phù hợp với điều kiện tìm kiếm.
          </p>
        )}
        {filteredEntities.map((e) => (
          <div
            key={e.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border-primary bg-slate-900/50 p-3 text-xs hover:bg-slate-900/80 transition"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-black uppercase px-2 py-0.5">
                  {e.type}
                </span>
                <span className="font-bold text-white">{entityTitle(e)}</span>
                <span className="text-text-tertiary text-[11px]">({e.id})</span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-xl">
                {JSON.stringify(e.data).slice(0, 120)}...
              </p>
            </div>
            <div className="text-right text-[10px] text-text-tertiary">
              <span className="block font-semibold text-slate-300">Nguồn: {e.source}</span>
              <span>{new Date(e.updatedAt).toLocaleString('vi-VN')}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
