import { useEffect, useState, type FormEvent } from 'react';
import { Button, Notice } from '@gaabe/ui';
import { createDraftCourse, loadCourses, productionAdminEnabled, signInAdmin, signOutAdmin, useAdminUser } from '../production';

type Course = Awaited<ReturnType<typeof loadCourses>>[number];

export function ProductionCourses() {
  const user = useAdminUser();
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function refresh() {
    if (!user) return;
    setLoading(true); setError('');
    try { setCourses(await loadCourses()); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not load courses.'); } finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); }, [user]);

  if (!productionAdminEnabled) return <Notice>Production administration is not configured for this build.</Notice>;
  if (!user) return <AdminSignIn onSuccess={() => undefined} />;
  return <section className="stack">
    <div className="row row-between"><p className="muted" style={{ margin: 0 }}>{user.email}</p><Button size="sm" variant="ghost" onClick={() => void signOutAdmin()}>Sign out</Button></div>
    <NewCourse onCreated={refresh} />
    {error && <Notice tone="error">{error}</Notice>}
    {loading ? <p className="muted">Loading…</p> : courses.length === 0 ? <p className="muted">No real courses have been created yet.</p> : <div className="grid">{courses.map((course) => <section className="card glass-liquid stack" key={course.id}><div><strong>{course.title}</strong><p className="muted">{course.summary}</p></div><small>{course.status} · {course.access_tier}</small></section>)}</div>}
  </section>;
}

function AdminSignIn({ onSuccess }: { onSuccess: () => void }) {
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    try { await signInAdmin(String(form.get('email') ?? ''), String(form.get('password') ?? '')); onSuccess(); } catch { setError('Sign in failed. Check your email and password.'); }
  }
  return <form className="card glass-liquid stack" onSubmit={submit} style={{ maxInlineSize: '32rem' }}><h2>Staff sign in</h2><label className="field"><span>Email</span><input required name="email" type="email" autoComplete="email" /></label><label className="field"><span>Password</span><input required name="password" type="password" autoComplete="current-password" /></label>{error && <Notice tone="error">{error}</Notice>}<Button type="submit">Sign in</Button></form>;
}

function NewCourse({ onCreated }: { onCreated: () => Promise<void> }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); setBusy(true); setError('');
    try { await createDraftCourse({ title: String(form.get('title') ?? ''), summary: String(form.get('summary') ?? ''), accessTier: String(form.get('accessTier')) === 'premium' ? 'premium' : 'free' }); event.currentTarget.reset(); await onCreated(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not create the draft.'); } finally { setBusy(false); }
  }
  return <form className="card glass-liquid stack" onSubmit={submit}><h2>Create real course</h2><label className="field"><span>Course title</span><input name="title" required minLength={1} maxLength={240} /></label><label className="field"><span>Summary</span><textarea name="summary" required maxLength={4000} rows={3} /></label><label className="field"><span>Access</span><select name="accessTier"><option value="free">Free</option><option value="premium">Premium</option></select></label>{error && <Notice tone="error">{error}</Notice>}<Button type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create draft'}</Button></form>;
}
