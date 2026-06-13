import { useEffect, useState } from 'react';

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

export function useLocalStorageVersion(events: string[] = []) {
  const [, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion((value) => value + 1);
    window.addEventListener('storage', bump);
    events.forEach((eventName) => window.addEventListener(eventName, bump));
    return () => {
      window.removeEventListener('storage', bump);
      events.forEach((eventName) => window.removeEventListener(eventName, bump));
    };
  }, [events.join('|')]);
}
