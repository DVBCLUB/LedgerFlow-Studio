import React, { useMemo, useState } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { LockKeyhole, ShieldCheck, Building2, LogOut, Cloud, Monitor } from 'lucide-react';

const SESSION_KEY = 'ledgerflow_auth_session_v2';
const LOCAL_TOKEN_MIN_LENGTH = 16;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

interface LocalAuthGateProps {
  children: React.ReactNode;
}

type AuthMode = 'supabase' | 'local';

interface LocalSession {
  authMode: AuthMode;
  label: string;
  loginAt: string;
  accessToken?: string;
  localToken?: string;
}

function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project') && !supabaseAnonKey.includes('your-anon-key'));
}

function createSupabaseAuthClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

function readSession(): LocalSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LocalSession>;
    if (!parsed?.authMode || !parsed?.label || !parsed?.loginAt) return null;
    if (parsed.authMode === 'supabase' && !parsed.accessToken) return null;
    if (parsed.authMode === 'local' && !parsed.localToken) return null;
    return parsed as LocalSession;
  } catch {
    return null;
  }
}

function saveSession(nextSession: LocalSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
}

export default function LocalAuthGate({ children }: LocalAuthGateProps) {
  const supabaseConfigured = useMemo(() => isSupabaseConfigured(), []);
  const supabase = useMemo(() => createSupabaseAuthClient(), []);
  const initialSession = useMemo(() => readSession(), []);
  const [session, setSession] = useState<LocalSession | null>(initialSession);
  const [mode, setMode] = useState<AuthMode>(supabaseConfigured ? 'supabase' : 'local');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localToken, setLocalToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSupabaseLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!supabase) {
      setError('Supabase chưa được cấu hình. Hãy kiểm tra VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError || !data.session) {
        setError(signInError?.message || 'Không thể đăng nhập Supabase.');
        return;
      }

      const nextSession: LocalSession = {
        authMode: 'supabase',
        label: data.user.email || email.trim(),
        loginAt: new Date().toISOString(),
        accessToken: data.session.access_token,
      };
      saveSession(nextSession);
      setSession(nextSession);
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  const handleLocalLogin = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    const cleanToken = localToken.trim();

    if (cleanToken.length < LOCAL_TOKEN_MIN_LENGTH) {
      setError(`Local token phải có ít nhất ${LOCAL_TOKEN_MIN_LENGTH} ký tự. Cấu hình giá trị này bằng LOCAL_ADMIN_TOKEN trong file .env.`);
      return;
    }

    const nextSession: LocalSession = {
      authMode: 'local',
      label: 'Local offline',
      loginAt: new Date().toISOString(),
      localToken: cleanToken,
    };
    saveSession(nextSession);
    setSession(nextSession);
    setLocalToken('');
  };

  const handleLogout = async () => {
    localStorage.removeItem(SESSION_KEY);
    if (supabase && session?.authMode === 'supabase') {
      await supabase.auth.signOut().catch(() => undefined);
    }
    setSession(null);
    setPassword('');
    setLocalToken('');
  };

  if (session) {
    return (
      <>
        <div className="fixed top-3 right-3 z-[80] flex items-center gap-2 rounded-full border border-emerald-500/30 bg-slate-950/80 px-3 py-2 text-[11px] font-bold text-emerald-200 shadow-2xl shadow-emerald-950/30 backdrop-blur-md">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>{session.authMode === 'supabase' ? 'Supabase' : 'Local'}: {session.label}</span>
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
        <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-cyan-700/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[30rem] w-[30rem] rounded-full bg-emerald-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950/85 p-7 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/25">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">LedgerFlow Hub</h1>
            <p className="mt-1 text-xs font-medium leading-relaxed text-slate-400">
              Đăng nhập bằng Supabase Auth cho bản cloud, hoặc dùng local token do founder tự cấu hình cho bản desktop/offline.
            </p>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-1">
          <button
            type="button"
            onClick={() => setMode('supabase')}
            disabled={!supabaseConfigured}
            className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-black transition ${
              mode === 'supabase'
                ? 'bg-cyan-500 text-slate-950'
                : 'text-slate-400 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40'
            }`}
          >
            <Cloud className="h-3.5 w-3.5" />
            Supabase
          </button>
          <button
            type="button"
            onClick={() => setMode('local')}
            className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-black transition ${
              mode === 'local' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
            Local
          </button>
        </div>

        {mode === 'supabase' ? (
          <form onSubmit={handleSupabaseLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-cyan-400/70"
                autoComplete="email"
                autoFocus
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
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-500/25 bg-rose-950/30 px-4 py-3 text-xs font-bold text-rose-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-black uppercase tracking-wide text-slate-950 shadow-lg shadow-cyan-950/40 transition hover:bg-cyan-400 disabled:cursor-wait disabled:opacity-70"
            >
              <LockKeyhole className="h-4 w-4" />
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập Supabase'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLocalLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-slate-400">LOCAL_ADMIN_TOKEN</label>
              <input
                type="password"
                value={localToken}
                onChange={(event) => setLocalToken(event.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-emerald-400/70"
                autoComplete="off"
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
              Mở bản local
            </button>
          </form>
        )}

        <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-950/20 p-4 text-xs text-amber-100">
          <div className="font-black uppercase tracking-wide text-amber-300">Không còn tài khoản mặc định</div>
          <p className="mt-2 text-[11px] leading-relaxed text-amber-100/80">
            Bản cloud dùng Supabase Email/Password. Bản local/offline dùng token riêng do founder tự tạo trong file .env, không commit token thật lên GitHub.
          </p>
        </div>
      </div>
    </div>
  );
}
