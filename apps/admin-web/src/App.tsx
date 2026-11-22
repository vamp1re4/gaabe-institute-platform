import { useMemo, useState, type ReactNode } from 'react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';
import { T } from '@gaabe/i18n';
import { Badge, Button, DemoBanner, Lang, Notice, NotFoundPanel, SiteShell, type NavItem } from '@gaabe/ui';
import { courses, demoStudents, worksheets } from '@gaabe/demo-data';

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

function Dashboard() {
  const published = courses.filter((course) => course.status === 'published').length;
  const lessons = courses.flatMap((course) => course.modules).flatMap((module) => module.lessons).length;
  return (
    <Page title={<T k="admin.nav.dashboard" />}>
      <section className="grid" aria-label="Demonstration overview">
        <Metric label="Sample students" value="24" note="Fictional records" />
        <Metric label="Published courses" value={String(published)} note={`${lessons} sample lessons`} />
        <Metric label="Pending review" value="3" note="Demo worksheet responses" />
      </section>
      <section className="card stack">
        <div><h2>Production readiness</h2><p>What this demonstration can and cannot do is deliberately visible to staff.</p></div>
        <ul>
          <li>Course, worksheet, and document records below are fictional browser data.</li>
          <li>There is no real staff login, role check, audit log, file upload, payment verification, or publishing API.</li>
          <li>Do not use this screen to handle student records, payment evidence, or original learning materials.</li>
        </ul>
      </section>
    </Page>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <section className="card stack"><p className="eyebrow">{label}</p><strong style={{ fontSize: '2.2rem' }}>{value}</strong><small>{note}</small></section>;
}

function Students() {
  const [query, setQuery] = useState('');
  const filtered = demoStudents.filter((student) => student.name.toLowerCase().includes(query.toLowerCase()));
  return (
    <Page title={<T k="admin.nav.students" />}>
      <label className="stack" style={{ maxInlineSize: '30rem' }}>
        <span><T k="common.search" /></span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search sample students" />
      </label>
      <div className="table-wrap"><table><caption className="sr-only">Fictional learner records for the administration demonstration</caption><thead><tr><th scope="col">Name</th><th scope="col">Course</th><th scope="col"><T k="common.status" /></th></tr></thead>
        <tbody>{filtered.map((student) => {
          const course = courses.find((item) => item.id === student.courseId);
          const status = student.status === 'payment-pending' ? 'Payment pending' : student.status === 'trial' ? 'Trial' : 'Active';
          return <tr key={student.id}><td><Lang code="en">{student.name}</Lang></td><td><Lang code="en">{course?.title ?? 'Unknown sample course'}</Lang></td><td><Badge tone={student.status === 'payment-pending' ? 'danger' : 'default'}>{status}</Badge></td></tr>;
        })}</tbody>
      </table></div>
      {filtered.length === 0 && <Notice>No sample student matches that search.</Notice>}
    </Page>
  );
}

function Courses() {
  const [showDrafts, setShowDrafts] = useState(true);
  const visible = useMemo(() => courses.filter((course) => showDrafts || course.status === 'published'), [showDrafts]);
  return (
    <Page title={<T k="admin.nav.courses" />}>
      <label><input type="checkbox" checked={showDrafts} onChange={(event) => setShowDrafts(event.target.checked)} /> Show unpublished sample courses</label>
      <div className="grid">{visible.map((course) => <section className="card stack" key={course.id}>
        <div><Badge tone={course.status === 'draft' ? 'muted' : 'default'}>{course.status}</Badge> <Badge tone={course.free ? 'default' : 'gold'}>{course.free ? 'Free' : 'Premium'}</Badge></div>
        <div><h2><Lang code="en">{course.title}</Lang></h2><p><Lang code="en">{course.summary}</Lang></p></div>
        <small>{course.modules.length} modules · {course.modules.flatMap((module) => module.lessons).length} lessons</small>
        <Button disabled title="A server-backed editor is not available in this demonstration">Edit (not connected)</Button>
      </section>)}</div>
    </Page>
  );
}

function Worksheets() {
  return <Page title={<T k="admin.nav.worksheets" />}>
    <Notice>Question authoring, answer keys, version publishing, and grading must be server-authorized. This list is read-only demo data.</Notice>
    <div className="table-wrap"><table><caption className="sr-only">Fictional worksheets in the administration demonstration</caption><thead><tr><th scope="col">Worksheet</th><th scope="col">Questions</th><th scope="col">Review state</th></tr></thead><tbody>
      {worksheets.map((worksheet) => <tr key={worksheet.id}><td><Lang code="en">{worksheet.title}</Lang></td><td>{worksheet.questions.length}</td><td><Badge tone="muted">Demo only</Badge></td></tr>)}
    </tbody></table></div>
  </Page>;
}

function Content() {
  return <Page title={<T k="admin.nav.documents" />}>
    <section className="card stack"><h2>Secure document processing</h2><p>No source document is uploaded through this prototype. A production pipeline must validate file type and size, malware-scan, store originals privately, queue conversion, preserve language metadata, and authorize every rendered page and audio segment.</p><Button disabled>Upload document (not connected)</Button></section>
    <section className="card stack"><h2>Read Aloud review</h2><p>English browser speech is a browser capability; Dhivehi speech remains unavailable until a verified provider and native-speaker review are complete. Quranic Arabic must use approved recordings, not generic synthesis.</p><Lang code="dv">ދަރުސްތައް</Lang></section>
  </Page>;
}

function Subscriptions() {
  return <Page title={<T k="admin.nav.subscriptions" />}>
    <Notice tone="error">Payment and entitlement decisions are not implemented. Never grant paid access from browser state or this demonstration screen.</Notice>
    <section className="card stack"><h2>Required production controls</h2><ul><li>Server-verified payment state machine with idempotency and audit events.</li><li>Manual-transfer review that remains pending until authorized staff verify evidence.</li><li>Short-lived, entitlement-checked access for premium lessons, media, documents, and audio.</li></ul></section>
  </Page>;
}

export function App() {
  return <SiteShell
    nav={NAV}
    demoBanner={<DemoBanner messageKey="admin.mockNotice" />}
    brandSuffix={<small> · <T k="admin.title" /></small>}
    homeLink={(children) => <Link to="/" className="brand">{children}</Link>}
    renderLink={({ to, children, onClick }) => <NavLink to={to} end={to === '/'} onClick={onClick}>{children}</NavLink>}
  >
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/students" element={<Students />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/worksheets" element={<Worksheets />} />
      <Route path="/content" element={<Content />} />
      <Route path="/subscriptions" element={<Subscriptions />} />
      <Route path="*" element={<NotFoundPanel homeLink={<Link className="btn" to="/"><T k="error.goHome" /></Link>} />} />
    </Routes>
  </SiteShell>;
}
