import { useMemo, useState, type ReactNode } from 'react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';
import { T, useI18n } from '@gaabe/i18n';
import { Badge, Lang, Notice, NotFoundPanel, SiteShell, type NavItem } from '@gaabe/ui';
import { courses, students, worksheets } from '@gaabe/demo-data';
import { ProductionCourses } from './pages/ProductionCourses';

const NAV: NavItem[] = [
  { to: '/', labelKey: 'admin.nav.dashboard' },
  { to: '/students', labelKey: 'admin.nav.students' },
  { to: '/courses', labelKey: 'admin.nav.courses' },
  { to: '/worksheets', labelKey: 'admin.nav.worksheets' },
  { to: '/content', labelKey: 'admin.nav.documents' },
  { to: '/subscriptions', labelKey: 'admin.nav.subscriptions' },
];

function Page({ title, children }: { title: ReactNode; children: ReactNode }) {
  return <div className="container page stack"><h1>{title}</h1>{children}</div>;
}

/** Admin translations are not authored or reviewed yet, so page content stays isolated in English. */
function AdminBody({ children }: { children: ReactNode }) {
  const { locale } = useI18n();
  return <div lang="en" dir="ltr" className="admin-main">
    {locale === 'dv' && <Notice>Administration screens are English-only for now. Dhivehi admin text has not been written or reviewed.</Notice>}
    {children}
  </div>;
}

function Dashboard() {
  const published = courses.filter((course) => course.status === 'published').length;
  const lessons = courses
    .filter((course) => course.status === 'published')
    .flatMap((course) => course.modules)
    .flatMap((module) => module.lessons).length;
  const teacherGraded = worksheets.flatMap((worksheet) => worksheet.questions).filter((question) => question.type === 'essay').length;
  return (
    <Page title={<T k="admin.nav.dashboard" />}>
      <section className="grid" aria-label="Demonstration overview">
        <Metric label="Sample students" value={String(students.length)} note="Fictional records" />
        <Metric label="Published courses" value={String(published)} note={`${lessons} sample lessons`} />
        <Metric label="Teacher-graded prompts" value={String(teacherGraded)} note="Demo worksheet items" />
      </section>
    </Page>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <section className="card glass-liquid stack"><p className="eyebrow">{label}</p><strong style={{ fontSize: '2.2rem' }}>{value}</strong><small>{note}</small></section>;
}

function Students() {
  const [query, setQuery] = useState('');
  const filtered = students.filter((student) => student.name.toLowerCase().includes(query.toLowerCase()));
  return (
    <Page title={<T k="admin.nav.students" />}>
      <label className="stack" style={{ maxInlineSize: '30rem' }}>
        <span><T k="common.search" /></span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search sample students" />
      </label>
      <div className="table-wrap"><table><caption className="sr-only">Fictional learner records for the administration demonstration</caption><thead><tr><th scope="col">Name</th><th scope="col">Course</th><th scope="col"><T k="common.status" /></th></tr></thead>
        <tbody>{filtered.map((student) => {
          const course = courses.find((item) => item.id === student.courseId);
          return <tr key={student.id}><td>{student.name}</td><td>{course?.title ?? 'Unknown sample course'}</td><td><Badge tone={student.status === 'suspended' ? 'danger' : 'default'}>{student.status}</Badge></td></tr>;
        })}</tbody>
      </table></div>
      {filtered.length === 0 && <Notice>No sample student matches that search.</Notice>}
    </Page>
  );
}

function Courses() {
  if (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) return <Page title={<T k="admin.nav.courses" />}><ProductionCourses /></Page>;
  const [showDrafts, setShowDrafts] = useState(true);
  const visible = useMemo(() => courses.filter((course) => showDrafts || course.status === 'published'), [showDrafts]);
  return (
    <Page title={<T k="admin.nav.courses" />}>
      <label><input type="checkbox" checked={showDrafts} onChange={(event) => setShowDrafts(event.target.checked)} /> Show unpublished sample courses</label>
      <div className="grid">{visible.map((course) => <section className="card glass-liquid stack" key={course.id}>
        <div><Badge tone={course.status === 'draft' ? 'muted' : 'default'}>{course.status}</Badge> <Badge tone={course.free ? 'default' : 'gold'}>{course.free ? 'Free' : 'Premium'}</Badge></div>
        <div><h2>{course.title}</h2><p>{course.summary}</p></div>
        <small>{course.modules.length} modules · {course.modules.flatMap((module) => module.lessons).length} lessons</small>
        <div className="stack"><button type="button" className="btn" aria-disabled="true" aria-describedby={`course-edit-${course.id}`} onClick={(event) => event.preventDefault()}>Edit (not connected)</button><small id={`course-edit-${course.id}`}>Editing needs a server-backed, authorised content API.</small></div>
      </section>)}</div>
    </Page>
  );
}

function Worksheets() {
  return <Page title={<T k="admin.nav.worksheets" />}>
    <Notice>Question authoring, answer keys, version publishing, and grading must be server-authorized. This list is read-only demo data.</Notice>
    <div className="table-wrap"><table><caption className="sr-only">Fictional worksheets in the administration demonstration</caption><thead><tr><th scope="col">Worksheet</th><th scope="col">Questions</th><th scope="col">Review state</th></tr></thead><tbody>
      {worksheets.map((worksheet) => <tr key={worksheet.id}><td>{worksheet.title}</td><td>{worksheet.questions.length}</td><td><Badge tone="muted">Demo only</Badge></td></tr>)}
    </tbody></table></div>
  </Page>;
}

function Content() {
  return <Page title={<T k="admin.nav.documents" />}>
    <section className="card glass-liquid stack"><h2>Secure document processing</h2><p>No source document is uploaded through this prototype. A production pipeline must validate file type and size, malware-scan, store originals privately, queue conversion, preserve language metadata, and authorize every rendered page and audio segment.</p><div className="stack"><button type="button" className="btn" aria-disabled="true" aria-describedby="document-upload-note" onClick={(event) => event.preventDefault()}>Upload document (not connected)</button><small id="document-upload-note">Uploading needs private storage and server-side file validation.</small></div></section>
    <section className="card glass-liquid stack"><h2>Read Aloud review</h2><p>English browser speech is a browser capability; Dhivehi speech remains unavailable until a verified provider and native-speaker review are complete. Quranic Arabic must use approved recordings, not generic synthesis.</p><Lang code="dv">ދަރުސްތައް</Lang></section>
  </Page>;
}

function Subscriptions() {
  return <Page title={<T k="admin.nav.subscriptions" />}>
    <Notice tone="error">Payment and entitlement decisions are not implemented. Never grant paid access from browser state or this demonstration screen.</Notice>
    <section className="card glass-liquid stack"><h2>Required production controls</h2><ul><li>Server-verified payment state machine with idempotency and audit events.</li><li>Manual-transfer review that remains pending until authorized staff verify evidence.</li><li>Short-lived, entitlement-checked access for premium lessons, media, documents, and audio.</li></ul></section>
  </Page>;
}

export function App() {
  return <SiteShell
    nav={NAV}
    visualMode="liquid"
    brandSuffix={<small> · <T k="admin.title" /></small>}
    homeLink={(children) => <Link to="/" className="brand">{children}</Link>}
    renderLink={({ to, children, onClick }) => <NavLink to={to} end={to === '/'} onClick={onClick}>{children}</NavLink>}
  >
    <AdminBody><Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/students" element={<Students />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/worksheets" element={<Worksheets />} />
      <Route path="/content" element={<Content />} />
      <Route path="/subscriptions" element={<Subscriptions />} />
      <Route path="*" element={<NotFoundPanel homeLink={<Link className="btn" to="/"><T k="error.goHome" /></Link>} />} />
    </Routes></AdminBody>
  </SiteShell>;
}
