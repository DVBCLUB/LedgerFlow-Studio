import React, { useMemo, useState } from 'react';
import { LockKeyhole, ShieldCheck, Building2, LogOut } from 'lucide-react';

const SESSION_KEY = 'ledgerflow_local_session_v1';
const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'ledgerflow2026';

interface LocalAuthGateProps {
  children: React.ReactNode;
}

interface LocalSession {
  username: string;
  loginAt: string;
}

function readSession(): LocalSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalSession;
    if (!parsed?.username || !parsed?.loginAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export default function LocalAuthGate({ children }: LocalAuthGateProps) {
  const initialSession = useMemo(() => readSession(), []);
  const [session, setSession] = useState<LocalSession | null>(initialSession);
  const [username, setUsername] = useState(DEFAULT_USERNAME);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    const cleanUser = username.trim();
    if (cleanUser === DEFAULT_USERNAME && password === DEFAULT_PASSWORD) {
      const nextSession: LocalSession = {
        username: cleanUser,
        loginAt: new Date().toISOString(),
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
      setSession(nextSession);
      setError('');
      return;
    }
    setError('Sai tài khoản hoặc mật khẩu. Dùng admin / ledgerflow2026 cho bản local đầu tiên.');
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setPassword('');
  };

  if (session) {
    return (
      <>
        <div className="fixed top-3 right-3 z-[80] flex items-center gap-2 rounded-full border border-emerald-500/30 bg-slate-950/80 px-3 py-2 text-[11px] font-bold text-emerald-200 shadow-2xl shadow-emerald-950/30 backdrop-blur-md">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Local: {session.username}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="ml-1 inline-flex items-center gap-1 rounded-full border border-slate-700 px-2 py-1 text-[10px] text-slate-300 hover:border-rose-500/60 hover:text-rose-200"
          >
            <LogOut className="h-3 w-3" />
            Thoát
          </button>
        </div>
        {children}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-purple-700/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[30rem] w-[30rem] rounded-full bg-emerald-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950/85 p-7 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/25">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">LedgerFlow Hub</h1>
            <p className="mt-1 text-xs font-medium leading-relaxed text-slate-400">
              Đăng nhập local để mở trung tâm điều hành. Supabase/GitHub/AI Gateway là cấu hình bên trong app, không phải tài khoản mở app.
            </p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Tài khoản</label>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-emerald-400/70"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-emerald-400/70"
              autoComplete="current-password"
              autoFocus
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-500/25 bg-rose-950/30 px-4 py-3 text-xs font-bold text-rose-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black uppercase tracking-wide text-slate-950 shadow-lg shadow-emerald-950/40 transition hover:bg-emerald-400"
          >
            <LockKeyhole className="h-4 w-4" />
            Đăng nhập
          </button>
        </form>

        <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-950/20 p-4 text-xs text-amber-100">
          <div className="font-black uppercase tracking-wide text-amber-300">Tài khoản mặc định bản local</div>
          <div className="mt-2 font-mono text-[12px] leading-6">
            User: <span className="font-black text-white">admin</span><br />
            Pass: <span className="font-black text-white">ledgerflow2026</span>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-amber-100/80">
            Đây là lớp đăng nhập local cho bản desktop/offline. Phân quyền nhiều người dùng sẽ được nâng cấp ở module Auth/Role Center sau.
          </p>
        </div>
      </div>
    </div>
  );
}
