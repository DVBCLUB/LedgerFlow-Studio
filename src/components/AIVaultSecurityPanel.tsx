import React, { useEffect, useState } from 'react';
import { Lock, LockOpen, ShieldCheck, ShieldAlert } from 'lucide-react';
import {
  fetchAIVaultStatus,
  lockAIVault,
  setAIVaultPassphrase,
  unlockAIVault,
  type AIVaultSecurityStatus,
} from '../utils/aiSettingsApi';

export default function AIVaultSecurityPanel() {
  const [vault, setVault] = useState<AIVaultSecurityStatus | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setVault(await fetchAIVaultStatus());
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
        setMessage('Đã bật mật khẩu chủ và mã hóa lại toàn bộ AI key trong vault.');
      } else if (action === 'unlock') {
        next = await unlockAIVault(passphrase);
        setMessage('Đã mở khóa AI Vault. Bây giờ app có thể dùng key để gọi AI.');
      } else {
        next = await lockAIVault();
        setMessage('Đã khóa AI Vault. App sẽ không giải mã key cho tới khi mở khóa lại.');
      }
      setVault(next);
      setPassphrase('');
    } catch (err: any) {
      setError(err.message || 'Thao tác AI Vault thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const isLocked = !!vault?.isLocked;
  const hasPassphrase = !!vault?.hasPassphrase;

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
              </div>
            )}
          </div>
        </div>

        <div className="min-w-[280px] rounded-xl border border-slate-900 bg-slate-950 p-3">
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
          {message && <div className="mt-2 rounded-lg border border-emerald-900 bg-emerald-950/30 p-2 text-[11px] font-bold text-emerald-100">{message}</div>}
          {error && <div className="mt-2 rounded-lg border border-red-900 bg-red-950/30 p-2 text-[11px] font-bold text-red-100">{error}</div>}
        </div>
      </div>
    </section>
  );
}
