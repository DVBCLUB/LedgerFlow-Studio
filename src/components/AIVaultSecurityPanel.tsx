import React, { useEffect, useState } from 'react';
import { Clock, Lock, LockOpen, ShieldAlert, ShieldCheck } from 'lucide-react';
import {
  fetchAIVaultAutoLockStatus,
  fetchAIVaultStatus,
  lockAIVault,
  setAIVaultPassphrase,
  unlockAIVault,
  updateAIVaultAutoLock,
  type AIVaultAutoLockStatus,
  type AIVaultSecurityStatus,
} from '../utils/aiSettingsApi';

export default function AIVaultSecurityPanel() {
  const [vault, setVault] = useState<AIVaultSecurityStatus | null>(null);
  const [autoLock, setAutoLock] = useState<AIVaultAutoLockStatus | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const [timeoutMinutes, setTimeoutMinutes] = useState(30);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [vaultStatus, autoLockStatus] = await Promise.all([
        fetchAIVaultStatus(),
        fetchAIVaultAutoLockStatus(),
      ]);
      setVault(vaultStatus);
      setAutoLock(autoLockStatus);
      setTimeoutMinutes(autoLockStatus.timeoutMinutes);
    } catch (err: any) {
      setError(err.message || 'Không đọc được trạng thái AI Vault.');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const run = async (action: 'enable' | 'unlock' | 'lock') => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      let next: AIVaultSecurityStatus;
      if (action === 'enable') {
        next = await setAIVaultPassphrase(passphrase);
        setMessage('Đã bật mật khẩu chủ và mã hóa lại toàn bộ AI key trong vault. Auto-lock sẽ tự chạy sau khi vault mở khóa.');
      } else if (action === 'unlock') {
        next = await unlockAIVault(passphrase);
        setMessage('Đã mở khóa AI Vault. Auto-lock sẽ đếm ngược nếu đang bật.');
      } else {
        next = await lockAIVault();
        setMessage('Đã khóa AI Vault. App sẽ không giải mã key cho tới khi mở khóa lại.');
      }
      setVault(next);
      setPassphrase('');
      setAutoLock(await fetchAIVaultAutoLockStatus());
    } catch (err: any) {
      setError(err.message || 'Thao tác AI Vault thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const saveAutoLock = async (enabled: boolean) => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const next = await updateAIVaultAutoLock({ enabled, timeoutMinutes });
      setAutoLock(next);
      setMessage(enabled ? `Đã bật auto-lock sau ${next.timeoutMinutes} phút không dùng.` : 'Đã tắt auto-lock.');
    } catch (err: any) {
      setError(err.message || 'Không cập nhật được auto-lock.');
    } finally {
      setBusy(false);
    }
  };

  const isLocked = !!vault?.isLocked;
  const hasPassphrase = !!vault?.hasPassphrase;
  const remaining = autoLock?.remainingSeconds ?? 0;
  const remainingText = remaining > 0
    ? `${Math.floor(remaining / 60)} phút ${remaining % 60} giây`
    : 'Chưa đếm ngược';

  return (
    <section className="mb-4 rounded-2xl border border-amber-900/60 bg-slate-950/80 p-4 shadow-2xl shadow-amber-950/10">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${isLocked ? 'border-red-700 bg-red-950/40' : 'border-emerald-700 bg-emerald-950/30'}`}>
            {isLocked ? <Lock className="h-5 w-5 text-red-300" /> : <ShieldCheck className="h-5 w-5 text-emerald-300" />}
          </div>
          <div>
            <div className="text-sm font-black text-white">Bảo mật AI Vault</div>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">
              {vault?.message || 'Đang kiểm tra vault...'} Key thật không trả về frontend; frontend chỉ thấy key đã che.
            </p>
            {vault && (
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-black">
                <span className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-slate-300">Mode: {vault.mode}</span>
                <span className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-slate-300">Keys: {vault.enabledKeys}/{vault.totalKeys} bật</span>
                <span className={`rounded-lg border px-2 py-1 ${vault.canDecrypt ? 'border-emerald-800 bg-emerald-950/30 text-emerald-200' : 'border-red-800 bg-red-950/30 text-red-200'}`}>
                  {vault.canDecrypt ? 'Có thể giải mã' : 'Đang khóa'}
                </span>
                {autoLock && (
                  <span className={`rounded-lg border px-2 py-1 ${autoLock.armed ? 'border-amber-700 bg-amber-950/30 text-amber-100' : 'border-slate-800 bg-slate-900 text-slate-300'}`}>
                    Auto-lock: {autoLock.enabled ? (autoLock.armed ? remainingText : 'Bật') : 'Tắt'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid min-w-[280px] gap-3 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-900 bg-slate-950 p-3">
            {!hasPassphrase && (
              <div className="mb-2 flex items-start gap-2 rounded-lg border border-amber-900/50 bg-amber-950/20 p-2 text-[11px] font-semibold text-amber-100">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                Nên bật mật khẩu chủ nếu máy có nhiều người dùng hoặc bạn hay copy project qua máy khác.
              </div>
            )}
            <input
              type="password"
              value={passphrase}
              onChange={(event) => setPassphrase(event.target.value)}
              placeholder={hasPassphrase ? 'Nhập mật khẩu chủ để mở khóa' : 'Tạo mật khẩu chủ AI Vault'}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-bold text-white outline-none focus:border-amber-500"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {!hasPassphrase && (
                <button
                  type="button"
                  disabled={busy || passphrase.length < 8}
                  onClick={() => run('enable')}
                  className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Bật mật khẩu chủ
                </button>
              )}
              {hasPassphrase && isLocked && (
                <button
                  type="button"
                  disabled={busy || passphrase.length < 8}
                  onClick={() => run('unlock')}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <LockOpen className="h-4 w-4" />
                  Mở khóa
                </button>
              )}
              {hasPassphrase && !isLocked && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run('lock')}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-900 bg-red-950/40 px-3 py-2 text-xs font-black text-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Lock className="h-4 w-4" />
                  Khóa vault
                </button>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={load}
                className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-black text-slate-300 disabled:opacity-50"
              >
                Làm mới
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-900 bg-slate-950 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-black text-white">
              <Clock className="h-4 w-4 text-amber-300" />
              Tự khóa vault
            </div>
            <p className="mb-2 text-[11px] font-semibold leading-5 text-slate-400">
              {autoLock?.message || 'Auto-lock giúp khóa vault nếu bạn quên khóa thủ công.'}
            </p>
            <label className="text-[11px] font-black uppercase tracking-wide text-slate-500">Số phút không dùng</label>
            <input
              type="number"
              min={1}
              max={1440}
              value={timeoutMinutes}
              onChange={(event) => setTimeoutMinutes(Number(event.target.value))}
              className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-bold text-white outline-none focus:border-amber-500"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => saveAutoLock(true)}
                className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-black text-slate-950 disabled:opacity-50"
              >
                Bật / lưu auto-lock
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => saveAutoLock(false)}
                className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-black text-slate-300 disabled:opacity-50"
              >
                Tắt
              </button>
            </div>
            {autoLock?.armed && <div className="mt-2 rounded-lg border border-amber-900 bg-amber-950/30 p-2 text-[11px] font-bold text-amber-100">Đang đếm ngược: {remainingText}</div>}
          </div>

          <div className="lg:col-span-2">
            {message && <div className="rounded-lg border border-emerald-900 bg-emerald-950/30 p-2 text-[11px] font-bold text-emerald-100">{message}</div>}
            {error && <div className="rounded-lg border border-red-900 bg-red-950/30 p-2 text-[11px] font-bold text-red-100">{error}</div>}
          </div>
        </div>
      </div>
    </section>
  );
}
