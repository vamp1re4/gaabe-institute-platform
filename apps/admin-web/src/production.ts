import { createProductionClients, publicBackendConfig } from '@gaabe/api';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { useEffect, useState } from 'react';

const configured = Boolean(import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_APP_ID && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
const clients = configured ? createProductionClients(publicBackendConfig(import.meta.env)) : null;
export const productionAdminEnabled = configured;

export function useAdminUser() {
  const [user, setUser] = useState<User | null>(clients?.auth.currentUser ?? null);
  useEffect(() => clients ? onAuthStateChanged(clients.auth, setUser) : undefined, []);
  return user;
}

export async function signInAdmin(email: string, password: string) {
  if (!clients) throw new Error('Production administration is not configured.');
  await signInWithEmailAndPassword(clients.auth, email, password);
}

export async function signOutAdmin() { if (clients) await signOut(clients.auth); }

export async function loadStaffOrganization() {
  if (!clients?.auth.currentUser) throw new Error('Sign in first.');
  const { data, error } = await clients.supabase.from('organization_members').select('organization_id, role').limit(1).maybeSingle();
  if (error || !data || !['owner', 'admin', 'teacher'].includes(data.role)) throw new Error('This account does not have publishing access.');
  return data.organization_id;
}

export async function loadCourses() {
  if (!clients) return [];
  const organizationId = await loadStaffOrganization();
  const { data, error } = await clients.supabase.from('courses').select('id, title, summary, status, access_tier, created_at').eq('organization_id', organizationId).order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createDraftCourse(input: { title: string; summary: string; accessTier: 'free' | 'premium' }) {
  if (!clients?.auth.currentUser) throw new Error('Sign in first.');
  const organizationId = await loadStaffOrganization();
  const slug = `${input.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${crypto.randomUUID().slice(0, 8)}`;
  const { error } = await clients.supabase.from('courses').insert({
    organization_id: organizationId,
    created_by_uid: clients.auth.currentUser.uid,
    slug,
    title: input.title.trim(),
    summary: input.summary.trim(),
    access_tier: input.accessTier,
  });
  if (error) throw error;
}
