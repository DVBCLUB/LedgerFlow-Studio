/**
 * mediaProviderClient.ts
 * ============================================================
 * Shared HTTP + credential helper for the Multi-Modal Asset Foundry adapters.
 *
 * Every adapter reads credentials from the AI Key Vault (never from the
 * frontend). This keeps provider keys server-side only, per AGENTS.md.
 */

import { getEnabledAIKeyEntries } from './aiKeyVault.ts';

export interface MediaKey {
  provider: string;
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

/** Resolve the first enabled vault entry for a provider id (e.g. "flux1", "elevenlabs"). */
export async function findMediaKey(provider: string): Promise<MediaKey | null> {
  try {
    const entries = await getEnabledAIKeyEntries();
    const entry = entries.find((e) => e.provider === provider && e.enabled);
    if (!entry) return null;
    return {
      provider: entry.provider,
      apiKey: entry.apiKey,
      baseUrl: entry.baseUrl || undefined,
      model: entry.model || undefined,
    };
  } catch {
    return null;
  }
}

export interface HttpRequestOptions {
  apiKey?: string;
  /** Authorization headers. Defaults to `Authorization: Bearer <apiKey>`. */
  authHeaders?: Record<string, string>;
  extraHeaders?: Record<string, string>;
  timeoutMs?: number;
}

export async function postJson(url: string, body: unknown, opts: HttpRequestOptions = {}): Promise<any> {
  const timeoutMs = opts.timeoutMs || 90_000;
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...(opts.apiKey ? opts.authHeaders || { authorization: `Bearer ${opts.apiKey}` } : {}),
    ...(opts.extraHeaders || {}),
  };
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  return parseResponse(res);
}

export async function getJson(url: string, opts: HttpRequestOptions = {}): Promise<any> {
  const timeoutMs = opts.timeoutMs || 60_000;
  const headers: Record<string, string> = {
    ...(opts.apiKey ? opts.authHeaders || { authorization: `Bearer ${opts.apiKey}` } : {}),
    ...(opts.extraHeaders || {}),
  };
  const res = await fetch(url, { method: 'GET', headers, signal: AbortSignal.timeout(timeoutMs) });
  return parseResponse(res);
}

export async function fetchBinary(url: string, opts: HttpRequestOptions = {}): Promise<Buffer> {
  const timeoutMs = opts.timeoutMs || 120_000;
  const headers: Record<string, string> = {
    ...(opts.apiKey ? opts.authHeaders || { authorization: `Bearer ${opts.apiKey}` } : {}),
    ...(opts.extraHeaders || {}),
  };
  const res = await fetch(url, { method: 'GET', headers, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  const arr = await res.arrayBuffer();
  return Buffer.from(arr);
}

async function parseResponse(res: Response): Promise<any> {
  const text = await res.text();
  let json: any;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const message = json?.error?.message || json?.error || json?.detail || `HTTP ${res.status}`;
    const err = new Error(typeof message === 'string' ? message : `HTTP ${res.status}`);
    (err as any).status = res.status;
    throw err;
  }
  return json;
}
