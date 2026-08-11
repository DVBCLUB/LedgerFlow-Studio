import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { LocalAuthProvider, useLocalAuth } from '../context/LocalAuthContext';

interface LocalLoginGateProps {
  children: React.ReactNode;
}

function SessionCheckingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b] px-4 text-slate-200 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 700px 500px at 30% 50%, rgba(99,102,241,0.06) 0%, transparent 70%), radial-gradient(ellipse 500px 700px at 75% 30%, rgba(6,182,212,0.05) 0%, transparent 70%)',
      }} />
      <div
        className="relative w-full max-w-sm rounded-2xl p-6 text-center"
        style={{
          background: 'rgba(15,18,28,0.85)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.02), 0 24px 48px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(24px)',
        }}
      >
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl"
          style={{
            background: 'rgba(6,182,212,0.08)',
            border: '1px solid rgba(6,182,212,0.2)',
            boxShadow: '0 0 16px rgba(6,182,212,0.15)',
          }}
        >
          <ShieldCheck className="h-5 w-5 text-cyan-300" />
        </div>
        <h1 className="mt-4 text-lg font-black text-white">Đang kiểm tra phiên đăng nhập</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
          LedgerFlow đang xác nhận phiên local với backend.
        </p>
        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mt-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-cyan-500"
              style={{ animation: `lf-dot-pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>
      <style>{`
        @keyframes lf-dot-pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
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
    <div className="min-h-screen bg-[#09090b] px-4 py-8 text-slate-200 relative overflow-hidden">
      {/* Ambient background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 800px 600px at 20% 50%, rgba(99,102,241,0.07) 0%, transparent 70%), radial-gradient(ellipse 600px 800px at 80% 30%, rgba(6,182,212,0.05) 0%, transparent 70%)',
          animation: 'lf-ambient 8s ease-in-out infinite alternate',
        }}
      />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
        <div
          className="grid w-full overflow-hidden rounded-3xl lg:grid-cols-[1fr_26rem]"
          style={{
            background: 'rgba(10,12,18,0.9)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.02), 0 32px 64px rgba(0,0,0,0.6)',
            backdropFilter: 'blur(24px)',
          }}
        >
          {/* Left panel */}
          <section
            className="hidden min-h-[34rem] flex-col justify-between p-8 lg:flex"
            style={{ background: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div>
              {/* LF Logo */}
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
                  boxShadow: '0 0 16px rgba(99,102,241,0.35)',
                }}
              >
                <span className="text-white font-black text-base tracking-tight">LF</span>
              </div>
              <p className="mt-6 text-[10px] font-black uppercase tracking-[0.22em] text-indigo-400">
                LedgerFlow Hub
              </p>
              <h1 className="mt-3 max-w-md text-3xl font-black leading-tight text-white">
                Đăng nhập vào hệ điều hành công ty phần mềm.
              </h1>
              <p className="mt-4 max-w-lg text-sm font-semibold leading-6 text-slate-500">
                Màn này bảo vệ dữ liệu local, AI Gateway, Integration Hub và các workspace vận hành trước khi vào phần mềm.
              </p>
            </div>
            <div className="grid gap-3 text-xs font-semibold text-slate-500">
              <div
                className="rounded-2xl p-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                Backend giữ session bằng cookie HttpOnly.
              </div>
              <div
                className="rounded-2xl p-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                Frontend không lưu khóa AI hoặc secret provider.
              </div>
            </div>
          </section>

          {/* Right panel — Form */}
          <section className="p-6 sm:p-8">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Local access</p>
            <h2 className="mt-2 text-2xl font-black text-white">Mở LedgerFlow</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              Dùng email nội bộ bất kỳ, hoặc email owner nếu backend đã cấu hình giới hạn.
            </p>

            <form className="mt-6 space-y-4" onSubmit={login}>
              <label className="block">
                <span className="text-xs font-bold text-slate-400">Email</span>
                <input
                  autoComplete="email"
                  className="mt-2 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onFocus={(e) => { e.target.style.border = '1px solid rgba(99,102,241,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                  onBlur={(e) => { e.target.style.border = '1px solid rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="founder@ledgerflow.local"
                  type="email"
                  value={email}
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold text-slate-400">Mật khẩu</span>
                <input
                  autoComplete="current-password"
                  className="mt-2 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onFocus={(e) => { e.target.style.border = '1px solid rgba(99,102,241,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                  onBlur={(e) => { e.target.style.border = '1px solid rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Nhập mật khẩu local"
                  type="password"
                  value={password}
                />
              </label>

              {error && (
                <div
                  className="rounded-xl p-3 text-xs font-bold leading-5 text-rose-200"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
                >
                  {error}
                </div>
              )}

              {usesDevPassword && (
                <div
                  className="rounded-xl p-3 text-xs font-semibold leading-5 text-amber-100"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
                >
                  Local/dev mặc định có thể dùng mật khẩu{' '}
                  <span className="font-black">admin123</span>. Khi phát hành hoặc deploy, hãy cấu hình LOCAL_AUTH_DEV_PASSWORD.
                </div>
              )}

              <button
                className="w-full rounded-xl px-4 py-3 text-sm font-black text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background: isSubmitting ? 'rgba(99,102,241,0.6)' : 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
                  boxShadow: isSubmitting ? 'none' : '0 0 20px rgba(99,102,241,0.3)',
                }}
                onMouseEnter={(e) => { if (!isSubmitting) (e.target as HTMLElement).style.transform = 'scale(1.01)'; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = 'scale(1)'; }}
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </form>
          </section>
        </div>
      </div>

      <style>{`
        @keyframes lf-ambient {
          from { opacity: 0.7; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function LocalLoginGateContent({ children }: LocalLoginGateProps) {
  // Direct pass-through: Bypass login gate screen to load Company OS immediately
  return <>{children}</>;
}

export default function LocalLoginGate({ children }: LocalLoginGateProps) {
  return (
    <LocalAuthProvider>
      <LocalLoginGateContent>{children}</LocalLoginGateContent>
    </LocalAuthProvider>
  );
}
