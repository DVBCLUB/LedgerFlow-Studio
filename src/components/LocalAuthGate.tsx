import React, { useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Building2, LockKeyhole, LogOut, ShieldCheck } from 'lucide-react';

const SESSION_KEY = 'ledgerflow_auth_session_v2';

type AuthMode = 'supabase' | 'local';

interface LocalAuthGateProps {
  children: React.ReactNode;
}

interface AuthSession {
  mode: AuthMode;
  label: string;
  loginAt: string;
  accessToken?: string;
}

function readSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.mode || !parsed?.label || !parsed?.loginAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

function isSupabaseConfigured(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

function getSupabaseClient() {
  if (!isSupabaseConfigured()) return null;
  return createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error || 'Không thể đăng nhập.');
}

export default function LocalAuthGate({ children }: LocalAuthGateProps) {
  const initialSession = useMemo(() => readSession(), []);
  const supabaseConfigured = useMemo(() => isSupabaseConfigured(), []);
  const [session, setSession] = useState<AuthSession | null>(initialSession);
  const [mode, setMode] = useState<AuthMode>(supabaseConfigured ? 'supabase' : 'local');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localToken, setLocalToken] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSupabaseLogin = async () => {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase chưa được cấu hình. Hãy nhập VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.');
    }

    const { data, error: signInError } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) throw signInError;
    if (!data.session || !data.user?.email) throw new Error('Không lấy được phiên Supabase.');

    const nextSession: AuthSession = {
      mode: 'supabase',
      label: data.user.email,
      loginAt: new Date().toISOString(),
      accessToken: data.session.access_token,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
  };

  const handleLocalLogin = async () => {
    const response = await fetch('/api/auth/local-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: localToken }),
    });
    const payload = await response.json().catch(() => null) as { success?: boolean; error?: string } | null;
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error || 'LOCAL_ADMIN_TOKEN không hợp lệ hoặc chưa được cấu hình.');
    }

    const nextSession: AuthSession = {
      mode: 'local',
      label: 'Local/offline',
      loginAt: new Date().toISOString(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
    setLocalToken('');
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (mode === 'supabase') {
        await handleSupabaseLogin();
      } else {
        await handleLocalLogin();
      }
    } catch (loginError) {
      setError(getErrorMessage(loginError));
    } finally {
      setIsSubmitting(false);
      setPassword('');
    }
  };

  const handleLogout = async () => {
    if (session?.mode === 'supabase') {
      await getSupabaseClient()?.auth.signOut().catch(() => undefined);
    }
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setPassword('');
    setLocalToken('');
  };

  if (session) {
    return (
      <>
        <div className="fixed top-3 right-3 z-[80] flex items-center gap-2 rounded-full border border-cyan-500/30 bg-slate-950/80 px-3 py-2 text-[11px] font-bold text-cyan-100 shadow-2xl shadow-cyan-950/30 backdrop-blur-md">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>{session.mode === 'supabase' ? 'Supabase' : 'Local'}: {session.label}</span>
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
        <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-cyan-700/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[30rem] w-[30rem] rounded-full bg-slate-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950/85 p-7 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/25">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">LedgerFlow Hub</h1>
            <p className="mt-1 text-xs font-medium leading-relaxed text-slate-400">
              Đăng nhập bằng Supabase Auth hoặc token local/offline đã cấu hình trong .env. Không có tài khoản mặc định trong source code.
            </p>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-1">
          <button
            type="button"
            onClick={() => setMode('supabase')}
            disabled={!supabaseConfigured}
            className={`rounded-xl px-3 py-2 text-xs font-black transition ${
              mode === 'supabase'
                ? 'bg-cyan-500 text-slate-950'
                : 'text-slate-400 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40'
            }`}
          >
            Supabase Auth
          </button>
          <button
            type="button"
            onClick={() => setMode('local')}
            className={`rounded-xl px-3 py-2 text-xs font-black transition ${
              mode === 'local'
                ? 'bg-cyan-500 text-slate-950'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            Local/offline
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {mode === 'supabase' ? (
            <>
              <div>
                <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-cyan-400/70"
                  autoComplete="email"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Mật khẩu</label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-cyan-400/70"
                  autoComplete="current-password"
                  required
                />
              </div>
            </>
          ) : (
            <div>
              <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-slate-400">LOCAL_ADMIN_TOKEN</label>
              <input
                type="password"
                value={localToken}
                onChange={(event) => setLocalToken(event.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-cyan-400/70"
                autoComplete="one-time-code"
                autoFocus
                required
              />
              <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                Token được kiểm tra qua backend local và không được lưu vào localStorage.
              </p>
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
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-black uppercase tracking-wide text-slate-950 shadow-lg shadow-cyan-950/40 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LockKeyhole className="h-4 w-4" />
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="mt-5 rounded-2xl border border-slate-700/80 bg-slate-900/60 p-4 text-xs text-slate-300">
          <div className="font-black uppercase tracking-wide text-cyan-300">Thiết lập tài khoản</div>
          <p className="mt-2 leading-relaxed">
            Supabase dùng email/password. Local/offline dùng `LOCAL_ADMIN_TOKEN` trong `.env`. Xem chi tiết tại `docs/AUTH_SETUP.md`.
          </p>
        </div>
      </div>
    </div>
  );
}
