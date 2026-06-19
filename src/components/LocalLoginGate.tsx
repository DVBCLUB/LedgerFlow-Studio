import React from 'react';
import { AlertTriangle, LockKeyhole, Mail } from 'lucide-react';
import { LocalAuthProvider, useLocalAuth } from '../context/LocalAuthContext';

interface LocalLoginGateProps {
  children: React.ReactNode;
}

function LoginScreen() {
  const { email, setEmail, password, setPassword, error, usesDevPassword, isSubmitting, login } = useLocalAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-7 shadow-2xl shadow-black/40">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-200 ring-1 ring-cyan-300/20">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-cyan-300">LedgerFlow Hub</p>
            <h1 className="vi-label mt-1 text-2xl font-bold text-white">Đăng nhập để vào phần mềm</h1>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">
              Phiên local-first cho web app và desktop exe. Session được lưu cục bộ trên máy này.
            </p>
          </div>
        </div>

        <form onSubmit={login} className="space-y-4">
          <div>
            <label className="vi-label mb-1.5 block text-[11px] font-semibold text-slate-400">Email</label>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 focus-within:border-cyan-300/70">
              <Mail className="h-4 w-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full bg-transparent text-sm font-bold text-white outline-none"
                placeholder="founder@ledgerflow.local"
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="vi-label mb-1.5 block text-[11px] font-semibold text-slate-400">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-cyan-300/70"
              autoComplete="current-password"
            />
          </div>

          {usesDevPassword && (
            <div className="flex gap-3 rounded-2xl border border-amber-400/25 bg-amber-950/20 p-4 text-xs font-semibold leading-5 text-amber-100">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
              <span>Mật khẩu mặc định chỉ dùng cho local/dev. Hãy đổi trong production.</span>
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-rose-500/25 bg-rose-950/30 px-4 py-3 text-xs font-bold text-rose-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black uppercase tracking-wide text-slate-950 shadow-lg shadow-cyan-950/40 transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-70"
          >
            <LockKeyhole className="h-4 w-4" />
            {isSubmitting ? 'Đang kiểm tra...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}

function GateBody({ children }: { children: React.ReactNode }) {
  const { session } = useLocalAuth();
  if (!session) return <LoginScreen />;
  return <>{children}</>;
}

export default function LocalLoginGate({ children }: LocalLoginGateProps) {
  return (
    <LocalAuthProvider>
      <GateBody>{children}</GateBody>
    </LocalAuthProvider>
  );
}
