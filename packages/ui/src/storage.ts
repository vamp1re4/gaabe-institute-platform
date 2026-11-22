import { useCallback, useSyncExternalStore } from 'react';

/**
 * Tiny localStorage-backed store. DEMO ONLY: progress, the "subscription" and the "signed-in user"
 * all live in this browser. None of it is secure, synced, or verified by any server.
 */
const listeners = new Set<() => void>();
const memory = new Map<string, string>();

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return memory.get(key) ?? null;
  }
}
function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    if (value === null) memory.delete(key);
    else memory.set(key, value);
  }
  listeners.forEach((l) => l());
}

export function useStored<T>(key: string, initial: T): [T, (v: T) => void] {
  // Snapshot is the raw string so useSyncExternalStore gets a stable primitive.
  const raw = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      window.addEventListener('storage', cb);
      return () => {
        listeners.delete(cb);
        window.removeEventListener('storage', cb);
      };
    },
    () => read(key),
    () => null,
  );
  let value = initial;
  if (raw !== null) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = initial;
    }
  }
  const set = useCallback((v: T) => write(key, JSON.stringify(v)), [key]);
  return [value, set];
}

export function clearStored(key: string) {
  write(key, null);
}

