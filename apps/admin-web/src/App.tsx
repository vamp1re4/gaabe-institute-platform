import { type ReactNode } from 'react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';
import { T, useI18n } from '@gaabe/i18n';
import { Notice, NotFoundPanel, SiteShell, type NavItem } from '@gaabe/ui';
import { ProductionCourses } from './pages/ProductionCourses';

const NAV: NavItem[] = [
  { to: '/', labelKey: 'admin.nav.dashboard' },
  { to: '/courses', labelKey: 'admin.nav.courses' },
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
  return (
    <Page title={<T k="admin.nav.dashboard" />}>
      <section className="card glass-liquid stack">
        <h2>Content workspace</h2>
        <p>Manage your real teacher profile, courses, lessons, worksheets, and presentations from one place. Content stays in draft until the organization owner approves it.</p>
        <Link className="btn" to="/courses">Open courses</Link>
      </section>
    </Page>
  );
}

function Courses() {
  if (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) return <Page title={<T k="admin.nav.courses" />}><ProductionCourses /></Page>;
  return <Page title={<T k="admin.nav.courses" />}><p className="muted">Production administration is not configured for this build.</p></Page>;
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
      <Route path="/courses" element={<Courses />} />
      <Route path="*" element={<NotFoundPanel homeLink={<Link className="btn" to="/"><T k="error.goHome" /></Link>} />} />
    </Routes></AdminBody>
  </SiteShell>;
}
