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
