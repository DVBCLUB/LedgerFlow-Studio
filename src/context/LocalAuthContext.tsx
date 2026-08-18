import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const EMAIL_KEY = 'lf_user_email';
const SESSION_KEY = 'lf_auth_session';

export interface LocalSession {
  email: string;
  loggedInAt: string;
  role?: string;
}

interface LocalAuthContextValue {
  session: LocalSession | null;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  error: string;
  usesDevPassword: boolean;
  isSubmitting: boolean;
  isCheckingSession: boolean;
  login: (event: React.FormEvent) => Promise<void>;
  logout: () => void;
}

const LocalAuthContext = createContext<LocalAuthContextValue | null>(null);

class BackendAuthError extends Error {}

export function readLocalSession(): LocalSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LocalSession;
      if (parsed?.email && parsed?.loggedInAt) return parsed;
    }
  } catch {
    // Ignore storage parse error
  }
  return null;
}

async function requestLocalSession(email: string, password: string): Promise<{ session: LocalSession; usesDevPassword: boolean }> {
  const response = await fetch('/api/auth/local-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new BackendAuthError(data?.error || 'Email hoặc mật khẩu không đúng.');
  }
  if (!data?.session?.email || !data?.session?.loggedInAt) {
    throw new BackendAuthError('Phiên đăng nhập backend không hợp lệ.');
  }

  return {
    session: data.session,
    usesDevPassword: Boolean(data.usesDevPassword),
  };
}

export function LocalAuthProvider({ children }: { children: React.ReactNode }) {
  const initialSession = useMemo(() => readLocalSession(), []);
  const initialEmail = useMemo(() => localStorage.getItem(EMAIL_KEY) || '', []);
  const [session, setSession] = useState<LocalSession | null>(initialSession);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [usesDevPassword, setUsesDevPassword] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(Boolean(initialSession));

  useEffect(() => {
    if (!initialSession) {
      setIsCheckingSession(false);
      return;
    }

    fetch('/api/auth/session')
      .then((response) => {
        if (!response.ok) throw new Error('Session expired');
        return response.json();
      })
      .then((data) => {
        if (data?.session) {
          setSession(data.session);
          return;
        }
        localStorage.removeItem(SESSION_KEY);
        setSession(null);
      })
      .catch(() => {
        localStorage.removeItem(SESSION_KEY);
        setSession(null);
      })
      .finally(() => {
        setIsCheckingSession(false);
      });
  }, [initialSession]);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Vui lòng nhập email hợp lệ để mở LedgerFlow.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await requestLocalSession(cleanEmail, password);
      localStorage.setItem(EMAIL_KEY, result.session.email);
      localStorage.setItem(SESSION_KEY, JSON.stringify(result.session));
      setSession(result.session);
      setUsesDevPassword(result.usesDevPassword);
      setError('');
      setPassword('');
    } catch (loginError: unknown) {
      setError(loginError instanceof Error ? loginError.message : 'Email hoặc mật khẩu không đúng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const logout = () => {
    void fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setPassword('');
  };

  const value: LocalAuthContextValue = {
    session,
    email,
    setEmail,
    password,
    setPassword,
    error,
    usesDevPassword,
    isSubmitting,
    isCheckingSession,
    login,
    logout,
  };

  return <LocalAuthContext.Provider value={value}>{children}</LocalAuthContext.Provider>;
}

export function useLocalAuth() {
  const ctx = useContext(LocalAuthContext);
  if (!ctx) {
    throw new Error('useLocalAuth must be used within LocalAuthProvider');
  }
  return ctx;
}
