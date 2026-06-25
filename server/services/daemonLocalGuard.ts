import type { NextFunction, Request, Response } from 'express';
import { readRequestPrincipal } from './localAuth.ts';

const PUBLIC_PATHS = new Set(['/health']);
const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);

function hostName(value: string | undefined) {
  if (!value) return '';
  try {
    const candidate = value.includes('://') ? value : `http://${value}`;
    return new URL(candidate).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function isLocalHost(value: string) {
  return LOCAL_HOSTS.has(value.toLowerCase()) || value.toLowerCase().endsWith('.localhost');
}

function isLocalRequest(req: Request) {
  const origin = hostName(req.headers.origin);
  const host = hostName(req.headers.host);
  const forwarded = hostName(req.headers['x-forwarded-host'] as string | undefined);
  if (origin && !isLocalHost(origin)) return false;
  if (forwarded && !isLocalHost(forwarded)) return false;
  return !host || isLocalHost(host);
}

function requiresPrincipal(req: Request) {
  if (PUBLIC_PATHS.has(req.path)) return false;
  if (req.method === 'OPTIONS') return false;
  return process.env.LEDGERFLOW_DAEMON_AUTH_REQUIRED === 'true';
}

export function createDaemonLocalGuard() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (process.env.LEDGERFLOW_DAEMON_ALLOW_REMOTE !== 'true' && !isLocalRequest(req)) {
      return res.status(403).json({ success: false, error: 'LedgerFlow daemon only accepts local requests by default.' });
    }

    if (requiresPrincipal(req) && !readRequestPrincipal(req)) {
      return res.status(401).json({ success: false, error: 'LedgerFlow daemon principal required.' });
    }

    res.setHeader('X-LedgerFlow-Daemon-Guard', 'local-first');
    next();
  };
}
