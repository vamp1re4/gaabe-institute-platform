import { clearStored, useStored } from '@gaabe/ui';

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
