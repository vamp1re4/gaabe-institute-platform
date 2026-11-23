import { useEffect, useState } from 'react';
import { createProductionClients, publicBackendConfig } from '@gaabe/api';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, updateProfile, type User } from 'firebase/auth';

const configured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY
  && import.meta.env.VITE_FIREBASE_APP_ID
  && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
);

const clients = configured ? createProductionClients(publicBackendConfig(import.meta.env)) : null;

export const productionAuthEnabled = configured;
export const paymentsUrl = import.meta.env.VITE_PAYMENTS_URL as string | undefined;
export const productionPaymentsEnabled = Boolean(configured && paymentsUrl);

async function persistProfile(user: User, displayName?: string) {
  if (!clients) return;
  const { error } = await clients.supabase.from('profiles').upsert({
    firebase_uid: user.uid,
    email: user.email?.toLowerCase() ?? null,
    display_name: displayName ?? user.displayName ?? null,
  });
  if (error) throw new Error('Your account was created, but the learning profile could not be saved. Please sign in again.');
}

export function useProductionUser() {
  const [user, setUser] = useState<User | null>(clients?.auth.currentUser ?? null);
  useEffect(() => {
    if (!clients) return;
    return onAuthStateChanged(clients.auth, setUser);
  }, []);
  return user;
}

export async function signInProduction(email: string, password: string) {
  if (!clients) throw new Error('Production authentication is not configured.');
  const credential = await signInWithEmailAndPassword(clients.auth, email, password);
  await persistProfile(credential.user);
}

export async function registerProduction(name: string, email: string, password: string) {
  if (!clients) throw new Error('Production authentication is not configured.');
  const credential = await createUserWithEmailAndPassword(clients.auth, email, password);
  if (name) await updateProfile(credential.user, { displayName: name });
  await persistProfile(credential.user, name);
}

export async function signOutProduction() {
  if (clients) await signOut(clients.auth);
}

/** Starts Stripe-hosted test Checkout. The browser never receives Stripe secrets. */
export async function startTestCheckout(plan: 'standard' | 'premium') {
  if (!clients || !paymentsUrl || !clients.auth.currentUser) throw new Error('Sign in before selecting a plan.');
  const token = await clients.auth.currentUser.getIdToken();
  const response = await fetch(`${paymentsUrl}/v1/checkout`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      'idempotency-key': `checkout-${crypto.randomUUID()}`,
    },
    body: JSON.stringify({ plan }),
  });
  const body = await response.json().catch(() => null) as { checkoutUrl?: unknown } | null;
  if (!response.ok || typeof body?.checkoutUrl !== 'string') throw new Error('Checkout could not be started. Please try again.');
  window.location.assign(body.checkoutUrl);
}
