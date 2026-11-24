import { useEffect, useState, type FormEvent } from 'react';
import { Button, Notice } from '@gaabe/ui';
import { addLearningPack, approveCourse, createDraftCourse, loadCourses, loadStaffContext, productionAdminEnabled, savePublicProfile, signInAdmin, signOutAdmin, submitCourseForReview, useAdminUser } from '../production';

type Course = Awaited<ReturnType<typeof loadCourses>>[number];

export function ProductionCourses() {
  const user = useAdminUser();
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'owner' | 'admin' | 'teacher' | null>(null);

  async function refresh() {
    if (!user) return;
    setLoading(true); setError('');
    try {
      const [items, context] = await Promise.all([loadCourses(), loadStaffContext()]);
      setCourses(items); setRole(context.role);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not load courses.'); } finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); }, [user]);

  if (!productionAdminEnabled) return <Notice>Production administration is not configured for this build.</Notice>;
  if (!user) return <AdminSignIn onSuccess={() => undefined} />;
  return <section className="stack">
    <div className="row row-between"><p className="muted" style={{ margin: 0 }}>{user.email}</p><Button size="sm" variant="ghost" onClick={() => void signOutAdmin()}>Sign out</Button></div>
    <TeacherProfile />
    <NewCourse onCreated={refresh} />
    {error && <Notice tone="error">{error}</Notice>}
    {loading ? <p className="muted">Loading…</p> : courses.length === 0 ? <p className="muted">Create the first course, then add its lesson, worksheet and presentation below.</p> : <>
      <LearningPack courses={courses} onSaved={refresh} />
      <div className="grid">{courses.map((course) => <CourseCard course={course} role={role} onChanged={refresh} />)}</div>
    </>}
  </section>;
}

function CourseCard({ course, role, onChanged }: { course: Course; role: 'owner' | 'admin' | 'teacher' | null; onChanged: () => Promise<void> }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function action(kind: 'submit' | 'approve') {
    setBusy(true); setError('');
    try { if (kind === 'submit') await submitCourseForReview(course.id); else await approveCourse(course.id); await onChanged(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Action could not be completed.'); } finally { setBusy(false); }
  }
  return <section className="card glass-liquid stack" key={course.id}>
    <div><strong>{course.title}</strong><p className="muted">{course.summary}</p></div>
    <small>{course.status} · {course.access_tier}</small>
    {course.status === 'draft' && <div className="row">
      <Button size="sm" variant="ghost" disabled={busy} onClick={() => void action('submit')}>Submit for client approval</Button>
      {role === 'owner' && <Button size="sm" disabled={busy} onClick={() => void action('approve')}>Approve & publish</Button>}
    </div>}
    {error && <Notice tone="error">{error}</Notice>}
  </section>;
}

function TeacherProfile() {
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); setBusy(true); setMessage('');
    try { await savePublicProfile({ teacherName: String(form.get('teacherName') ?? ''), teacherBio: String(form.get('teacherBio') ?? ''), contactEmail: String(form.get('contactEmail') ?? '') }); setMessage('Teacher profile saved.'); } catch (reason) { setMessage(reason instanceof Error ? reason.message : 'Profile could not be saved.'); } finally { setBusy(false); }
  }
  return <form className="card glass-liquid stack" onSubmit={submit}><h2>Teacher profile</h2><p className="muted">This is the public information learners see. Use real details only.</p><label className="field"><span>Teacher name</span><input required name="teacherName" maxLength={160} /></label><label className="field"><span>Short biography</span><textarea required name="teacherBio" maxLength={4000} rows={3} /></label><label className="field"><span>Contact email</span><input name="contactEmail" type="email" autoComplete="email" /></label><Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save teacher profile'}</Button>{message && <p role="status" className="muted">{message}</p>}</form>;
}

function LearningPack({ courses, onSaved }: { courses: Course[]; onSaved: () => Promise<void> }) {
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); setBusy(true); setMessage('');
    try {
      await addLearningPack({ courseId: String(form.get('courseId')), moduleTitle: String(form.get('moduleTitle')), lessonTitle: String(form.get('lessonTitle')), lessonBody: String(form.get('lessonBody')), worksheetTitle: String(form.get('worksheetTitle')), question: String(form.get('question')), presentationTitle: String(form.get('presentationTitle')), slides: String(form.get('slides')) });
      event.currentTarget.reset(); await onSaved(); setMessage('Lesson, worksheet and presentation saved as a draft learning pack.');
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : 'Learning pack could not be saved.'); } finally { setBusy(false); }
  }
  return <form className="card glass-liquid stack" onSubmit={submit}><h2>Build the learner experience</h2><p className="muted">Add the real module, lesson, worksheet and presentation for a selected draft course.</p><label className="field"><span>Course</span><select required name="courseId">{courses.filter((course) => course.status === 'draft').map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label><label className="field"><span>Module title</span><input required name="moduleTitle" maxLength={240} /></label><label className="field"><span>Lesson title</span><input required name="lessonTitle" maxLength={240} /></label><label className="field"><span>Lesson text</span><textarea required name="lessonBody" rows={5} /></label><label className="field"><span>Worksheet title</span><input required name="worksheetTitle" maxLength={240} /></label><label className="field"><span>Worksheet question</span><textarea required name="question" rows={2} /></label><label className="field"><span>Presentation title</span><input required name="presentationTitle" maxLength={240} /></label><label className="field"><span>Presentation slides</span><textarea required name="slides" rows={4} placeholder="One slide per line" /></label><Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save learning pack'}</Button>{message && <p role="status" className="muted">{message}</p>}</form>;
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
