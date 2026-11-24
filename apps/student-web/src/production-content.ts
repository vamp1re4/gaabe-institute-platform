import { useEffect, useState } from 'react';
import { createProductionClients, publicBackendConfig } from '@gaabe/api';

const enabled = Boolean(import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_APP_ID && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
const clients = enabled ? createProductionClients(publicBackendConfig(import.meta.env)) : null;

export type LiveLesson = { id: string; title: string; position: number; duration_minutes: number | null };
export type LiveModule = { id: string; title: string; position: number; lessons: LiveLesson[] };
export type LiveCourse = { id: string; slug: string; title: string; summary: string; access_tier: 'free' | 'premium'; course_modules: LiveModule[] };

function normalize(value: unknown): LiveCourse[] {
  return Array.isArray(value) ? value as LiveCourse[] : [];
}

async function readCourses(courseId?: string) {
  if (!clients) return [];
  let query = clients.supabase.from('courses')
    .select('id, slug, title, summary, access_tier, course_modules(id, title, position, lessons(id, title, position, duration_minutes))')
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  if (courseId) query = query.eq('id', courseId);
  const { data, error } = await query;
  if (error) throw error;
  return normalize(data).map((course) => ({
    ...course,
    course_modules: [...(course.course_modules ?? [])].sort((a, b) => a.position - b.position).map((module) => ({ ...module, lessons: [...(module.lessons ?? [])].sort((a, b) => a.position - b.position) })),
  }));
}

export function usePublishedCourses(courseId?: string) {
  const [courses, setCourses] = useState<LiveCourse[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    async function load() {
      try { const next = await readCourses(courseId); if (active) { setCourses(next); setError(''); } }
      catch { if (active) setError('Courses are temporarily unavailable.'); }
      finally { if (active) setLoading(false); }
    }
    void load();
    if (!clients) return () => { active = false; };
    const channel = clients.supabase.channel(`published-courses-${courseId ?? 'all'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'course_modules' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lessons' }, () => void load())
      .subscribe();
    return () => { active = false; void clients.supabase.removeChannel(channel); };
  }, [courseId]);
  return { courses, loading, error, enabled };
}
