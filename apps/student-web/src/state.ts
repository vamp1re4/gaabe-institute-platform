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

export const KEYS = {
  progress: 'gaabe.demo.progress',
  subscription: 'gaabe.demo.subscription',
  user: 'gaabe.demo.user',
  checklist: 'gaabe.demo.checklist',
} as const;

export function useProgress() {
  const [done, setDone] = useStored<Record<string, string>>(KEYS.progress, {});
  return {
    done,
    isDone: (lessonId: string) => lessonId in done,
    toggle: (lessonId: string) => {
      const next = { ...done };
      if (lessonId in next) delete next[lessonId];
      else next[lessonId] = new Date().toISOString();
      setDone(next);
    },
  };
}

export function useSubscription() {
  const [planId, setPlan] = useStored<string | null>(KEYS.subscription, null);
  return {
    planId,
    active: planId !== null && planId !== 'free',
    activate: (id: string) => setPlan(id),
    reset: () => clearStored(KEYS.subscription),
  };
}

export function useDemoUser() {
  const [user, setUser] = useStored<{ name: string } | null>(KEYS.user, null);
  return { user, signIn: (name: string) => setUser({ name }), signOut: () => clearStored(KEYS.user) };
}
