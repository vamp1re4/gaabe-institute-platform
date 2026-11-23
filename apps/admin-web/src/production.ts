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

export async function loadStaffContext() {
  if (!clients?.auth.currentUser) throw new Error('Sign in first.');
  const { data, error } = await clients.supabase.from('organization_members').select('organization_id, role').limit(1).maybeSingle();
  if (error || !data || !['owner', 'admin', 'teacher'].includes(data.role)) throw new Error('This account does not have publishing access.');
  return data as { organization_id: string; role: 'owner' | 'admin' | 'teacher' };
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

export async function savePublicProfile(input: { teacherName: string; teacherBio: string; contactEmail: string }) {
  if (!clients?.auth.currentUser) throw new Error('Sign in first.');
  const organizationId = await loadStaffOrganization();
  const { error } = await clients.supabase.from('organization_public_profiles').upsert({
    organization_id: organizationId,
    teacher_name: input.teacherName.trim(),
    teacher_bio: input.teacherBio.trim(),
    contact_email: input.contactEmail.trim().toLowerCase() || null,
    updated_by_uid: clients.auth.currentUser.uid,
  });
  if (error) throw error;
}

export async function addLearningPack(input: { courseId: string; moduleTitle: string; lessonTitle: string; lessonBody: string; worksheetTitle: string; question: string; presentationTitle: string; slides: string }) {
  if (!clients?.auth.currentUser) throw new Error('Sign in first.');
  const { data: existingModules, error: modulesError } = await clients.supabase.from('course_modules').select('position').eq('course_id', input.courseId).order('position', { ascending: false }).limit(1);
  if (modulesError) throw modulesError;
  const modulePosition = (existingModules?.[0]?.position ?? 0) + 1;
  const { data: module, error: moduleError } = await clients.supabase.from('course_modules').insert({ course_id: input.courseId, position: modulePosition, title: input.moduleTitle.trim() }).select('id').single();
  if (moduleError || !module) throw moduleError ?? new Error('Module could not be created.');
  const { data: lesson, error: lessonError } = await clients.supabase.from('lessons').insert({ module_id: module.id, position: 1, title: input.lessonTitle.trim(), body: { content: input.lessonBody.trim() }, duration_minutes: 15 }).select('id').single();
  if (lessonError || !lesson) throw lessonError ?? new Error('Lesson could not be created.');
  const { data: worksheet, error: worksheetError } = await clients.supabase.from('worksheets').insert({ lesson_id: lesson.id, title: input.worksheetTitle.trim(), published: true }).select('id').single();
  if (worksheetError || !worksheet) throw worksheetError ?? new Error('Worksheet could not be created.');
  const { error: questionError } = await clients.supabase.from('worksheet_questions').insert({ worksheet_id: worksheet.id, position: 1, prompt: { content: input.question.trim() }, question_type: 'short_answer', configuration: {} });
  if (questionError) throw questionError;
  const slides = input.slides.split('\n').map((line) => line.trim()).filter(Boolean).map((content, index) => ({ position: index + 1, content }));
  const { error: presentationError } = await clients.supabase.from('presentations').insert({ course_id: input.courseId, title: input.presentationTitle.trim(), slides, published: true, created_by_uid: clients.auth.currentUser.uid });
  if (presentationError) throw presentationError;
}

export async function submitCourseForReview(courseId: string) {
  if (!clients?.auth.currentUser) throw new Error('Sign in first.');
  const { error } = await clients.supabase.from('course_review_requests').upsert({ course_id: courseId, submitted_by_uid: clients.auth.currentUser.uid, status: 'pending', review_note: '' }, { onConflict: 'course_id' });
  if (error) throw error;
}

export async function approveCourse(courseId: string, reviewNote = '') {
  if (!clients) throw new Error('Production administration is not configured.');
  const { error } = await clients.supabase.rpc('approve_course_review', { p_course_id: courseId, p_review_note: reviewNote });
  if (error) throw error;
}
