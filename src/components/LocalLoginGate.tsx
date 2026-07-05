import React from 'react';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { LocalAuthProvider, useLocalAuth } from '../context/LocalAuthContext';

interface LocalLoginGateProps {
  children: React.ReactNode;
}

function SessionCheckingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b] px-4 text-slate-200">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950/80 p-6 text-center shadow-2xl shadow-black/30">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <h1 className="mt-4 text-lg font-black text-white">Đang kiểm tra phiên đăng nhập</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">LedgerFlow đang xác nhận phiên local với backend.</p>
      </div>
    </div>
  );
}

function LoginScreen() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    error,
    usesDevPassword,
    isSubmitting,
    login,
  } = useLocalAuth();

  return (
    <div className="min-h-screen bg-[#09090b] px-4 py-8 text-slate-200">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl shadow-black/30 lg:grid-cols-[1fr_26rem]">
          <section className="hidden min-h-[34rem] flex-col justify-between bg-slate-900/70 p-8 lg:flex">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <p className="mt-6 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">LedgerFlow Hub</p>
              <h1 className="mt-3 max-w-md text-3xl font-black leading-tight text-white">Đăng nhập vào hệ điều hành công ty phần mềm.</h1>
              <p className="mt-4 max-w-lg text-sm font-semibold leading-6 text-slate-400">
                Màn này bảo vệ dữ liệu local, AI Gateway, Integration Hub và các workspace vận hành trước khi vào phần mềm.
              </p>
            </div>
            <div className="grid gap-3 text-xs font-semibold text-slate-400">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">Backend giữ session bằng cookie HttpOnly.</div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">Frontend không lưu khóa AI hoặc secret provider.</div>
            </div>
          </section>

          <section className="p-6 sm:p-8">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">Local access</p>
            <h2 className="mt-2 text-2xl font-black text-white">Mở LedgerFlow</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">Dùng email nội bộ bất kỳ, hoặc email owner nếu backend đã cấu hình giới hạn.</p>

            <form className="mt-6 space-y-4" onSubmit={login}>
              <label className="block">
                <span className="text-xs font-bold text-slate-300">Email</span>
                <input
                  autoComplete="email"
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-500"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="founder@ledgerflow.local"
                  type="email"
                  value={email}
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold text-slate-300">Mật khẩu</span>
                <input
                  autoComplete="current-password"
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-500"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Nhập mật khẩu local"
                  type="password"
                  value={password}
                />
              </label>

              {error && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-bold leading-5 text-rose-200">
                  {error}
                </div>
              )}

              {usesDevPassword && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs font-semibold leading-5 text-amber-100">
                  Local/dev mặc định có thể dùng mật khẩu <span className="font-black">admin123</span>. Khi phát hành hoặc deploy, hãy cấu hình LOCAL_AUTH_DEV_PASSWORD.
                </div>
              )}

              <button
                className="w-full rounded-xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

function LocalLoginGateContent({ children }: LocalLoginGateProps) {
  const { session, isCheckingSession } = useLocalAuth();

  if (isCheckingSession) return <SessionCheckingScreen />;
  if (!session) return <LoginScreen />;

  return <>{children}</>;
}

export default function LocalLoginGate({ children }: LocalLoginGateProps) {
  return (
    <LocalAuthProvider>
      <LocalLoginGateContent>{children}</LocalLoginGateContent>
    </LocalAuthProvider>
  );
}
