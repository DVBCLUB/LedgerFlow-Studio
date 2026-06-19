/**
 * SystemSettingsPanel.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Màn hình Cài Đặt trung tâm của LedgerFlow Studio.
 *
 * Tab 1 · AI Gateway & Keys     — Quản lý API key AI providers qua backend vault
 * Tab 2 · Bảo mật Vault         — Mật khẩu chủ, auto-lock vault, status vault
 * Tab 3 · Tích hợp nền tảng    — Supabase config + GitHub, Telegram, n8n status
 * Tab 4 · Tùy chọn ứng dụng    — Giao diện, vai trò, preferences (localStorage)
 * Tab 5 · Sao lưu & Khôi phục  — Export/import backup dữ liệu nội bộ
 * Tab 6 · Về phần mềm           — Version, build manifest, tài liệu
 *
 * Bảo mật:
 *   - Không lưu AI API key, server token, mật khẩu vault vào frontend.
 *   - AI keys mã hóa AES-256-GCM trên backend — frontend chỉ thấy masked key.
 *   - Supabase anon key là public-safe và lưu localStorage (đúng thiết kế Supabase).
 *   - Backend secrets (GitHub token, Telegram token) chỉ config qua .env trên server.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import {
  Settings, KeyRound, Shield, Plug2, Palette, HardDrive,
  Info, ChevronRight, RefreshCw, CheckCircle2, XCircle,
  AlertTriangle, Loader2, ExternalLink, Eye, EyeOff,
  GitBranch, Database, MessageSquare, Workflow, Globe,
  Trash2, Clock, Bot, Copy, Check, Activity, Zap,
} from 'lucide-react';
import {
  fetchAIKeys,
  fetchAIVaultStatus,
  fetchAIVaultAutoLockStatus,
  runAIDiagnostics,
  type AIVaultSecurityStatus,
  type AIVaultAutoLockStatus,
  type AIKeySummary,
  lockAIVault,
  unlockAIVault,
  setAIVaultPassphrase,
  updateAIVaultAutoLock,
} from '../../utils/aiSettingsApi';

// ─── Lazy sub-panels ─────────────────────────────────────────────────────────
const AISettingsManager = React.lazy(() => import('../../components/AISettingsManager'));
const LabsBackupRestore = React.lazy(() => import('../../components/LabsBackupRestore'));

// ─── Types ───────────────────────────────────────────────────────────────────
type SettingsTab = 'ai_gateway' | 'vault' | 'integrations' | 'preferences' | 'backup' | 'about';

// ─── Copy-to-clipboard helper ─────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setDone(true);
      setTimeout(() => setDone(false), 1600);
    });
  };
  return (
    <button onClick={copy} className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-slate-400 hover:text-white transition-colors">
      {done ? <Check className="h-2.5 w-2.5 text-emerald-400" /> : <Copy className="h-2.5 w-2.5" />}
      {done ? 'Đã copy' : 'Copy'}
    </button>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function StatusBadge({ ok, loading }: { ok?: boolean; loading?: boolean }) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-950 px-2 py-0.5 text-[10px] font-bold text-slate-400">
        <Loader2 className="h-2.5 w-2.5 animate-spin" /> Đang kiểm tra
      </span>
    );
  }
  if (ok === undefined) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-950 px-2 py-0.5 text-[10px] font-bold text-slate-500">
        Chưa kiểm tra
      </span>
    );
  }
  return ok ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-700/40 bg-emerald-950/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
      <CheckCircle2 className="h-2.5 w-2.5" /> Đã kết nối
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full border border-rose-700/40 bg-rose-950/30 px-2 py-0.5 text-[10px] font-bold text-rose-300">
      <XCircle className="h-2.5 w-2.5" /> Chưa kết nối
    </span>
  );
}

// ─── System Health Dashboard ──────────────────────────────────────────────────
interface HealthItem {
  label: string;
  icon: React.ReactNode;
  status: 'ok' | 'warn' | 'error' | 'loading' | 'unknown';
  detail: string;
  tab: SettingsTab;
}

function SystemHealthDashboard({ onNavigate }: { onNavigate: (tab: SettingsTab) => void }) {
  const [items, setItems] = useState<HealthItem[]>([
    { label: 'AI Gateway', icon: <Bot className="h-4 w-4" />, status: 'loading', detail: 'Đang kiểm tra...', tab: 'ai_gateway' },
    { label: 'Vault bảo mật', icon: <Shield className="h-4 w-4" />, status: 'loading', detail: 'Đang kiểm tra...', tab: 'vault' },
    { label: 'Supabase', icon: <Database className="h-4 w-4" />, status: 'loading', detail: 'Đang kiểm tra...', tab: 'integrations' },
    { label: 'GitHub', icon: <GitBranch className="h-4 w-4" />, status: 'unknown', detail: 'Chưa kiểm tra', tab: 'integrations' },
  ]);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const runChecks = useCallback(async () => {
    setChecking(true);

    const update = (idx: number, patch: Partial<HealthItem>) =>
      setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, ...patch } : item)));

    // AI Gateway check
    try {
      const res = await fetch('/api/ai/keys');
      const json = await res.json() as { keys?: unknown[] };
      const count = json.keys?.length ?? 0;
      update(0, {
        status: count > 0 ? 'ok' : 'warn',
        detail: count > 0 ? `${count} key đã cấu hình` : 'Chưa có AI key nào',
      });
    } catch {
      update(0, { status: 'error', detail: 'Không kết nối được backend' });
    }

    // Vault check
    try {
      const vault = await fetchAIVaultStatus();
      update(1, {
        status: vault.hasPassphrase ? (vault.isLocked ? 'warn' : 'ok') : 'warn',
        detail: vault.hasPassphrase
          ? (vault.isLocked ? 'Vault đang khóa' : `${vault.enabledKeys}/${vault.totalKeys} key bật`)
          : 'Chưa bật mật khẩu chủ',
      });
    } catch {
      update(1, { status: 'error', detail: 'Không đọc được vault status' });
    }

    // Supabase check
    try {
      const url = localStorage.getItem('lf_supabase_url') || '';
      const key = localStorage.getItem('lf_supabase_anon_key') || '';
      if (!url || !key) {
        update(2, { status: 'warn', detail: 'Chưa cấu hình Supabase URL/anon key' });
      } else {
        update(2, { status: 'ok', detail: 'Đã cấu hình URL & anon key' });
      }
    } catch {
      update(2, { status: 'unknown', detail: 'Không kiểm tra được' });
    }

    // GitHub check (quick)
    try {
      const res = await fetch('/api/integrations/github/status', { signal: AbortSignal.timeout(3000) });
      const json = await res.json() as { success?: boolean };
      update(3, { status: json.success ? 'ok' : 'warn', detail: json.success ? 'Token hợp lệ' : 'Chưa cấu hình token' });
    } catch {
      update(3, { status: 'warn', detail: 'Chưa cấu hình hoặc không kiểm tra được' });
    }

    setLastChecked(new Date().toLocaleTimeString('vi-VN'));
    setChecking(false);
  }, []);

  useEffect(() => { void runChecks(); }, [runChecks]);

  const statusColors: Record<string, string> = {
    ok: 'border-emerald-700/40 bg-emerald-950/20 text-emerald-300',
    warn: 'border-amber-700/40 bg-amber-950/20 text-amber-300',
    error: 'border-rose-700/40 bg-rose-950/20 text-rose-300',
    loading: 'border-slate-700 bg-slate-900/40 text-slate-400',
    unknown: 'border-slate-700 bg-slate-900/40 text-slate-500',
  };
  const statusIcons: Record<string, React.ReactNode> = {
    ok: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
    warn: <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />,
    error: <XCircle className="h-3.5 w-3.5 text-rose-400" />,
    loading: <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />,
    unknown: <Activity className="h-3.5 w-3.5 text-slate-500" />,
  };

  return (
    <div className="mb-5 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-violet-400" />
          <span className="text-xs font-black text-white">Trạng thái hệ thống</span>
          {lastChecked && <span className="text-[10px] text-slate-600">cập nhật {lastChecked}</span>}
        </div>
        <button
          onClick={runChecks}
          disabled={checking}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-[10px] font-bold text-slate-400 hover:text-white disabled:opacity-40"
        >
          <RefreshCw className={`h-3 w-3 ${checking ? 'animate-spin' : ''}`} /> Kiểm tra lại
        </button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => onNavigate(item.tab)}
            className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition-all hover:brightness-110 ${statusColors[item.status]}`}
          >
            <div className="mt-0.5 shrink-0">{statusIcons[item.status]}</div>
            <div>
              <div className="text-[10px] font-black leading-none">{item.label}</div>
              <div className="mt-1 text-[10px] font-semibold leading-4 opacity-80">{item.detail}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Loading fallback ─────────────────────────────────────────────────────────
function PanelLoader() {
  return (
    <div className="flex items-center justify-center py-16 gap-3 text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
      <span className="text-sm font-semibold">Đang tải...</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: AI Gateway - Compact version (keys + providers + quick test)
// Full AISettingsManager is below this as embedded sub-panel
// ─────────────────────────────────────────────────────────────────────────────
function AIGatewayTab() {
  return (
    <div className="space-y-4">
      {/* Security notice */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-700/30 bg-amber-950/20 p-4">
        <Shield className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
        <div>
          <div className="text-xs font-black text-amber-100">Bảo mật AI Keys</div>
          <p className="mt-1 text-[11px] font-semibold leading-5 text-amber-200/70">
            API key được lưu trên backend local trong file mã hóa AES-256-GCM. Frontend không bao giờ nhận key thật — chỉ nhận version đã che.
            Key đi qua AI Router ở backend, không gọi provider trực tiếp từ trình duyệt.
          </p>
        </div>
      </div>

      {/* Embedded full settings manager */}
      <Suspense fallback={<PanelLoader />}>
        <AISettingsManager />
      </Suspense>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: Vault Security
// ─────────────────────────────────────────────────────────────────────────────
function VaultTab() {
  const [vault, setVault] = useState<AIVaultSecurityStatus | null>(null);
  const [autoLock, setAutoLock] = useState<AIVaultAutoLockStatus | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [timeoutMinutes, setTimeoutMinutes] = useState(30);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [v, al] = await Promise.all([
        fetchAIVaultStatus(),
        fetchAIVaultAutoLockStatus(),
      ]);
      setVault(v);
      setAutoLock(al);
      setTimeoutMinutes(al.timeoutMinutes);
    } catch (err: any) {
      setError(err.message || 'Không đọc được trạng thái vault.');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const run = async (action: 'enable' | 'unlock' | 'lock') => {
    setBusy(true); setError(''); setMessage('');
    try {
      let next: AIVaultSecurityStatus;
      if (action === 'enable') {
        next = await setAIVaultPassphrase(passphrase);
        setMessage('Đã bật mật khẩu chủ và mã hóa lại toàn bộ AI key.');
      } else if (action === 'unlock') {
        next = await unlockAIVault(passphrase);
        setMessage('Vault đã mở khóa.');
      } else {
        next = await lockAIVault();
        setMessage('Vault đã khóa. Key không thể giải mã cho tới khi mở khóa lại.');
      }
      setVault(next);
      setPassphrase('');
      setAutoLock(await fetchAIVaultAutoLockStatus());
    } catch (err: any) {
      setError(err.message || 'Thao tác vault thất bại.');
    } finally { setBusy(false); }
  };

  const saveAutoLock = async (enabled: boolean) => {
    setBusy(true); setError(''); setMessage('');
    try {
      const next = await updateAIVaultAutoLock({ enabled, timeoutMinutes });
      setAutoLock(next);
      setMessage(enabled ? `Đã bật auto-lock: ${next.timeoutMinutes} phút.` : 'Đã tắt auto-lock.');
    } catch (err: any) {
      setError(err.message || 'Không cập nhật được auto-lock.');
    } finally { setBusy(false); }
  };

  const isLocked = !!vault?.isLocked;
  const hasPassphrase = !!vault?.hasPassphrase;
  const remainingSeconds = autoLock?.remainingSeconds ?? 0;
  const remainingText = remainingSeconds > 0
    ? `${Math.floor(remainingSeconds / 60)}p ${remainingSeconds % 60}s`
    : 'Không đếm ngược';

  return (
    <div className="space-y-5">
      {/* Status card */}
      <div className={`rounded-2xl border p-5 ${isLocked ? 'border-rose-700/40 bg-rose-950/10' : 'border-emerald-700/40 bg-emerald-950/10'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${isLocked ? 'border-rose-700 bg-rose-950/40' : 'border-emerald-700 bg-emerald-950/30'}`}>
            <Shield className={`h-5 w-5 ${isLocked ? 'text-rose-300' : 'text-emerald-300'}`} />
          </div>
          <div>
            <div className="text-sm font-black text-white">
              {vault ? (isLocked ? '🔒 Vault đang khóa' : '🔓 Vault đang mở') : 'Đang kiểm tra...'}
            </div>
            <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
              {vault?.message || ''}
            </p>
          </div>
          <button onClick={load} disabled={busy} className="ml-auto rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-slate-200 disabled:opacity-40">
            <RefreshCw className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {vault && (
          <div className="flex flex-wrap gap-2">
            <span className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-[10px] font-black text-slate-300">Mode: {vault.mode}</span>
            <span className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-[10px] font-black text-slate-300">
              {vault.enabledKeys}/{vault.totalKeys} key bật
            </span>
            <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-black ${vault.canDecrypt ? 'border-emerald-800 bg-emerald-950/30 text-emerald-200' : 'border-rose-800 bg-rose-950/30 text-rose-200'}`}>
              {vault.canDecrypt ? 'Có thể giải mã' : 'Đang khóa'}
            </span>
            {autoLock && (
              <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-black ${autoLock.armed ? 'border-amber-700 bg-amber-950/30 text-amber-100' : 'border-slate-800 bg-slate-900 text-slate-300'}`}>
                <Clock className="inline h-2.5 w-2.5 mr-1" />
                Auto-lock: {autoLock.enabled ? (autoLock.armed ? remainingText : 'Bật') : 'Tắt'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Passphrase control */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="mb-3 text-sm font-black text-white flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-amber-300" /> Mật khẩu chủ (Master Passphrase)
        </h3>

        {!hasPassphrase && (
          <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-800/40 bg-amber-950/20 p-3 text-[11px] font-semibold leading-5 text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            Chưa có mật khẩu chủ. Nên bật nếu máy nhiều người dùng hoặc thường xuyên copy project qua máy khác.
          </div>
        )}

        <div className="relative">
          <input
            type={showPassphrase ? 'text' : 'password'}
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder={hasPassphrase ? 'Nhập mật khẩu chủ để mở/đổi' : 'Tạo mật khẩu chủ (tối thiểu 8 ký tự)'}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 pr-10 text-sm font-semibold text-white outline-none focus:border-amber-500"
          />
          <button
            type="button"
            onClick={() => setShowPassphrase((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            tabIndex={-1}
          >
            {showPassphrase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {!hasPassphrase && (
            <button
              type="button"
              disabled={busy || passphrase.length < 8}
              onClick={() => run('enable')}
              className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-slate-950 disabled:opacity-50"
            >
              Bật mật khẩu chủ
            </button>
          )}
          {hasPassphrase && isLocked && (
            <button
              type="button"
              disabled={busy || passphrase.length < 8}
              onClick={() => run('unlock')}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-black text-white disabled:opacity-50"
            >
              Mở khóa vault
            </button>
          )}
          {hasPassphrase && !isLocked && (
            <button
              type="button"
              disabled={busy}
              onClick={() => run('lock')}
              className="rounded-xl border border-rose-800 bg-rose-950/40 hover:bg-rose-900/40 px-4 py-2 text-xs font-black text-rose-100 disabled:opacity-50"
            >
              Khóa vault ngay
            </button>
          )}
        </div>
      </div>

      {/* Auto-lock */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="mb-3 text-sm font-black text-white flex items-center gap-2">
          <Clock className="h-4 w-4 text-violet-300" /> Tự động khóa (Auto-lock)
        </h3>
        <p className="mb-3 text-[11px] font-semibold leading-5 text-slate-400">
          {autoLock?.message || 'Auto-lock khóa vault sau thời gian không dùng.'}
        </p>
        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Số phút không dùng</label>
        <input
          type="number" min={1} max={1440}
          value={timeoutMinutes}
          onChange={(e) => setTimeoutMinutes(Number(e.target.value))}
          className="w-36 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-bold text-white outline-none focus:border-violet-500"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button disabled={busy} onClick={() => saveAutoLock(true)} className="rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2 text-xs font-black text-white disabled:opacity-50">
            Bật / cập nhật auto-lock
          </button>
          <button disabled={busy} onClick={() => saveAutoLock(false)} className="rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 px-4 py-2 text-xs font-black text-slate-300 disabled:opacity-50">
            Tắt auto-lock
          </button>
        </div>
        {autoLock?.armed && (
          <div className="mt-3 rounded-xl border border-amber-800/40 bg-amber-950/20 px-3 py-2 text-[11px] font-bold text-amber-100">
            Đang đếm ngược: {remainingText}
          </div>
        )}
      </div>

      {/* Feedback */}
      {message && <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/20 px-4 py-3 text-sm font-bold text-emerald-300">{message}</div>}
      {error && <div className="rounded-xl border border-rose-800/40 bg-rose-950/20 px-4 py-3 text-sm font-bold text-rose-300">{error}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: Integrations — Supabase config (frontend-safe anon key) + others status
// ─────────────────────────────────────────────────────────────────────────────
interface IntegrationEntry {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  envVars: string[];
  docNote: string;
  endpoint?: string;
}

const BACKEND_INTEGRATIONS: IntegrationEntry[] = [
  {
    id: 'github',
    name: 'GitHub Connector',
    icon: <GitBranch className="h-5 w-5 text-slate-300" />,
    description: 'Tích hợp GitHub để quản lý PR, CI/CD và repository.',
    envVars: ['GITHUB_TOKEN', 'GITHUB_REPO'],
    docNote: 'Thêm personal access token vào .env trên server. Không nhập token qua frontend.',
    endpoint: '/api/integrations/github/status',
  },
  {
    id: 'telegram',
    name: 'Telegram Bot',
    icon: <MessageSquare className="h-5 w-5 text-sky-400" />,
    description: 'Bot Telegram để nhận thông báo và điều khiển từ xa.',
    envVars: ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'],
    docNote: 'Đặt token trong .env trên server. Không bao giờ nhập bot token qua frontend.',
  },
  {
    id: 'n8n',
    name: 'n8n Automation',
    icon: <Workflow className="h-5 w-5 text-orange-400" />,
    description: 'Webhook từ n8n để nhận sự kiện tự động hóa quy trình.',
    envVars: ['N8N_WEBHOOK_SECRET'],
    docNote: 'Secret trong .env. n8n gọi endpoint /api/company-os/n8n/webhook.',
  },
];

const SUPABASE_URL_KEY = 'lf_supabase_url_config';
const SUPABASE_ANON_KEY_KEY = 'lf_supabase_anon_config';
const SUPABASE_TABLE_KEY = 'lf_supabase_table_config';

function IntegrationsTab() {
  const [sbUrl, setSbUrl] = useState(() => localStorage.getItem(SUPABASE_URL_KEY) || '');
  const [sbAnon, setSbAnon] = useState(() => localStorage.getItem(SUPABASE_ANON_KEY_KEY) || '');
  const [sbTable, setSbTable] = useState(() => localStorage.getItem(SUPABASE_TABLE_KEY) || 'ledgerflow_vault');
  const [showAnon, setShowAnon] = useState(false);
  const [sbSaved, setSbSaved] = useState(false);

  const saveSupabase = () => {
    localStorage.setItem(SUPABASE_URL_KEY, sbUrl.trim());
    localStorage.setItem(SUPABASE_ANON_KEY_KEY, sbAnon.trim());
    localStorage.setItem(SUPABASE_TABLE_KEY, sbTable.trim() || 'ledgerflow_vault');
    setSbSaved(true);
    setTimeout(() => setSbSaved(false), 2000);
  };

  const [statuses, setStatuses] = useState<Record<string, { ok?: boolean; message: string; loading: boolean }>>({});

  const checkIntegration = useCallback(async (id: string, endpoint?: string) => {
    if (!endpoint) return;
    setStatuses((prev) => ({ ...prev, [id]: { ok: undefined, message: '', loading: true } }));
    try {
      const res = await fetch(endpoint, { signal: AbortSignal.timeout(5000) });
      const json = await res.json() as { success?: boolean; ok?: boolean; message?: string; error?: string };
      const ok = json.success === true || json.ok === true;
      setStatuses((prev) => ({ ...prev, [id]: { ok, message: json.message || json.error || (ok ? 'Đã kết nối' : 'Lỗi kết nối'), loading: false } }));
    } catch {
      setStatuses((prev) => ({ ...prev, [id]: { ok: false, message: 'Không thể kiểm tra kết nối', loading: false } }));
    }
  }, []);

  const rlsSql = `ALTER TABLE ${sbTable || 'ledgerflow_vault'} ENABLE ROW LEVEL SECURITY;\nCREATE POLICY "user_owns_data" ON ${sbTable || 'ledgerflow_vault'}\n  FOR ALL USING (auth.uid()::text = email);`;

  return (
    <div className="space-y-5">
      {/* Supabase config */}
      <div className="rounded-2xl border border-emerald-800/30 bg-emerald-950/10 p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-800/40 bg-emerald-950/30">
            <Database className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-sm font-black text-white">Supabase Cloud Database</div>
            <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
              Anon key là public-safe (bảo vệ bởi RLS policy). Service key tuyệt đối không nhập ở đây.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">Project URL</label>
            <input type="url" value={sbUrl} onChange={(e) => setSbUrl(e.target.value)} placeholder="https://xxxx.supabase.co"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-mono text-slate-200 outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">
              Anon / Public Key <span className="text-emerald-600">(public-safe)</span>
            </label>
            <div className="relative">
              <input type={showAnon ? 'text' : 'password'} value={sbAnon} onChange={(e) => setSbAnon(e.target.value)} placeholder="eyJhbGciOi..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 pr-10 text-sm font-mono text-slate-200 outline-none focus:border-emerald-500" />
              <button type="button" onClick={() => setShowAnon((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300" tabIndex={-1}>
                {showAnon ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">Table Name</label>
            <input type="text" value={sbTable} onChange={(e) => setSbTable(e.target.value)} placeholder="ledgerflow_vault"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-mono text-slate-200 outline-none focus:border-emerald-500" />
          </div>
          <div className="flex items-end">
            <button onClick={saveSupabase}
              className={`w-full rounded-xl px-4 py-2.5 text-sm font-black transition-all ${sbSaved ? 'bg-emerald-700 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}>
              {sbSaved ? '✓ Đã lưu' : 'Lưu cấu hình Supabase'}
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">SQL RLS Schema khuyến nghị</span>
            <CopyButton text={rlsSql} />
          </div>
          <pre className="overflow-x-auto text-[10px] font-mono text-slate-400 leading-5">{rlsSql}</pre>
        </div>
        <p className="mt-3 text-[11px] font-semibold text-slate-500">
          <Info className="inline h-3 w-3 mr-1 text-slate-600" />
          Service Role Key (toàn quyền, bypass RLS) phải để trong <code className="rounded bg-slate-900 px-1 text-amber-300">.env</code> trên server, không bao giờ nhập ở đây.
        </p>
      </div>

      {/* Backend integrations */}
      <div>
        <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
          <Shield className="h-3.5 w-3.5" /> Tích hợp backend (credentials qua .env trên server)
        </div>
        <div className="space-y-3">
          {BACKEND_INTEGRATIONS.map((integration) => {
            const status = statuses[integration.id];
            return (
              <div key={integration.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-950">{integration.icon}</div>
                    <div>
                      <div className="text-xs font-black text-white">{integration.name}</div>
                      <p className="mt-0.5 text-[10px] font-semibold text-slate-400">{integration.description}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge ok={status?.ok} loading={status?.loading} />
                    {integration.endpoint && (
                      <button onClick={() => void checkIntegration(integration.id, integration.endpoint)} disabled={status?.loading}
                        className="rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-slate-400 hover:text-white disabled:opacity-40">
                        <RefreshCw className={`h-3 w-3 ${status?.loading ? 'animate-spin' : ''}`} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {integration.envVars.map((v) => (
                    <div key={v} className="flex items-center gap-1">
                      <code className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-0.5 text-[10px] font-bold text-amber-300">{v}</code>
                      <CopyButton text={`${v}=`} />
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[10px] font-semibold text-slate-600"><Info className="inline h-3 w-3 mr-1" />{integration.docNote}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: App Preferences (non-sensitive localStorage settings)
// ─────────────────────────────────────────────────────────────────────────────
interface AppPrefs {
  defaultRole: string;
  sidebarCollapsed: boolean;
  showBadges: boolean;
  confirmBeforeApply: boolean;
  maxBackupCopies: number;
}

const PREFS_KEY = 'lf_app_preferences_v1';
const DEFAULT_PREFS: AppPrefs = {
  defaultRole: 'all',
  sidebarCollapsed: false,
  showBadges: true,
  confirmBeforeApply: true,
  maxBackupCopies: 10,
};

function PreferencesTab() {
  const [prefs, setPrefs] = useState<AppPrefs>(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      return raw ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<AppPrefs>) } : DEFAULT_PREFS;
    } catch {
      return DEFAULT_PREFS;
    }
  });
  const [saved, setSaved] = useState(false);

  const save = (next: AppPrefs) => {
    setPrefs(next);
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const field = <K extends keyof AppPrefs>(key: K, value: AppPrefs[K]) => save({ ...prefs, [key]: value });

  return (
    <div className="space-y-5">
      {saved && (
        <div className="rounded-xl border border-emerald-700/40 bg-emerald-950/20 px-4 py-2.5 text-sm font-bold text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" /> Đã lưu cài đặt
        </div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-5">
        <h3 className="text-sm font-black text-white flex items-center gap-2">
          <Globe className="h-4 w-4 text-sky-300" /> Giao diện & Điều hướng
        </h3>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Vai trò mặc định khi khởi động</label>
          <select
            value={prefs.defaultRole}
            onChange={(e) => field('defaultRole', e.target.value)}
            className="w-48 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-violet-500"
          >
            <option value="all">Tất cả</option>
            <option value="ceo">CEO / Founder</option>
            <option value="dev">Dev / Technical</option>
            <option value="marketing">Marketing</option>
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {([
            ['showBadges', 'Hiện badge chức năng trên menu'],
            ['confirmBeforeApply', 'Xác nhận trước khi AI Apply code'],
            ['sidebarCollapsed', 'Thu gọn sidebar mặc định'],
          ] as [keyof AppPrefs, string][]).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 cursor-pointer">
              <span className="text-sm font-semibold text-slate-300">{label}</span>
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={prefs[key] as boolean}
                  onChange={(e) => field(key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600 peer-checked:after:bg-white" />
              </div>
            </label>
          ))}
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Số bản backup tối đa lưu cùng lúc</label>
          <input
            type="number" min={1} max={50}
            value={prefs.maxBackupCopies}
            onChange={(e) => field('maxBackupCopies', Number(e.target.value))}
            className="w-24 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-bold text-white outline-none focus:border-violet-500"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
        <h3 className="text-sm font-black text-white flex items-center gap-2">
          <Trash2 className="h-4 w-4 text-rose-300" /> Đặt lại cài đặt
        </h3>
        <p className="text-[11px] font-semibold text-slate-400">Xóa toàn bộ cài đặt ứng dụng về mặc định. Không ảnh hưởng đến dữ liệu kế toán hay AI key.</p>
        <button
          onClick={() => {
            localStorage.removeItem(PREFS_KEY);
            setPrefs(DEFAULT_PREFS);
            setSaved(true);
            setTimeout(() => setSaved(false), 1800);
          }}
          className="rounded-xl border border-rose-800/40 bg-rose-950/20 hover:bg-rose-950/40 px-4 py-2 text-xs font-black text-rose-300"
        >
          Đặt lại về mặc định
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: Backup & Restore
// ─────────────────────────────────────────────────────────────────────────────
function BackupTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-2xl border border-violet-700/30 bg-violet-950/10 p-4">
        <HardDrive className="mt-0.5 h-5 w-5 shrink-0 text-violet-300" />
        <div>
          <div className="text-xs font-black text-violet-100">Sao lưu dữ liệu nội bộ</div>
          <p className="mt-1 text-[11px] font-semibold leading-5 text-violet-200/70">
            Backup này bao gồm dữ liệu Workboard, Decision Log, Product Factory, Prompt Pack và các dữ liệu localStorage nội bộ. AI Key vault có quy trình backup riêng trong tab AI Gateway.
          </p>
        </div>
      </div>
      <Suspense fallback={<PanelLoader />}>
        <LabsBackupRestore />
      </Suspense>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: About
// ─────────────────────────────────────────────────────────────────────────────
function AboutTab() {
  const [manifest, setManifest] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch('/ledgerflow-build-manifest.json')
      .then((r) => r.json())
      .then(setManifest)
      .catch(() => setManifest(null));
  }, []);

  const items: [string, string][] = [
    ['Tên ứng dụng', 'LedgerFlow Studio'],
    ['Phiên bản', String(manifest?.version ?? '—')],
    ['Build date', manifest?.buildAt ? new Date(manifest.buildAt as string).toLocaleString('vi-VN') : '—'],
    ['Môi trường', import.meta.env.MODE ?? '—'],
    ['Simulation modules', String(manifest?.totalSimulationModules ?? '—')],
  ];

  const links: [string, string, string][] = [
    ['Tài liệu kiến trúc', '/docs/COMPANY_OS_TARGET_ARCHITECTURE.md', ''],
    ['AI Agent Playbook', '/docs/AI_AGENT_PLAYBOOK.md', ''],
    ['Hướng dẫn chạy Hybrid', '/docs/HYBRID_RUN_GUIDE.md', ''],
    ['Release Guard Checklist', '/docs/RELEASE_GUARD_CHECKLIST.md', ''],
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 shadow-lg shadow-violet-900/40">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="text-base font-black text-white">LedgerFlow Studio</div>
            <div className="text-xs font-semibold text-slate-400">Software Company Operating System</div>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {items.map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2.5">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-600">{label}</div>
              <div className="mt-0.5 text-xs font-bold text-slate-200">{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="mb-3 text-sm font-black text-white">Tài liệu nội bộ</h3>
        <div className="space-y-2">
          {links.map(([label, href]) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2.5 hover:border-slate-700 hover:bg-slate-900/60 transition-colors"
            >
              <span className="text-xs font-semibold text-slate-300">{label}</span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-600" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN: SystemSettingsPanel
// ─────────────────────────────────────────────────────────────────────────────
const TABS: { id: SettingsTab; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'ai_gateway',    label: 'AI Gateway & Keys',    icon: <Bot className="h-4 w-4" />,     desc: 'Quản lý API key AI providers' },
  { id: 'vault',         label: 'Bảo mật Vault',        icon: <Shield className="h-4 w-4" />,  desc: 'Mật khẩu chủ & auto-lock' },
  { id: 'integrations',  label: 'Tích hợp nền tảng',   icon: <Plug2 className="h-4 w-4" />,   desc: 'Supabase, GitHub, Telegram...' },
  { id: 'preferences',   label: 'Tùy chọn ứng dụng',   icon: <Palette className="h-4 w-4" />, desc: 'Giao diện, vai trò mặc định' },
  { id: 'backup',        label: 'Sao lưu & Khôi phục',  icon: <HardDrive className="h-4 w-4" />, desc: 'Export / import dữ liệu' },
  { id: 'about',         label: 'Về phần mềm',           icon: <Info className="h-4 w-4" />,    desc: 'Phiên bản, tài liệu, build info' },
];

export default function SystemSettingsPanel() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('ai_gateway');

  return (
    <div className="space-y-0 text-slate-100">
      {/* Header */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-violet-950/20 p-6 shadow-2xl mb-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 shadow-xl shadow-violet-900/30">
            <Settings className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">Cài đặt hệ thống</h1>
            <p className="mt-1 text-sm font-semibold text-slate-400">
              Quản lý AI providers, bảo mật vault, tích hợp nền tảng và cấu hình ứng dụng.
            </p>
          </div>
        </div>
      </div>

      {/* Layout: sidebar + content */}
      <div className="flex gap-5">
        {/* Sidebar nav */}
        <aside className="w-52 shrink-0">
          <nav className="sticky top-4 space-y-1 rounded-2xl border border-slate-800 bg-slate-900/60 p-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
                  activeTab === t.id
                    ? 'bg-violet-600/20 border border-violet-700/40 text-violet-200'
                    : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <span className={activeTab === t.id ? 'text-violet-400' : 'text-slate-600'}>{t.icon}</span>
                <div>
                  <div className={`text-xs font-black leading-none ${activeTab === t.id ? 'text-violet-100' : 'text-slate-300'}`}>{t.label}</div>
                  <div className="mt-0.5 text-[10px] font-semibold text-slate-600 leading-none">{t.desc}</div>
                </div>
                {activeTab === t.id && <ChevronRight className="ml-auto h-3.5 w-3.5 text-violet-400" />}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          {activeTab === 'ai_gateway'   && <AIGatewayTab />}
          {activeTab === 'vault'        && <VaultTab />}
          {activeTab === 'integrations' && <IntegrationsTab />}
          {activeTab === 'preferences'  && <PreferencesTab />}
          {activeTab === 'backup'       && <BackupTab />}
          {activeTab === 'about'        && <AboutTab />}
        </main>
      </div>
    </div>
  );
}
