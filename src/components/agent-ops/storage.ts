import { useEffect, useState } from 'react';

export type AgentOpsAuditEntry = {
  id: string;
  at: string;
  action: string;
  cardId: string;
  detail: string;
};

export const AGENT_OPS_AUDIT_KEY = 'ledgerflow_aiops_audit_v1';

export function readLocalStorageValue<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeLocalStorageValue<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent('ledgerflow-local-storage-updated', { detail: { key } }));
}

export function readLocalStorageArray<T>(keys: string[]): T[] {
  const merged: T[] = [];
  const seen = new Set<string>();

  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as T[];
      if (!Array.isArray(parsed)) continue;

      for (const item of parsed) {
        const id = typeof item === 'object' && item !== null && 'id' in item ? String((item as { id?: unknown }).id) : `${key}-${merged.length}`;
        if (seen.has(id)) continue;
        seen.add(id);
        merged.push(item);
      }
    } catch {
      // Keep the hub readable even when an old localStorage payload is malformed.
    }
  }

  return merged;
}

export function appendLocalStorageArrayItem<T>(key: string, item: T, limit = 200) {
  const current = readLocalStorageValue<T[]>(key, []);
  writeLocalStorageValue(key, [item, ...current].slice(0, limit));
}

export function upsertLocalStorageArrayItem<T extends { id: string }>(key: string, item: T, limit = 200) {
  const current = readLocalStorageValue<T[]>(key, []);
  const withoutItem = current.filter((entry) => entry.id !== item.id);
  writeLocalStorageValue(key, [item, ...withoutItem].slice(0, limit));
}

export function appendAgentOpsAudit(action: string, cardId: string, detail: string) {
  appendLocalStorageArrayItem<AgentOpsAuditEntry>(AGENT_OPS_AUDIT_KEY, {
    id: `audit-${Date.now()}`,
    at: new Date().toLocaleString('vi-VN'),
    action,
    cardId,
    detail
  }, 120);
}

export function useLocalStorageVersion(events: string[] = []) {
  const [, setVersion] = useState(0);
  const eventKey = events.join('|');

  useEffect(() => {
    const bump = () => setVersion((value) => value + 1);
    const eventNames = eventKey ? eventKey.split('|') : [];
    window.addEventListener('storage', bump);
    window.addEventListener('ledgerflow-local-storage-updated', bump);
    eventNames.forEach((eventName) => window.addEventListener(eventName, bump));
    return () => {
      window.removeEventListener('storage', bump);
      window.removeEventListener('ledgerflow-local-storage-updated', bump);
      eventNames.forEach((eventName) => window.removeEventListener(eventName, bump));
    };
  }, [eventKey]);
}
