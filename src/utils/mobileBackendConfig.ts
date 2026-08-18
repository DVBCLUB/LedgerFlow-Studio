/**
 * mobileBackendConfig.ts
 * Manages Dynamic Backend URL Resolution & Security Tokens for Mobile & Native Apps.
 */

const STORAGE_KEY_BACKEND_URL = 'ledgerflow_mobile_backend_url';
const STORAGE_KEY_AUTH_TOKEN = 'ledgerflow_mobile_auth_token';

export function isCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false;
  const protocol = window.location.protocol;
  const host = window.location.hostname;
  return (
    protocol === 'capacitor:' ||
    protocol === 'ionic:' ||
    host === 'localhost' && (window as any).Capacitor !== undefined
  );
}

export function getCustomBackendUrl(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEY_BACKEND_URL) || '';
}

export function setCustomBackendUrl(url: string): void {
  if (typeof window === 'undefined') return;
  const cleanUrl = url.trim().replace(/\/+$/, '');
  if (cleanUrl) {
    localStorage.setItem(STORAGE_KEY_BACKEND_URL, cleanUrl);
  } else {
    localStorage.removeItem(STORAGE_KEY_BACKEND_URL);
  }
}

export function getMobileAuthToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEY_AUTH_TOKEN) || '';
}

export function setMobileAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  const cleanToken = token.trim();
  if (cleanToken) {
    localStorage.setItem(STORAGE_KEY_AUTH_TOKEN, cleanToken);
  } else {
    localStorage.removeItem(STORAGE_KEY_AUTH_TOKEN);
  }
}

export function getApiBaseUrl(): string {
  const custom = getCustomBackendUrl();
  if (custom) return custom;
  if (typeof window !== 'undefined') {
    // If running in browser or PWA on Railway domain, use current origin
    if (!isCapacitorNative() && window.location.origin.startsWith('http')) {
      return window.location.origin;
    }
  }
  return '';
}

export function getApiHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
  const token = getMobileAuthToken();
  if (token) {
    headers['x-mobile-vibe-token'] = token;
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}
