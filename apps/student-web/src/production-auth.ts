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
