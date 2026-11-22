import { useMemo, useState, type ReactNode } from 'react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';
import { T } from '@gaabe/i18n';
import { Badge, Button, DemoBanner, Lang, Notice, NotFoundPanel, SiteShell, type NavItem } from '@gaabe/ui';
import { courses, worksheets } from '@gaabe/demo-data';

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

function DemoWarning() {
  return <Notice tone="info"><T k="admin.mockNotice" /></Notice>;
}

function Dashboard() {
  const published = courses.filter((course) => course.status === 'published').length;
  const lessons = courses.flatMap((course) => course.modules).flatMap((module) => module.lessons).length;
  return (
    <Page title={<T k="admin.nav.dashboard" />}>
      <DemoWarning />
      <section className="grid grid-3" aria-label="Demonstration overview">
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

const students = [
  { name: 'Aisha Hassan', course: 'Sample Course A — Foundations', status: 'Active' },
  { name: 'Mohamed Rilwan', course: 'Sample Course B — Guided Practice', status: 'Trial' },
  { name: 'Fathimath N.', course: 'Sample Course C — Revision', status: 'Payment pending' },
] as const;

function Students() {
  const [query, setQuery] = useState('');
  const filtered = students.filter((student) => student.name.toLowerCase().includes(query.toLowerCase()));
  return (
    <Page title={<T k="admin.nav.students" />}>
      <DemoWarning />
      <label className="stack" style={{ maxInlineSize: '30rem' }}>
        <span><T k="common.search" /></span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search sample students" />
      </label>
      <div className="table-wrap"><table><thead><tr><th>Name</th><th>Course</th><th><T k="common.status" /></th></tr></thead>
        <tbody>{filtered.map((student) => <tr key={student.name}><td>{student.name}</td><td>{student.course}</td><td><Badge tone={student.status === 'Payment pending' ? 'danger' : 'default'}>{student.status}</Badge></td></tr>)}</tbody>
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
      <DemoWarning />
      <label><input type="checkbox" checked={showDrafts} onChange={(event) => setShowDrafts(event.target.checked)} /> Show unpublished sample courses</label>
      <div className="grid grid-2">{visible.map((course) => <section className="card stack" key={course.id}>
        <div><Badge tone={course.status === 'draft' ? 'muted' : 'default'}>{course.status}</Badge> <Badge tone={course.free ? 'default' : 'gold'}>{course.free ? 'Free' : 'Premium'}</Badge></div>
        <div><h2>{course.title}</h2><p>{course.summary}</p></div>
        <small>{course.modules.length} modules · {course.modules.flatMap((module) => module.lessons).length} lessons</small>
        <Button disabled title="A server-backed editor is not available in this demonstration">Edit (not connected)</Button>
      </section>)}</div>
    </Page>
  );
}

function Worksheets() {
  return <Page title={<T k="admin.nav.worksheets" />}>
    <DemoWarning />
    <Notice>Question authoring, answer keys, version publishing, and grading must be server-authorized. This list is read-only demo data.</Notice>
    <div className="table-wrap"><table><thead><tr><th>Worksheet</th><th>Questions</th><th>Review state</th></tr></thead><tbody>
      {worksheets.map((worksheet) => <tr key={worksheet.id}><td>{worksheet.title}</td><td>{worksheet.questions.length}</td><td><Badge tone="muted">Demo only</Badge></td></tr>)}
    </tbody></table></div>
  </Page>;
}

function Content() {
  return <Page title={<T k="admin.nav.documents" />}>
    <DemoWarning />
    <section className="card stack"><h2>Secure document processing</h2><p>No source document is uploaded through this prototype. A production pipeline must validate file type and size, malware-scan, store originals privately, queue conversion, preserve language metadata, and authorize every rendered page and audio segment.</p><Button disabled>Upload document (not connected)</Button></section>
    <section className="card stack"><h2>Read Aloud review</h2><p>English browser speech is a browser capability; Dhivehi speech remains unavailable until a verified provider and native-speaker review are complete. Quranic Arabic must use approved recordings, not generic synthesis.</p><Lang code="dv">ދަރުސްތައް</Lang></section>
  </Page>;
}

function Subscriptions() {
  return <Page title={<T k="admin.nav.subscriptions" />}>
    <DemoWarning />
    <Notice tone="error">Payment and entitlement decisions are not implemented. Never grant paid access from browser state or this demonstration screen.</Notice>
    <section className="card stack"><h2>Required production controls</h2><ul><li>Server-verified payment state machine with idempotency and audit events.</li><li>Manual-transfer review that remains pending until authorized staff verify evidence.</li><li>Short-lived, entitlement-checked access for premium lessons, media, documents, and audio.</li></ul></section>
  </Page>;
}

export function App() {
  return <SiteShell
    nav={NAV}
    demoBanner={<DemoBanner />}
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
